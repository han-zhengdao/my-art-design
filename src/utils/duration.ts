/** 将秒数格式化为小时展示（保留两位小数） */
export function formatSecondsAsHours(sec: number): string {
  const h = sec / 3600
  if (!Number.isFinite(h)) return '--'
  return `${h.toFixed(2)} 小时`
}
