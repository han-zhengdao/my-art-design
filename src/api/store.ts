/**
 * 门店管理：列表、新增、详情、修改、删除已对接后端。
 */

import request from '@/utils/http'
import { PARTNER_COUNTRY_CODE_TO_ID } from '@/api/partner'

/** 接口返回记录（分页/详情通用，字段名与后端对齐） */
type StoreApiRecord = {
  id: number
  storeName: string
  partnerId: number
  partnerName: string
  countryName?: string
  regionId?: number | null
  regionName?: string
  contact?: string
  phone?: string
  address?: string
  lat?: string
  lng?: string
  fenceData?: string
  /** 地图类型：1=谷歌，其余按腾讯 */
  mapType?: number
  wheelCount?: number
  beaconCount?: number
  dcBalance?: number
  TotalPendingWorkOrders?: number
  totalPendingWorkOrders?: number
  loginEmail?: string
  country?: string
  countryCode?: string
  storeAddress?: string
  contactName?: string
  createTime?: string
  operatorName?: string
  mapProvider?: Api.Store.MapProvider
  storeCoordinate?: Api.Store.GeoPoint
  geofence?: Api.Store.GeoPoint[]
  timezone?: string
}

function parseStoreGeofence(fenceData?: string): Api.Store.GeoPoint[] {
  if (!fenceData?.trim()) return []
  try {
    const data = JSON.parse(fenceData) as unknown
    if (!Array.isArray(data)) return []
    return data
      .map((item) => {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          const lng = Number(obj.lng ?? obj.lon ?? obj[0])
          const lat = Number(obj.lat ?? obj[1])
          return { lng, lat }
        }
        return { lng: NaN, lat: NaN }
      })
      .filter((point) => Number.isFinite(point.lng) && Number.isFinite(point.lat))
  } catch {
    return []
  }
}

function normalizeStoreItem(row: StoreApiRecord): Api.Store.StoreListItem {
  const lng = Number(row.lng)
  const lat = Number(row.lat)
  const hasCoordinate = Number.isFinite(lng) && Number.isFinite(lat)
  const mapProvider: Api.Store.MapProvider =
    row.mapProvider ?? (row.mapType === 1 ? 'GOOGLE' : 'TENCENT')
  const regionId = row.regionId != null && row.regionId !== 0 ? Number(row.regionId) : undefined
  const pendingRaw =
    row.TotalPendingWorkOrders ??
    row.totalPendingWorkOrders ??
    (row as Record<string, unknown>)['TotalPendingWorkOrders']
  const pendingCount =
    typeof pendingRaw === 'number' && Number.isFinite(pendingRaw)
      ? pendingRaw
      : Number(pendingRaw) || 0

  return {
    id: row.id,
    loginEmail: row.loginEmail,
    storeName: row.storeName,
    storeAddress: row.storeAddress ?? row.address ?? '',
    contactName: row.contactName ?? row.contact ?? '',
    phone: row.phone ?? '',
    regionId,
    regionName:
      regionId == null
        ? row.regionName?.trim()
          ? row.regionName
          : '无区域'
        : (row.regionName ?? ''),
    partnerId: row.partnerId,
    partnerName: row.partnerName,
    country: row.country ?? row.countryName ?? '',
    countryCode: row.countryCode ?? '',
    mapProvider,
    storeCoordinate: hasCoordinate ? { lng, lat } : (row.storeCoordinate ?? { lng: 0, lat: 0 }),
    geofence: row.geofence ?? parseStoreGeofence(row.fenceData),
    timezone: row.timezone ?? '',
    dcBalance: row.dcBalance ?? 0,
    wheelCount: row.wheelCount ?? 0,
    beaconCount: row.beaconCount ?? 0,
    pendingTicketCount: pendingCount,
    createTime: row.createTime ?? '',
    operatorName: row.operatorName ?? ''
  }
}

/** 分页查询门店 GET /org/store/getStorePageList */
export async function fetchStoreList(
  params: Api.Store.StoreSearchParams
): Promise<Api.Store.StoreList> {
  const pageNum = params.pageNum ?? params.current ?? 1
  const pageSize = Math.min(params.pageSize ?? params.size ?? 10, 200)
  const countryId =
    params.countryId ??
    (params.countryCode ? PARTNER_COUNTRY_CODE_TO_ID[params.countryCode] : undefined)

  const data = await request.get<{
    records: StoreApiRecord[]
    total: number
    pageNum: number
    pageSize: number
  }>({
    url: '/org/store/getStorePageList',
    params: {
      pageNum,
      pageSize,
      ...(params.storeName?.trim() ? { storeName: params.storeName.trim() } : {}),
      ...(countryId != null ? { countryId } : {}),
      ...(params.partnerId != null ? { partnerId: params.partnerId } : {}),
      ...(typeof params.regionId === 'number' ? { regionId: params.regionId } : {}),
      ...(params.dataScopeSql ? { dataScopeSql: params.dataScopeSql } : {})
    }
  })

  return {
    records: (data.records ?? []).map(normalizeStoreItem),
    total: data.total ?? 0,
    current: data.pageNum ?? pageNum,
    size: data.pageSize ?? pageSize
  }
}

/** 新增门店 POST /org/store/createStore（同步创建登录用户） */
export function createStore(payload: Api.Store.CreateStorePayload): Promise<number> {
  return request.post<number>({
    url: '/org/store/createStore',
    params: {
      storeName: payload.storeName,
      partnerId: payload.partnerId,
      email: payload.email,
      password: payload.password,
      ...(payload.regionId != null ? { regionId: payload.regionId } : {}),
      ...(payload.contact?.trim() ? { contact: payload.contact.trim() } : {}),
      ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
      ...(payload.address?.trim() ? { address: payload.address.trim() } : {}),
      ...(payload.lat?.trim() ? { lat: payload.lat.trim() } : {}),
      ...(payload.lng?.trim() ? { lng: payload.lng.trim() } : {}),
      ...(payload.fenceData?.trim() ? { fenceData: payload.fenceData.trim() } : {}),
      ...(payload.mapType != null ? { mapType: payload.mapType } : {})
    }
  })
}

/** 查询门店详情 GET /org/store/getStoreDetail */
export async function getStoreDetail(id: number): Promise<Api.Store.StoreListItem> {
  const data = await request.get<StoreApiRecord>({
    url: '/org/store/getStoreDetail',
    params: { id }
  })
  return normalizeStoreItem(data)
}

/** 修改门店 POST /org/store/updateStore */
export function updateStore(payload: Api.Store.UpdateStorePayload): Promise<void> {
  return request.post<void>({
    url: '/org/store/updateStore',
    params: {
      id: payload.id,
      storeName: payload.storeName,
      ...(payload.contact?.trim() ? { contact: payload.contact.trim() } : {}),
      ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
      ...(payload.address?.trim() ? { address: payload.address.trim() } : {}),
      ...(payload.lat?.trim() ? { lat: payload.lat.trim() } : {}),
      ...(payload.lng?.trim() ? { lng: payload.lng.trim() } : {}),
      ...(payload.fenceData?.trim() ? { fenceData: payload.fenceData.trim() } : {}),
      ...(payload.mapType != null ? { mapType: payload.mapType } : {})
    }
  })
}

/** 删除门店 POST /org/store/deleteStore?id= */
export function deleteStore(id: number): Promise<void> {
  return request.post<void>({
    url: `/org/store/deleteStore?id=${encodeURIComponent(String(id))}`
  })
}

/** 批量删除（当前无批量接口，循环调用单删） */
export async function batchDeleteStores(ids: number[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteStore(id)))
}
