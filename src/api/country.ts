/**
 * 国家基础数据：GET /system/country/getCountryList，供各业务模块下拉 / 展示复用。
 */

import request from '@/utils/http'

let cachedList: Api.Country.CountryListItem[] | null = null
let inflight: Promise<Api.Country.CountryListItem[]> | null = null

/**
 * 国家列表 GET /system/country/getCountryList
 * @param options.force 为 true 时忽略内存缓存并重新请求
 */
export function fetchCountryList(options?: {
  force?: boolean
}): Promise<Api.Country.CountryListItem[]> {
  if (!options?.force && cachedList) {
    return Promise.resolve(cachedList)
  }
  if (!options?.force && inflight) {
    return inflight
  }
  inflight = request
    .get<Api.Country.CountryListItem[]>({
      url: '/system/country/getCountryList'
    })
    .then((data) => {
      const list = Array.isArray(data) ? data : []
      cachedList = list
      inflight = null
      return list
    })
    .catch((e) => {
      inflight = null
      throw e
    })
  return inflight
}

/** 清空列表缓存（如切换账号、需强制同步主数据时） */
export function clearCountryListCache(): void {
  cachedList = null
  inflight = null
}

/** 展示用国家名（默认中文名） */
export function getCountryDisplayName(
  row: Api.Country.CountryListItem,
  locale: 'zh' | 'en' = 'zh'
): string {
  return locale === 'en' ? row.countryNameEn : row.countryNameZh
}
