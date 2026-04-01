/**
 * 合作商管理（当前为前端 mock，对接后端时替换为真实接口）
 */

import { appendPartnerAdminUserFromPartner } from '@/api/user-mock'

const MOCK_ROWS: Api.Partner.PartnerListItem[] = [
  {
    id: 1001,
    userNickName: '合作商管理员-A',
    loginEmail: 'partner-a@example.com',
    partnerName: '华东零售集团',
    country: '中国',
    countryCode: 'CN',
    iotToken: 'iot-token-cn-1001',
    tenantId: 'tenant-cn-1001',
    dcBalance: 12800,
    contactName: '张伟',
    phone: '13800138001',
    enterpriseAddress: '上海市浦东新区世纪大道 88 号',
    regionCount: 6,
    storeCount: 42,
    wheelCount: 320,
    beaconCount: 55,
    operatorName: '系统管理员',
    createTime: '2025-12-01 09:30:00'
  },
  {
    id: 1002,
    userNickName: '合作商管理员-B',
    loginEmail: 'partner-b@example.com',
    partnerName: 'Pacific Foods LLC',
    country: '美国',
    countryCode: 'US',
    iotToken: 'iot-token-us-1002',
    tenantId: 'tenant-us-1002',
    dcBalance: 7650,
    contactName: 'John Smith',
    phone: '+1-415-555-0101',
    enterpriseAddress: '415 Market St, San Francisco, CA',
    regionCount: 3,
    storeCount: 18,
    wheelCount: 156,
    beaconCount: 24,
    operatorName: '系统管理员',
    createTime: '2025-11-20 14:12:33'
  },
  {
    id: 1003,
    userNickName: '合作商管理员-C',
    loginEmail: 'partner-c@example.com',
    partnerName: '关东鲜选',
    country: '日本',
    countryCode: 'JP',
    iotToken: 'iot-token-jp-1003',
    tenantId: 'tenant-jp-1003',
    dcBalance: 4200,
    contactName: '佐藤健',
    phone: '+81-3-1234-5678',
    enterpriseAddress: '東京都千代田区1-2-3',
    regionCount: 2,
    storeCount: 9,
    wheelCount: 88,
    beaconCount: 13,
    operatorName: '李运营',
    createTime: '2025-10-08 11:05:18'
  },
  {
    id: 1004,
    userNickName: '合作商管理员-D',
    loginEmail: 'partner-d@example.com',
    partnerName: '西南商贸',
    country: '中国',
    countryCode: 'CN',
    iotToken: 'iot-token-cn-1004',
    tenantId: 'tenant-cn-1004',
    dcBalance: 9800,
    contactName: '王芳',
    phone: '13900139002',
    enterpriseAddress: '成都市高新区天府大道 666 号',
    regionCount: 4,
    storeCount: 27,
    wheelCount: 210,
    beaconCount: 38,
    operatorName: '李运营',
    createTime: '2026-01-15 16:40:00'
  },
  {
    id: 1005,
    userNickName: '合作商管理员-E',
    loginEmail: 'partner-e@example.com',
    partnerName: 'Nordic Retail AS',
    country: '挪威',
    countryCode: 'NO',
    iotToken: 'iot-token-no-1005',
    tenantId: 'tenant-no-1005',
    dcBalance: 2330,
    contactName: 'Erik Hansen',
    phone: '+47-21-00-00-00',
    enterpriseAddress: 'Oslo City Center, Norway',
    regionCount: 1,
    storeCount: 5,
    wheelCount: 34,
    beaconCount: 8,
    operatorName: '系统管理员',
    createTime: '2026-02-01 08:00:22'
  }
]

/** 可变的 mock 数据（对接接口后可删除） */
let mockRows: Api.Partner.PartnerListItem[] = [...MOCK_ROWS]

function filterRows(params: Api.Partner.PartnerSearchParams): Api.Partner.PartnerListItem[] {
  let list = [...mockRows]
  const name = params.partnerName?.trim()
  if (name) {
    list = list.filter((r) => r.partnerName.includes(name))
  }
  if (params.countryCode) {
    list = list.filter((r) => r.countryCode === params.countryCode)
  }
  return list
}

/** 按国家拉取合作商（用于下拉联动等） */
export function fetchPartnersByCountry(
  countryCode: string
): Promise<Api.Partner.PartnerListItem[]> {
  return fetchPartnerList({ countryCode, current: 1, size: 500 }).then((res) => res.records)
}

export function fetchPartnerList(
  params: Api.Partner.PartnerSearchParams
): Promise<Api.Partner.PartnerList> {
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

export function createPartner(
  payload: Omit<Api.Partner.PartnerListItem, 'id' | 'createTime' | 'operatorName'> & {
    operatorName: string
    regionCount?: number
    storeCount?: number
    wheelCount?: number
    dcBalance?: number
    beaconCount?: number
  }
): Promise<Api.Partner.PartnerListItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nextId = mockRows.reduce((m, r) => Math.max(m, r.id), 0) + 1
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      const row: Api.Partner.PartnerListItem = {
        id: nextId,
        userNickName: payload.userNickName ?? '',
        loginEmail: payload.loginEmail ?? '',
        partnerName: payload.partnerName,
        country: payload.country,
        countryCode: payload.countryCode,
        iotToken: payload.iotToken,
        tenantId: payload.tenantId,
        dcBalance: payload.dcBalance ?? 0,
        contactName: payload.contactName,
        phone: payload.phone,
        enterpriseAddress: payload.enterpriseAddress,
        regionCount: payload.regionCount ?? 0,
        storeCount: payload.storeCount ?? 0,
        wheelCount: payload.wheelCount ?? 0,
        beaconCount: payload.beaconCount ?? 0,
        operatorName: payload.operatorName,
        createTime
      }
      mockRows = [row, ...mockRows]
      if (payload.userNickName?.trim() && payload.loginEmail?.trim()) {
        appendPartnerAdminUserFromPartner({
          nickName: payload.userNickName.trim(),
          userEmail: payload.loginEmail.trim(),
          partnerName: row.partnerName,
          operatorName: payload.operatorName
        })
      }
      resolve(row)
    }, 200)
  })
}

export function updatePartner(
  id: number,
  payload: Partial<
    Pick<
      Api.Partner.PartnerListItem,
      | 'partnerName'
      | 'country'
      | 'countryCode'
      | 'iotToken'
      | 'tenantId'
      | 'contactName'
      | 'phone'
      | 'enterpriseAddress'
      | 'regionCount'
      | 'storeCount'
      | 'wheelCount'
      | 'dcBalance'
      | 'beaconCount'
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

export function deletePartner(id: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockRows = mockRows.filter((r) => r.id !== id)
      resolve()
    }, 200)
  })
}
