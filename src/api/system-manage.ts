import request from '@/utils/http'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 获取角色列表（真实接口；当前页面已改用 @/api/role-mock）
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

/** 菜单管理页：后端菜单树 GET /system/menu/getMenuTree（Authorization 由 http 拦截器注入） */
export function fetchGetMenuTree() {
  return request.get<Api.SystemManage.MenuTreeItem[]>({
    url: '/system/menu/getMenuTree'
  })
}

/** 菜单管理：按 id 查询菜单详情 */
export function fetchGetMenuDetail(id: number) {
  return request.get<Api.SystemManage.MenuDetail>({
    url: '/system/menu/getMenuDetail',
    params: { id }
  })
}

/** 菜单管理：提交菜单更新 */
export function fetchUpdateMenu(params: Api.SystemManage.UpdateMenuPayload) {
  return request.post<void>({
    url: '/system/menu/updateMenu',
    params
  })
}

/** 菜单管理：新增菜单，返回新建菜单 id */
export function fetchCreateMenu(params: Api.SystemManage.CreateMenuPayload) {
  return request.post<number>({
    url: '/system/menu/createMenu',
    params
  })
}

/** 菜单管理：目录下拉列表 */
export function fetchListDirectoryMenus() {
  return request.get<Api.SystemManage.DirectoryMenuItem[]>({
    url: '/system/menu/listDirectoryMenus'
  })
}

/** 菜单管理：删除菜单 */
export function fetchDeleteMenu(id: number) {
  const params: Api.SystemManage.DeleteMenuPayload = { id }
  return request.post<void>({
    // 注意：当前 http 封装会把 POST 的 params 挪到 body，这个接口要求 query 参数，需显式拼到 URL
    url: `/system/menu/deleteMenu?id=${encodeURIComponent(String(params.id))}`
  })
}
