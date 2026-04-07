/**
 * 粗略判断 WGS84 经纬度是否落在中国境内常用地图服务范围（矩形包络，非精确国界线）。
 * 用于「境内打开高德/腾讯类、境外打开谷歌」等分流；边界附近或邻国境内可能有误判。
 */
export function isLikelyChinaTerritory(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  return lng >= 73.0 && lng <= 135.5 && lat >= 18.0 && lat <= 54.5
}
