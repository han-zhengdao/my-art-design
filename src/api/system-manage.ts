import request from '@/utils/http'

// 用户分页列表 GET /system/user/getUserPageList
export function fetchGetUserPageList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/system/user/getUserPageList',
    params
  })
}

/** 新增用户 POST /system/user/createUser，成功时 data 为新用户 id */
export function fetchCreateUser(params: Api.SystemManage.CreateUserPayload) {
  return request.post<number>({
    url: '/system/user/createUser',
    params
  })
}

/** 用户详情 GET /system/user/getUserDetail?id= */
export function fetchGetUserDetail(id: number) {
  return request.get<Api.SystemManage.UserDetail>({
    url: '/system/user/getUserDetail',
    params: { id }
  })
}

/** 修改用户 POST /system/user/updateUser */
export function fetchUpdateUser(params: Api.SystemManage.UpdateUserPayload) {
  return request.post<null>({
    url: '/system/user/updateUser',
    params
  })
}

/** 删除用户 POST /system/user/deleteUser?id= */
export function fetchDeleteUser(id: number) {
  return request.post<null>({
    url: `/system/user/deleteUser?id=${encodeURIComponent(String(id))}`
  })
}

/**
 * 修改当前登录用户界面语言
 * POST /system/user/updateCurrentUserLanguage?language=
 * @param language 1 中文 2 英文（与 LoginUserInfoResponse.language 一致）
 */
export function fetchUpdateCurrentUserLanguage(language: number) {
  return request.post<null>({
    url: `/system/user/updateCurrentUserLanguage?language=${encodeURIComponent(String(language))}`,
    showSuccessMessage: false,
    showErrorMessage: true
  })
}

/** 重置/修改密码 POST /system/user/resetPassword（Body：id、oldPassword、newPassword） */
export function fetchResetPassword(params: Api.SystemManage.ResetPasswordPayload) {
  return request.post<null>({
    url: '/system/user/resetPassword',
    params,
    showSuccessMessage: true,
    showErrorMessage: true
  })
}

/** 创建用户时可选角色列表 GET /system/role/getRoleByUserTypeList（Authorization 由拦截器注入） */
export function fetchGetRoleByUserTypeList() {
  return request.get<Api.SystemManage.RoleByUserTypeItem[]>({
    url: '/system/role/getRoleByUserTypeList'
  })
}

/** 角色分页列表 GET /system/role/getRolePageList */
export function fetchGetRolePageList(params: Api.SystemManage.RolePageListParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/system/role/getRolePageList',
    params
  })
}

/** 新增角色 POST /system/role/createRole，返回新建角色 id */
export function fetchCreateRole(params: Api.SystemManage.CreateRolePayload) {
  return request.post<number>({
    url: '/system/role/createRole',
    params
  })
}

/** 删除角色 POST /system/role/deleteRole?id= */
export function fetchDeleteRole(id: number) {
  return request.post<void>({
    url: `/system/role/deleteRole?id=${encodeURIComponent(String(id))}`
  })
}

/** 角色详情 GET /system/role/getRoleDetail?id= */
export function fetchGetRoleDetail(id: number) {
  return request.get<Api.SystemManage.RoleDetail>({
    url: '/system/role/getRoleDetail',
    params: { id }
  })
}

/** 修改角色 POST /system/role/updateRole */
export function fetchUpdateRole(params: Api.SystemManage.UpdateRolePayload) {
  return request.post<void>({
    url: '/system/role/updateRole',
    params
  })
}

/** 查询角色已分配菜单权限 GET /system/role/getRoleMenuByRoleIdList?roleId= */
export function fetchGetRoleMenuByRoleIdList(roleId: number) {
  return request.get<Api.SystemManage.RoleMenuByRoleItem[]>({
    url: '/system/role/getRoleMenuByRoleIdList',
    params: { roleId }
  })
}

/** 给角色分配菜单权限 POST /system/role/assignRoleMenus */
export function fetchAssignRoleMenus(params: Api.SystemManage.AssignRoleMenusPayload) {
  return request.post<void>({
    url: '/system/role/assignRoleMenus',
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

/** 菜单管理：顶级目录下拉列表 */
export function fetchListDirectoryMenus() {
  return request.get<Api.SystemManage.DirectoryMenuItem[]>({
    url: '/system/menu/getDirectoryMenuList'
  })
}

/** 按字典编码拉取字典项（如 menu_type） */
export function fetchGetDictDataByDictCodeList(dictCode: string) {
  return request.get<Api.SystemManage.DictDataItem[]>({
    url: '/system/dict/getDictDataByDictCodeList',
    params: { dictCode }
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
