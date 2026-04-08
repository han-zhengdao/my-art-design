import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import { fetchGetMyMenusPermission } from './auth'
import { asyncRoutes } from '@/router/routes/asyncRoutes'

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

// 获取菜单列表
export function fetchGetMenuList() {
  return fetchGetMyMenusPermission().then((permissions) => {
    const readableCodes = new Set(
      (permissions || []).filter((item) => item.canRead === 1).map((item) => item.menuCode)
    )

    // 路由名称 -> 后端 menuCode 映射
    const routeCodeMap: Record<string, string> = {
      Menus: 'system:menu',
      Role: 'system:role',
      User: 'system:user',
      PartnerList: 'org:partner',
      RegionList: 'org:region',
      StoreList: 'org:store',
      WheelList: 'biz:device',
      BeaconList: 'biz:device'
    }

    const filterByPermission = (routes: AppRouteRecord[]): AppRouteRecord[] => {
      return routes
        .map((route) => {
          const copied = { ...route }
          if (copied.children?.length) {
            copied.children = filterByPermission(copied.children)
          }
          return copied
        })
        .filter((route) => {
          // 保留有可见子节点的目录
          if (route.children && route.children.length > 0) {
            return true
          }
          // 仅对已映射节点做权限过滤，未映射默认保留
          const code = routeCodeMap[String(route.name || '')]
          if (!code) return true
          return readableCodes.has(code)
        })
    }

    return filterByPermission(asyncRoutes)
  })
}
