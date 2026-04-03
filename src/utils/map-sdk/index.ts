/**
 * 地图 JS SDK 全局单例加载（多页面、多实例安全）
 *
 * - 同标签页内：腾讯/谷歌脚本各只注入一次；并发 `ensure*` 合并为同一 Promise。
 * - 各业务页面在自有容器上 `new Map` 得到独立实例，互不影响；不要在模块间共享 Map 实例。
 * - 不同页面可各自加标记/路线等，仅操作自己的实例即可。
 */

export type TencentMapSdkMode = 'gl' | 'legacy'

export type TencentSdkReady = { mode: TencentMapSdkMode; scriptSrc: string }

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

function resolveGoogleScriptBase(): string | null {
  const custom = import.meta.env.VITE_GOOGLE_MAP_SCRIPT_SRC?.trim()
  if (custom) return custom
  const key = import.meta.env.VITE_GOOGLE_MAP_KEY?.trim()
  if (key) {
    return `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`
  }
  return null
}

export function getTencentScriptSrc(): string | null {
  return resolveTencentScriptSrc()
}

export function getGoogleScriptBase(): string | null {
  return resolveGoogleScriptBase()
}

export function getTencentApiMode(scriptSrc: string): TencentMapSdkMode {
  if (scriptSrc.includes('gljs')) return 'gl'
  if (/\/api\/js\b/.test(scriptSrc)) return 'legacy'
  return 'gl'
}

function isTencentSdkReady(mode: TencentMapSdkMode): boolean {
  if (mode === 'gl') return Boolean(window.TMap?.Map && window.TMap?.LatLng)
  return Boolean(window.qq?.maps?.Map && window.qq?.maps?.LatLng)
}

async function waitForTencentReady(mode: TencentMapSdkMode): Promise<boolean> {
  for (let i = 0; i < 80; i++) {
    if (isTencentSdkReady(mode)) return true
    await new Promise((r) => setTimeout(r, 50))
  }
  return false
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

let tencentEnsurePromise: Promise<TencentSdkReady> | null = null

/**
 * 确保腾讯地图 SDK 已就绪（全局只加载一次；可多处 await）。
 */
export function ensureTencentMapSdk(): Promise<TencentSdkReady> {
  const scriptSrc = resolveTencentScriptSrc()
  if (!scriptSrc) {
    return Promise.reject(
      new Error(
        '未配置腾讯地图：请在 .env 中设置 VITE_TENCENT_MAP_KEY，或设置 VITE_TENCENT_MAP_SCRIPT_SRC 为完整脚本地址。'
      )
    )
  }
  const mode = getTencentApiMode(scriptSrc)
  if (isTencentSdkReady(mode)) {
    return Promise.resolve({ mode, scriptSrc })
  }
  if (!tencentEnsurePromise) {
    tencentEnsurePromise = (async (): Promise<TencentSdkReady> => {
      await loadScriptOnce(scriptSrc)
      const ready = await waitForTencentReady(mode)
      if (!ready) {
        throw new Error(
          '腾讯地图 SDK 未加载成功。请确认 Key 有效、控制台已配置当前域名白名单；新 Key 请使用 GL 版（默认 gljs），仅旧项目可设 VITE_TENCENT_MAP_USE_LEGACY=true。'
        )
      }
      return { mode, scriptSrc }
    })().catch((e) => {
      tencentEnsurePromise = null
      throw e
    })
  }
  return tencentEnsurePromise
}

function buildGoogleScriptUrlWithCallback(base: string, callbackName: string): string {
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

let googleEnsurePromise: Promise<void> | null = null

/**
 * 确保谷歌 Maps JavaScript API 已就绪（全局只加载一次；可多处 await）。
 */
export function ensureGoogleMapSdk(): Promise<void> {
  if (window.google?.maps) {
    return Promise.resolve()
  }
  if (!googleEnsurePromise) {
    const base = resolveGoogleScriptBase()
    if (!base) {
      return Promise.reject(
        new Error(
          '未配置谷歌地图：请在 .env 中设置 VITE_GOOGLE_MAP_KEY，或设置 VITE_GOOGLE_MAP_SCRIPT_SRC 为完整脚本地址。'
        )
      )
    }
    googleEnsurePromise = new Promise<void>((resolve, reject) => {
      const cbName = `__googleMapSdk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      ;(window as unknown as Record<string, unknown>)[cbName] = () => {
        resolve()
        delete (window as unknown as Record<string, unknown>)[cbName]
      }
      const url = buildGoogleScriptUrlWithCallback(base, cbName)
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
    }).catch((e) => {
      googleEnsurePromise = null
      throw e
    })
  }
  return googleEnsurePromise
}
