<template>
  <div class="page-content">
    <ElRadioGroup v-model="activeProvider">
      <ElRadioButton value="tencent">腾讯地图</ElRadioButton>
      <ElRadioButton value="google">谷歌地图</ElRadioButton>
    </ElRadioGroup>
    <ElAlert
      v-if="configError"
      type="warning"
      :closable="false"
      class="mt-3"
      :title="configError"
    />
    <hr class="my-4 border-g-300" />
    <div
      class="relative min-h-[640px] h-[800px] w-full border border-g-200 bg-[var(--default-box-color)]"
    >
      <div
        v-show="activeProvider === 'tencent'"
        ref="tencentContainerRef"
        class="absolute inset-0 min-h-[640px] w-full rounded-lg"
      />
      <div
        v-show="activeProvider === 'google'"
        ref="googleContainerRef"
        class="absolute inset-0 min-h-[640px] w-full rounded-lg"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    ensureGoogleMapSdk,
    ensureTencentMapSdk,
    getGoogleScriptBase,
    getTencentApiMode,
    getTencentScriptSrc
  } from '@/utils/map-sdk'

  defineOptions({ name: 'DashboardMapView' })

  type MapProvider = 'tencent' | 'google'

  const activeProvider = ref<MapProvider>('tencent')
  const tencentContainerRef = ref<HTMLDivElement | null>(null)
  const googleContainerRef = ref<HTMLDivElement | null>(null)

  const tencentMapInited = ref(false)
  const googleMapInited = ref(false)

  let tencentMapInstance: unknown = null
  let googleMapInstance: unknown = null

  const configError = ref('')

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
    } else {
      await ensureGoogle()
      await nextTick()
      const g = window.google?.maps
      if (g?.event && googleMapInstance) {
        g.event.trigger(googleMapInstance as object, 'resize')
      }
    }
  })

  onMounted(async () => {
    if (!getTencentScriptSrc() && !getGoogleScriptBase()) {
      configError.value =
        '请至少配置腾讯或谷歌地图：VITE_TENCENT_MAP_KEY / VITE_TENCENT_MAP_SCRIPT_SRC 与 VITE_GOOGLE_MAP_KEY / VITE_GOOGLE_MAP_SCRIPT_SRC'
      return
    }
    if (activeProvider.value === 'tencent') {
      await ensureTencent()
    } else {
      await ensureGoogle()
    }
  })

  /** 实例仅属于本页 DOM；卸载后清空，避免再次进入时误判已初始化 */
  onUnmounted(() => {
    tencentMapInstance = null
    googleMapInstance = null
    tencentMapInited.value = false
    googleMapInited.value = false
  })
</script>
