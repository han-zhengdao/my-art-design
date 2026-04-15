import { AppRouteRecord } from '@/types/router'

/** 车轮录入（位于帮助中心之后） */
export const wheelEntryRoutes: AppRouteRecord = {
  path: '/wheel-entry',
  name: 'WheelEntry',
  component: '/index/index',
  redirect: '/wheel-entry/list',
  meta: {
    title: 'menus.wheelEntry.title',
    icon: 'ri:shopping-cart-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'WheelEntryList',
      component: '/wheel-entry/list',
      meta: {
        title: 'menus.wheelEntry.list',
        icon: 'ri:list-check-2',
        keepAlive: true
      }
    }
  ]
}
