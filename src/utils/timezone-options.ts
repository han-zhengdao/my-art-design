/** 全球 IANA 时区：值存 IANA ID，展示含当前 UTC 偏移（受夏令时影响为「当前」偏移） */

export type TimezoneOption = { value: string; label: string }

export type TimezoneGroup = { label: string; options: TimezoneOption[] }

let cachedFlatOptions: TimezoneOption[] | null = null

/** 全球常用（置顶展示，下方分组中不再重复） */
export const POPULAR_TIMEZONE_IDS: readonly string[] = [
  'UTC',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland'
]

/** 浏览器报告的本地 IANA 时区（与 Intl 一致，如 Asia/Shanghai）；不可用则返回 null */
export function getBrowserLocalTimeZone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (typeof tz === 'string' && tz.length > 0) return tz
  } catch {
    /* ignore */
  }
  return null
}

/** 与门店「所属国家」下拉对应的默认 IANA（一国多区时取业务上最常用的一个） */
export function getSuggestedTimezoneForCountry(
  countryCode: string | undefined | null
): string | null {
  if (!countryCode) return null
  const map: Record<string, string> = {
    CN: 'Asia/Shanghai',
    US: 'America/New_York',
    JP: 'Asia/Tokyo',
    NO: 'Europe/Oslo',
    DE: 'Europe/Berlin'
  }
  return map[countryCode] ?? null
}

function formatOffsetShort(timeZone: string): string {
  try {
    const d = new Date()
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset'
    }).formatToParts(d)
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

function listIanaIds(): string[] {
  try {
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
      .supportedValuesOf
    if (typeof supportedValuesOf === 'function') {
      return supportedValuesOf.call(Intl, 'timeZone')
    }
  } catch {
    /* ignore */
  }
  return [
    'UTC',
    'Etc/UTC',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Australia/Sydney'
  ]
}

/** 单条选项（与全量列表 label 规则一致） */
export function getTimezoneOption(value: string): TimezoneOption {
  return {
    value,
    label: `${value} (${formatOffsetShort(value) || '—'})`
  }
}

/** 浏览器支持的 IANA 时区扁平列表（带缓存），按标识排序 */
export function getIanaTimezoneOptions(): TimezoneOption[] {
  if (cachedFlatOptions) return cachedFlatOptions
  const ids = listIanaIds()
  cachedFlatOptions = ids
    .map((value) => getTimezoneOption(value))
    .sort((a, b) => a.value.localeCompare(b.value))
  return cachedFlatOptions
}

function ianaAreaToGroupLabel(id: string): string {
  const seg = id.split('/')[0] || id
  const zh: Record<string, string> = {
    Africa: '非洲',
    America: '美洲',
    Antarctica: '南极洲',
    Arctic: '北极地区',
    Asia: '亚洲',
    Atlantic: '大西洋',
    Australia: '大洋洲',
    Brazil: '巴西',
    Canada: '加拿大',
    Chile: '智利',
    Europe: '欧洲',
    Indian: '印度洋',
    Mexico: '墨西哥',
    Pacific: '太平洋',
    US: '美国',
    Etc: '其他 (Etc)',
    UTC: 'UTC'
  }
  return zh[seg] || seg
}

/**
 * 分组下拉：常用 + 按 IANA 首段分区，降低扫列表成本。
 * @param ensureValue 编辑时若旧值不在标准列表中，单独一组展示避免空白
 */
export function getGroupedTimezoneSelectOptions(ensureValue?: string | null): TimezoneGroup[] {
  const all = getIanaTimezoneOptions()
  const allByValue = new Map(all.map((o) => [o.value, o]))
  const popularSet = new Set<string>(POPULAR_TIMEZONE_IDS)

  const popularOptions: TimezoneOption[] = []
  for (const id of POPULAR_TIMEZONE_IDS) {
    const opt = allByValue.get(id)
    if (opt) popularOptions.push(opt)
  }

  const rest = all.filter((o) => !popularSet.has(o.value))
  const groupMap = new Map<string, TimezoneOption[]>()
  for (const opt of rest) {
    const g = ianaAreaToGroupLabel(opt.value)
    if (!groupMap.has(g)) groupMap.set(g, [])
    groupMap.get(g)!.push(opt)
  }
  for (const [, opts] of groupMap) {
    opts.sort((a, b) => a.value.localeCompare(b.value))
  }

  const regionGroups = Array.from(groupMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))
    .map(([label, options]) => ({ label, options }))

  const groups: TimezoneGroup[] = [{ label: '常用', options: popularOptions }, ...regionGroups]

  if (!ensureValue) return groups

  const exists = groups.some((g) => g.options.some((o) => o.value === ensureValue))
  if (exists) return groups

  return [{ label: '已保存时区', options: [getTimezoneOption(ensureValue)] }, ...groups]
}

/** 详情/兜底展示：IANA + 当前偏移 */
export function formatTimezoneLabel(iana: string | undefined | null): string {
  if (!iana) return '--'
  return `${iana} (${formatOffsetShort(iana) || '—'})`
}
