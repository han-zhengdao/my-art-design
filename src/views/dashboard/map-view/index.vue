<template>
  <div class="page-content map-view-page">
    <MapViewSearch
      v-model="searchForm"
      :hidden="!showOrgFilters"
      :locked-partner-id="lockedPartnerId"
      @search="onFilterSearch"
      @reset="onFilterReset"
    />

    <ElAlert
      v-if="configError"
      type="warning"
      :closable="false"
      class="mt-2"
      :title="configError"
    />
    <!-- <hr class="my-4 border-g-300" /> -->
    <div
      class="relative mt-2 h-[800px] min-h-[640px] w-full overflow-hidden border border-g-200 bg-[var(--default-box-color)]"
    >
      <div
        class="absolute top-2 z-[2000] pointer-events-auto transition-all duration-200"
        :class="activeProvider === 'google' ? 'left-[188px]' : 'left-3'"
      >
        <ElRadioGroup
          v-model="activeProvider"
          class="map-provider-switch rounded-md bg-white/92 p-1 shadow-sm dark:bg-g-900/85"
        >
          <ElRadioButton value="tencent">{{ t('mapView.provider.tencent') }}</ElRadioButton>
          <ElRadioButton value="google">{{ t('mapView.provider.google') }}</ElRadioButton>
        </ElRadioGroup>
      </div>
      <div
        v-show="activeProvider === 'tencent'"
        ref="tencentContainerRef"
        class="absolute inset-0 z-0 min-h-[640px] w-full rounded-lg"
      />
      <div
        v-show="activeProvider === 'google'"
        ref="googleContainerRef"
        class="absolute inset-0 z-0 min-h-[640px] w-full rounded-lg"
      />
      <div
        v-if="activeProvider === 'tencent' && tencentHover.visible"
        class="pointer-events-none absolute z-[2100] rounded bg-black/75 px-2 py-1 text-xs text-white"
        :style="{ left: `${tencentHover.left}px`, top: `${tencentHover.top}px` }"
      >
        {{ tencentHover.text }}
      </div>
      <div
        v-if="wheelCard.visible && wheelCard.data"
        class="absolute z-[2200] w-[300px] rounded-lg border border-g-200 bg-white/95 p-3 shadow-lg dark:border-g-600 dark:bg-g-900/95"
        :style="{ left: `${wheelCard.left}px`, top: `${wheelCard.top}px` }"
      >
        <div class="mb-2 flex items-center justify-between">
          <div class="text-sm font-semibold text-g-800 dark:text-g-100">{{
            t('mapView.card.title')
          }}</div>
          <ElButton link type="info" class="!p-0" @click="closeWheelCard">{{
            t('mapView.card.close')
          }}</ElButton>
        </div>
        <div class="space-y-1 text-sm text-g-800 dark:text-g-200">
          <div
            ><span class="text-g-500">{{ t('mapView.card.devEui') }}：</span
            >{{ wheelCard.data.devEui }}</div
          >
          <div
            ><span class="text-g-500">{{ t('mapView.card.store') }}：</span
            >{{ wheelCard.data.storeName }}</div
          >
          <div
            ><span class="text-g-500">{{ t('mapView.card.latestLocateTime') }}：</span
            >{{ wheelCard.data.latestLocateTime }}</div
          >
          <div>
            <span class="text-g-500">{{ t('mapView.card.outFenceDistanceKm') }}：</span
            >{{ wheelCard.data.outFenceDistanceKm }}
          </div>
        </div>
        <div class="mt-3 flex items-center gap-0">
          <ElButton type="primary" size="small" class="!px-4 !py-3" @click="handleNavigate">{{
            t('mapView.card.navigate')
          }}</ElButton>
          <ElButton type="warning" size="small" class="!px-4 !py-3" @click="openTicketProcess">{{
            t('mapView.card.ticketProcess')
          }}</ElButton>
        </div>
      </div>
    </div>
    <ElDialog
      v-model="processVisible"
      :title="t('mapView.processDialog.title')"
      width="420px"
      destroy-on-close
    >
      <ElForm label-position="top">
        <ElFormItem :label="t('mapView.processDialog.resultLabel')" required>
          <ElRadioGroup v-model="processResult">
            <ElRadio value="RECYCLE">{{ t('mapView.processDialog.recycle') }}</ElRadio>
            <ElRadio value="LOST">{{ t('mapView.processDialog.lost') }}</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="processVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="submitProcess">{{ t('common.confirm') }}</ElButton>
      </template>
    </ElDialog>
    <ElDrawer
      v-model="inFenceDrawerVisible"
      :title="t('mapView.drawer.title')"
      direction="rtl"
      size="540px"
      destroy-on-close
      class="in-fence-drawer"
    >
      <div class="flex h-full flex-col">
        <div
          class="mb-3 flex items-center justify-between rounded-md bg-g-100 py-2 dark:bg-g-800/70"
        >
          <span class="text-sm font-medium text-g-700 dark:text-g-200">{{
            t('mapView.drawer.listTitle')
          }}</span>
          <span class="text-xs text-g-500 dark:text-g-200">{{
            t('mapView.drawer.totalCount', { n: inFenceTotal })
          }}</span>
        </div>
        <div class="min-h-0 flex-1">
          <ElTable :data="inFencePagedRows" stripe border height="100%">
            <ElTableColumn
              prop="devEui"
              :label="t('mapView.drawer.columnDevEui')"
              min-width="150"
            />
            <ElTableColumn
              prop="storeName"
              :label="t('mapView.drawer.columnStore')"
              min-width="120"
            />
            <ElTableColumn
              prop="batteryLevel"
              :label="t('mapView.drawer.columnBattery')"
              width="60"
            >
              <template #default="{ row }">{{ row.batteryLevel }}%</template>
            </ElTableColumn>
            <ElTableColumn
              prop="lastCommunicationTime"
              :label="t('mapView.drawer.columnLastComm')"
              min-width="180"
            />
          </ElTable>
        </div>
        <div class="mt-3 flex items-center justify-end">
          <ElPagination
            background
            layout="total, sizes, prev, pager, next"
            :total="inFenceTotal"
            :current-page="inFencePagination.current"
            :page-size="inFencePagination.size"
            :page-sizes="[5, 10, 20, 50]"
            @current-change="handleInFenceCurrentChange"
            @size-change="handleInFenceSizeChange"
          />
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import MapViewSearch from './modules/map-view-search.vue'
  import { fetchStoreList } from '@/api/store'
  import { useUserStore } from '@/store/modules/user'
  import {
    ensureGoogleMapSdk,
    ensureTencentMapSdk,
    getGoogleScriptBase,
    getTencentApiMode,
    getTencentScriptSrc
  } from '@/utils/map-sdk'
  import inFenceMarkerIcon from '@/assets/images/map/marks.png'
  import outFenceMarkerIcon from '@/assets/images/map/weilanwai.png'
  import { ElMessage } from 'element-plus'
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'DashboardMapView' })

  type MapProvider = 'tencent' | 'google'
  type StoreRow = Api.Store.StoreListItem
  const MARKER_ICON_SIZE = {
    width: 63,
    height: 78
  } as const
  interface WheelPoint {
    lng: number
    lat: number
    wheelCount: number
    inFence: boolean
    devEui: string
    latestLocateTime: string
    outFenceDistanceKm: number
  }

  interface WheelPointView extends WheelPoint {
    storeName: string
  }
  interface InFenceWheelItem {
    devEui: string
    storeName: string
    batteryLevel: number
    lastCommunicationTime: string
  }

  interface VisualStore {
    id: number
    storeName: string
    storeCoordinate: Api.Store.GeoPoint
    geofence: Api.Store.GeoPoint[]
    wheelPoints: WheelPoint[]
  }

  const userStore = useUserStore()
  const { t, locale } = useI18n()

  function wheelHoverTitle(storeName: string, wheelCount: number) {
    return t('mapView.hover.tooltip', { store: storeName, count: wheelCount })
  }

  const roles = () => userStore.info.roles ?? []

  const isRegionScopedUser = computed(
    () => roles().includes('REGION_ADMIN') || userStore.info.userType === 'REGION'
  )
  const isStoreScopedUser = computed(
    () =>
      roles().includes('STORE_ADMIN') ||
      roles().includes('STORE_STAFF') ||
      userStore.info.userType === 'STORE'
  )

  /** 区域 / 门店用户：不展示顶部四级筛选，直接进入所辖范围 */
  const showOrgFilters = computed(() => !isRegionScopedUser.value && !isStoreScopedUser.value)

  const lockedPartnerId = computed(() => {
    if (roles().includes('PARTNER_ADMIN') && userStore.info.partnerId != null) {
      return userStore.info.partnerId
    }
    return undefined
  })

  const searchForm = ref<Api.Dashboard.MapViewSearchParams>({
    countryCode: undefined,
    partnerId: undefined,
    regionId: undefined,
    storeId: undefined
  })

  const activeProvider = ref<MapProvider>('tencent')
  const tencentContainerRef = ref<HTMLDivElement | null>(null)
  const googleContainerRef = ref<HTMLDivElement | null>(null)

  const tencentMapInited = ref(false)
  const googleMapInited = ref(false)

  let tencentMapInstance: unknown = null
  let googleMapInstance: unknown = null

  /** 腾讯 GL Marker / MultiPolyline 实例列表，或 legacy Marker / Polyline 列表 */
  const tencentGlMarkers: Array<{ setMap?: (v: unknown) => void }> = []
  const tencentLegacyMarkers: unknown[] = []

  let googleMarkerInstances: Array<{ setMap?: (v: unknown) => void }> = []
  let googleFenceInstances: Array<{ setMap?: (v: unknown) => void }> = []
  const tencentHover = ref({
    visible: false,
    text: '',
    left: 12,
    top: 12
  })

  const configError = ref('')
  const wheelCard = ref<{
    visible: boolean
    left: number
    top: number
    data: WheelPointView | null
  }>({
    visible: false,
    left: 16,
    top: 16,
    data: null
  })
  const processVisible = ref(false)
  const processResult = ref<'RECYCLE' | 'LOST' | ''>('')
  const wheelCardAnchor = ref<{ lng: number; lat: number } | null>(null)
  const inFenceDrawerVisible = ref(false)
  const inFenceWheelRows = ref<InFenceWheelItem[]>([])
  const inFencePagination = ref({
    current: 1,
    size: 10
  })
  const inFenceTotal = computed(() => inFenceWheelRows.value.length)
  const inFencePagedRows = computed(() => {
    const start = (inFencePagination.value.current - 1) * inFencePagination.value.size
    return inFenceWheelRows.value.slice(start, start + inFencePagination.value.size)
  })

  const lastStores = ref<VisualStore[]>([])

  function removeWheelPointFromMap(devEui: string) {
    lastStores.value = lastStores.value
      .map((s) => ({
        ...s,
        wheelPoints: s.wheelPoints.filter((p) => p.devEui !== devEui)
      }))
      .filter((s) => s.wheelPoints.length > 0)
  }

  function closeWheelCard() {
    wheelCard.value.visible = false
    wheelCard.value.data = null
    wheelCardAnchor.value = null
  }

  function openInFenceDrawer(point: WheelPointView) {
    closeWheelCard()
    inFenceWheelRows.value = Array.from({ length: Math.max(1, point.wheelCount) }, (_, i) => ({
      devEui: point.wheelCount > 1 ? `${point.devEui}-${i + 1}` : point.devEui,
      storeName: point.storeName,
      batteryLevel: Math.max(18, 92 - i * 9),
      lastCommunicationTime: point.latestLocateTime
    }))
    inFencePagination.value.current = 1
    inFenceDrawerVisible.value = true
  }

  function handleInFenceCurrentChange(page: number) {
    inFencePagination.value.current = page
  }

  function handleInFenceSizeChange(size: number) {
    inFencePagination.value.size = size
    inFencePagination.value.current = 1
  }

  function placeWheelCard(data: WheelPointView, offset: { x: number; y: number }) {
    // marker position is bottom-center; convert to icon's top-right anchor.
    const x = offset.x + Math.round(MARKER_ICON_SIZE.width / 2)
    const y = offset.y - MARKER_ICON_SIZE.height
    wheelCard.value = {
      visible: true,
      data,
      left: x,
      top: y
    }
  }

  function getPixelByLngLat(lng: number, lat: number): { x: number; y: number } | null {
    if (activeProvider.value === 'tencent') {
      const src = getTencentScriptSrc()
      if (!src || !tencentMapInstance) return null
      const mode = getTencentApiMode(src)
      if (mode === 'gl') {
        const TMap = window.TMap
        const map = tencentMapInstance as {
          projectToContainer?: (latLng: unknown) => { x?: number; y?: number }
        }
        if (!TMap?.LatLng || typeof map.projectToContainer !== 'function') return null
        const pixel = map.projectToContainer(new TMap.LatLng(lat, lng))
        if (typeof pixel?.x === 'number' && typeof pixel?.y === 'number') {
          return { x: pixel.x, y: pixel.y }
        }
        return null
      }
      const qq = window.qq as
        | {
            maps?: {
              LatLng?: new (lat: number, lng: number) => unknown
            }
          }
        | undefined
      const map = tencentMapInstance as {
        getProjection?: () => {
          fromLatLngToContainerPixel?: (latLng: unknown) => {
            getX?: () => number
            getY?: () => number
            x?: number
            y?: number
          }
        }
      }
      const proj = map.getProjection?.()
      if (!qq?.maps?.LatLng || !proj?.fromLatLngToContainerPixel) return null
      const pixel = proj.fromLatLngToContainerPixel(new qq.maps.LatLng(lat, lng))
      const x = typeof pixel?.x === 'number' ? pixel.x : pixel?.getX?.()
      const y = typeof pixel?.y === 'number' ? pixel.y : pixel?.getY?.()
      if (typeof x === 'number' && typeof y === 'number') return { x, y }
      return null
    }

    const maps = window.google?.maps as
      | {
          LatLng?: new (lat: number, lng: number) => unknown
          event?: { addListener?: (obj: unknown, event: string, cb: () => void) => void }
        }
      | undefined
    const map = googleMapInstance as {
      getProjection?: () => {
        fromLatLngToPoint?: (latLng: unknown) => { x: number; y: number }
      }
      getBounds?: () => {
        getNorthEast?: () => { lat: () => number; lng: () => number }
        getSouthWest?: () => { lat: () => number; lng: () => number }
      }
      getZoom?: () => number
    } | null
    if (!maps?.LatLng || !map) return null
    const proj = map.getProjection?.()
    const bounds = map.getBounds?.()
    const zoom = map.getZoom?.() ?? 0
    if (!proj?.fromLatLngToPoint || !bounds?.getNorthEast || !bounds?.getSouthWest) return null
    const p = proj.fromLatLngToPoint(new maps.LatLng(lat, lng))
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const nw = new maps.LatLng(ne.lat(), sw.lng())
    const pNw = proj.fromLatLngToPoint(nw)
    const scale = Math.pow(2, zoom)
    return {
      x: (p.x - pNw.x) * scale,
      y: (p.y - pNw.y) * scale
    }
  }

  function refreshWheelCardPosition() {
    if (!wheelCard.value.visible || !wheelCard.value.data || !wheelCardAnchor.value) return
    const pixel = getPixelByLngLat(wheelCardAnchor.value.lng, wheelCardAnchor.value.lat)
    if (!pixel) return
    placeWheelCard(wheelCard.value.data, pixel)
  }

  function openWheelCard(data: WheelPointView, offset?: { x?: number; y?: number }) {
    wheelCardAnchor.value = { lng: data.lng, lat: data.lat }
    const pixel =
      offset && typeof offset.x === 'number' && typeof offset.y === 'number'
        ? { x: offset.x, y: offset.y }
        : (getPixelByLngLat(data.lng, data.lat) ?? { x: 24, y: 24 })
    placeWheelCard(data, pixel)
  }

  function getNavUrlByProvider(p: WheelPointView): string {
    if (activeProvider.value === 'tencent') {
      return `https://uri.amap.com/marker?position=${p.lng},${p.lat}`
    }
    return `https://www.google.com/maps?q=${p.lat},${p.lng}`
  }

  function handleNavigate() {
    if (!wheelCard.value.data) return
    window.open(getNavUrlByProvider(wheelCard.value.data), '_blank', 'noopener,noreferrer')
  }

  function openTicketProcess() {
    if (!wheelCard.value.data) return
    processResult.value = ''
    processVisible.value = true
  }

  function submitProcess() {
    if (!processResult.value) {
      ElMessage.warning(t('mapView.messages.selectResult'))
      return
    }
    const current = wheelCard.value.data
    if (!current) {
      ElMessage.warning(t('mapView.messages.wheelNotFound'))
      return
    }
    removeWheelPointFromMap(current.devEui)
    applyMarkersToActiveMap(lastStores.value)
    closeWheelCard()
    const resultLabel =
      processResult.value === 'RECYCLE'
        ? t('mapView.processDialog.recycle')
        : t('mapView.processDialog.lost')
    ElMessage.success(t('mapView.messages.processSubmitted', { result: resultLabel }))
    processVisible.value = false
  }

  function buildDemoFence(lng: number, lat: number): Api.Store.GeoPoint[] {
    const d = 0.0028
    return [
      { lng: lng - d, lat: lat - d },
      { lng: lng + d, lat: lat - d },
      { lng: lng + d, lat: lat + d },
      { lng: lng - d, lat: lat + d }
    ]
  }

  function createWheelPoints(center: Api.Store.GeoPoint, idx: number): WheelPoint[] {
    const delta = 0.005 + idx * 0.0008
    const at = (n: number) => `2026-04-14 1${n}:2${(idx + n) % 6}:00`
    const mk = (
      lng: number,
      lat: number,
      wheelCount: number,
      inFence: boolean,
      suffix: string,
      distanceKm: number,
      timeIndex: number
    ): WheelPoint => ({
      lng,
      lat,
      wheelCount,
      inFence,
      devEui: `EUI-${idx + 1}${suffix}`,
      latestLocateTime: at(timeIndex),
      outFenceDistanceKm: distanceKm
    })
    return [
      // 围栏内仅 1 个点：聚合多个车轮（显示角标）
      mk(center.lng, center.lat, 3 + (idx % 2), true, 'IN', 0, 0),
      // 围栏外分散点：模拟外部轨迹点
      mk(center.lng + delta, center.lat + delta * 0.6, 1, false, 'A1', 0.82 + idx * 0.1, 1),
      mk(center.lng - delta * 0.8, center.lat + delta * 0.5, 1, false, 'A2', 1.26 + idx * 0.08, 2),
      mk(center.lng + delta * 0.4, center.lat - delta, 1, false, 'A3', 0.54 + idx * 0.09, 3)
    ]
  }

  function appendMockStores(stores: StoreRow[]): VisualStore[] {
    const base = stores.map((s, idx) => {
      const center = s.storeCoordinate
      const fence =
        Array.isArray(s.geofence) && s.geofence.length >= 3
          ? s.geofence
          : buildDemoFence(center.lng, center.lat)
      return {
        id: s.id,
        storeName: s.storeName,
        storeCoordinate: center,
        geofence: fence,
        wheelPoints: createWheelPoints(center, idx)
      }
    })
    return base
  }

  function markerStyleId(point: WheelPoint) {
    return point.inFence ? 'in-fence' : 'out-fence'
  }

  function wheelMarkerIcon(point: WheelPoint): string {
    return point.inFence ? inFenceMarkerIcon : outFenceMarkerIcon
  }

  function tencentMarkerStyleConfig(iconUrl: string) {
    return {
      width: MARKER_ICON_SIZE.width,
      height: MARKER_ICON_SIZE.height,
      anchor: { x: Math.round(MARKER_ICON_SIZE.width / 2), y: MARKER_ICON_SIZE.height },
      src: iconUrl
    }
  }

  function googleMarkerIconConfig(iconUrl: string): unknown {
    const g = window.google?.maps as
      | {
          Size?: new (w: number, h: number) => unknown
          Point?: new (x: number, y: number) => unknown
        }
      | undefined
    if (g?.Size && g?.Point) {
      return {
        url: iconUrl,
        scaledSize: new g.Size(MARKER_ICON_SIZE.width, MARKER_ICON_SIZE.height),
        anchor: new g.Point(Math.round(MARKER_ICON_SIZE.width / 2), MARKER_ICON_SIZE.height)
      }
    }
    return iconUrl
  }

  function clearTencentMarkers() {
    setTencentMarkerHover(false)
    closeWheelCard()
    inFenceDrawerVisible.value = false
    while (tencentGlMarkers.length) {
      const m = tencentGlMarkers.pop()
      m?.setMap?.(null)
    }
    while (tencentLegacyMarkers.length) {
      const m = tencentLegacyMarkers.pop() as { setMap?: (v: unknown) => void }
      m?.setMap?.(null)
    }
  }

  function setTencentMarkerHover(
    visible: boolean,
    text: string = '',
    offset?: { x?: number; y?: number }
  ) {
    const el = tencentContainerRef.value
    if (el) {
      el.style.cursor = visible ? 'pointer' : ''
    }
    if (visible) {
      tencentHover.value = {
        visible: true,
        text,
        left: (offset?.x ?? 16) + 12,
        top: (offset?.y ?? 16) + 12
      }
    } else {
      tencentHover.value.visible = false
    }
  }

  function clearGoogleMarkers() {
    closeWheelCard()
    inFenceDrawerVisible.value = false
    googleMarkerInstances.forEach((m) => m.setMap?.(null))
    googleMarkerInstances = []
    googleFenceInstances.forEach((m) => m.setMap?.(null))
    googleFenceInstances = []
  }

  function fitTencentMap(stores: VisualStore[]) {
    const m = tencentMapInstance as {
      fitBounds?: (b: unknown, o?: unknown) => void
      setCenter?: (c: unknown) => void
      setZoom?: (z: number) => void
    } | null
    if (!m || stores.length === 0) return
    const src = getTencentScriptSrc()
    if (!src) return
    const mode = getTencentApiMode(src)
    if (mode === 'gl') {
      const TMap = window.TMap
      const TMapWithBounds = TMap as
        | (typeof TMap & {
            LatLngBounds?: new () => { extend: (p: unknown) => void }
          })
        | undefined
      if (!TMapWithBounds?.LatLngBounds || !TMapWithBounds.LatLng) return
      const bounds = new TMapWithBounds.LatLngBounds()
      stores.forEach((s) => {
        s.wheelPoints.forEach((p) => bounds.extend(new TMapWithBounds.LatLng(p.lat, p.lng)))
      })
      if (typeof m.fitBounds === 'function') {
        m.fitBounds(bounds, { padding: 80 })
      }
    } else {
      const qq = window.qq as
        | {
            maps?: {
              LatLngBounds?: new () => { extend: (p: unknown) => void }
              LatLng?: new (lat: number, lng: number) => unknown
            }
          }
        | undefined
      if (!qq?.maps?.LatLngBounds || !qq.maps.LatLng) return
      const LatLngBoundsCtor = qq.maps.LatLngBounds
      const LatLngCtor = qq.maps.LatLng
      if (!LatLngBoundsCtor || !LatLngCtor) return
      const bounds = new LatLngBoundsCtor()
      stores.forEach((s) => {
        s.wheelPoints.forEach((p) => bounds.extend(new LatLngCtor(p.lat, p.lng)))
      })
      if (typeof m.fitBounds === 'function') {
        m.fitBounds(bounds)
      }
    }
  }

  function fitGoogleMap(stores: VisualStore[]) {
    const maps = window.google?.maps as
      | {
          LatLngBounds?: new () => { extend: (p: unknown) => void }
        }
      | undefined
    const map = googleMapInstance as
      | {
          setCenter: (c: unknown) => void
          setZoom: (z: number) => void
          fitBounds: (b: unknown, p?: number) => void
        }
      | undefined
    if (!maps || !map || stores.length === 0) return
    if (stores.length === 1) {
      const p = stores[0].wheelPoints[0]
      if (!p) return
      map.setCenter({ lat: p.lat, lng: p.lng })
      map.setZoom(15)
      return
    }
    if (!maps.LatLngBounds) return
    const bounds = new maps.LatLngBounds()
    stores.forEach((s) => s.wheelPoints.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng })))
    map.fitBounds(bounds, 80)
  }

  function renderTencentMarkers(stores: VisualStore[]) {
    clearTencentMarkers()
    const el = tencentContainerRef.value
    if (!el || !tencentMapInstance || stores.length === 0) return

    const src = getTencentScriptSrc()
    if (!src) return
    const mode = getTencentApiMode(src)

    if (mode === 'gl') {
      const TMap = window.TMap
      if (
        !TMap?.MultiMarker ||
        !TMap?.MarkerStyle ||
        !TMap?.MultiPolyline ||
        !TMap?.PolylineStyle ||
        !TMap.LatLng
      )
        return
      const map = tencentMapInstance as InstanceType<typeof TMap.Map>
      const points = stores.flatMap((s) =>
        s.wheelPoints.map((p) => ({ storeName: s.storeName, ...p }))
      )
      const styleIds = Array.from(new Set(points.map((p) => markerStyleId(p))))
      const styles = styleIds.reduce<Record<string, InstanceType<typeof TMap.MarkerStyle>>>(
        (acc, sid) => {
          acc[sid] = new TMap.MarkerStyle({
            ...tencentMarkerStyleConfig(sid === 'in-fence' ? inFenceMarkerIcon : outFenceMarkerIcon)
          })
          return acc
        },
        {}
      )
      const multi = new TMap.MultiMarker({
        map,
        styles,
        geometries: points.map((p, idx) => ({
          id: `wheel-${idx}`,
          styleId: markerStyleId(p),
          position: new TMap.LatLng(p.lat, p.lng),
          properties: {
            title: wheelHoverTitle(p.storeName, p.wheelCount),
            ...p
          }
        }))
      })
      tencentGlMarkers.push(multi as { setMap?: (v: unknown) => void })
      const multiAny = multi as {
        on?: (evt: string, cb: (e: Record<string, unknown>) => void) => void
      }
      multiAny.on?.('mouseover', (e) => {
        const geometry = e.geometry as { properties?: { title?: string } } | undefined
        const pt = e.point as { x?: number; y?: number } | undefined
        setTencentMarkerHover(
          true,
          geometry?.properties?.title ?? t('mapView.hover.defaultPoint'),
          pt
        )
      })
      multiAny.on?.('mouseout', () => {
        setTencentMarkerHover(false)
      })
      multiAny.on?.('click', (e) => {
        const geometry = e.geometry as { properties?: WheelPointView } | undefined
        const data = geometry?.properties
        if (!data) {
          closeWheelCard()
          return
        }
        if (data.inFence) {
          openInFenceDrawer(data)
          return
        }
        openWheelCard(data)
      })

      const lineStyles = {
        fence: new TMap.PolylineStyle({
          color: '#3b82f6',
          width: 3,
          borderWidth: 0
        })
      }
      const multiLine = new TMap.MultiPolyline({
        map,
        styles: lineStyles,
        geometries: stores
          .filter((s) => Array.isArray(s.geofence) && s.geofence.length >= 3)
          .map((s) => {
            const pts = [...s.geofence, s.geofence[0]]
            return {
              id: `fence-${s.id}`,
              styleId: 'fence',
              paths: pts.map((p) => new TMap.LatLng(p.lat, p.lng))
            }
          })
      })
      tencentGlMarkers.push(multiLine as { setMap?: (v: unknown) => void })
    } else {
      const qq = window.qq as
        | {
            maps?: {
              Marker?: new (opts: Record<string, unknown>) => unknown
              LatLng?: new (lat: number, lng: number) => unknown
              Polyline?: new (opts: Record<string, unknown>) => unknown
            }
          }
        | undefined
      if (!qq?.maps?.Marker || !qq.maps.LatLng || !qq.maps.Polyline) return
      const MarkerCtor = qq.maps.Marker
      const LatLngCtor = qq.maps.LatLng
      const PolylineCtor = qq.maps.Polyline
      if (!MarkerCtor || !LatLngCtor) return
      const map = tencentMapInstance
      stores.forEach((s) => {
        s.wheelPoints.forEach((p) => {
          const marker = new MarkerCtor({
            map,
            position: new LatLngCtor(p.lat, p.lng),
            title: wheelHoverTitle(s.storeName, p.wheelCount),
            icon: wheelMarkerIcon(p),
            cursor: 'pointer'
          })
          tencentLegacyMarkers.push(marker)
          const eventApi = (
            window.qq as {
              maps?: {
                event?: {
                  addListener?: (
                    o: unknown,
                    evt: string,
                    cb: (e: Record<string, unknown>) => void
                  ) => void
                }
              }
            }
          )?.maps?.event
          eventApi?.addListener?.(marker, 'mouseover', (e) => {
            const px = e.pixel as { x?: number; y?: number } | undefined
            setTencentMarkerHover(true, wheelHoverTitle(s.storeName, p.wheelCount), px)
          })
          eventApi?.addListener?.(marker, 'mouseout', () => {
            setTencentMarkerHover(false)
          })
          eventApi?.addListener?.(marker, 'click', () => {
            if (p.inFence) {
              openInFenceDrawer({ storeName: s.storeName, ...p })
              return
            }
            openWheelCard({ storeName: s.storeName, ...p })
          })
        })
        if (Array.isArray(s.geofence) && s.geofence.length >= 3) {
          const path = [...s.geofence, s.geofence[0]].map((p) => new LatLngCtor(p.lat, p.lng))
          const line = new PolylineCtor({
            map,
            path,
            strokeColor: '#3b82f6',
            strokeWeight: 3
          })
          tencentLegacyMarkers.push(line)
        }
      })
    }
    fitTencentMap(stores)
  }

  function renderGoogleMarkers(stores: VisualStore[]) {
    clearGoogleMarkers()
    const maps = window.google?.maps as
      | {
          Marker?: new (opts: Record<string, unknown>) => unknown
          Polyline?: new (opts: Record<string, unknown>) => unknown
        }
      | undefined
    const map = googleMapInstance
    if (!maps?.Marker || !maps?.Polyline || !map || stores.length === 0) return
    const MarkerCtor = maps.Marker
    const PolylineCtor = maps.Polyline

    stores.forEach((s) => {
      s.wheelPoints.forEach((p) => {
        const marker = new MarkerCtor({
          map,
          position: { lat: p.lat, lng: p.lng },
          title: wheelHoverTitle(s.storeName, p.wheelCount),
          icon: googleMarkerIconConfig(wheelMarkerIcon(p))
        })
        const markerAny = marker as {
          addListener?: (event: string, cb: (e: Record<string, unknown>) => void) => void
        }
        markerAny.addListener?.('click', (e) => {
          if (p.inFence) {
            openInFenceDrawer({ storeName: s.storeName, ...p })
            return
          }
          const domEvt = e.domEvent as MouseEvent | undefined
          const rect = googleContainerRef.value?.getBoundingClientRect()
          const pxFromMouse =
            domEvt && rect
              ? { x: domEvt.clientX - rect.left, y: domEvt.clientY - rect.top }
              : undefined
          const px = getPixelByLngLat(p.lng, p.lat) ?? pxFromMouse
          openWheelCard({ storeName: s.storeName, ...p }, px)
        })
        googleMarkerInstances.push(marker as { setMap?: (v: unknown) => void })
      })
      if (Array.isArray(s.geofence) && s.geofence.length >= 3) {
        const path = [...s.geofence, s.geofence[0]].map((p) => ({
          lat: p.lat,
          lng: p.lng
        }))
        const line = new PolylineCtor({
          map,
          path,
          strokeColor: '#3b82f6',
          strokeWeight: 3
        })
        googleFenceInstances.push(line as { setMap?: (v: unknown) => void })
      }
    })
    fitGoogleMap(stores)
  }

  function applyMarkersToActiveMap(stores: VisualStore[]) {
    lastStores.value = stores
    if (activeProvider.value === 'tencent') {
      renderTencentMarkers(stores)
    } else {
      renderGoogleMarkers(stores)
    }
  }

  async function fetchStoresForMap(params: Api.Dashboard.MapViewSearchParams): Promise<StoreRow[]> {
    const res = await fetchStoreList({
      current: 1,
      size: 500,
      countryCode: params.countryCode,
      partnerId: params.partnerId,
      regionId: params.regionId
    })
    let list = res.records
    if (params.storeId != null) {
      list = list.filter((s) => s.id === params.storeId)
    }
    return list
  }

  function canQueryWithFilters(p: Api.Dashboard.MapViewSearchParams): boolean {
    return Boolean(p.countryCode && p.partnerId != null && p.regionId !== undefined)
  }

  async function loadAndShowMarkers(params: Api.Dashboard.MapViewSearchParams) {
    const stores = await fetchStoresForMap(params)
    if (stores.length === 0) {
      ElMessage.warning(t('mapView.messages.noStores'))
      clearTencentMarkers()
      clearGoogleMarkers()
      lastStores.value = []
      return
    }
    await ensureMapForProvider(activeProvider.value)
    applyMarkersToActiveMap(appendMockStores(stores))
  }

  async function onFilterSearch(p: Api.Dashboard.MapViewSearchParams) {
    if (!canQueryWithFilters(p)) {
      ElMessage.warning(t('mapView.messages.selectFilters'))
      return
    }
    await loadAndShowMarkers(p)
  }

  function onFilterReset() {
    searchForm.value = {
      countryCode: undefined,
      partnerId: lockedPartnerId.value,
      regionId: undefined,
      storeId: undefined
    }
    lastStores.value = []
    clearTencentMarkers()
    clearGoogleMarkers()
  }

  async function loadScopedUserMarkers() {
    if (isRegionScopedUser.value) {
      const rid = userStore.info.regionId
      if (rid == null) {
        ElMessage.warning(t('mapView.messages.regionNotBound'))
        return
      }
      await loadAndShowMarkers({ regionId: rid })
      return
    }
    if (isStoreScopedUser.value) {
      const sid = userStore.info.storeId
      if (sid == null) {
        ElMessage.warning(t('mapView.messages.storeNotBound'))
        return
      }
      const res = await fetchStoreList({ current: 1, size: 500 })
      const one = res.records.filter((s) => s.id === sid)
      if (one.length === 0) {
        ElMessage.warning(t('mapView.messages.storeDataMissing'))
        return
      }
      await ensureMapForProvider(activeProvider.value)
      applyMarkersToActiveMap(appendMockStores(one))
    }
  }

  function initTencentMap() {
    const el = tencentContainerRef.value
    if (!el) return

    const src = getTencentScriptSrc()
    if (!src) return

    const mode = getTencentApiMode(src)

    if (mode === 'gl') {
      const TMap = window.TMap
      if (!TMap?.Map || !TMap?.LatLng) return
      const center = new TMap.LatLng(39.9042, 116.4074)
      tencentMapInstance = new TMap.Map(el, {
        center,
        zoom: 12
      })
    } else {
      const qq = window.qq
      if (!qq?.maps) return
      const center = new qq.maps.LatLng(39.9042, 116.4074)
      tencentMapInstance = new qq.maps.Map(el, {
        center,
        zoom: 12
      })
    }
    const followSrc = getTencentScriptSrc()
    if (followSrc && getTencentApiMode(followSrc) === 'gl') {
      const map = tencentMapInstance as {
        on?: (evt: string, cb: () => void) => void
      }
      ;['bounds_changed', 'center_changed', 'zoom_changed', 'dragging', 'dragend'].forEach((evt) =>
        map.on?.(evt, () => refreshWheelCardPosition())
      )
    } else {
      const qqEvent = (
        window.qq as {
          maps?: { event?: { addListener?: (obj: unknown, evt: string, cb: () => void) => void } }
        }
      )?.maps?.event
      ;['bounds_changed', 'center_changed', 'zoom_changed', 'dragend'].forEach((evt) =>
        qqEvent?.addListener?.(tencentMapInstance, evt, () => refreshWheelCardPosition())
      )
    }
    tencentMapInited.value = true
  }

  function tencentMapResize() {
    const m = tencentMapInstance as { resize?: () => void } | null
    if (m && typeof m.resize === 'function') {
      m.resize()
    }
  }

  function initGoogleMap() {
    const el = googleContainerRef.value
    const maps = window.google?.maps
    if (!el || !maps) return

    googleMapInstance = new maps.Map(el, {
      center: { lat: 39.9042, lng: 116.4074 },
      zoom: 12,
      mapTypeControl: true
    })
    const gEvent = (
      maps as { event?: { addListener?: (obj: unknown, event: string, cb: () => void) => void } }
    ).event
    gEvent?.addListener?.(googleMapInstance, 'bounds_changed', () => refreshWheelCardPosition())
    gEvent?.addListener?.(googleMapInstance, 'zoom_changed', () => refreshWheelCardPosition())
    gEvent?.addListener?.(googleMapInstance, 'drag', () => refreshWheelCardPosition())
    googleMapInited.value = true
  }

  async function ensureTencent() {
    try {
      configError.value = ''
      await ensureTencentMapSdk()
      await nextTick()
      await nextTick()
      if (!tencentMapInited.value) {
        initTencentMap()
      }
      requestAnimationFrame(() => tencentMapResize())
    } catch (e) {
      configError.value = e instanceof Error ? e.message : String(e)
    }
  }

  async function ensureGoogle() {
    try {
      configError.value = ''
      await ensureGoogleMapSdk()
      await nextTick()
      if (!googleMapInited.value) {
        initGoogleMap()
      }
    } catch (e) {
      configError.value = e instanceof Error ? e.message : String(e)
    }
  }

  async function ensureMapForProvider(p: MapProvider) {
    if (p === 'tencent') {
      await ensureTencent()
    } else {
      await ensureGoogle()
    }
  }

  watch(activeProvider, async (v) => {
    if (v === 'tencent') {
      await ensureTencent()
      await nextTick()
      const src = getTencentScriptSrc()
      if (
        src &&
        getTencentApiMode(src) === 'legacy' &&
        window.qq?.maps?.event &&
        tencentMapInstance
      ) {
        window.qq.maps.event.trigger(tencentMapInstance, 'resize')
      } else {
        tencentMapResize()
      }
      setTencentMarkerHover(false)
    } else {
      await ensureGoogle()
      await nextTick()
      const g = window.google?.maps
      if (g?.event && googleMapInstance) {
        g.event.trigger(googleMapInstance as object, 'resize')
      }
    }
    if (lastStores.value.length > 0) {
      applyMarkersToActiveMap(lastStores.value)
      refreshWheelCardPosition()
    }
  })

  watch(locale, () => {
    if (lastStores.value.length > 0) {
      applyMarkersToActiveMap(lastStores.value)
    }
  })

  onMounted(async () => {
    if (!getTencentScriptSrc() && !getGoogleScriptBase()) {
      configError.value = t('mapView.config.missingKeys')
      return
    }

    if (showOrgFilters.value) {
      if (lockedPartnerId.value != null) {
        searchForm.value.partnerId = lockedPartnerId.value
      }
      if (activeProvider.value === 'tencent') {
        await ensureTencent()
      } else {
        await ensureGoogle()
      }
      return
    }

    if (activeProvider.value === 'tencent') {
      await ensureTencent()
    } else {
      await ensureGoogle()
    }
    await loadScopedUserMarkers()
  })

  onUnmounted(() => {
    setTencentMarkerHover(false)
    clearTencentMarkers()
    clearGoogleMarkers()
    tencentMapInstance = null
    googleMapInstance = null
    tencentMapInited.value = false
    googleMapInited.value = false
  })
</script>

<style scoped>
  :deep(.map-provider-switch .el-radio-button__inner) {
    cursor: pointer;
  }

  :deep(.in-fence-drawer .el-drawer__body) {
    padding-top: 0;
    overflow: hidden;
  }
</style>
