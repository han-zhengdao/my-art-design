import type { App } from 'vue'
import { createRouter, createWebHashHistory, type Router } from 'vue-router'
import { staticRoutes } from './routes/staticRoutes'
import { configureNProgress } from '@/utils/router'
import { setupBeforeEachGuard } from './guards/beforeEach'
import { setupAfterEachGuard } from './guards/afterEach'

/** dev 下懒加载 chunk 偶发 “Failed to fetch” 时，避免短时间内反复整页刷新 */
const DEV_CHUNK_RELOAD_KEY = 'vite_dev_route_chunk_reload_at'

function setupDevLazyChunkRecovery(r: Router) {
  if (!import.meta.env.DEV) return

  r.onError((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    if (
      !/Failed to fetch dynamically imported module|Loading chunk \d+ failed|Importing a module script failed/i.test(
        msg
      )
    ) {
      return
    }
    const now = Date.now()
    const prev = sessionStorage.getItem(DEV_CHUNK_RELOAD_KEY)
    if (prev && now - Number(prev) < 45_000) {
      console.warn(
        '[router] 路由页面脚本加载失败（可能与 HMR / 网络有关）。请尝试：强制刷新 Ctrl+Shift+R，或重启 pnpm dev。'
      )
      return
    }
    sessionStorage.setItem(DEV_CHUNK_RELOAD_KEY, String(now))
    window.location.reload()
  })
}

// 创建路由实例
export const router = createRouter({
  history: createWebHashHistory(),
  routes: staticRoutes // 静态路由
})

// 初始化路由
export function initRouter(app: App<Element>): void {
  configureNProgress() // 顶部进度条
  setupDevLazyChunkRecovery(router)
  setupBeforeEachGuard(router) // 路由前置守卫
  setupAfterEachGuard(router) // 路由后置守卫
  app.use(router)
}

// 主页路径，默认使用菜单第一个有效路径，配置后使用此路径
export const HOME_PAGE_PATH = ''
