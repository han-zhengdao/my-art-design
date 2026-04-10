import { AppRouteRecord } from '@/types/router'

export const helpRoutes: AppRouteRecord = {
  path: '/help',
  name: 'Help',
  component: '/index/index',
  meta: {
    title: 'menus.help.title',
    icon: 'ri:lightbulb-line'
  },
  children: [
    {
      path: 'support',
      name: 'HelpSupport',
      component: '/help/support',
      meta: {
        title: 'menus.help.support',
        icon: 'ri:book-open-line',
        keepAlive: true
      }
    }
  ]
}
