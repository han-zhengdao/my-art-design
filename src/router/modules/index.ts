import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'
import { partnerRoutes } from './partner'
import { regionRoutes } from './region'
import { storeRoutes } from './store'
import { wheelRoutes } from './wheel'
import { beaconRoutes } from './beacon'
import { ticketRoutes } from './ticket'
import { dcRoutes } from './dc'
import { helpRoutes } from './help'
import { wheelEntryRoutes } from './wheel-entry'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  systemRoutes,
  partnerRoutes,
  regionRoutes,
  storeRoutes,
  wheelRoutes,
  beaconRoutes,
  ticketRoutes,
  dcRoutes,
  helpRoutes,
  wheelEntryRoutes
]
