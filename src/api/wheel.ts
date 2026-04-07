/**
 * 车轮管理（当前为前端 mock，对接后端时替换为真实接口）
 */

const MOCK_ROWS: Api.Wheel.WheelListItem[] = [
  {
    id: 5001,
    devEui: '0004A30B00112201',
    storeId: 3001,
    storeName: '浦东旗舰店',
    regionId: 2001,
    regionName: '华东一区',
    partnerId: 1001,
    partnerName: '华东零售集团',
    countryCode: 'CN',
    country: '中国',
    deviceStatus: 'IN_USE',
    onlineStatus: 'ONLINE',
    batteryLevel: 86,
    gpsAccuracy: 'PRECISE',
    beaconSignal: -62,
    loraSignal: -70,
    beaconMacCoordinate: { lng: 121.5031, lat: 31.2362 },
    currentPosition: { lng: 121.5035, lat: 31.2364 },
    fenceStatus: 'INSIDE',
    outFenceDurationSec: 0,
    outFenceDistanceM: 0,
    lastPosition: { lng: 121.5018, lat: 31.2355 },
    lastCommTime: '2026-04-03 14:22:10',
    createTime: '2026-01-06 10:00:00',
    operatorName: '系统管理员'
  },
  {
    id: 5002,
    devEui: '0004A30B00112202',
    storeId: 3001,
    storeName: '浦东旗舰店',
    regionId: 2001,
    regionName: '华东一区',
    partnerId: 1001,
    partnerName: '华东零售集团',
    countryCode: 'CN',
    country: '中国',
    deviceStatus: 'IN_USE',
    onlineStatus: 'OFFLINE',
    batteryLevel: 42,
    gpsAccuracy: 'IMPRECISE',
    beaconSignal: -78,
    loraSignal: -85,
    beaconMacCoordinate: { lng: 121.5028, lat: 31.236 },
    currentPosition: { lng: 121.504, lat: 31.237 },
    fenceStatus: 'OUTSIDE',
    outFenceDurationSec: 3600,
    outFenceDistanceM: 120,
    lastPosition: { lng: 121.5015, lat: 31.235 },
    lastCommTime: '2026-04-03 08:00:00',
    createTime: '2026-01-07 11:20:00',
    operatorName: '李运营'
  },
  {
    id: 5003,
    devEui: '0004A30B00112203',
    storeId: 3002,
    storeName: '成都高新店',
    regionId: 2002,
    regionName: '西南运营中心',
    partnerId: 1004,
    partnerName: '西南商贸',
    countryCode: 'CN',
    country: '中国',
    deviceStatus: 'SCRAPPED',
    onlineStatus: 'OFFLINE',
    batteryLevel: 0,
    gpsAccuracy: 'PRECISE',
    beaconSignal: -90,
    loraSignal: -92,
    beaconMacCoordinate: { lng: 104.072, lat: 30.572 },
    currentPosition: { lng: 104.072, lat: 30.572 },
    fenceStatus: 'INSIDE',
    outFenceDurationSec: 0,
    outFenceDistanceM: 0,
    lastPosition: { lng: 104.068, lat: 30.569 },
    lastCommTime: '2026-04-01 00:00:00',
    createTime: '2026-01-13 12:00:00',
    operatorName: '李运营'
  },
  {
    id: 5004,
    devEui: '0004A30B00112204',
    storeId: 3004,
    storeName: 'Oslo Downtown',
    regionId: null,
    regionName: '无区域',
    partnerId: 1005,
    partnerName: 'Nordic Retail AS',
    countryCode: 'NO',
    country: '挪威',
    deviceStatus: 'IN_USE',
    onlineStatus: 'ONLINE',
    batteryLevel: 95,
    gpsAccuracy: 'PRECISE',
    beaconSignal: -55,
    loraSignal: -60,
    beaconMacCoordinate: { lng: 10.7522, lat: 59.9139 },
    currentPosition: { lng: 10.7525, lat: 59.914 },
    fenceStatus: 'INSIDE',
    outFenceDurationSec: 0,
    outFenceDistanceM: 0,
    lastPosition: { lng: 10.748, lat: 59.911 },
    lastCommTime: '2026-04-03 14:25:00',
    createTime: '2026-02-13 11:00:00',
    operatorName: '系统管理员'
  },
  {
    id: 5005,
    devEui: '0004A30B00112205',
    storeId: 3004,
    storeName: 'Oslo Downtown',
    regionId: null,
    regionName: '无区域',
    partnerId: 1005,
    partnerName: 'Nordic Retail AS',
    countryCode: 'NO',
    country: '挪威',
    deviceStatus: 'LOST',
    onlineStatus: 'OFFLINE',
    batteryLevel: 12,
    gpsAccuracy: 'IMPRECISE',
    beaconSignal: -95,
    loraSignal: -95,
    beaconMacCoordinate: { lng: 10.75, lat: 59.91 },
    currentPosition: { lng: 10.7522, lat: 59.9139 },
    fenceStatus: 'OUTSIDE',
    outFenceDurationSec: 86400,
    outFenceDistanceM: 500,
    lastPosition: { lng: 10.7522, lat: 59.9139 },
    lastCommTime: '2026-03-01 09:00:00',
    createTime: '2026-02-13 11:30:00',
    operatorName: '系统管理员'
  }
]

let mockRows: Api.Wheel.WheelListItem[] = [...MOCK_ROWS]

function filterRows(params: Api.Wheel.WheelSearchParams): Api.Wheel.WheelListItem[] {
  let list = [...mockRows]
  const dev = typeof params.devEui === 'string' ? params.devEui.trim() : ''
  if (dev) list = list.filter((r) => r.devEui.toLowerCase().includes(dev.toLowerCase()))

  if (typeof params.countryCode === 'string' && params.countryCode) {
    list = list.filter((r) => r.countryCode === params.countryCode)
  }
  if (typeof params.partnerId === 'number') {
    list = list.filter((r) => r.partnerId === params.partnerId)
  }
  if (params.regionId === 'NONE') {
    list = list.filter((r) => r.regionId == null)
  } else if (typeof params.regionId === 'number') {
    list = list.filter((r) => r.regionId === params.regionId)
  }
  if (typeof params.storeId === 'number') {
    list = list.filter((r) => r.storeId === params.storeId)
  }
  if (params.deviceStatus) {
    list = list.filter((r) => r.deviceStatus === params.deviceStatus)
  }
  if (params.gpsAccuracy) {
    list = list.filter((r) => r.gpsAccuracy === params.gpsAccuracy)
  }
  if (params.fenceStatus) {
    list = list.filter((r) => r.fenceStatus === params.fenceStatus)
  }

  const sf = params.sortField
  const so = params.sortOrder
  if (sf && so) {
    const mult = so === 'ascending' ? 1 : -1
    const cmp = (a: Api.Wheel.WheelListItem, b: Api.Wheel.WheelListItem) => {
      let va = 0
      let vb = 0
      if (sf === 'batteryLevel') {
        va = a.batteryLevel
        vb = b.batteryLevel
      } else if (sf === 'beaconSignal') {
        va = a.beaconSignal
        vb = b.beaconSignal
      } else if (sf === 'loraSignal') {
        va = a.loraSignal
        vb = b.loraSignal
      }
      return (va - vb) * mult
    }
    list = [...list].sort(cmp)
  }

  return list
}

export function fetchWheelList(params: Api.Wheel.WheelSearchParams): Promise<Api.Wheel.WheelList> {
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
    }, 260)
  })
}

export type WheelCreatePayload = Pick<
  Api.Wheel.WheelListItem,
  | 'devEui'
  | 'storeId'
  | 'storeName'
  | 'regionId'
  | 'regionName'
  | 'partnerId'
  | 'partnerName'
  | 'countryCode'
  | 'country'
> & { operatorName: string }

function buildNewWheelRow(
  payload: WheelCreatePayload,
  id: number,
  createTime: string
): Api.Wheel.WheelListItem {
  const store = mockRows.find((s) => s.storeId === payload.storeId)
  const pt = store?.currentPosition ?? { lng: 116.4074, lat: 39.9042 }
  return {
    id,
    devEui: payload.devEui.trim(),
    storeId: payload.storeId,
    storeName: payload.storeName,
    regionId: payload.regionId ?? null,
    regionName: payload.regionName,
    partnerId: payload.partnerId,
    partnerName: payload.partnerName,
    countryCode: payload.countryCode,
    country: payload.country,
    deviceStatus: 'IN_USE',
    onlineStatus: 'OFFLINE',
    batteryLevel: 100,
    gpsAccuracy: 'PRECISE',
    beaconSignal: -65,
    loraSignal: -72,
    beaconMacCoordinate: store?.beaconMacCoordinate ?? { ...pt },
    currentPosition: { ...pt },
    fenceStatus: 'INSIDE',
    outFenceDurationSec: 0,
    outFenceDistanceM: 0,
    lastPosition: { ...pt },
    lastCommTime: createTime,
    createTime,
    operatorName: payload.operatorName
  }
}

export function createWheel(payload: WheelCreatePayload): Promise<Api.Wheel.WheelListItem> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const key = payload.devEui.trim().toUpperCase()
      if (mockRows.some((r) => r.devEui.toUpperCase() === key)) {
        reject(new Error('DevEUI 已存在'))
        return
      }
      const nextId = mockRows.reduce((m, r) => Math.max(m, r.id), 0) + 1
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      const row = buildNewWheelRow(payload, nextId, createTime)
      mockRows = [row, ...mockRows]
      resolve(row)
    }, 200)
  })
}

export function updateWheel(
  id: number,
  payload: Partial<
    Pick<
      Api.Wheel.WheelListItem,
      | 'storeId'
      | 'storeName'
      | 'regionId'
      | 'regionName'
      | 'partnerId'
      | 'partnerName'
      | 'countryCode'
      | 'country'
    >
  >
): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockRows.findIndex((r) => r.id === id)
      if (idx < 0) {
        reject(new Error('not found'))
        return
      }
      mockRows[idx] = { ...mockRows[idx], ...payload } as Api.Wheel.WheelListItem
      resolve()
    }, 150)
  })
}

export function deleteWheel(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockRows.findIndex((r) => r.id === id)
      if (idx < 0) {
        reject(new Error('not found'))
        return
      }
      mockRows.splice(idx, 1)
      resolve()
    }, 150)
  })
}

export function batchDeleteWheels(ids: number[]): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockRows = mockRows.filter((r) => !ids.includes(r.id))
      resolve()
    }, 200)
  })
}

export function batchCreateWheels(
  payloads: Array<Omit<WheelCreatePayload, 'operatorName'>>,
  operatorName: string
): Promise<{ created: Api.Wheel.WheelListItem[]; skipped: { devEui: string; reason: string }[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existing = new Set(mockRows.map((r) => r.devEui.trim().toUpperCase()))
      const created: Api.Wheel.WheelListItem[] = []
      const skipped: { devEui: string; reason: string }[] = []
      const pad = (n: number) => String(n).padStart(2, '0')
      const now = new Date()
      const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      let nextId = mockRows.reduce((m, r) => Math.max(m, r.id), 0)

      for (const p of payloads) {
        const raw = p.devEui?.trim() ?? ''
        const key = raw.toUpperCase()
        if (!raw) {
          skipped.push({ devEui: '(空)', reason: 'DevEUI 为空' })
          continue
        }
        if (existing.has(key)) {
          skipped.push({ devEui: raw, reason: 'DevEUI 已存在' })
          continue
        }
        existing.add(key)
        nextId += 1
        const row = buildNewWheelRow({ ...p, operatorName }, nextId, createTime)
        created.push(row)
      }
      mockRows = [...created, ...mockRows]
      resolve({ created, skipped })
    }, 320)
  })
}
