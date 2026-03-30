import { AppRouteRecord } from '@/types/router'

export const partnerRoutes: AppRouteRecord = {
  path: '/partner',
  name: 'Partner',
  component: '/index/index',
  redirect: '/partner/list',
  meta: {
    title: 'menus.partner.title',
    icon: 'ri:team-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'PartnerList',
      component: '/partner/list',
      meta: {
        title: 'menus.partner.list',
        icon: 'ri:list-check-2',
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
