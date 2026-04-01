import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { templateRoutes } from './template'
import { widgetsRoutes } from './widgets'
import { examplesRoutes } from './examples'
import { systemRoutes } from './system'
import { partnerRoutes } from './partner'
import { regionRoutes } from './region'
import { storeRoutes } from './store'
import { articleRoutes } from './article'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
import { safeguardRoutes } from './safeguard'
import { helpRoutes } from './help'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  systemRoutes,
  partnerRoutes,
  regionRoutes,
  storeRoutes,
  templateRoutes,
  widgetsRoutes,
  examplesRoutes,
  articleRoutes,
  resultRoutes,
  exceptionRoutes,
  safeguardRoutes,
  ...helpRoutes
]
