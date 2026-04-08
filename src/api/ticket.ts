/**
 * 工单管理（当前为前端 mock，对接后端时替换为真实接口）
 */

function isActiveFilter(v: unknown): boolean {
  if (v == null) return false
  if (typeof v === 'string' && v.trim() === '') return false
  return true
}

const MOCK_ROWS: Api.Ticket.TicketListItem[] = [
  {
    id: 5001,
    devEui: 'EUI001122334455667788',
    storeId: 3001,
    storeName: '浦东旗舰店',
    regionId: 2001,
    regionName: '华东一区',
    partnerId: 1001,
    partnerName: '华东零售集团',
    countryCode: 'CN',
    country: '中国',
    alertType: 'DEVICE_OUT_OF_BOUNDS',
    alertTypeLabel: '设备越界',
    alertTime: '2026-03-01 09:15:00',
    alertCoordinate: { lng: 121.5045, lat: 31.2358 },
    ticketStatus: 'PENDING',
    processResult: null,
    processTime: null,
    processorName: null
  },
  {
    id: 5002,
    devEui: 'EUI00AABBCCDDEEFF01',
    storeId: 3001,
    storeName: '浦东旗舰店',
    regionId: 2001,
    regionName: '华东一区',
    partnerId: 1001,
    partnerName: '华东零售集团',
    countryCode: 'CN',
    country: '中国',
    alertType: 'DEVICE_OUT_OF_BOUNDS',
    alertTypeLabel: '设备越界',
    alertTime: '2026-03-02 14:20:33',
    alertCoordinate: { lng: 121.5031, lat: 31.2362 },
    ticketStatus: 'PENDING',
    processResult: null,
    processTime: null,
    processorName: null
  },
  {
    id: 5003,
    devEui: 'EUI1122334455667788',
    storeId: 3002,
    storeName: '成都高新店',
    regionId: 2002,
    regionName: '西南运营中心',
    partnerId: 1004,
    partnerName: '西南商贸',
    countryCode: 'CN',
    country: '中国',
    alertType: 'DEVICE_OUT_OF_BOUNDS',
    alertTypeLabel: '设备越界',
    alertTime: '2026-02-28 08:00:10',
    alertCoordinate: { lng: 104.073, lat: 30.571 },
    ticketStatus: 'COMPLETED',
    processResult: 'RECYCLE',
    processTime: '2026-02-28 10:12:00',
    processorName: '李运营'
  },
  {
    id: 5004,
    devEui: 'EUI99FFEEDDCCBBAA01',
    storeId: 3003,
    storeName: 'SF Bay Store',
    regionId: 2003,
    regionName: '加州湾区',
    partnerId: 1002,
    partnerName: 'Pacific Foods LLC',
    countryCode: 'US',
    country: '美国',
    alertType: 'DEVICE_OUT_OF_BOUNDS',
    alertTypeLabel: '设备越界',
    alertTime: '2026-01-15 16:45:00',
    alertCoordinate: { lng: -122.418, lat: 37.775 },
    ticketStatus: 'PENDING',
    processResult: null,
    processTime: null,
    processorName: null
  },
  {
    id: 5005,
    devEui: 'EUI7766554433221100',
    storeId: 3004,
    storeName: 'Oslo Downtown',
    regionId: null,
    regionName: '无区域',
    partnerId: 1005,
    partnerName: 'Nordic Retail AS',
    countryCode: 'NO',
    country: '挪威',
    alertType: 'DEVICE_OUT_OF_BOUNDS',
    alertTypeLabel: '设备越界',
    alertTime: '2026-02-10 11:30:22',
    alertCoordinate: { lng: 10.7522, lat: 59.9139 },
    ticketStatus: 'PENDING',
    processResult: null,
    processTime: null,
    processorName: null
  },
  {
    id: 5006,
    devEui: 'EUI55443322110099AA',
    storeId: 3004,
    storeName: 'Oslo Downtown',
    regionId: null,
    regionName: '无区域',
    partnerId: 1005,
    partnerName: 'Nordic Retail AS',
    countryCode: 'NO',
    country: '挪威',
    alertType: 'DEVICE_OUT_OF_BOUNDS',
    alertTypeLabel: '设备越界',
    alertTime: '2026-02-09 09:00:00',
    alertCoordinate: { lng: 10.751, lat: 59.914 },
    ticketStatus: 'COMPLETED',
    processResult: 'LOST',
    processTime: '2026-02-09 15:00:00',
    processorName: '系统管理员'
  },
  {
    id: 5007,
    devEui: 'EUI1234567890ABCDE',
    storeId: 3002,
    storeName: '成都高新店',
    regionId: 2002,
    regionName: '西南运营中心',
    partnerId: 1004,
    partnerName: '西南商贸',
    countryCode: 'CN',
    country: '中国',
    alertType: 'DEVICE_OUT_OF_BOUNDS',
    alertTypeLabel: '设备越界',
    alertTime: '2026-03-03 07:45:11',
    alertCoordinate: { lng: 104.072, lat: 30.572 },
    ticketStatus: 'PENDING',
    processResult: null,
    processTime: null,
    processorName: null
  },
  {
    id: 5008,
    devEui: 'EUIFEDCBA0987654321',
    storeId: 3003,
    storeName: 'SF Bay Store',
    regionId: 2003,
    regionName: '加州湾区',
    partnerId: 1002,
    partnerName: 'Pacific Foods LLC',
    countryCode: 'US',
    country: '美国',
    alertType: 'DEVICE_OUT_OF_BOUNDS',
    alertTypeLabel: '设备越界',
    alertTime: '2025-12-20 18:20:00',
    alertCoordinate: { lng: -122.42, lat: 37.774 },
    ticketStatus: 'COMPLETED',
    processResult: 'SCRAPPED',
    processTime: '2025-12-21 09:00:00',
    processorName: 'Alex'
  }
]

const mockRows: Api.Ticket.TicketListItem[] = [...MOCK_ROWS]

function filterRows(params: Api.Ticket.TicketSearchParams): Api.Ticket.TicketListItem[] {
  let list = [...mockRows]

  const dev = typeof params.devEui === 'string' ? params.devEui.trim() : ''
  if (dev) {
    list = list.filter((r) => r.devEui.toLowerCase().includes(dev.toLowerCase()))
  }

  if (typeof params.countryCode === 'string' && params.countryCode) {
    list = list.filter((r) => r.countryCode === params.countryCode)
  }

  if (typeof params.partnerId === 'number') {
    list = list.filter((r) => r.partnerId === params.partnerId)
  }

  if (isActiveFilter(params.regionId)) {
    if (params.regionId === 'NONE') {
      list = list.filter((r) => r.regionId == null)
    } else {
      list = list.filter((r) => r.regionId === params.regionId)
    }
  } else if (isActiveFilter(params.partnerId)) {
    list = list.filter((r) => r.regionId == null)
  }

  if (typeof params.storeId === 'number') {
    list = list.filter((r) => r.storeId === params.storeId)
  }

  const tab = params.ticketTab ?? 'pending'
  if (tab === 'pending') {
    list = list.filter((r) => r.ticketStatus === 'PENDING')
  } else if (tab === 'done') {
    list = list.filter((r) => r.ticketStatus === 'COMPLETED')
  }

  if (params.processResult) {
    list = list.filter((r) => r.processResult === params.processResult)
  }

  const range = params.alertTimeRange
  if (Array.isArray(range) && range.length === 2 && range[0] && range[1]) {
    const [start, end] = range
    list = list.filter((r) => r.alertTime >= start && r.alertTime <= end)
  }

  return list
}

export function fetchTicketList(
  params: Api.Ticket.TicketSearchParams
): Promise<Api.Ticket.TicketList> {
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

export function processTicket(
  id: number,
  payload: { processResult: Api.Ticket.ProcessResult; processorName: string }
): Promise<Api.Ticket.TicketListItem> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockRows.findIndex((r) => r.id === id)
      if (idx === -1) {
        reject(new Error('工单不存在'))
        return
      }
      const row = mockRows[idx]
      if (row.ticketStatus !== 'PENDING') {
        reject(new Error('工单已处理'))
        return
      }
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const processTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      const updated: Api.Ticket.TicketListItem = {
        ...row,
        ticketStatus: 'COMPLETED',
        processResult: payload.processResult,
        processTime,
        processorName: payload.processorName
      }
      mockRows[idx] = updated
      resolve(updated)
    }, 200)
  })
}
