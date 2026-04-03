/**
 * 信标管理（当前为前端 mock，对接后端时替换为真实接口）
 */

const MOCK_ROWS: Api.Beacon.BeaconListItem[] = [
  {
    id: 4001,
    beaconMac: 'AA:BB:CC:DD:EE:01',
    regionCode: 'A-01',
    gpsCoordinate: { lng: 121.503, lat: 31.236 },
    storeId: 3001,
    storeName: '浦东旗舰店',
    regionId: 2001,
    regionName: '华东一区',
    partnerId: 1001,
    partnerName: '华东零售集团',
    countryCode: 'CN',
    country: '中国',
    createTime: '2026-01-06 10:00:00',
    operatorName: '系统管理员'
  },
  {
    id: 4002,
    beaconMac: 'AA:BB:CC:DD:EE:02',
    regionCode: 'A-02',
    gpsCoordinate: { lng: 121.503, lat: 31.236 },
    storeId: 3001,
    storeName: '浦东旗舰店',
    regionId: 2001,
    regionName: '华东一区',
    partnerId: 1001,
    partnerName: '华东零售集团',
    countryCode: 'CN',
    country: '中国',
    createTime: '2026-01-06 10:05:00',
    operatorName: '系统管理员'
  },
  {
    id: 4003,
    beaconMac: 'FF:EE:DD:CC:BB:03',
    regionCode: 'B-01',
    gpsCoordinate: { lng: 104.072, lat: 30.572 },
    storeId: 3002,
    storeName: '成都高新店',
    regionId: 2002,
    regionName: '西南运营中心',
    partnerId: 1004,
    partnerName: '西南商贸',
    countryCode: 'CN',
    country: '中国',
    createTime: '2026-01-13 12:00:00',
    operatorName: '李运营'
  },
  {
    id: 4004,
    beaconMac: 'FF:EE:DD:CC:BB:04',
    regionCode: 'B-02',
    gpsCoordinate: { lng: 104.072, lat: 30.572 },
    storeId: 3002,
    storeName: '成都高新店',
    regionId: 2002,
    regionName: '西南运营中心',
    partnerId: 1004,
    partnerName: '西南商贸',
    countryCode: 'CN',
    country: '中国',
    createTime: '2026-01-13 12:10:00',
    operatorName: '李运营'
  },
  {
    id: 4005,
    beaconMac: '11:22:33:44:55:05',
    regionCode: 'C-01',
    gpsCoordinate: { lng: -122.4194, lat: 37.7749 },
    storeId: 3003,
    storeName: 'SF Bay Store',
    regionId: 2003,
    regionName: '加州湾区',
    partnerId: 1002,
    partnerName: 'Pacific Foods LLC',
    countryCode: 'US',
    country: '美国',
    createTime: '2025-11-26 09:10:00',
    operatorName: '系统管理员'
  },
  {
    id: 4006,
    beaconMac: '11:22:33:44:55:06',
    regionCode: 'D-01',
    gpsCoordinate: { lng: 10.7522, lat: 59.9139 },
    storeId: 3004,
    storeName: 'Oslo Downtown',
    regionId: null,
    regionName: '无区域',
    partnerId: 1005,
    partnerName: 'Nordic Retail AS',
    countryCode: 'NO',
    country: '挪威',
    createTime: '2026-02-13 11:00:00',
    operatorName: '系统管理员'
  }
]

let mockRows: Api.Beacon.BeaconListItem[] = [...MOCK_ROWS]

function filterRows(params: Api.Beacon.BeaconSearchParams): Api.Beacon.BeaconListItem[] {
  let list = [...mockRows]
  const mac = typeof params.beaconMac === 'string' ? params.beaconMac.trim() : ''
  if (mac) list = list.filter((r) => r.beaconMac.includes(mac))

  if (typeof params.countryCode === 'string' && params.countryCode) {
    list = list.filter((r) => r.countryCode === params.countryCode)
  }

  // 避免搜索组件 clear 后出现 '' 导致错误过滤
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
  return list
}

export function fetchBeaconList(
  params: Api.Beacon.BeaconSearchParams
): Promise<Api.Beacon.BeaconList> {
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

export type BeaconCreatePayload = Pick<
  Api.Beacon.BeaconListItem,
  | 'beaconMac'
  | 'regionCode'
  | 'gpsCoordinate'
  | 'storeId'
  | 'storeName'
  | 'regionId'
  | 'regionName'
  | 'partnerId'
  | 'partnerName'
  | 'countryCode'
  | 'country'
> & { operatorName: string }

export function createBeacon(payload: BeaconCreatePayload): Promise<Api.Beacon.BeaconListItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nextId = mockRows.reduce((m, r) => Math.max(m, r.id), 0) + 1
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      const row: Api.Beacon.BeaconListItem = {
        id: nextId,
        beaconMac: payload.beaconMac,
        regionCode: payload.regionCode,
        gpsCoordinate: payload.gpsCoordinate,
        storeId: payload.storeId,
        storeName: payload.storeName,
        regionId: payload.regionId,
        regionName: payload.regionName,
        partnerId: payload.partnerId,
        partnerName: payload.partnerName,
        countryCode: payload.countryCode,
        country: payload.country,
        createTime,
        operatorName: payload.operatorName
      }
      mockRows = [row, ...mockRows]
      resolve(row)
    }, 200)
  })
}

/** 批量新增（与单条规则一致；mock 内校验 MAC 不重复） */
export function batchCreateBeacons(
  payloads: Array<Omit<BeaconCreatePayload, 'operatorName'>>,
  operatorName: string
): Promise<{
  created: Api.Beacon.BeaconListItem[]
  skipped: { beaconMac: string; reason: string }[]
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existingMacs = new Set(mockRows.map((r) => r.beaconMac.trim().toUpperCase()))
      const created: Api.Beacon.BeaconListItem[] = []
      const skipped: { beaconMac: string; reason: string }[] = []

      const pad = (n: number) => String(n).padStart(2, '0')
      const now = new Date()
      const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

      let nextId = mockRows.reduce((m, r) => Math.max(m, r.id), 0)

      for (const p of payloads) {
        const mac = p.beaconMac?.trim() ?? ''
        const key = mac.toUpperCase()
        if (!mac) {
          skipped.push({ beaconMac: '(空)', reason: 'MAC 为空' })
          continue
        }
        if (existingMacs.has(key)) {
          skipped.push({ beaconMac: mac, reason: 'MAC 已存在' })
          continue
        }
        existingMacs.add(key)
        nextId += 1
        const row: Api.Beacon.BeaconListItem = {
          id: nextId,
          beaconMac: mac,
          regionCode: p.regionCode,
          gpsCoordinate: p.gpsCoordinate,
          storeId: p.storeId,
          storeName: p.storeName,
          regionId: p.regionId,
          regionName: p.regionName,
          partnerId: p.partnerId,
          partnerName: p.partnerName,
          countryCode: p.countryCode,
          country: p.country,
          createTime,
          operatorName
        }
        created.push(row)
      }
      mockRows = [...created, ...mockRows]
      resolve({ created, skipped })
    }, 320)
  })
}

export function updateBeacon(
  id: number,
  payload: Partial<
    Pick<
      Api.Beacon.BeaconListItem,
      | 'regionCode'
      | 'gpsCoordinate'
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
      if (idx === -1) {
        reject(new Error('记录不存在'))
        return
      }
      mockRows[idx] = { ...mockRows[idx], ...payload }
      resolve()
    }, 200)
  })
}

export function deleteBeacon(id: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockRows = mockRows.filter((r) => r.id !== id)
      resolve()
    }, 200)
  })
}

export function batchDeleteBeacons(ids: number[]): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const set = new Set(ids)
      mockRows = mockRows.filter((r) => !set.has(r.id))
      resolve()
    }, 200)
  })
}
