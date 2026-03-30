<template>
  <div class="page-content">
    <ElRadioGroup v-model="activeProvider">
      <ElRadioButton value="tencent">腾讯地图</ElRadioButton>
      <ElRadioButton value="google">谷歌地图</ElRadioButton>
    </ElRadioGroup>
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

  const tencentScriptSrc = computed(() => resolveTencentScriptSrc())
  const googleScriptBase = computed(() => resolveGoogleScriptBase())

  /** 腾讯新控制台申请的 key 一般对应 JavaScript API GL（gljs + TMap），旧版为 api/js + qq.maps */
  function resolveTencentScriptSrc(): string | null {
    const custom = import.meta.env.VITE_TENCENT_MAP_SCRIPT_SRC?.trim()
    if (custom) return custom
    const key = import.meta.env.VITE_TENCENT_MAP_KEY?.trim()
    if (key) {
      const useLegacy = import.meta.env.VITE_TENCENT_MAP_USE_LEGACY === 'true'
      if (useLegacy) {
        return `https://map.qq.com/api/js?v=2.exp&key=${encodeURIComponent(key)}`
      }
      return `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(key)}`
    }
    return null
  }

  function getTencentApiMode(scriptSrc: string): 'gl' | 'legacy' {
    if (scriptSrc.includes('gljs')) return 'gl'
    if (/\/api\/js\b/.test(scriptSrc)) return 'legacy'
    return 'gl'
  }

  async function waitForTencentReady(mode: 'gl' | 'legacy'): Promise<boolean> {
    for (let i = 0; i < 80; i++) {
      if (mode === 'gl' && window.TMap?.Map && window.TMap?.LatLng) return true
      if (mode === 'legacy' && window.qq?.maps?.Map && window.qq?.maps?.LatLng) return true
      await new Promise((r) => setTimeout(r, 50))
    }
    return false
  }

  /** 仅 key 或完整 script 的「基础地址」；谷歌需额外拼 callback */
  function resolveGoogleScriptBase(): string | null {
    const custom = import.meta.env.VITE_GOOGLE_MAP_SCRIPT_SRC?.trim()
    if (custom) return custom
    const key = import.meta.env.VITE_GOOGLE_MAP_KEY?.trim()
    if (key) {
      return `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`
    }
    return null
  }

  function loadScriptOnce(src: string): Promise<void> {
    const existing = document.querySelector(`script[data-map-src="${encodeURIComponent(src)}"]`)
    if (existing) {
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.async = true
      script.dataset.mapSrc = src
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`脚本加载失败: ${src}`))
      document.head.appendChild(script)
    })
  }

  function buildGoogleScriptUrl(callbackName: string): string | null {
    const base = googleScriptBase.value
    if (!base) return null
    try {
      const url = new URL(base, window.location.origin)
      if (!url.searchParams.has('callback')) {
        url.searchParams.set('callback', callbackName)
      }
      return url.toString()
    } catch {
      const join = base.includes('?') ? '&' : '?'
      return `${base}${join}callback=${encodeURIComponent(callbackName)}`
    }
  }

  function initTencentMap() {
    const el = tencentContainerRef.value
    if (!el) return

    const src = tencentScriptSrc.value
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
    const src = tencentScriptSrc.value
    if (!src) {
      configError.value =
        '未配置腾讯地图：请在 .env 中设置 VITE_TENCENT_MAP_KEY，或设置 VITE_TENCENT_MAP_SCRIPT_SRC 为完整脚本地址。'
      return
    }
    configError.value = ''
    await loadScriptOnce(src)
    const mode = getTencentApiMode(src)
    const ready = await waitForTencentReady(mode)
    if (!ready) {
      configError.value =
        '腾讯地图 SDK 未加载成功。请确认 Key 有效、控制台已配置当前域名白名单；新 Key 请使用 GL 版（默认 gljs），仅旧项目可设 VITE_TENCENT_MAP_USE_LEGACY=true。'
      return
    }
    await nextTick()
    await nextTick()
    if (!tencentMapInited.value) {
      initTencentMap()
    }
    requestAnimationFrame(() => tencentMapResize())
  }

  async function ensureGoogle() {
    const base = googleScriptBase.value
    if (!base) {
      configError.value =
        '未配置谷歌地图：请在 .env 中设置 VITE_GOOGLE_MAP_KEY，或设置 VITE_GOOGLE_MAP_SCRIPT_SRC 为完整脚本地址。'
      return
    }
    configError.value = ''

    if (window.google?.maps) {
      await nextTick()
      if (!googleMapInited.value) initGoogleMap()
      return
    }

    const cbName = `__googleMapLoaded_${Date.now()}`
    await new Promise<void>((resolve, reject) => {
      ;(window as unknown as Record<string, unknown>)[cbName] = () => {
        resolve()
        delete (window as unknown as Record<string, unknown>)[cbName]
      }
      const url = buildGoogleScriptUrl(cbName)
      if (!url) {
        reject(new Error('谷歌地图脚本地址无效'))
        return
      }
      const script = document.createElement('script')
      script.src = url
      script.async = true
      script.defer = true
      script.onerror = () => reject(new Error('谷歌地图脚本加载失败'))
      document.head.appendChild(script)
    })

    await nextTick()
    if (!googleMapInited.value) {
      initGoogleMap()
    }
  }

  watch(activeProvider, async (v) => {
    if (v === 'tencent') {
      await ensureTencent()
      await nextTick()
      const src = tencentScriptSrc.value
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
    if (!tencentScriptSrc.value && !googleScriptBase.value) {
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
</script>
