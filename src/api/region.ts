/**
 * 区域管理：分页列表、新增、详情、修改、删除已对接后端；
 * 批量删除暂以循环调用单删接口实现。
 */

import request from '@/utils/http'
import { PARTNER_COUNTRY_CODE_TO_ID } from '@/api/partner'

/** 接口分页单条（字段名与列表展示字段对齐） */
type RegionPageRecord = {
  id: number
  regionName: string
  partnerId: number
  partnerName: string
  countryName?: string
  storeCount?: number
  contact?: string
  phone?: string
  address?: string
  wheelCount?: number
  beaconCount?: number
  dcBalance?: number
  country?: string
  countryCode?: string
  regionAddress?: string
  regionContactName?: string
  regionPhone?: string
  loginEmail?: string
  pendingTicketCount?: number
  createTime?: string
  operatorName?: string
}

function normalizeRegionListItem(row: RegionPageRecord): Api.Region.RegionListItem {
  return {
    id: row.id,
    regionName: row.regionName,
    partnerId: row.partnerId,
    partnerName: row.partnerName,
    country: row.country ?? row.countryName ?? '',
    countryCode: row.countryCode ?? '',
    regionAddress: row.regionAddress ?? row.address ?? '',
    regionContactName: row.regionContactName ?? row.contact ?? '',
    regionPhone: row.regionPhone ?? row.phone ?? '',
    dcBalance: row.dcBalance ?? 0,
    storeCount: row.storeCount ?? 0,
    wheelCount: row.wheelCount ?? 0,
    beaconCount: row.beaconCount ?? 0,
    pendingTicketCount: row.pendingTicketCount ?? 0,
    loginEmail: row.loginEmail,
    createTime: row.createTime ?? '',
    operatorName: row.operatorName ?? ''
  }
}

/** 分页查询区域 GET /org/region/getRegionPageList */
export async function fetchRegionList(
  params: Api.Region.RegionSearchParams
): Promise<Api.Region.RegionList> {
  const countryId =
    params.countryId ??
    (params.countryCode ? PARTNER_COUNTRY_CODE_TO_ID[params.countryCode] : undefined)

  const pageNum = params.pageNum ?? params.current ?? 1
  const pageSize = Math.min(params.pageSize ?? params.size ?? 10, 200)

  const data = await request.get<{
    records: RegionPageRecord[]
    total: number
    pageNum: number
    pageSize: number
  }>({
    url: '/org/region/getRegionPageList',
    params: {
      pageNum,
      pageSize,
      ...(params.regionName?.trim() ? { regionName: params.regionName.trim() } : {}),
      ...(countryId != null ? { countryId } : {}),
      ...(params.partnerId != null ? { partnerId: params.partnerId } : {}),
      ...(params.dataScopeSql ? { dataScopeSql: params.dataScopeSql } : {})
    }
  })

  return {
    records: (data.records ?? []).map(normalizeRegionListItem),
    total: data.total ?? 0,
    current: data.pageNum ?? pageNum,
    size: data.pageSize ?? pageSize
  }
}

/** 新增区域 POST /org/region/createRegion（同步创建登录用户） */
export function createRegion(payload: Api.Region.CreateRegionPayload): Promise<number> {
  return request.post<number>({
    url: '/org/region/createRegion',
    params: {
      regionName: payload.regionName,
      partnerId: payload.partnerId,
      email: payload.email,
      password: payload.password,
      ...(payload.contact?.trim() ? { contact: payload.contact.trim() } : {}),
      ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
      ...(payload.address?.trim() ? { address: payload.address.trim() } : {})
    }
  })
}

/** 查询区域详情 GET /org/region/getRegionDetail */
export async function getRegionDetail(id: number): Promise<Api.Region.RegionListItem> {
  const data = await request.get<Api.Region.RegionDetail>({
    url: '/org/region/getRegionDetail',
    params: { id }
  })
  return normalizeRegionListItem({
    ...data,
    country: data.countryName ?? '',
    countryCode: ''
  })
}

/** 修改区域 POST /org/region/updateRegion */
export function updateRegion(payload: Api.Region.UpdateRegionPayload): Promise<void> {
  return request.post<void>({
    url: '/org/region/updateRegion',
    params: {
      id: payload.id,
      regionName: payload.regionName,
      ...(payload.contact?.trim() ? { contact: payload.contact.trim() } : {}),
      ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
      ...(payload.address?.trim() ? { address: payload.address.trim() } : {})
    }
  })
}

/** 删除区域 POST /org/region/deleteRegion?id= */
export function deleteRegion(id: number): Promise<void> {
  return request.post<void>({
    url: `/org/region/deleteRegion?id=${encodeURIComponent(String(id))}`
  })
}

/** 批量删除（当前无批量接口，循环调用单删） */
export async function batchDeleteRegions(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteRegion(id)))
}
