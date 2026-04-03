import { AppRouteRecord } from '@/types/router'

/** 信标管理（与门店管理并列，建议顺序在门店管理之后） */
export const beaconRoutes: AppRouteRecord = {
  path: '/beacon',
  name: 'Beacon',
  component: '/index/index',
  redirect: '/beacon/list',
  meta: {
    title: 'menus.beacon.title',
    icon: 'ri:signal-tower-line',
    roles: ['R_SUPER', 'STORE_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'BeaconList',
      component: '/beacon/list',
      meta: {
        title: 'menus.beacon.list',
        icon: 'ri:list-check-3',
        keepAlive: true,
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    }
  ]
}
