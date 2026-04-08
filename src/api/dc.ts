/**
 * DC 管理（前端 mock，对接后端时替换）
 */

function matchTimeRange(time: string, range?: string[]): boolean {
  if (!range || range.length < 2 || !range[0] || !range[1]) return true
  return time >= range[0] && time <= range[1]
}

// ---------- 充值对象 ----------
const TARGET_MOCK: Api.Dc.RechargeTargetItem[] = [
  {
    partnerId: 1001,
    partnerName: '华东零售集团',
    country: '中国',
    countryCode: 'CN',
    contactName: '张伟',
    phone: '13800138001',
    email: 'partner-a@example.com',
    dcBalance: 12800,
    allocatableBalance: 5000
  },
  {
    partnerId: 1002,
    partnerName: 'Pacific Foods LLC',
    country: '美国',
    countryCode: 'US',
    contactName: 'John Smith',
    phone: '+1-415-555-0101',
    email: 'partner-b@example.com',
    dcBalance: 7650,
    allocatableBalance: 2000
  },
  {
    partnerId: 1004,
    partnerName: '西南商贸',
    country: '中国',
    countryCode: 'CN',
    contactName: '王芳',
    phone: '13900139002',
    email: 'partner-d@example.com',
    dcBalance: 9800,
    allocatableBalance: 3200
  },
  {
    partnerId: 1005,
    partnerName: 'Nordic Retail AS',
    country: '挪威',
    countryCode: 'NO',
    contactName: 'Erik Hansen',
    phone: '+47-21-00-00-00',
    email: 'partner-e@example.com',
    dcBalance: 2100,
    allocatableBalance: 800
  }
]

export function fetchDcRechargeTargetList(
  params: Api.Dc.RechargeTargetSearchParams
): Promise<Api.Dc.RechargeTargetList> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let list = [...TARGET_MOCK]
      const name = params.partnerName?.trim()
      if (name) list = list.filter((r) => r.partnerName.includes(name))
      if (params.countryCode) list = list.filter((r) => r.countryCode === params.countryCode)
      const current = params.current ?? 1
      const size = params.size ?? 20
      const start = (current - 1) * size
      resolve({
        records: list.slice(start, start + size),
        current,
        size,
        total: list.length
      })
    }, 200)
  })
}

// ---------- 充值记录 ----------
const RECHARGE_REC_MOCK: Api.Dc.RechargeRecordItem[] = [
  {
    id: 9001,
    partnerName: '华东零售集团',
    country: '中国',
    countryCode: 'CN',
    contactName: '张伟',
    phone: '13800138001',
    email: 'partner-a@example.com',
    amount: 1000,
    rechargeTime: '2026-03-01 10:00:00',
    operatorName: '系统管理员',
    serialNo: 'DC-R-202603010001'
  },
  {
    id: 9002,
    partnerName: 'Pacific Foods LLC',
    country: '美国',
    countryCode: 'US',
    contactName: 'John Smith',
    phone: '+1-415-555-0101',
    email: 'partner-b@example.com',
    amount: 500,
    rechargeTime: '2026-03-02 14:30:22',
    operatorName: '李运营',
    serialNo: 'DC-R-202603020002'
  },
  {
    id: 9003,
    partnerName: '西南商贸',
    country: '中国',
    countryCode: 'CN',
    contactName: '王芳',
    phone: '13900139002',
    email: 'partner-d@example.com',
    amount: 2000,
    rechargeTime: '2026-02-28 09:15:00',
    operatorName: '系统管理员',
    serialNo: 'DC-R-202602280003'
  }
]

export function fetchDcRechargeRecordList(
  params: Api.Dc.RechargeRecordSearchParams
): Promise<Api.Dc.RechargeRecordList> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let list = [...RECHARGE_REC_MOCK]
      const name = params.partnerName?.trim()
      if (name) list = list.filter((r) => r.partnerName.includes(name))
      if (params.countryCode) list = list.filter((r) => r.countryCode === params.countryCode)
      const tr = params.timeRange
      if (tr && tr.length === 2) {
        list = list.filter((r) => matchTimeRange(r.rechargeTime, tr))
      }
      const sf = params.sortField
      const so = params.sortOrder
      if (sf === 'rechargeTime' && so) {
        const mult = so === 'ascending' ? 1 : -1
        list = [...list].sort((a, b) => a.rechargeTime.localeCompare(b.rechargeTime) * mult)
      }
      const current = params.current ?? 1
      const size = params.size ?? 20
      const start = (current - 1) * size
      resolve({
        records: list.slice(start, start + size),
        current,
        size,
        total: list.length
      })
    }, 200)
  })
}

// ---------- 分配记录 ----------
const ASSIGN_REC_MOCK: Api.Dc.AssignRecordItem[] = [
  {
    id: 8001,
    assignSource: 'PARTNER',
    assignSourceLabel: '合作商',
    assignType: 'REGION',
    assignTypeLabel: '区域',
    targetName: '华东一区',
    amount: 500,
    assignTime: '2026-03-01 11:00:00',
    operatorName: '张伟'
  },
  {
    id: 8002,
    assignSource: 'REGION',
    assignSourceLabel: '区域',
    assignType: 'STORE',
    assignTypeLabel: '门店',
    targetName: '浦东旗舰店',
    amount: 200,
    assignTime: '2026-03-01 11:30:00',
    operatorName: '李运营'
  },
  {
    id: 8003,
    assignSource: 'PARTNER',
    assignSourceLabel: '合作商',
    assignType: 'STORE',
    assignTypeLabel: '门店',
    targetName: '成都高新店',
    amount: 300,
    assignTime: '2026-03-02 09:00:00',
    operatorName: '系统管理员'
  }
]

export function fetchDcAssignRecordList(
  params: Api.Dc.AssignRecordSearchParams
): Promise<Api.Dc.AssignRecordList> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let list = [...ASSIGN_REC_MOCK]
      const kw = params.targetKeyword?.trim()
      if (kw) list = list.filter((r) => r.targetName.includes(kw))
      if (params.assignSource) list = list.filter((r) => r.assignSource === params.assignSource)
      if (params.assignType) list = list.filter((r) => r.assignType === params.assignType)
      const tr = params.timeRange
      if (tr && tr.length === 2) {
        list = list.filter((r) => matchTimeRange(r.assignTime, tr))
      }
      const current = params.current ?? 1
      const size = params.size ?? 20
      const start = (current - 1) * size
      resolve({
        records: list.slice(start, start + size),
        current,
        size,
        total: list.length
      })
    }, 200)
  })
}

// ---------- 使用记录 ----------
const USAGE_REC_MOCK: Api.Dc.UsageRecordItem[] = [
  {
    id: 7001,
    usageType: 'WHEEL',
    usageTypeLabel: '车轮',
    deviceId: 'EUI001122334455667788',
    partnerId: 1001,
    regionId: 2001,
    storeId: 3001,
    storeName: '浦东旗舰店',
    regionName: '华东一区',
    partnerName: '华东零售集团',
    country: '中国',
    countryCode: 'CN',
    amount: 2,
    usageTime: '2026-03-03 08:00:00'
  },
  {
    id: 7002,
    usageType: 'BEACON',
    usageTypeLabel: '信标',
    deviceId: 'AA:BB:CC:DD:EE:01',
    partnerId: 1001,
    regionId: 2001,
    storeId: 3001,
    storeName: '浦东旗舰店',
    regionName: '华东一区',
    partnerName: '华东零售集团',
    country: '中国',
    countryCode: 'CN',
    amount: 1,
    usageTime: '2026-03-03 09:10:00'
  },
  {
    id: 7003,
    usageType: 'WHEEL',
    usageTypeLabel: '车轮',
    deviceId: 'EUI99FFEEDDCCBBAA01',
    partnerId: 1002,
    regionId: 2003,
    storeId: 3003,
    storeName: 'SF Bay Store',
    regionName: '加州湾区',
    partnerName: 'Pacific Foods LLC',
    country: '美国',
    countryCode: 'US',
    amount: 3,
    usageTime: '2026-02-20 16:00:00'
  }
]

export function fetchDcUsageRecordList(
  params: Api.Dc.UsageRecordSearchParams
): Promise<Api.Dc.UsageRecordList> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let list = [...USAGE_REC_MOCK]
      const kw = params.deviceKeyword?.trim()
      if (kw) {
        list = list.filter((r) => r.deviceId.toLowerCase().includes(kw.toLowerCase()))
      }
      if (params.usageType) list = list.filter((r) => r.usageType === params.usageType)
      if (params.countryCode) list = list.filter((r) => r.countryCode === params.countryCode)
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
      const tr = params.timeRange
      if (tr && tr.length === 2) {
        list = list.filter((r) => matchTimeRange(r.usageTime, tr))
      }
      const current = params.current ?? 1
      const size = params.size ?? 20
      const start = (current - 1) * size
      resolve({
        records: list.slice(start, start + size),
        current,
        size,
        total: list.length
      })
    }, 200)
  })
}
