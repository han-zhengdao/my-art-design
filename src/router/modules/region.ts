import { AppRouteRecord } from '@/types/router'

/** 区域管理（与合作商管理并列的顶级菜单，顺序在合作商管理之后） */
export const regionRoutes: AppRouteRecord = {
  path: '/region',
  name: 'Region',
  component: '/index/index',
  redirect: '/region/list',
  meta: {
    title: 'menus.region.title',
    icon: 'ri:layout-grid-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'RegionList',
      component: '/partner/region/list',
      meta: {
        title: 'menus.region.list',
        icon: 'ri:list-check',
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
