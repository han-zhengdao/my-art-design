import request from '@/utils/http'

/**
 * 登录（未登录无 Token，请求头由 http 拦截器按需附加 Bearer）
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/auth/login',
    params
  })
}

/**
 * 获取当前登录用户信息（含 language：1 中文 2 英文）
 * @returns 映射后的 UserInfo
 */
export function fetchGetUserInfo() {
  return request
    .get<Api.Auth.LoginUserInfoResponse>({
      url: '/auth/getLoginUserInfo'
    })
    .then((res) => {
      const roleMap: Record<string, string> = {
        SUPER_ADMIN: 'R_SUPER',
        ADMIN: 'R_ADMIN',
        USER: 'R_USER'
      }

      const role = res.roleCode ? roleMap[res.roleCode] || res.roleCode : 'R_USER'

      return {
        userId: res.userId,
        userName: res.nickName || res.email,
        email: res.email,
        roles: [role],
        buttons: [],
        language: res.language
      } as Api.Auth.UserInfo
    })
}

/**
 * 退出登录
 */
export function fetchLogout() {
  return request.post<void>({
    url: '/auth/logout'
  })
}

/**
 * GET /auth/getCurrentUserRoleMenuList — 当前角色可访问菜单权限列表
 */
export function fetchGetCurrentUserRoleMenuList() {
  return request.get<Api.Auth.CurrentUserRoleMenuItem[]>({
    url: '/auth/getCurrentUserRoleMenuList'
  })
}

/**
 * 获取当前用户可见菜单树（用于后端模式动态菜单 / 路由）
 */
export function fetchGetMyMenus() {
  return request.get<Api.SystemManage.MenuTreeItem[]>({
    url: '/auth/getMyMenus'
  })
}
