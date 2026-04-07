import { AppRouteRecord } from '@/types/router'

/** 车轮管理（位于门店管理之后、信标管理之前） */
export const wheelRoutes: AppRouteRecord = {
  path: '/wheel',
  name: 'Wheel',
  component: '/index/index',
  redirect: '/wheel/list',
  meta: {
    title: 'menus.wheel.title',
    icon: 'ri:shopping-cart-line',
    roles: ['R_SUPER', 'STORE_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'WheelList',
      component: '/wheel/list',
      meta: {
        title: 'menus.wheel.list',
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
