/**
 * 用户管理本地 mock（与 /api/user/list 对接前使用）
 * 合作商创建成功时可同步追加合作商管理员账户
 */

const INITIAL_ROWS: Api.SystemManage.UserListItem[] = [
  {
    id: 1,
    avatar: '',
    status: '1',
    userName: 'super',
    userGender: 'male',
    nickName: '系统超管',
    userPhone: '13800000001',
    userEmail: 'super@example.com',
    userRoles: ['R_SUPER'],
    assetName: '平台总部',
    createBy: '系统',
    createTime: '2025-01-01 10:00:00',
    updateBy: '系统',
    updateTime: '2025-01-01 10:00:00'
  },
  {
    id: 2,
    avatar: '',
    status: '1',
    userName: 'partner-admin',
    userGender: 'female',
    nickName: '合作商管理员-A',
    userPhone: '13800000002',
    userEmail: 'partner-admin@example.com',
    userRoles: ['PARTNER_ADMIN'],
    assetName: '华东零售集团',
    createBy: '系统超管',
    createTime: '2025-02-10 09:30:00',
    updateBy: '系统超管',
    updateTime: '2025-02-10 09:30:00'
  },
  {
    id: 3,
    avatar: '',
    status: '1',
    userName: 'region-admin',
    userGender: 'male',
    nickName: '区域管理员-B',
    userPhone: '13800000003',
    userEmail: 'region-admin@example.com',
    userRoles: ['REGION_ADMIN'],
    assetName: '华东一区',
    createBy: '系统超管',
    createTime: '2025-03-15 14:20:00',
    updateBy: '系统超管',
    updateTime: '2025-03-15 14:20:00'
  },
  {
    id: 4,
    avatar: '',
    status: '4',
    userName: 'store-admin',
    userGender: 'female',
    nickName: '门店管理员-C',
    userPhone: '13800000004',
    userEmail: 'store-admin@example.com',
    userRoles: ['STORE_ADMIN'],
    assetName: '上海世纪门店',
    createBy: '系统超管',
    createTime: '2024-03-01 08:00:00',
    updateBy: '系统超管',
    updateTime: '2024-03-01 08:00:00'
  },
  {
    id: 5,
    avatar: '',
    status: '4',
    userName: 'store-staff',
    userGender: 'male',
    nickName: '门店员工-D',
    userPhone: '13800000005',
    userEmail: 'store-staff@example.com',
    userRoles: ['STORE_STAFF'],
    assetName: '成都高新门店',
    createBy: '门店管理员-C',
    createTime: '2024-05-20 11:15:00',
    updateBy: '门店管理员-C',
    updateTime: '2024-05-20 11:15:00'
  },
  {
    id: 6,
    avatar: '',
    status: '4',
    userName: 'region-admin',
    userGender: 'male',
    nickName: '区域管理员-B',
    userPhone: '13800000003',
    userEmail: 'region-admin@example.com',
    userRoles: ['REGION_ADMIN'],
    assetName: '华东一区',
    createBy: '系统超管',
    createTime: '2024-03-01 08:00:00',
    updateBy: '系统超管',
    updateTime: '2026-03-01 08:00:00'
  }
]

let mockUserRows: Api.SystemManage.UserListItem[] = [...INITIAL_ROWS]

function filterMockRows(
  params: Api.SystemManage.UserSearchParams
): Api.SystemManage.UserListItem[] {
  let list = [...mockUserRows]
  const keyword = params.keyword?.trim()
  if (keyword) {
    list = list.filter(
      (r) =>
        r.userName.includes(keyword) ||
        r.userEmail.includes(keyword) ||
        r.nickName.includes(keyword)
    )
  }
  if (params.role) {
    list = list.filter((r) => r.userRoles.includes(params.role!))
  }
  if (params.status) {
    const wantDisabled = params.status === 'disabled'
    list = list.filter((r) => (wantDisabled ? r.status === '4' : r.status !== '4'))
  }
  if (params.logoutTimeRange && params.logoutTimeRange.length === 2) {
    const [start, end] = params.logoutTimeRange
    const startTs = start ? new Date(start).getTime() : NaN
    const endTs = end ? new Date(end).getTime() : NaN
    list = list.filter((r) => {
      if (r.status !== '4') return false
      const t = new Date(r.updateTime).getTime()
      if (Number.isNaN(t)) return false
      if (!Number.isNaN(startTs) && t < startTs) return false
      if (!Number.isNaN(endTs) && t > endTs) return false
      return true
    })
  }
  return list
}

export function fetchMockUserList(
  params: Api.SystemManage.UserSearchParams
): Promise<Api.SystemManage.UserList> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const current = params.current ?? 1
      const size = params.size ?? 20
      const filtered = filterMockRows(params)
      const start = (current - 1) * size
      const records = filtered.slice(start, start + size)
      resolve({
        records,
        current,
        size,
        total: filtered.length
      })
    }, 200)
  })
}

/** 是否存在用户绑定该角色编码（删除角色前校验，与 RoleListItem.roleCode 一致） */
export function isRoleCodeUsedByAnyUser(roleCode: string): boolean {
  const code = roleCode.trim()
  if (!code) return false
  return mockUserRows.some((u) => Array.isArray(u.userRoles) && u.userRoles.includes(code))
}

/** 新增合作商成功后同步：在用户管理列表追加一条「合作商管理员」，对应资产为合作商名称 */
export function appendPartnerAdminUserFromPartner(payload: {
  nickName: string
  userEmail: string
  partnerName: string
  operatorName: string
}): void {
  const nextId = mockUserRows.reduce((m, r) => Math.max(m, r.id), 0) + 1
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const local = payload.userEmail.split('@')[0]?.trim()
  const userName = local && local.length > 0 ? local : `partner_${nextId}`

  const row: Api.SystemManage.UserListItem = {
    id: nextId,
    avatar: '',
    status: '1',
    userName,
    userGender: 'unknown',
    nickName: payload.nickName,
    userPhone: '',
    userEmail: payload.userEmail,
    userRoles: ['PARTNER_ADMIN'],
    assetName: payload.partnerName,
    createBy: payload.operatorName,
    createTime,
    updateBy: payload.operatorName,
    updateTime: createTime
  }
  mockUserRows = [row, ...mockUserRows]
}

/** 新增区域成功后同步：在用户管理列表追加一条「区域管理员」，对应资产为区域名称 */
export function appendRegionAdminUserFromRegion(payload: {
  nickName: string
  userEmail: string
  regionName: string
  operatorName: string
}): void {
  const nextId = mockUserRows.reduce((m, r) => Math.max(m, r.id), 0) + 1
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const local = payload.userEmail.split('@')[0]?.trim()
  const userName = local && local.length > 0 ? local : `region_${nextId}`

  const row: Api.SystemManage.UserListItem = {
    id: nextId,
    avatar: '',
    status: '1',
    userName,
    userGender: 'unknown',
    nickName: payload.nickName,
    userPhone: '',
    userEmail: payload.userEmail,
    userRoles: ['REGION_ADMIN'],
    assetName: payload.regionName,
    createBy: payload.operatorName,
    createTime,
    updateBy: payload.operatorName,
    updateTime: createTime
  }
  mockUserRows = [row, ...mockUserRows]
}

/** 新增门店成功后同步：在用户管理列表追加一条「门店管理员」，对应资产为门店名称 */
export function appendStoreAdminUserFromStore(payload: {
  nickName: string
  userEmail: string
  storeName: string
  operatorName: string
}): void {
  const nextId = mockUserRows.reduce((m, r) => Math.max(m, r.id), 0) + 1
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const local = payload.userEmail.split('@')[0]?.trim()
  const userName = local && local.length > 0 ? local : `store_${nextId}`

  const row: Api.SystemManage.UserListItem = {
    id: nextId,
    avatar: '',
    status: '1',
    userName,
    userGender: 'unknown',
    nickName: payload.nickName,
    userPhone: '',
    userEmail: payload.userEmail,
    userRoles: ['STORE_ADMIN'],
    assetName: payload.storeName,
    createBy: payload.operatorName,
    createTime,
    updateBy: payload.operatorName,
    updateTime: createTime
  }
  mockUserRows = [row, ...mockUserRows]
}

/** 从本地 mock 中移除用户（用户管理删除） */
export function deleteMockUsersByIds(ids: number[]): void {
  const set = new Set(ids)
  mockUserRows = mockUserRows.filter((r) => !set.has(r.id))
}
