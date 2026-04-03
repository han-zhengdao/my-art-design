<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="min(96vw, 960px)"
    top="4vh"
    append-to-body
    align-center
    destroy-on-close
    :close-on-click-modal="false"
    class="store-map-picker-dialog"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <div v-if="loadError" class="py-10 text-center text-[var(--el-color-danger)]">{{
      loadError
    }}</div>
    <div v-show="!loadError" ref="mapContainerRef" class="store-map-picker-canvas" />

    <div v-if="!loadError" class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
      <template v-if="pickMode === 'coordinate'">
        定位成功时，会在当前位置显示坐标标记，可直接确定或点击地图其它位置修改。
      </template>
      <template v-else>
        依次点击地图添加围栏顶点，至少 3 个点；「撤销」可去掉最后一个点。
      </template>
    </div>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton
        v-if="pickMode === 'geofence'"
        :disabled="vertexCount === 0"
        @click="undoLastVertex"
      >
        撤销上一点
      </ElButton>
      <ElButton type="primary" :disabled="!canConfirm" @click="handleConfirm">确定填入</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    ensureGoogleMapSdk,
    ensureTencentMapSdk,
    getTencentApiMode,
    getTencentScriptSrc
  } from '@/utils/map-sdk'
  import { translateGpsToTencentGcj02, wgs84ToGcj02 } from '@/utils/coord-transform'
  import { ElMessage } from 'element-plus'

  type PickMode = 'coordinate' | 'geofence'

  /** 运行时由腾讯 GL 脚本注入，此处仅作断言以通过类型检查 */
  type TencentGlSdk = {
    LatLng: new (lat: number, lng: number) => { getLat: () => number; getLng: () => number }
    Map: new (
      el: HTMLElement,
      opts: Record<string, unknown>
    ) => {
      on: (
        evt: string,
        fn: (e: { latLng: { getLat: () => number; getLng: () => number } }) => void
      ) => void
      destroy?: () => void
    }
    MultiMarker: new (opts: Record<string, unknown>) => { setGeometries: (g: unknown[]) => void }
    MultiPolyline: new (opts: Record<string, unknown>) => { setGeometries: (g: unknown[]) => void }
    PolylineStyle: new (opts: Record<string, unknown>) => unknown
  }

  type GoogleMapsSdk = {
    Map: new (
      el: HTMLElement,
      opts: Record<string, unknown>
    ) => {
      addListener: (
        evt: string,
        fn: (e: { latLng?: { lat: () => number; lng: () => number } | null }) => void
      ) => { remove: () => void }
    }
    Marker: new (opts: Record<string, unknown>) => unknown
    Polyline: new (opts: Record<string, unknown>) => unknown
  }

  const props = defineProps<{
    modelValue: boolean
    /** 地图厂商，与门店表单一致 */
    mapProvider: Api.Store.MapProvider
    pickMode: PickMode
    /** 初始坐标文本 经度,纬度 */
    initialCoordinateText?: string
    /** 初始围栏 lng,lat;lng,lat;... */
    initialGeofenceText?: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [v: boolean]
    confirm: [value: string]
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const dialogTitle = computed(() =>
    props.pickMode === 'coordinate' ? '在地图上选择门店坐标' : '在地图上绘制电子围栏'
  )

  const mapContainerRef = ref<HTMLDivElement | null>(null)
  const loadError = ref('')

  /** 选点：当前点；围栏：顶点序列（lng,lat 顺序） */
  const pickedLng = ref<number | null>(null)
  const pickedLat = ref<number | null>(null)
  const fenceVertices = ref<Array<{ lng: number; lat: number }>>([])

  const vertexCount = computed(() => fenceVertices.value.length)

  const canConfirm = computed(() => {
    if (props.pickMode === 'coordinate') {
      return pickedLng.value != null && pickedLat.value != null
    }
    return fenceVertices.value.length >= 3
  })

  // —— 腾讯 GL 覆盖物引用（仅本弹窗内） ——
  let tencentMap: unknown = null
  let tencentMarkerLayer: { setGeometries: (g: unknown[]) => void } | null = null
  let tencentPolylineLayer: { setGeometries: (g: unknown[]) => void } | null = null

  // —— 谷歌（运行时由脚本注入 window.google） ——
  let googleMarker: unknown = null
  let googlePolyline: unknown = null
  let googleClickListener: { remove: () => void } | null = null

  // —— 腾讯旧版 ——
  let qqMarker: unknown = null
  let qqPolyline: unknown = null
  let qqClickListener: unknown = null

  function parseLngLat(text: string): { lng: number; lat: number } {
    const [a, b] = text.split(',').map((s) => s.trim())
    const lng = Number(a)
    const lat = Number(b)
    if (Number.isNaN(lng) || Number.isNaN(lat)) throw new Error('invalid')
    return { lng, lat }
  }

  function parseFence(text: string): Array<{ lng: number; lat: number }> {
    return text
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((seg) => parseLngLat(seg))
  }

  /** 地图上显示围栏时闭合折线（存储仍不含重复首点） */
  function fencePathClosedForDisplay(verts: Array<{ lng: number; lat: number }>) {
    if (verts.length < 3) return verts
    return [...verts, verts[0]!]
  }

  function getCurrentPositionOptional(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  type MapCenterSource = 'initial' | 'geolocation' | 'fallback'

  /** 中心：已有坐标/围栏则对准数据；否则尝试定位；失败则北京 */
  async function resolveMapCenter(): Promise<{
    lng: number
    lat: number
    source: MapCenterSource
  }> {
    try {
      if (props.pickMode === 'coordinate' && props.initialCoordinateText?.trim()) {
        return { ...parseLngLat(props.initialCoordinateText.trim()), source: 'initial' }
      }
      if (props.pickMode === 'geofence' && props.initialGeofenceText) {
        const pts = parseFence(props.initialGeofenceText)
        if (pts.length) return { ...pts[0]!, source: 'initial' }
      }
    } catch {
      /* ignore */
    }
    const pos = await getCurrentPositionOptional()
    if (pos) {
      const lng = pos.coords.longitude
      const lat = pos.coords.latitude
      // 浏览器定位通常为 WGS84；国内腾讯/Google 的展示交互坐标体系可能不是 WGS84。
      // 这里优先调用腾讯坐标转换 WebService（更精确）；失败则回退到本地算法。
      const webTranslated = await translateGpsToTencentGcj02(lng, lat)
      const converted = webTranslated ?? wgs84ToGcj02(lng, lat)
      return { lng: converted.lng, lat: converted.lat, source: 'geolocation' }
    }
    return { lng: 116.4074, lat: 39.9042, source: 'fallback' }
  }

  function resetStateFromProps() {
    pickedLng.value = null
    pickedLat.value = null
    fenceVertices.value = []
    try {
      if (props.pickMode === 'coordinate' && props.initialCoordinateText) {
        const p = parseLngLat(props.initialCoordinateText.trim())
        pickedLng.value = p.lng
        pickedLat.value = p.lat
      }
      if (props.pickMode === 'geofence' && props.initialGeofenceText) {
        fenceVertices.value = parseFence(props.initialGeofenceText)
      }
    } catch {
      /* ignore */
    }
  }

  function destroyTencentOverlays() {
    if (tencentMarkerLayer && typeof tencentMarkerLayer.setGeometries === 'function') {
      tencentMarkerLayer.setGeometries([])
    }
    if (tencentPolylineLayer && typeof tencentPolylineLayer.setGeometries === 'function') {
      tencentPolylineLayer.setGeometries([])
    }
    tencentMarkerLayer = null
    tencentPolylineLayer = null
  }

  function syncTencentGlOverlays() {
    const TMap = window.TMap as TencentGlSdk | undefined
    if (!TMap || !tencentMap) return

    if (props.pickMode === 'coordinate') {
      if (pickedLng.value == null || pickedLat.value == null) {
        destroyTencentOverlays()
        return
      }
      const pos = new TMap.LatLng(pickedLat.value, pickedLng.value)
      if (!tencentMarkerLayer) {
        tencentMarkerLayer = new TMap.MultiMarker({
          map: tencentMap,
          geometries: [{ id: 'store', position: pos }]
        })
      } else {
        tencentMarkerLayer.setGeometries([{ id: 'store', position: pos }])
      }
      return
    }

    const verts = fenceVertices.value
    if (verts.length < 2) {
      if (tencentPolylineLayer) {
        tencentPolylineLayer.setGeometries([])
      }
      return
    }
    const pathVerts = fencePathClosedForDisplay(verts)
    const path = pathVerts.map((v) => new TMap.LatLng(v.lat, v.lng))
    const geometries = [
      {
        id: 'fence',
        styleId: 'fence-line',
        paths: [path]
      }
    ]
    if (!tencentPolylineLayer) {
      tencentPolylineLayer = new TMap.MultiPolyline({
        map: tencentMap,
        styles: {
          'fence-line': new TMap.PolylineStyle({ color: '#3777FF', width: 4 })
        },
        geometries
      })
    } else {
      tencentPolylineLayer.setGeometries(geometries)
    }
  }

  function initTencentGl(centerLngLat: { lng: number; lat: number }) {
    const TMap = window.TMap as TencentGlSdk | undefined
    if (!TMap?.Map || !mapContainerRef.value) return

    const c = centerLngLat
    const center = new TMap.LatLng(c.lat, c.lng)
    const map = new TMap.Map(mapContainerRef.value, {
      center,
      zoom: 14
    })
    tencentMap = map

    map.on('click', (evt) => {
      const lat = evt.latLng.getLat()
      const lng = evt.latLng.getLng()
      if (props.pickMode === 'coordinate') {
        pickedLng.value = lng
        pickedLat.value = lat
        syncTencentGlOverlays()
      } else {
        fenceVertices.value = [...fenceVertices.value, { lng, lat }]
        syncTencentGlOverlays()
      }
    })

    if (props.pickMode === 'coordinate' && pickedLng.value != null && pickedLat.value != null) {
      syncTencentGlOverlays()
    }
    if (props.pickMode === 'geofence' && fenceVertices.value.length >= 2) {
      syncTencentGlOverlays()
    }
  }

  function initTencentLegacy(centerLngLat: { lng: number; lat: number }) {
    const qq = window.qq
    if (!qq?.maps || !mapContainerRef.value) return

    const c = centerLngLat
    const center = new qq.maps.LatLng(c.lat, c.lng)
    const map = new qq.maps.Map(mapContainerRef.value, {
      center,
      zoom: 14
    })

    qqClickListener = qq.maps.event.addListener(
      map,
      'click',
      (e: { latLng: { getLat: () => number; getLng: () => number } }) => {
        const lat = e.latLng.getLat()
        const lng = e.latLng.getLng()
        if (props.pickMode === 'coordinate') {
          pickedLng.value = lng
          pickedLat.value = lat
          if (!qqMarker) {
            qqMarker = new qq.maps.Marker({
              map,
              position: e.latLng
            })
          } else {
            ;(qqMarker as { setPosition: (p: unknown) => void }).setPosition(e.latLng)
          }
        } else {
          fenceVertices.value = [...fenceVertices.value, { lng, lat }]
          const path = fencePathClosedForDisplay(fenceVertices.value).map(
            (v) => new qq.maps.LatLng(v.lat, v.lng)
          )
          if (!qqPolyline) {
            qqPolyline = new qq.maps.Polyline({
              map,
              path,
              strokeColor: '#3777FF',
              strokeWeight: 3
            })
          } else {
            ;(qqPolyline as { setPath: (p: unknown[]) => void }).setPath(path)
          }
        }
      }
    )

    if (props.pickMode === 'coordinate' && pickedLng.value != null && pickedLat.value != null) {
      const pos = new qq.maps.LatLng(pickedLat.value, pickedLng.value)
      qqMarker = new qq.maps.Marker({ map, position: pos })
    }
    if (props.pickMode === 'geofence' && fenceVertices.value.length >= 2) {
      const path = fencePathClosedForDisplay(fenceVertices.value).map(
        (v) => new qq.maps.LatLng(v.lat, v.lng)
      )
      qqPolyline = new qq.maps.Polyline({
        map,
        path,
        strokeColor: '#3777FF',
        strokeWeight: 3
      })
    }
  }

  function initGoogle(centerLngLat: { lng: number; lat: number }) {
    const maps = window.google?.maps as GoogleMapsSdk | undefined
    if (!maps || !mapContainerRef.value) return

    const c = centerLngLat
    const map = new maps.Map(mapContainerRef.value, {
      center: { lat: c.lat, lng: c.lng },
      zoom: 14,
      mapTypeControl: true
    })

    googleClickListener = map.addListener(
      'click',
      (e: { latLng?: { lat: () => number; lng: () => number } | null }) => {
        if (!e.latLng) return
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        if (props.pickMode === 'coordinate') {
          pickedLng.value = lng
          pickedLat.value = lat
          if (!googleMarker) {
            googleMarker = new maps.Marker({ map, position: e.latLng })
          } else {
            ;(googleMarker as { setPosition: (p: unknown) => void }).setPosition(e.latLng)
          }
        } else {
          fenceVertices.value = [...fenceVertices.value, { lng, lat }]
          const path = fencePathClosedForDisplay(fenceVertices.value).map((v) => ({
            lat: v.lat,
            lng: v.lng
          }))
          if (!googlePolyline) {
            googlePolyline = new maps.Polyline({
              map,
              path,
              strokeColor: '#3777FF',
              strokeWeight: 3
            })
          } else {
            ;(googlePolyline as { setPath: (p: unknown[]) => void }).setPath(path)
          }
        }
      }
    )

    if (props.pickMode === 'coordinate' && pickedLng.value != null && pickedLat.value != null) {
      googleMarker = new maps.Marker({
        map,
        position: { lat: pickedLat.value, lng: pickedLng.value }
      })
    }
    if (props.pickMode === 'geofence' && fenceVertices.value.length >= 2) {
      const path = fencePathClosedForDisplay(fenceVertices.value).map((v) => ({
        lat: v.lat,
        lng: v.lng
      }))
      googlePolyline = new maps.Polyline({
        map,
        path,
        strokeColor: '#3777FF',
        strokeWeight: 3
      })
    }
  }

  async function handleOpened() {
    loadError.value = ''
    resetStateFromProps()
    const centerResult = await resolveMapCenter()
    /** 坐标点选 + 浏览器定位成功：在定位点预置选中点并显示标记图标 */
    if (
      props.pickMode === 'coordinate' &&
      centerResult.source === 'geolocation' &&
      pickedLng.value == null &&
      pickedLat.value == null
    ) {
      pickedLng.value = centerResult.lng
      pickedLat.value = centerResult.lat
    }
    const centerLngLat = { lng: centerResult.lng, lat: centerResult.lat }
    await nextTick()
    await nextTick()

    try {
      if (props.mapProvider === 'GOOGLE') {
        await ensureGoogleMapSdk()
        initGoogle(centerLngLat)
      } else {
        await ensureTencentMapSdk()
        const src = getTencentScriptSrc()
        const mode = src ? getTencentApiMode(src) : 'gl'
        if (mode === 'gl') {
          initTencentGl(centerLngLat)
        } else {
          initTencentLegacy(centerLngLat)
        }
      }
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : String(e)
      ElMessage.error(loadError.value)
    }
  }

  function handleClosed() {
    loadError.value = ''
    // 腾讯 GL
    if (tencentMap && typeof (tencentMap as { destroy?: () => void }).destroy === 'function') {
      ;(tencentMap as { destroy: () => void }).destroy()
    }
    tencentMap = null
    destroyTencentOverlays()

    // 谷歌
    if (googleClickListener) {
      googleClickListener.remove()
      googleClickListener = null
    }
    googleMarker = null
    googlePolyline = null

    // 腾讯旧版
    if (qqClickListener && window.qq?.maps?.event) {
      window.qq.maps.event.removeListener(qqClickListener as never)
    }
    qqClickListener = null
    qqMarker = null
    qqPolyline = null

    if (mapContainerRef.value) {
      mapContainerRef.value.innerHTML = ''
    }
  }

  function undoLastVertex() {
    if (props.pickMode !== 'geofence' || fenceVertices.value.length === 0) return
    fenceVertices.value = fenceVertices.value.slice(0, -1)

    const src = getTencentScriptSrc()
    const mode = src ? getTencentApiMode(src) : 'gl'
    if (props.mapProvider === 'GOOGLE' && googlePolyline) {
      const path = fencePathClosedForDisplay(fenceVertices.value).map((v) => ({
        lat: v.lat,
        lng: v.lng
      }))
      ;(googlePolyline as { setPath: (p: unknown[]) => void }).setPath(path)
    } else if (props.mapProvider === 'TENCENT' && mode === 'gl') {
      syncTencentGlOverlays()
    } else if (props.mapProvider === 'TENCENT' && mode === 'legacy' && qqPolyline && window.qq) {
      const path = fencePathClosedForDisplay(fenceVertices.value).map(
        (v) => new window.qq!.maps.LatLng(v.lat, v.lng)
      )
      ;(qqPolyline as { setPath: (p: unknown[]) => void }).setPath(path)
    }
  }

  function handleConfirm() {
    if (!canConfirm.value) return
    if (props.pickMode === 'coordinate') {
      emit('confirm', `${pickedLng.value!.toFixed(6)},${pickedLat.value!.toFixed(6)}`)
    } else {
      const text = fenceVertices.value
        .map((v) => `${v.lng.toFixed(6)},${v.lat.toFixed(6)}`)
        .join(';')
      emit('confirm', text)
    }
    visible.value = false
  }
</script>

<style scoped>
  .store-map-picker-canvas {
    width: 100%;
    height: min(560px, 70vh);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
  }
</style>
