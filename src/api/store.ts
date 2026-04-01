/**
 * 门店管理（当前为前端 mock，对接后端时替换为真实接口）
 */

import { appendStoreAdminUserFromStore } from '@/api/user-mock'

const MOCK_ROWS: Api.Store.StoreListItem[] = [
  {
    id: 3001,
    userNickName: '门店管理员-浦东店',
    loginEmail: 'store-pd@example.com',
    storeName: '浦东旗舰店',
    storeAddress: '上海市浦东新区世纪大道 188 号',
    contactName: '赵明',
    phone: '13800138021',
    regionId: 2001,
    regionName: '华东一区',
    partnerId: 1001,
    partnerName: '华东零售集团',
    country: '中国',
    countryCode: 'CN',
    mapProvider: 'TENCENT',
    storeCoordinate: { lng: 121.503, lat: 31.236 },
    geofence: [
      { lng: 121.502, lat: 31.236 },
      { lng: 121.504, lat: 31.236 },
      { lng: 121.504, lat: 31.237 },
      { lng: 121.502, lat: 31.237 }
    ],
    timezone: 'Asia/Shanghai',
    dcBalance: 500,
    wheelCount: 20,
    beaconCount: 4,
    pendingTicketCount: 2,
    createTime: '2026-01-05 10:00:00',
    operatorName: '系统管理员'
  },
  {
    id: 3002,
    userNickName: '门店管理员-成都店',
    loginEmail: 'store-cd@example.com',
    storeName: '成都高新店',
    storeAddress: '成都市高新区天府大道 88 号',
    contactName: '陈佳',
    phone: '13900139012',
    regionId: 2002,
    regionName: '西南运营中心',
    partnerId: 1004,
    partnerName: '西南商贸',
    country: '中国',
    countryCode: 'CN',
    mapProvider: 'TENCENT',
    storeCoordinate: { lng: 104.072, lat: 30.572 },
    geofence: [
      { lng: 104.071, lat: 30.571 },
      { lng: 104.073, lat: 30.571 },
      { lng: 104.073, lat: 30.573 },
      { lng: 104.071, lat: 30.573 }
    ],
    timezone: 'Asia/Shanghai',
    dcBalance: 0,
    wheelCount: 0,
    beaconCount: 0,
    pendingTicketCount: 0,
    createTime: '2026-01-12 14:20:00',
    operatorName: '李运营'
  },
  {
    id: 3003,
    userNickName: '门店管理员-湾区店',
    loginEmail: 'store-bay@example.com',
    storeName: 'SF Bay Store',
    storeAddress: 'San Francisco, Market St',
    contactName: 'Alex',
    phone: '+1-415-555-0123',
    regionId: 2003,
    regionName: '加州湾区',
    partnerId: 1002,
    partnerName: 'Pacific Foods LLC',
    country: '美国',
    countryCode: 'US',
    mapProvider: 'GOOGLE',
    storeCoordinate: { lng: -122.4194, lat: 37.7749 },
    geofence: [
      { lng: -122.421, lat: 37.774 },
      { lng: -122.418, lat: 37.774 },
      { lng: -122.418, lat: 37.776 },
      { lng: -122.421, lat: 37.776 }
    ],
    timezone: 'America/Los_Angeles',
    dcBalance: 0,
    wheelCount: 5,
    beaconCount: 0,
    pendingTicketCount: 1,
    createTime: '2025-11-25 09:10:00',
    operatorName: '系统管理员'
  },
  {
    id: 3004,
    userNickName: '门店管理员-奥斯陆店',
    loginEmail: 'store-oslo@example.com',
    storeName: 'Oslo Downtown',
    storeAddress: 'Oslo City Center',
    contactName: 'Erik',
    phone: '+47-21-00-01-01',
    regionId: undefined,
    regionName: '无区域',
    partnerId: 1005,
    partnerName: 'Nordic Retail AS',
    country: '挪威',
    countryCode: 'NO',
    mapProvider: 'GOOGLE',
    storeCoordinate: { lng: 10.7522, lat: 59.9139 },
    geofence: [
      { lng: 10.751, lat: 59.913 },
      { lng: 10.753, lat: 59.913 },
      { lng: 10.753, lat: 59.915 },
      { lng: 10.751, lat: 59.915 }
    ],
    timezone: 'Europe/Oslo',
    dcBalance: 0,
    wheelCount: 0,
    beaconCount: 0,
    pendingTicketCount: 0,
    createTime: '2026-02-12 11:00:00',
    operatorName: '系统管理员'
  }
]

let mockRows: Api.Store.StoreListItem[] = [...MOCK_ROWS]

function filterRows(params: Api.Store.StoreSearchParams): Api.Store.StoreListItem[] {
  let list = [...mockRows]
  const name = params.storeName?.trim()
  if (name) {
    list = list.filter((r) => r.storeName.includes(name))
  }
  if (params.countryCode) {
    list = list.filter((r) => r.countryCode === params.countryCode)
  }
  if (params.partnerId != null) {
    list = list.filter((r) => r.partnerId === params.partnerId)
  }
  if (params.regionId != null) {
    if (params.regionId === 'NONE') {
      list = list.filter((r) => r.regionId == null)
    } else {
      list = list.filter((r) => r.regionId === params.regionId)
    }
  } else if (params.partnerId != null) {
    // 当已选合作商但未选区域时，仅显示该合作商下无区域门店
    list = list.filter((r) => r.regionId == null)
  }
  return list
}

export function fetchStoreList(params: Api.Store.StoreSearchParams): Promise<Api.Store.StoreList> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const current = params.current ?? 1
      const size = params.size ?? 20
      const filtered = filterRows(params)
      const start = (current - 1) * size
      const records = filtered.slice(start, start + size)
      resolve({
        records,
        current,
        size,
        total: filtered.length
      })
    }, 280)
  })
}

export function createStore(
  payload: Omit<
    Api.Store.StoreListItem,
    | 'id'
    | 'dcBalance'
    | 'wheelCount'
    | 'beaconCount'
    | 'pendingTicketCount'
    | 'createTime'
    | 'operatorName'
  > & {
    operatorName: string
    userNickName?: string
    loginEmail?: string
  }
): Promise<Api.Store.StoreListItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nextId = mockRows.reduce((m, r) => Math.max(m, r.id), 0) + 1
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      const row: Api.Store.StoreListItem = {
        id: nextId,
        userNickName: payload.userNickName ?? '',
        loginEmail: payload.loginEmail ?? '',
        storeName: payload.storeName,
        storeAddress: payload.storeAddress,
        contactName: payload.contactName,
        phone: payload.phone,
        regionId: payload.regionId,
        regionName: payload.regionName ?? '无区域',
        partnerId: payload.partnerId,
        partnerName: payload.partnerName,
        country: payload.country,
        countryCode: payload.countryCode,
        mapProvider: payload.mapProvider,
        storeCoordinate: payload.storeCoordinate,
        geofence: payload.geofence,
        timezone: payload.timezone,
        dcBalance: 0,
        wheelCount: 0,
        beaconCount: 0,
        pendingTicketCount: 0,
        createTime,
        operatorName: payload.operatorName
      }
      mockRows = [row, ...mockRows]
      if (payload.userNickName?.trim() && payload.loginEmail?.trim()) {
        appendStoreAdminUserFromStore({
          nickName: payload.userNickName.trim(),
          userEmail: payload.loginEmail.trim(),
          storeName: row.storeName,
          operatorName: payload.operatorName
        })
      }
      resolve(row)
    }, 200)
  })
}

export function updateStore(
  id: number,
  payload: Partial<
    Pick<
      Api.Store.StoreListItem,
      | 'storeName'
      | 'storeAddress'
      | 'contactName'
      | 'phone'
      | 'regionId'
      | 'regionName'
      | 'partnerId'
      | 'partnerName'
      | 'country'
      | 'countryCode'
      | 'mapProvider'
      | 'storeCoordinate'
      | 'geofence'
      | 'timezone'
    >
  >
): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockRows.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('记录不存在'))
        return
      }
      mockRows[idx] = { ...mockRows[idx], ...payload }
      resolve()
    }, 200)
  })
}

export function deleteStore(id: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockRows = mockRows.filter((r) => r.id !== id)
      resolve()
    }, 200)
  })
}

export function batchDeleteStores(ids: number[]): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const set = new Set(ids)
      mockRows = mockRows.filter((r) => !set.has(r.id))
      resolve()
    }, 200)
  })
}
