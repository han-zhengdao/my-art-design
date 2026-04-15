/**
 * 字典项展示文案：英文优先 dictValueEn，中文优先 dictValueZh，否则 dictValue
 */
export function getDictDataDisplayLabel(
  item: Api.SystemManage.DictDataItem,
  localeCode: string
): string {
  const isEn = localeCode?.toLowerCase().startsWith('en')
  if (isEn && item.dictValueEn?.trim()) return item.dictValueEn.trim()
  if (!isEn && item.dictValueZh?.trim()) return item.dictValueZh.trim()
  return item.dictValue?.trim() || String(item.dictKey)
}
