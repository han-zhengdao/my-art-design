/**
 * 角色管理本地 mock（对接 /api/role/list 前使用）
 */

const INITIAL_ROWS: Api.SystemManage.RoleListItem[] = [
  {
    roleId: 1,
    roleName: '系统管理员',
    roleCode: 'R_ADMIN',
    description: '平台系统管理权限',
    enabled: true,
    createTime: '2025-01-01 10:00:00',
    operatorName: '系统超管'
  },
  {
    roleId: 2,
    roleName: '合作商管理员',
    roleCode: 'PARTNER_ADMIN',
    description: '合作商侧管理与配置',
    enabled: true,
    createTime: '2025-02-10 09:30:00',
    operatorName: '系统超管'
  },
  {
    roleId: 3,
    roleName: '区域管理员',
    roleCode: 'REGION_ADMIN',
    description: '区域内门店与资产运维',
    enabled: true,
    createTime: '2025-03-15 14:20:00',
    operatorName: '李运营'
  },
  {
    roleId: 4,
    roleName: '门店管理员',
    roleCode: 'STORE_ADMIN',
    description: '单店运营与员工管理',
    enabled: true,
    createTime: '2025-04-01 08:00:00',
    operatorName: '李运营'
  },
  {
    roleId: 5,
    roleName: '门店员工',
    roleCode: 'STORE_STAFF',
    description: '门店日常操作权限',
    enabled: false,
    createTime: '2025-05-20 11:15:00',
    operatorName: '门店管理员'
  }
]

let mockRoleRows: Api.SystemManage.RoleListItem[] = [...INITIAL_ROWS]

function parseTime(s: string): number {
  const t = new Date(s.replace(/-/g, '/')).getTime()
  return Number.isNaN(t) ? NaN : t
}

function filterMockRows(
  params: Api.SystemManage.RoleSearchParams
): Api.SystemManage.RoleListItem[] {
  let list = [...mockRoleRows]

  if (params.roleId != null) {
    list = list.filter((r) => r.roleId === params.roleId)
  }
  const name = params.roleName?.trim()
  if (name) {
    list = list.filter((r) => r.roleName.includes(name))
  }
  const code = params.roleCode?.trim()
  if (code) {
    list = list.filter((r) => r.roleCode.includes(code))
  }
  const desc = params.description?.trim()
  if (desc) {
    list = list.filter((r) => r.description.includes(desc))
  }
  if (params.enabled !== undefined && params.enabled !== null) {
    list = list.filter((r) => r.enabled === params.enabled)
  }

  const start = params.startTime
  const end = params.endTime
  if (start && end) {
    const startTs = parseTime(start)
    const endTs = parseTime(end)
    if (!Number.isNaN(startTs) && !Number.isNaN(endTs)) {
      const dayEnd = endTs + 86400000 - 1
      list = list.filter((r) => {
        const t = parseTime(r.createTime)
        if (Number.isNaN(t)) return false
        return t >= startTs && t <= dayEnd
      })
    }
  }

  return list
}

export function fetchMockRoleList(
  params: Api.SystemManage.RoleSearchParams
): Promise<Api.SystemManage.RoleList> {
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

export function createRole(
  payload: Pick<
    Api.SystemManage.RoleListItem,
    'roleName' | 'roleCode' | 'description' | 'enabled'
  > & { operatorName: string }
): Promise<Api.SystemManage.RoleListItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nextId = mockRoleRows.reduce((m, r) => Math.max(m, r.roleId), 0) + 1
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      const row: Api.SystemManage.RoleListItem = {
        roleId: nextId,
        roleName: payload.roleName,
        roleCode: payload.roleCode,
        description: payload.description,
        enabled: payload.enabled,
        createTime,
        operatorName: payload.operatorName
      }
      mockRoleRows = [row, ...mockRoleRows]
      resolve(row)
    }, 200)
  })
}

export function updateRole(
  roleId: number,
  payload: Partial<
    Pick<
      Api.SystemManage.RoleListItem,
      'roleName' | 'roleCode' | 'description' | 'enabled' | 'operatorName'
    >
  >
): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockRoleRows.findIndex((r) => r.roleId === roleId)
      if (idx === -1) {
        reject(new Error('记录不存在'))
        return
      }
      mockRoleRows[idx] = { ...mockRoleRows[idx], ...payload }
      resolve()
    }, 200)
  })
}

export function deleteRoleById(roleId: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockRoleRows = mockRoleRows.filter((r) => r.roleId !== roleId)
      resolve()
    }, 200)
  })
}
