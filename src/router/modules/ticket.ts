import { AppRouteRecord } from '@/types/router'

/** 工单管理（位于信标管理与帮助中心之间） */
export const ticketRoutes: AppRouteRecord = {
  path: '/ticket',
  name: 'Ticket',
  component: '/index/index',
  redirect: '/ticket/list',
  meta: {
    title: 'menus.ticket.title',
    icon: 'ri:file-list-3-line',
    roles: ['R_SUPER', 'R_ADMIN', 'STORE_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'TicketList',
      component: '/ticket/list',
      meta: {
        title: 'menus.ticket.list',
        icon: 'ri:list-unordered',
        keepAlive: true
      }
    }
  ]
}
