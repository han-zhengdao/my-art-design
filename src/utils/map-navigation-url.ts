/**
 * 打开第三方地图「驾车路线」的网页链接（不依赖各 SDK）。
 * 境内：高德 uri.amap.com（与项目内高德标点链接一致，易用且覆盖广）。
 * 境外：Google Maps directions。
 *
 * 坐标均为经纬度数值；境内服务通常按 GCJ-02 使用，与 WGS84 有少量偏差属常见情况。
 */

export function buildAmapDrivingNavigationUrl(opts: {
  destLat: number
  destLng: number
  startLat?: number
  startLng?: number
}): string {
  const { destLat, destLng, startLat, startLng } = opts
  const q = new URLSearchParams()
  q.set('mode', 'car')
  q.set('policy', '1')
  q.set('src', 'pos_wheel')
  if (startLng != null && startLat != null) {
    q.set('from', `${startLng},${startLat}`)
  }
  q.set('to', `${destLng},${destLat}`)
  return `https://uri.amap.com/navigation?${q.toString()}`
}

export function buildGoogleMapsDrivingUrl(opts: {
  destLat: number
  destLng: number
  startLat?: number
  startLng?: number
}): string {
  const { destLat, destLng, startLat, startLng } = opts
  if (startLat != null && startLng != null) {
    return `https://www.google.com/maps/dir/${startLat},${startLng}/${destLat},${destLng}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`
}
