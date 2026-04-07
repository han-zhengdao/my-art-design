/**
 * 将 dBm 信号强度转为文案（信标 / LoRa 等通用）
 * ≥ -70：极强；-80~-70：流畅；-90~-80：一般；-100~-90：偏弱；＜-100：不可用
 */
export function signalStrengthLabel(dbm: number): string {
  if (dbm >= -70) return '极强'
  if (dbm >= -80) return '流畅'
  if (dbm >= -90) return '一般'
  if (dbm >= -100) return '偏弱'
  return '不可用'
}

/** 文案 + 原始 dBm，便于列表/详情展示 */
export function formatSignalStrength(dbm: number): string {
  return `${signalStrengthLabel(dbm)}（${dbm} dBm）`
}
