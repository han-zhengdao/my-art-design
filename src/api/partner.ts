/**
 * 合作商管理：列表分页、新增、详情、修改、删除均已对接后端。
 */

import request from '@/utils/http'

/** 搜索栏国家编码 → countryId（请与后端国家主表 id 对齐后修改） */
export const PARTNER_COUNTRY_CODE_TO_ID: Record<string, number> = {
  CN: 1,
  US: 2,
  JP: 3,
  NO: 4,
  DE: 5
}

/** 国家 id → 前端国家编码（与 PARTNER_COUNTRY_CODE_TO_ID 互逆） */
export function countryIdToCountryCode(countryId: number | undefined): string | undefined {
  if (countryId == null) return undefined
  const hit = Object.entries(PARTNER_COUNTRY_CODE_TO_ID).find(([, v]) => v === countryId)
  return hit?.[0]
}

function normalizePartnerListItem(row: Api.Partner.PartnerListItem): Api.Partner.PartnerListItem {
  return {
    ...row,
    contactName: row.contactName ?? row.contact,
    enterpriseAddress: row.enterpriseAddress ?? row.address,
    country: row.country ?? row.countryName ?? '',
    countryCode: row.countryCode ?? ''
  }
}

/** 按国家拉取合作商（用于下拉联动等） */
export function fetchPartnersByCountry(
  countryCode: string
): Promise<Api.Partner.PartnerListItem[]> {
  const countryId = PARTNER_COUNTRY_CODE_TO_ID[countryCode]
  return fetchPartnerList({
    pageNum: 1,
    pageSize: 500,
    ...(countryId != null ? { countryId } : { countryCode })
  }).then((res) => res.records)
}

/** 分页查询合作商 GET /org/partner/getPartnerPageList */
export async function fetchPartnerList(
  params: Api.Partner.PartnerSearchParams
): Promise<Api.Partner.PartnerList> {
  const countryId =
    params.countryId ??
    (params.countryCode ? PARTNER_COUNTRY_CODE_TO_ID[params.countryCode] : undefined)

  const data = await request.get<{
    records: Api.Partner.PartnerListItem[]
    total: number
    pageNum: number
    pageSize: number
  }>({
    url: '/org/partner/getPartnerPageList',
    params: {
      pageNum: params.pageNum ?? 1,
      pageSize: Math.min(params.pageSize ?? 10, 200),
      partnerName: params.partnerName,
      countryId,
      dataScopeSql: params.dataScopeSql
    }
  })

  return {
    records: (data.records ?? []).map(normalizePartnerListItem),
    total: data.total ?? 0,
    current: data.pageNum ?? params.pageNum ?? 1,
    size: data.pageSize ?? params.pageSize ?? 10
  }
}

/** 新增合作商 POST /org/partner/createPartner（同步创建登录用户） */
export function createPartner(payload: Api.Partner.CreatePartnerPayload): Promise<number> {
  return request.post<number>({
    url: '/org/partner/createPartner',
    params: {
      partnerName: payload.partnerName,
      email: payload.email,
      password: payload.password,
      ...(payload.contact?.trim() ? { contact: payload.contact.trim() } : {}),
      ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
      ...(payload.address?.trim() ? { address: payload.address.trim() } : {}),
      ...(payload.countryId != null ? { countryId: payload.countryId } : {})
    }
  })
}

/** 详情 → 与列表项一致的展示结构 */
function partnerDetailToListItem(d: Api.Partner.PartnerDetail): Api.Partner.PartnerListItem {
  const countryCode = countryIdToCountryCode(d.countryId) ?? ''
  return normalizePartnerListItem({
    id: d.id,
    partnerName: d.partnerName,
    contact: d.contact,
    phone: d.phone,
    address: d.address,
    contactName: d.contact,
    enterpriseAddress: d.address,
    countryId: d.countryId,
    countryName: d.countryName,
    country: d.countryName ?? '',
    countryCode,
    regionCount: d.regionCount ?? 0,
    storeCount: d.storeCount ?? 0,
    wheelCount: d.wheelCount ?? 0,
    beaconCount: d.beaconCount ?? 0,
    dcBalance: d.dcBalance ?? 0
  } as Api.Partner.PartnerListItem)
}

/** 查询合作商详情 GET /org/partner/getPartnerDetail */
export async function getPartnerDetail(id: number): Promise<Api.Partner.PartnerListItem> {
  const data = await request.get<Api.Partner.PartnerDetail>({
    url: '/org/partner/getPartnerDetail',
    params: { id }
  })
  return partnerDetailToListItem(data)
}

/** 修改合作商 POST /org/partner/updatePartner */
export function updatePartner(payload: Api.Partner.UpdatePartnerPayload): Promise<void> {
  return request.post<void>({
    url: '/org/partner/updatePartner',
    params: {
      id: payload.id,
      ...(payload.contact?.trim() ? { contact: payload.contact.trim() } : {}),
      ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
      ...(payload.address?.trim() ? { address: payload.address.trim() } : {}),
      ...(payload.countryId != null ? { countryId: payload.countryId } : {})
    }
  })
}

/** 删除合作商 POST /org/partner/deletePartner?id= */
export function deletePartner(id: number): Promise<void> {
  return request.post<void>({
    url: `/org/partner/deletePartner?id=${encodeURIComponent(String(id))}`
  })
}
