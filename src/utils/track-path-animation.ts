/** 轨迹动画：缓动与当前段终点下标（用于逐步绘制折线） */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** eased∈[0,1]，共 pointCount 个点时，折线应画到第几个点（含），至少 2 个点 */
export function endVertexIndex(eased: number, pointCount: number): number {
  const max = pointCount - 1
  if (max < 1) return 0
  return Math.max(1, Math.min(max, Math.ceil(eased * max)))
}
