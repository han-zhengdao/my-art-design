<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    :width="mode === 'track' || mode === 'location' ? '920px' : '720px'"
    align-center
    destroy-on-close
    body-class="wheel-extra-dialog-body"
    @opened="onExtraDialogOpened"
    @closed="onDialogClosed"
  >
    <template v-if="mode === 'location' && row">
      <p class="mb-2 text-sm text-[var(--el-text-color-secondary)]">
        DevEUI：{{ row.devEui }} · 当前位置（经纬度）
      </p>
      <div class="mb-3 font-mono text-lg">
        {{ row.currentPosition.lng }}, {{ row.currentPosition.lat }}
      </div>

      <div class="mb-3 flex flex-wrap items-center gap-3">
        <span class="text-sm text-[var(--el-text-color-secondary)]">地图类型</span>
        <ElRadioGroup v-model="locationMapProvider" @change="onLocationMapProviderChange">
          <ElRadioButton value="tencent">腾讯地图</ElRadioButton>
          <ElRadioButton value="google">谷歌地图</ElRadioButton>
        </ElRadioGroup>
      </div>

      <p v-if="locationMapError" class="mb-2 text-sm text-red-500">{{ locationMapError }}</p>
      <!-- loading 挂在外层，地图只占用内层 div，避免与腾讯 GL 控件 DOM 冲突；内层 overflow:hidden 约束画布与控件 -->
      <div
        v-loading="locationMapLoading"
        class="location-map-shell relative h-[420px] w-full overflow-hidden rounded border border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)]"
      >
        <div ref="locationMapContainerRef" class="absolute inset-0 min-h-0 min-w-0" />
      </div>
      <p class="mt-2 text-xs text-[var(--el-text-color-secondary)]">
        打开弹窗后自动展示设备当前坐标；中国境内默认腾讯地图，中国境外默认谷歌地图，可随时切换。
      </p>
    </template>

    <template v-else-if="mode === 'track' && row">
      <ElForm label-width="100px" class="mb-4">
        <ElFormItem label="时间范围">
          <ElDatePicker
            v-model="trackRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full max-w-full"
          />
        </ElFormItem>
      </ElForm>

      <div class="mb-3 flex flex-wrap items-center gap-3">
        <span class="text-sm text-[var(--el-text-color-secondary)]">地图类型</span>
        <ElRadioGroup v-model="trackMapProvider">
          <ElRadioButton value="tencent">腾讯地图</ElRadioButton>
          <ElRadioButton value="google">谷歌地图</ElRadioButton>
        </ElRadioGroup>
      </div>

      <ElAlert
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
        title="设备轨迹：选择地图后，点击「在地图中显示轨迹」按钮查看。"
      />

      <div class="mb-2 flex flex-wrap items-center gap-3">
        <ElButton
          type="primary"
          :loading="trackMapLoading"
          :disabled="!trackRange"
          @click="renderTrackMap"
        >
          在地图中显示轨迹
        </ElButton>
        <ElButton :disabled="!trackMapReady" @click="replayTrackAnimation">重新播放动画</ElButton>
        <span v-if="trackMapHint" class="text-xs text-[var(--el-text-color-secondary)]">{{
          trackMapHint
        }}</span>
      </div>
      <p v-if="trackMapError" class="mb-2 text-sm text-red-500">{{ trackMapError }}</p>

      <div
        ref="trackMapContainerRef"
        class="h-[420px] w-full rounded border border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)]"
      />
      <div class="mt-2 flex flex-wrap gap-6 text-xs text-[var(--el-text-color-secondary)]">
        <span
          ><span class="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-green-500 align-middle"></span
          >起点：初始位置（所选时间范围起点侧）</span
        >
        <span
          ><span class="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500 align-middle"></span
          >终点：最终位置</span
        >
        <span
          ><span class="mr-1 inline-block h-2 w-8 align-middle bg-[#3777FF]"></span
          >蓝色线为演示轨迹（加载后自动沿路径动画回放）</span
        >
      </div>
    </template>

    <template v-else-if="mode === 'nav' && row">
      <p class="mb-3 text-sm text-[var(--el-text-color-secondary)]">
        将尝试获取您当前位置作为起点，车轮设备位置作为终点并打开驾车路线。
      </p>
      <ElButton type="primary" :loading="navLoading" @click="openNavigation">开始导航</ElButton>
    </template>

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
  /* 弹窗内容 teleport 到 body，需 :global；避免 el-dialog__body 默认 overflow 裁剪地图控件 */
  :global(.el-dialog__body.wheel-extra-dialog-body) {
    overflow: visible !important;
  }
</style>

<script setup lang="ts">
  import {
    TENCENT_GL_MARKER_END,
    TENCENT_GL_MARKER_MOVER,
    TENCENT_GL_MARKER_START
  } from '@/utils/tencent-gl-marker-icons'
  import { isLikelyChinaTerritory } from '@/utils/geo-china-boundary'
  import {
    buildAmapDrivingNavigationUrl,
    buildGoogleMapsDrivingUrl
  } from '@/utils/map-navigation-url'
  import { endVertexIndex, easeInOutQuad } from '@/utils/track-path-animation'
  import { buildDemoTrackPath } from '@/utils/wheel-demo-track'
  import {
    ensureGoogleMapSdk,
    ensureTencentMapSdk,
    getTencentApiMode,
    getTencentScriptSrc
  } from '@/utils/map-sdk'
  import { ElMessage } from 'element-plus'
  import { computed, nextTick, ref, watch } from 'vue'

  type ExtraMode = 'location' | 'track' | 'nav'

  const props = defineProps<{
    modelValue: boolean
    mode: ExtraMode
    row: Api.Wheel.WheelListItem | null
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const dialogTitle = computed(() => {
    if (props.mode === 'location') return '当前定位'
    if (props.mode === 'track') return '轨迹回放'
    return '地图导航'
  })

  const trackRange = ref<[string, string] | null>(null)
  const navLoading = ref(false)

  const locationMapProvider = ref<'tencent' | 'google'>('tencent')
  const locationMapContainerRef = ref<HTMLDivElement | null>(null)
  const locationMapLoading = ref(false)
  const locationMapError = ref('')

  /** 当前定位弹窗专用，与轨迹地图实例分离 */
  let locationTencentMapGl: { destroy?: () => void; resize?: () => void } | null = null
  let locationQqMap: unknown = null
  let locationQqMarker: unknown = null
  let locationGoogleMap: { fitBounds?: (b: unknown, padding?: number) => void } | null = null
  let locationGoogleMarker: { setMap: (m: unknown) => void } | null = null

  const trackMapProvider = ref<'tencent' | 'google'>('tencent')
  const trackMapContainerRef = ref<HTMLDivElement | null>(null)
  const trackMapLoading = ref(false)
  const trackMapError = ref('')
  const trackMapHint = ref('')
  const trackMapReady = ref(false)

  const TRACK_ANIM_MS = 10000

  /** 腾讯 GL / 旧版 / 谷歌实例与覆盖物，便于销毁 */
  let tencentMapGl: { destroy?: () => void; resize?: () => void } | null = null
  let qqMap: unknown = null
  let qqBgPolyline: { setMap?: (m: unknown) => void } | null = null
  let qqAnimPolyline: { setMap?: (m: unknown) => void; setPath?: (p: unknown[]) => void } | null =
    null
  let qqMarkerStart: unknown = null
  let qqMarkerEnd: unknown = null
  let qqMoverMarker: { setMap?: (m: unknown) => void; setPosition?: (p: unknown) => void } | null =
    null
  let qqPathLatLng: unknown[] | null = null

  let googleMap: { fitBounds: (b: unknown, padding?: number) => void } | null = null
  let googleBgPolyline: { setMap: (m: unknown) => void } | null = null
  let googleAnimPolyline: {
    setMap: (m: unknown) => void
    setPath: (p: unknown[]) => void
  } | null = null
  let googleMarkerStart: { setMap: (m: unknown) => void } | null = null
  let googleMarkerEnd: { setMap: (m: unknown) => void } | null = null
  let googleMoverMarker: {
    setMap: (m: unknown) => void
    setPosition: (p: unknown) => void
  } | null = null
  let googleLinePath: { lat: number; lng: number }[] | null = null

  let tencentGlAnimPoly: { setGeometries: (g: unknown[]) => void } | null = null
  let tencentGlMoverMarker: { setGeometries: (g: unknown[]) => void } | null = null
  let tencentGlLatLngs: unknown[] | null = null

  let trackAnimRafId: number | null = null
  type TrackMapKind = 'tencentGl' | 'tencentLegacy' | 'google'
  let trackMapKind: TrackMapKind | null = null

  function cancelTrackAnimation() {
    if (trackAnimRafId !== null) {
      cancelAnimationFrame(trackAnimRafId)
      trackAnimRafId = null
    }
  }

  function runTencentGlTrackAnimation() {
    if (!tencentGlAnimPoly || !tencentGlMoverMarker || !tencentGlLatLngs) return
    const lngs = tencentGlLatLngs
    if (lngs.length < 2) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TRACK_ANIM_MS)
      const eased = easeInOutQuad(t)
      const idxEnd = endVertexIndex(eased, lngs.length)
      const partial = lngs.slice(0, idxEnd + 1)
      tencentGlAnimPoly!.setGeometries([
        {
          id: 'fg',
          styleId: 'fg',
          paths: [partial]
        }
      ])
      tencentGlMoverMarker!.setGeometries([
        {
          id: 'mover',
          styleId: 'mover',
          position: lngs[idxEnd],
          properties: { title: '当前位置' }
        }
      ])
      if (t < 1) {
        trackAnimRafId = requestAnimationFrame(tick)
      } else {
        trackAnimRafId = null
      }
    }
    cancelTrackAnimation()
    trackAnimRafId = requestAnimationFrame(tick)
  }

  function runGoogleTrackAnimation() {
    if (!googleAnimPolyline || !googleMoverMarker || !googleLinePath) return
    const linePath = googleLinePath
    if (linePath.length < 2) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TRACK_ANIM_MS)
      const eased = easeInOutQuad(t)
      const idxEnd = endVertexIndex(eased, linePath.length)
      const partial = linePath.slice(0, idxEnd + 1)
      googleAnimPolyline!.setPath(partial)
      googleMoverMarker!.setPosition(partial[idxEnd]!)
      if (t < 1) {
        trackAnimRafId = requestAnimationFrame(tick)
      } else {
        trackAnimRafId = null
      }
    }
    cancelTrackAnimation()
    trackAnimRafId = requestAnimationFrame(tick)
  }

  function runQqTrackAnimation() {
    const poly = qqAnimPolyline
    const mover = qqMoverMarker
    const path = qqPathLatLng
    if (!poly?.setPath || !mover?.setPosition || !path || path.length < 2) return
    const setPath = poly.setPath
    const setPosition = mover.setPosition
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TRACK_ANIM_MS)
      const eased = easeInOutQuad(t)
      const idxEnd = endVertexIndex(eased, path.length)
      const partial = path.slice(0, idxEnd + 1)
      setPath.call(poly, partial)
      setPosition.call(mover, path[idxEnd]!)
      if (t < 1) {
        trackAnimRafId = requestAnimationFrame(tick)
      } else {
        trackAnimRafId = null
      }
    }
    cancelTrackAnimation()
    trackAnimRafId = requestAnimationFrame(tick)
  }

  function replayTrackAnimation() {
    cancelTrackAnimation()
    if (trackMapKind === 'tencentGl') runTencentGlTrackAnimation()
    else if (trackMapKind === 'google') runGoogleTrackAnimation()
    else if (trackMapKind === 'tencentLegacy') runQqTrackAnimation()
  }

  watch(
    () => props.modelValue,
    (open) => {
      if (open && props.mode === 'track') {
        const end = new Date()
        const start = new Date(end.getTime() - 24 * 3600 * 1000)
        const fmt = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
        trackRange.value = [fmt(start), fmt(end)]
      }
      if (open && props.mode === 'location' && props.row) {
        locationMapProvider.value = isLikelyChinaTerritory(
          props.row.currentPosition.lat,
          props.row.currentPosition.lng
        )
          ? 'tencent'
          : 'google'
      }
    }
  )

  function destroyLocationMap() {
    locationMapError.value = ''
    if (locationTencentMapGl && typeof locationTencentMapGl.destroy === 'function') {
      locationTencentMapGl.destroy()
    }
    locationTencentMapGl = null

    if (locationQqMarker && window.qq?.maps) {
      ;(locationQqMarker as { setMap: (m: unknown) => void }).setMap(null)
    }
    locationQqMarker = null
    locationQqMap = null

    if (locationGoogleMarker) {
      locationGoogleMarker.setMap(null)
      locationGoogleMarker = null
    }
    locationGoogleMap = null

    const el = locationMapContainerRef.value
    if (el) el.innerHTML = ''
  }

  /** 弹窗动画结束或切换底图后多次触发，修正腾讯 GL / 谷歌在对话框内的尺寸与控件位置 */
  function scheduleLocationMapResize() {
    if (props.mode !== 'location') return
    const pulse = () => {
      const m = locationTencentMapGl as { resize?: () => void } | null
      if (m && typeof m.resize === 'function') m.resize()
      const gMaps = window.google?.maps as
        | { event?: { trigger: (map: unknown, e: string) => void } }
        | undefined
      if (locationGoogleMap && gMaps?.event) {
        gMaps.event.trigger(locationGoogleMap, 'resize')
      }
      if (locationQqMap && window.qq?.maps?.event) {
        window.qq.maps.event.trigger(locationQqMap as object, 'resize')
      }
    }
    pulse()
    requestAnimationFrame(pulse)
    setTimeout(pulse, 100)
    setTimeout(pulse, 320)
  }

  function onExtraDialogOpened() {
    if (props.mode === 'location') {
      scheduleLocationMapResize()
    }
  }

  /** 用户切换「腾讯 / 谷歌」时显式加载（不依赖 watch 对 ref 的收集，避免偶发不触发） */
  function onLocationMapProviderChange() {
    if (!props.modelValue || props.mode !== 'location' || !props.row) return
    void loadLocationMap()
  }

  async function loadLocationMap() {
    if (!props.modelValue || props.mode !== 'location' || !props.row) return
    await nextTick()
    const el = locationMapContainerRef.value
    if (!el) return
    locationMapLoading.value = true
    locationMapError.value = ''
    try {
      destroyLocationMap()
      const p = props.row.currentPosition
      if (locationMapProvider.value === 'google') {
        await ensureGoogleMapSdk()
        initLocationGoogle(el, p)
      } else {
        await ensureTencentMapSdk()
        const src = getTencentScriptSrc()
        const apiMode = src ? getTencentApiMode(src) : 'gl'
        if (apiMode === 'gl') {
          initLocationTencentGl(el, p)
        } else {
          initLocationTencentLegacy(el, p)
        }
      }
      await nextTick()
      scheduleLocationMapResize()
    } catch (e) {
      locationMapError.value = e instanceof Error ? e.message : String(e)
      ElMessage.error(locationMapError.value)
    } finally {
      locationMapLoading.value = false
    }
  }

  watch(
    () =>
      [
        props.modelValue,
        props.mode,
        props.row?.currentPosition.lat,
        props.row?.currentPosition.lng
      ] as const,
    async ([open, mode]) => {
      if (!open || mode !== 'location' || !props.row) {
        destroyLocationMap()
        return
      }
      await loadLocationMap()
    },
    { flush: 'post' }
  )

  function destroyTrackMap() {
    cancelTrackAnimation()
    trackMapReady.value = false
    trackMapKind = null
    tencentGlAnimPoly = null
    tencentGlMoverMarker = null
    tencentGlLatLngs = null
    googleLinePath = null
    qqPathLatLng = null

    trackMapError.value = ''
    trackMapHint.value = ''

    if (tencentMapGl && typeof tencentMapGl.destroy === 'function') {
      tencentMapGl.destroy()
    }
    tencentMapGl = null

    if (qqBgPolyline?.setMap) qqBgPolyline.setMap(null)
    if (qqAnimPolyline?.setMap) qqAnimPolyline.setMap(null)
    qqBgPolyline = null
    qqAnimPolyline = null
    if (qqMarkerStart && window.qq?.maps) {
      ;(qqMarkerStart as { setMap: (m: unknown) => void }).setMap(null)
    }
    if (qqMarkerEnd && window.qq?.maps) {
      ;(qqMarkerEnd as { setMap: (m: unknown) => void }).setMap(null)
    }
    if (qqMoverMarker?.setMap) qqMoverMarker.setMap(null)
    qqMarkerStart = null
    qqMarkerEnd = null
    qqMoverMarker = null
    qqMap = null

    if (googleBgPolyline) {
      googleBgPolyline.setMap(null)
      googleBgPolyline = null
    }
    if (googleAnimPolyline) {
      googleAnimPolyline.setMap(null)
      googleAnimPolyline = null
    }
    if (googleMarkerStart) {
      googleMarkerStart.setMap(null)
      googleMarkerStart = null
    }
    if (googleMarkerEnd) {
      googleMarkerEnd.setMap(null)
      googleMarkerEnd = null
    }
    if (googleMoverMarker) {
      googleMoverMarker.setMap(null)
      googleMoverMarker = null
    }
    googleMap = null

    const el = trackMapContainerRef.value
    if (el) el.innerHTML = ''
  }

  function onDialogClosed() {
    destroyTrackMap()
    destroyLocationMap()
  }

  async function renderTrackMap() {
    const row = props.row
    if (!row || !trackRange.value) return
    destroyTrackMap()
    trackMapLoading.value = true
    trackMapError.value = ''

    const pathPts = buildDemoTrackPath(row.lastPosition, row.currentPosition)
    if (pathPts.length < 2) {
      trackMapError.value = '轨迹点不足，无法绘制'
      trackMapLoading.value = false
      return
    }

    await nextTick()
    const el = trackMapContainerRef.value
    if (!el) {
      trackMapLoading.value = false
      return
    }

    try {
      if (trackMapProvider.value === 'google') {
        await ensureGoogleMapSdk()
        initGoogleTrack(el, pathPts)
        trackMapHint.value = '已使用谷歌地图绘制轨迹，可缩放拖拽查看。'
      } else {
        await ensureTencentMapSdk()
        const src = getTencentScriptSrc()
        const mode = src ? getTencentApiMode(src) : 'gl'
        if (mode === 'gl') {
          initTencentGlTrack(el, pathPts)
        } else {
          initTencentLegacyTrack(el, pathPts)
        }
        trackMapHint.value = '已使用腾讯地图绘制轨迹，可缩放拖拽查看。'
      }
      await nextTick()
      requestAnimationFrame(() => {
        const m = tencentMapGl as { resize?: () => void } | null
        if (m && typeof m.resize === 'function') m.resize()
        const gMaps = window.google?.maps as
          | { event?: { trigger: (m: unknown, e: string) => void } }
          | undefined
        if (googleMap && gMaps?.event) {
          gMaps.event.trigger(googleMap, 'resize')
        }
        if (qqMap && window.qq?.maps?.event) {
          window.qq.maps.event.trigger(qqMap as object, 'resize')
        }
      })
    } catch (e) {
      trackMapError.value = e instanceof Error ? e.message : String(e)
      ElMessage.error(trackMapError.value)
    } finally {
      trackMapLoading.value = false
    }
  }

  function initTencentGlTrack(el: HTMLElement, pathPts: { lng: number; lat: number }[]) {
    const TMap = window.TMap as
      | {
          Map: new (...args: unknown[]) => { destroy?: () => void; resize?: () => void }
          LatLng: new (lat: number, lng: number) => unknown
          MultiPolyline: new (opts: Record<string, unknown>) => unknown
          MultiMarker: new (opts: Record<string, unknown>) => unknown
          PolylineStyle: new (opts: { color: string; width: number }) => unknown
          MarkerStyle: new (opts: Record<string, unknown>) => unknown
        }
      | undefined
    if (!TMap?.Map) throw new Error('腾讯地图 GL 未就绪')

    const mid = pathPts[Math.floor(pathPts.length / 2)]!
    const center = new TMap.LatLng(mid.lat, mid.lng)
    const map = new TMap.Map(el, {
      center,
      zoom: 15
    })
    tencentMapGl = map as { destroy?: () => void; resize?: () => void }

    const latLngs = pathPts.map((p) => new TMap.LatLng(p.lat, p.lng))
    new TMap.MultiPolyline({
      map,
      styles: {
        bg: new TMap.PolylineStyle({ color: '#94a3b8', width: 6 })
      },
      geometries: [
        {
          id: 'bg',
          styleId: 'bg',
          paths: [latLngs]
        }
      ]
    })

    const animPartial = latLngs.length >= 2 ? latLngs.slice(0, 2) : [latLngs[0]!, latLngs[0]!]
    const animPoly = new TMap.MultiPolyline({
      map,
      styles: {
        fg: new TMap.PolylineStyle({ color: '#2563EB', width: 8 })
      },
      geometries: [
        {
          id: 'fg',
          styleId: 'fg',
          paths: [animPartial]
        }
      ]
    }) as { setGeometries: (g: unknown[]) => void }

    new TMap.MultiMarker({
      map,
      styles: {
        start: new TMap.MarkerStyle({
          width: 36,
          height: 44,
          anchor: { x: 18, y: 44 },
          src: TENCENT_GL_MARKER_START
        }),
        end: new TMap.MarkerStyle({
          width: 36,
          height: 44,
          anchor: { x: 18, y: 44 },
          src: TENCENT_GL_MARKER_END
        })
      },
      geometries: [
        {
          id: 'start',
          styleId: 'start',
          position: latLngs[0],
          properties: { title: '起点' }
        },
        {
          id: 'end',
          styleId: 'end',
          position: latLngs[latLngs.length - 1],
          properties: { title: '终点' }
        }
      ]
    })

    const moverMarker = new TMap.MultiMarker({
      map,
      styles: {
        mover: new TMap.MarkerStyle({
          width: 22,
          height: 22,
          anchor: { x: 11, y: 11 },
          src: TENCENT_GL_MARKER_MOVER
        })
      },
      geometries: [
        {
          id: 'mover',
          styleId: 'mover',
          position: latLngs[0],
          properties: { title: '当前位置' }
        }
      ]
    }) as { setGeometries: (g: unknown[]) => void }

    tencentGlAnimPoly = animPoly
    tencentGlMoverMarker = moverMarker
    tencentGlLatLngs = latLngs
    trackMapKind = 'tencentGl'
    trackMapReady.value = true
    runTencentGlTrackAnimation()
  }

  function initTencentLegacyTrack(el: HTMLElement, pathPts: { lng: number; lat: number }[]) {
    const qq = window.qq
    if (!qq?.maps) throw new Error('腾讯地图（旧版）未就绪')

    const mid = pathPts[Math.floor(pathPts.length / 2)]!
    const center = new qq.maps.LatLng(mid.lat, mid.lng)
    const map = new qq.maps.Map(el, {
      center,
      zoom: 15
    })
    qqMap = map

    const path = pathPts.map((p) => new qq.maps.LatLng(p.lat, p.lng))
    qqPathLatLng = path

    qqBgPolyline = new qq.maps.Polyline({
      map,
      path,
      strokeColor: '#cbd5e1',
      strokeWeight: 5
    }) as { setMap?: (m: unknown) => void }

    const animPath = path.length >= 2 ? [path[0]!, path[1]!] : [path[0]!, path[0]!]
    qqAnimPolyline = new qq.maps.Polyline({
      map,
      path: animPath,
      strokeColor: '#3777FF',
      strokeWeight: 4
    }) as {
      setMap?: (m: unknown) => void
      setPath?: (p: unknown[]) => void
    }

    qqMarkerStart = new qq.maps.Marker({
      map,
      position: path[0],
      title: '起点'
    })
    qqMarkerEnd = new qq.maps.Marker({
      map,
      position: path[path.length - 1],
      title: '终点'
    })

    qqMoverMarker = new qq.maps.Marker({
      map,
      position: path[0],
      title: '当前位置',
      zIndex: 900
    }) as { setMap?: (m: unknown) => void; setPosition?: (p: unknown) => void }

    trackMapKind = 'tencentLegacy'
    trackMapReady.value = true
    runQqTrackAnimation()
  }

  function initGoogleTrack(el: HTMLElement, pathPts: { lng: number; lat: number }[]) {
    const maps = window.google?.maps as
      | {
          Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown
          Polyline: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void }
          Marker: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void }
          LatLngBounds: new () => { extend: (p: { lat: number; lng: number }) => void }
          SymbolPath: { CIRCLE: unknown }
        }
      | undefined
    if (!maps) throw new Error('谷歌地图未就绪')

    const linePath = pathPts.map((p) => ({ lat: p.lat, lng: p.lng }))
    const mid = linePath[Math.floor(linePath.length / 2)]!
    const map = new maps.Map(el, {
      center: mid,
      zoom: 15,
      mapTypeControl: true
    }) as { fitBounds: (b: unknown, padding?: number) => void }
    googleMap = map

    googleLinePath = linePath

    googleBgPolyline = new maps.Polyline({
      map,
      path: linePath,
      strokeColor: '#94a3b8',
      strokeWeight: 6,
      strokeOpacity: 0.45,
      zIndex: 0
    }) as { setMap: (m: unknown) => void }

    const animInit = linePath.length >= 2 ? linePath.slice(0, 2) : [linePath[0]!, linePath[0]!]
    googleAnimPolyline = new maps.Polyline({
      map,
      path: animInit,
      strokeColor: '#2563EB',
      strokeWeight: 6,
      strokeOpacity: 1,
      zIndex: 2
    }) as {
      setMap: (m: unknown) => void
      setPath: (p: unknown[]) => void
    }

    const circleIcon = (fill: string, scale: number) => ({
      path: maps.SymbolPath.CIRCLE,
      fillColor: fill,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale
    })

    googleMarkerStart = new maps.Marker({
      map,
      position: linePath[0],
      zIndex: 3,
      label: { text: '起', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' },
      icon: circleIcon('#16a34a', 11)
    }) as { setMap: (m: unknown) => void }

    googleMarkerEnd = new maps.Marker({
      map,
      position: linePath[linePath.length - 1],
      zIndex: 2,
      label: { text: '终', color: '#ffffff', fontSize: '12px', fontWeight: 'bold' },
      icon: circleIcon('#dc2626', 11)
    }) as { setMap: (m: unknown) => void }

    googleMoverMarker = new maps.Marker({
      map,
      position: linePath[0],
      zIndex: 4,
      icon: circleIcon('#0ea5e9', 8)
    }) as {
      setMap: (m: unknown) => void
      setPosition: (p: unknown) => void
    }

    const bounds = new maps.LatLngBounds()
    linePath.forEach((p) => bounds.extend(p))
    map.fitBounds(bounds, 56)

    trackMapKind = 'google'
    trackMapReady.value = true
    runGoogleTrackAnimation()
  }

  function initLocationTencentGl(el: HTMLElement, p: Api.Store.GeoPoint) {
    const TMap = window.TMap as
      | {
          Map: new (...args: unknown[]) => { destroy?: () => void; resize?: () => void }
          LatLng: new (lat: number, lng: number) => unknown
          MultiMarker: new (opts: Record<string, unknown>) => unknown
          MarkerStyle: new (opts: Record<string, unknown>) => unknown
        }
      | undefined
    if (!TMap?.Map) throw new Error('腾讯地图 GL 未就绪')

    const pos = new TMap.LatLng(p.lat, p.lng)
    const map = new TMap.Map(el, {
      center: pos,
      zoom: 16
    })
    locationTencentMapGl = map as { destroy?: () => void; resize?: () => void }

    new TMap.MultiMarker({
      map,
      styles: {
        pos: new TMap.MarkerStyle({
          width: 36,
          height: 44,
          anchor: { x: 18, y: 44 },
          src: TENCENT_GL_MARKER_END
        })
      },
      geometries: [
        {
          id: 'device',
          styleId: 'pos',
          position: pos,
          properties: { title: '设备位置' }
        }
      ]
    })
  }

  function initLocationTencentLegacy(el: HTMLElement, p: Api.Store.GeoPoint) {
    const qq = window.qq
    if (!qq?.maps) throw new Error('腾讯地图（旧版）未就绪')

    const position = new qq.maps.LatLng(p.lat, p.lng)
    const map = new qq.maps.Map(el, {
      center: position,
      zoom: 16
    })
    locationQqMap = map

    locationQqMarker = new qq.maps.Marker({
      map,
      position,
      title: '设备位置'
    })
  }

  function initLocationGoogle(el: HTMLElement, p: Api.Store.GeoPoint) {
    const maps = window.google?.maps as
      | {
          Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown
          Marker: new (opts: Record<string, unknown>) => { setMap: (m: unknown) => void }
        }
      | undefined
    if (!maps) throw new Error('谷歌地图未就绪')

    const position = { lat: p.lat, lng: p.lng }
    const map = new maps.Map(el, {
      center: position,
      zoom: 16,
      mapTypeControl: true
    }) as { fitBounds?: (b: unknown, padding?: number) => void }
    locationGoogleMap = map

    locationGoogleMarker = new maps.Marker({
      map,
      position,
      zIndex: 5,
      title: '设备位置'
    }) as { setMap: (m: unknown) => void }
  }

  function openNavigation() {
    if (!props.row) return
    navLoading.value = true
    const dest = props.row.currentPosition
    const destOverseas = !isLikelyChinaTerritory(dest.lat, dest.lng)

    const finish = (url: string) => {
      window.open(url, '_blank')
      navLoading.value = false
    }

    const openWithOptionalStart = (startLat?: number, startLng?: number) => {
      const hasStart =
        startLat != null &&
        startLng != null &&
        Number.isFinite(startLat) &&
        Number.isFinite(startLng)
      if (destOverseas) {
        finish(
          buildGoogleMapsDrivingUrl({
            destLat: dest.lat,
            destLng: dest.lng,
            ...(hasStart ? { startLat, startLng } : {})
          })
        )
      } else {
        finish(
          buildAmapDrivingNavigationUrl({
            destLat: dest.lat,
            destLng: dest.lng,
            ...(hasStart ? { startLat, startLng } : {})
          })
        )
      }
    }

    if (!navigator.geolocation) {
      ElMessage.warning('浏览器不支持定位，将仅根据终点打开路线规划')
      openWithOptionalStart()
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        openWithOptionalStart(latitude, longitude)
      },
      () => {
        ElMessage.warning('无法获取当前位置，请检查权限；将仅根据终点打开路线规划')
        openWithOptionalStart()
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
</script>
