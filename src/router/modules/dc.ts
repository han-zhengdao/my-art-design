import { AppRouteRecord } from '@/types/router'

/** DC 管理（位于工单管理与帮助中心之间） */
export const dcRoutes: AppRouteRecord = {
  path: '/dc',
  name: 'Dc',
  component: '/index/index',
  redirect: '/dc/target',
  meta: {
    title: 'menus.dc.title',
    icon: 'ri:wallet-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'target',
      name: 'DcTarget',
      component: '/dc/target',
      meta: {
        title: 'menus.dc.target',
        icon: 'ri:user-search-line',
        keepAlive: true
      }
    },
    {
      path: 'allocate',
      name: 'DcAllocate',
      component: '/dc/allocate',
      meta: {
        title: 'menus.dc.allocate',
        icon: 'ri:share-circle-line',
        keepAlive: true
      }
    },
    {
      path: 'recharge-record',
      name: 'DcRechargeRecord',
      component: '/dc/recharge-record',
      meta: {
        title: 'menus.dc.rechargeRecord',
        icon: 'ri:file-list-2-line',
        keepAlive: true
      }
    },
    {
      path: 'assign-record',
      name: 'DcAssignRecord',
      component: '/dc/assign-record',
      meta: {
        title: 'menus.dc.assignRecord',
        icon: 'ri:share-forward-line',
        keepAlive: true
      }
    },
    {
      path: 'usage-record',
      name: 'DcUsageRecord',
      component: '/dc/usage-record',
      meta: {
        title: 'menus.dc.usageRecord',
        icon: 'ri:history-line',
        keepAlive: true
      }
    }
  ]
}
