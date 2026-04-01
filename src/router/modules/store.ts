import { AppRouteRecord } from '@/types/router'

/** 门店管理（顺序在区域管理之后） */
export const storeRoutes: AppRouteRecord = {
  path: '/store',
  name: 'Store',
  component: '/index/index',
  redirect: '/store/list',
  meta: {
    title: 'menus.store.title',
    icon: 'ri:store-2-line',
    roles: ['R_SUPER', 'STORE_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'StoreList',
      component: '/partner/store/list',
      meta: {
        title: 'menus.store.list',
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
