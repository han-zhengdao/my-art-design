/**
 * 腾讯地图 GL MultiMarker 的 MarkerStyle.src 可用 data URI（避免依赖外链图床）
 */

/** 水滴形标记，mainColor 如 #16a34a / #dc2626 */
export function tencentGlPinDataUri(mainColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
  <path fill="${mainColor}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"
    d="M18 4C10.3 4 4 10.3 4 18c0 9 14 24 14 24s14-15 14-24c0-7.7-6.3-14-14-14z"/>
  <circle cx="18" cy="18" r="5" fill="#ffffff"/>
</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const TENCENT_GL_MARKER_START = tencentGlPinDataUri('#16a34a')
export const TENCENT_GL_MARKER_END = tencentGlPinDataUri('#dc2626')

/** 轨迹动画：沿路线移动的高亮点 */
export function tencentGlDotDataUri(fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
  <circle cx="11" cy="11" r="8" fill="${fill}" stroke="#ffffff" stroke-width="2.5"/>
</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const TENCENT_GL_MARKER_MOVER = tencentGlDotDataUri('#0ea5e9')
