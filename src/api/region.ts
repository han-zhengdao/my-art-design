/**
 * 区域管理（当前为前端 mock，对接后端时替换为真实接口）
 */

const MOCK_ROWS: Api.Region.RegionListItem[] = [
  {
    id: 2001,
    regionName: '华东一区',
    regionAddress: '上海市浦东新区世纪大道 100 号',
    regionContactName: '李四',
    regionPhone: '13800138011',
    partnerId: 1001,
    partnerName: '华东零售集团',
    country: '中国',
    countryCode: 'CN',
    dcBalance: 0,
    storeCount: 0,
    wheelCount: 0,
    beaconCount: 0,
    pendingTicketCount: 2,
    createTime: '2025-12-05 10:00:00',
    operatorName: '系统管理员'
  },
  {
    id: 2002,
    regionName: '西南运营中心',
    regionAddress: '成都市高新区天府大道 200 号',
    regionContactName: '王芳',
    regionPhone: '13900139002',
    partnerId: 1004,
    partnerName: '西南商贸',
    country: '中国',
    countryCode: 'CN',
    dcBalance: 1200,
    storeCount: 3,
    wheelCount: 0,
    beaconCount: 0,
    pendingTicketCount: 0,
    createTime: '2026-01-10 14:20:00',
    operatorName: '李运营'
  },
  {
    id: 2003,
    regionName: '加州湾区',
    regionAddress: 'San Francisco, CA',
    regionContactName: 'John Smith',
    regionPhone: '+1-415-555-0101',
    partnerId: 1002,
    partnerName: 'Pacific Foods LLC',
    country: '美国',
    countryCode: 'US',
    dcBalance: 0,
    storeCount: 0,
    wheelCount: 5,
    beaconCount: 0,
    pendingTicketCount: 1,
    createTime: '2025-11-22 09:15:00',
    operatorName: '系统管理员'
  },
  {
    id: 2004,
    regionName: '关东鲜选·东京圈',
    regionAddress: '東京都千代田区',
    regionContactName: '佐藤健',
    regionPhone: '+81-3-1234-5678',
    partnerId: 1003,
    partnerName: '关东鲜选',
    country: '日本',
    countryCode: 'JP',
    dcBalance: 0,
    storeCount: 0,
    wheelCount: 0,
    beaconCount: 0,
    pendingTicketCount: 0,
    createTime: '2026-02-01 08:30:00',
    operatorName: '李运营'
  },
  {
    id: 2005,
    regionName: '奥斯陆北区',
    regionAddress: 'Oslo City Center',
    regionContactName: 'Erik Hansen',
    regionPhone: '+47-21-00-00-00',
    partnerId: 1005,
    partnerName: 'Nordic Retail AS',
    country: '挪威',
    countryCode: 'NO',
    dcBalance: 0,
    storeCount: 0,
    wheelCount: 0,
    beaconCount: 2,
    pendingTicketCount: 0,
    createTime: '2026-02-10 11:00:00',
    operatorName: '系统管理员'
  }
]

let mockRows: Api.Region.RegionListItem[] = [...MOCK_ROWS]

function filterRows(params: Api.Region.RegionSearchParams): Api.Region.RegionListItem[] {
  let list = [...mockRows]
  if (params.countryCode) {
    list = list.filter((r) => r.countryCode === params.countryCode)
  }
  const name = params.regionName?.trim()
  if (name) {
    list = list.filter((r) => r.regionName.includes(name))
  }
  if (params.partnerId != null) {
    list = list.filter((r) => r.partnerId === params.partnerId)
  }
  return list
}

export function fetchRegionList(
  params: Api.Region.RegionSearchParams
): Promise<Api.Region.RegionList> {
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

export function createRegion(
  payload: Pick<
    Api.Region.RegionListItem,
    | 'regionName'
    | 'regionAddress'
    | 'regionContactName'
    | 'regionPhone'
    | 'partnerId'
    | 'partnerName'
    | 'country'
    | 'countryCode'
  > & { operatorName: string }
): Promise<Api.Region.RegionListItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nextId = mockRows.reduce((m, r) => Math.max(m, r.id), 0) + 1
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      const row: Api.Region.RegionListItem = {
        id: nextId,
        regionName: payload.regionName,
        regionAddress: payload.regionAddress,
        regionContactName: payload.regionContactName,
        regionPhone: payload.regionPhone,
        partnerId: payload.partnerId,
        partnerName: payload.partnerName,
        country: payload.country,
        countryCode: payload.countryCode,
        dcBalance: 0,
        storeCount: 0,
        wheelCount: 0,
        beaconCount: 0,
        pendingTicketCount: 0,
        createTime,
        operatorName: payload.operatorName
      }
      mockRows = [row, ...mockRows]
      resolve(row)
    }, 200)
  })
}

export function updateRegion(
  id: number,
  payload: Partial<
    Pick<
      Api.Region.RegionListItem,
      | 'regionName'
      | 'regionAddress'
      | 'regionContactName'
      | 'regionPhone'
      | 'partnerId'
      | 'partnerName'
      | 'country'
      | 'countryCode'
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

export function deleteRegion(id: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockRows = mockRows.filter((r) => r.id !== id)
      resolve()
    }, 200)
  })
}

export function batchDeleteRegions(ids: number[]): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const set = new Set(ids)
      mockRows = mockRows.filter((r) => !set.has(r.id))
      resolve()
    }, 200)
  })
}
