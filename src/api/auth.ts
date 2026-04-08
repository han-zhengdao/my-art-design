import request from '@/utils/http'

const LOGIN_AUTHORIZATION =
  'eyJhbGciOiJIUzM4NCJ9.eyJsb2dpbklkIjoiYThmOTkwNmI1NDk1NGU4N2E2NmJhN2YzNWE4OWNmZDAiLCJ1c2VySWQiOjEsImlhdCI6MTc3NTYzNTcxMSwiZXhwIjoxNzc1NjQyOTExfQ.IW0gOqKmEtMqaX3kjRFGIDdx2Zoz3uozPdaGP6I9xlVkBPHui_e8Mj8i7_6n5-wn'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/auth/login',
    params,
    headers: {
      Authorization: LOGIN_AUTHORIZATION
    }
    // showSuccessMessage: true // 显示成功消息
    // showErrorMessage: false // 不显示错误消息
  })
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return request
    .get<{
      userId: number
      nickName?: string
      email: string
      roleId?: number
      roleName?: string
      roleCode?: string
      userType?: string
    }>({
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
        buttons: []
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
 * 获取当前用户菜单权限
 */
export function fetchGetMyMenusPermission() {
  return request.get<Api.Auth.MyMenuPermissionItem[]>({
    url: '/auth/getMyMenusPermission'
  })
}
