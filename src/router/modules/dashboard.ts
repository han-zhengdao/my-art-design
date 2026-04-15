import { AppRouteRecord } from '@/types/router'

export const dashboardRoutes: AppRouteRecord = {
  name: 'Dashboard',
  path: '/dashboard',
  component: '/index/index',
  meta: {
    title: 'menus.dashboard.title',
    icon: 'ri:home-smile-2-line',
    roles: ['R_SUPER', 'R_ADMIN', 'PARTNER_ADMIN', 'REGION_ADMIN', 'STORE_ADMIN', 'STORE_STAFF']
  },
  children: [
    {
      path: 'console',
      name: 'Console',
      component: '/dashboard/console',
      meta: {
        title: 'menus.dashboard.console',
        icon: 'ri:pie-chart-line',
        keepAlive: false,
        fixedTab: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'analysis',
      name: 'Analysis',
      component: '/dashboard/analysis',
      meta: {
        title: 'menus.dashboard.analysis',
        icon: 'ri:align-item-bottom-line',
        keepAlive: false,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'map-view',
      name: 'DashboardMapView',
      component: '/dashboard/map-view',
      meta: {
        title: 'menus.dashboard.mapView',
        icon: 'ri:map-pin-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN', 'PARTNER_ADMIN', 'REGION_ADMIN', 'STORE_ADMIN', 'STORE_STAFF']
      }
    }
  ]
}
