import request from '@/utils/http'

/** 合作商下拉 GET /org/partner/listPartnerOptions */
export function fetchListPartnerOptions() {
  return request.get<Api.Org.OptionItem[]>({
    url: '/org/partner/listPartnerOptions'
  })
}

/** 根据合作商查询区域下拉 GET /org/region/listRegionOptions?partnerId= */
export function fetchListRegionOptions(partnerId: number) {
  return request.get<Api.Org.OptionItem[]>({
    url: '/org/region/listRegionOptions',
    params: { partnerId }
  })
}

/** 根据合作商 + 区域查询门店下拉 GET /org/store/listStoreOptions?partnerId=&regionId= */
export function fetchListStoreOptions(params: Api.Org.StoreOptionsQuery) {
  return request.get<Api.Org.OptionItem[]>({
    url: '/org/store/listStoreOptions',
    params
  })
}
