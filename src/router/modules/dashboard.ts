import { AppRouteRecord } from '@/types/router'

export const dashboardRoutes: AppRouteRecord = {
  name: 'Dashboard',
  path: '/dashboard',
  component: '/index/index',
  meta: {
    title: 'menus.dashboard.title',
    icon: 'ri:home-smile-2-line',
    roles: ['R_SUPER', 'R_ADMIN']
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
        fixedTab: true
      }
    },
    {
      path: 'map-view',
      name: 'DashboardMapView',
      component: '/dashboard/map-view',
      meta: {
        title: 'menus.dashboard.mapView',
        icon: 'ri:map-pin-line',
        keepAlive: true
      }
    },
    {
      path: 'analysis',
      name: 'Analysis',
      component: '/dashboard/analysis',
      meta: {
        title: 'menus.dashboard.analysis',
        icon: 'ri:align-item-bottom-line',
        keepAlive: false
      }
    },
    {
      path: 'ecommerce',
      name: 'Ecommerce',
      component: '/dashboard/ecommerce',
      meta: {
        title: 'menus.dashboard.ecommerce',
        icon: 'ri:bar-chart-box-line',
        keepAlive: false
      }
    }
  ]
}
