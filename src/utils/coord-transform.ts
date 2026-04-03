/**
 * 坐标转换（WGS84 <-> GCJ-02）
 *
 * - 浏览器 `navigator.geolocation` 返回通常为 WGS84
 * - 国内不少地图（常见如高德/腾讯）展示或交互可能以 GCJ-02 为准
 * - 这里主要用于：当地图使用腾讯/QQ，并且中心点来源是浏览器定位时，把 WGS84 转为 GCJ-02，减少默认点位偏移
 *
 * 参考实现（公开算法）：
 *   - transformLat / transformLng / outOfChina 判断
 */

export function isOutOfChina(lng: number, lat: number): boolean {
  // 经度在 [73.66, 135.05]，纬度在 [3.86, 53.55]
  return lng < 73.66 || lng > 135.05 || lat < 3.86 || lat > 53.55
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0
  ret +=
    ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0
  ret +=
    ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0
  return ret
}

/**
 * WGS84 -> GCJ-02
 */
export function wgs84ToGcj02(lng: number, lat: number): { lng: number; lat: number } {
  if (isOutOfChina(lng, lat)) return { lng, lat }

  const a = 6378245.0
  // eslint-disable-next-line no-loss-of-precision
  const ee = 0.00669342162296594323

  const dLat = transformLat(lng - 105.0, lat - 35.0)
  const dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * Math.PI
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)

  const mgLat = dLat / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI)
  const mgLng = dLng / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI)

  const gcjLat = lat + mgLat
  const gcjLng = lng + mgLng
  return { lng: gcjLng, lat: gcjLat }
}

const gpsTranslateCache = new Map<string, Promise<{ lng: number; lat: number } | null>>()

/**
 * 使用腾讯 WebService 将 GPS(WGS84) 转为腾讯地图坐标体系（通常为 GCJ-02）
 * https://lbs.qq.com/webservice_v1/guide-convert.html
 *
 * - 仅当在中国境内才建议调用（境外会自动返回原坐标）
 * - 若 key 未配置或网络失败，返回 null 由调用方回退策略处理
 */
export async function translateGpsToTencentGcj02(
  lng: number,
  lat: number
): Promise<{ lng: number; lat: number } | null> {
  if (isOutOfChina(lng, lat)) return { lng, lat }

  const key = import.meta.env.VITE_TENCENT_MAP_KEY?.trim()
  if (!key) return null

  const cacheKey = `${lng},${lat}`
  const cached = gpsTranslateCache.get(cacheKey)
  if (cached) return cached

  const p = (async () => {
    try {
      const res = await fetch(
        `https://apis.map.qq.com/ws/coord/v1/translate?locations=${encodeURIComponent(
          `${lat},${lng}`
        )}&type=1&key=${encodeURIComponent(key)}&output=json`,
        { method: 'GET' }
      )
      if (!res.ok) return null
      type TranslateResponse = {
        status: number
        message?: string
        locations?: Array<{ lng: number; lat: number }>
      }
      const json = (await res.json()) as TranslateResponse
      if (json.status === 0 && Array.isArray(json.locations) && json.locations.length > 0) {
        return { lng: json.locations[0].lng, lat: json.locations[0].lat }
      }
      return null
    } catch {
      return null
    }
  })()

  gpsTranslateCache.set(cacheKey, p)
  return p
}
