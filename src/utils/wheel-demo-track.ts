/**
 * 演示轨迹：在两点间生成折线点。
 * 若起点与终点重合或极近，会沿连线方向拉开最小间距，避免折线退化为一点、双标记重叠。
 */
export function buildDemoTrackPath(
  from: { lng: number; lat: number },
  to: { lng: number; lat: number },
  segments = 32
): { lng: number; lat: number }[] {
  const [a, b] = normalizeEndpointsForDemo(from, to)
  const pts: { lng: number; lat: number }[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const lng = a.lng + (b.lng - a.lng) * t
    const lat = a.lat + (b.lat - a.lat) * t
    const dx = b.lng - a.lng
    const dy = b.lat - a.lat
    const len = Math.hypot(dx, dy) || 1
    const amp = 0.00015 * Math.sin(t * Math.PI)
    const px = (-dy / len) * amp
    const py = (dx / len) * amp
    pts.push({ lng: lng + px, lat: lat + py })
  }
  return pts
}

/** 最小约 0.001° ≈ 100m 量级，保证地图上线长与双点可辨 */
const MIN_SEP_DEG = 0.0011

function normalizeEndpointsForDemo(
  from: { lng: number; lat: number },
  to: { lng: number; lat: number }
): [{ lng: number; lat: number }, { lng: number; lat: number }] {
  const dx = to.lng - from.lng
  const dy = to.lat - from.lat
  const len = Math.hypot(dx, dy)

  if (len < 1e-12) {
    const a = { lng: to.lng - 0.0025, lat: to.lat + 0.0012 }
    return [a, { lng: to.lng, lat: to.lat }]
  }

  if (len < MIN_SEP_DEG) {
    const ux = dx / len
    const uy = dy / len
    const a = { lng: to.lng - ux * MIN_SEP_DEG, lat: to.lat - uy * MIN_SEP_DEG }
    return [a, { lng: to.lng, lat: to.lat }]
  }

  return [from, to]
}
