/**
 * 将 GET /auth/getMyMenus 返回的菜单树转为 AppRouteRecord（与 ComponentLoader 路径约定一致）
 *
 * - `menuName` 作为 meta.title：若后端已按用户语言返回文案，侧栏应直接展示（见 formatMenuTitle，非 menus. 前缀则原样显示）。
 * - 若仍使用前端 i18n 键（如 menus.xxx），formatMenuTitle 会走 vue-i18n。
 */
import type { AppRouteRecord, RouteMeta } from '@/types/router'

type MenuNode = Api.SystemManage.MenuTreeItem

const LEGACY_ICON_MAP: Record<string, string> = {
  setting: 'ri:settings-3-line',
  menu: 'ri:menu-line',
  team: 'ri:team-line',
  user: 'ri:user-line',
  apartment: 'ri:building-2-line',
  environment: 'ri:earth-line',
  shop: 'ri:store-2-line',
  appstore: 'ri:apps-line',
  desktop: 'ri:computer-line',
  group: 'ri:group-line'
}

export function normalizeMenuIcon(raw?: string): string {
  const s = (raw || '').trim()
  if (!s) return 'ri:file-list-3-line'
  if (s.includes(':')) return s
  return LEGACY_ICON_MAP[s] ?? `ri:file-list-3-line`
}

function joinAbsolutePath(parent: string, segment: string): string {
  const s = segment.trim()
  if (!s) return parent || '/'
  if (s.startsWith('http')) return s.replace(/\/$/, '')
  if (s.startsWith('/')) return s.replace(/\/+$/, '') || '/'
  const p = (parent || '').replace(/\/$/, '')
  if (!p) return `/${s}`.replace(/\/+/g, '/')
  return `${p}/${s}`.replace(/\/+/g, '/')
}

/** 与 vue-router name 兼容且全局唯一 */
function menuNodeToRouteName(node: MenuNode): string {
  const code = (node.menuCode || '').trim()
  const safe = code.replace(/[^a-zA-Z0-9_]/g, '_')
  if (/^[A-Za-z]/.test(safe) && safe.length > 0) {
    return `${safe}_${node.id}`
  }
  return `Menu_${node.id}`
}

function leafRouterPath(rawPath: string): string {
  const s = rawPath.trim()
  if (!s) return ''
  if (s.startsWith('/')) {
    const parts = s.split('/').filter(Boolean)
    return parts.length ? (parts[parts.length - 1] as string) : s
  }
  return s
}

function convertNode(node: MenuNode, parentAbsolutePath: string): AppRouteRecord {
  const rawPath = (node.path || '').trim()
  const absolutePath = rawPath.startsWith('/')
    ? rawPath.replace(/\/+$/, '') || '/'
    : joinAbsolutePath(parentAbsolutePath, rawPath)

  const childrenRaw = node.children ?? []
  const isBranch = childrenRaw.length > 0 || node.type === 1

  const name = menuNodeToRouteName(node)
  const meta: RouteMeta = {
    title: node.menuName,
    icon: normalizeMenuIcon(node.icon),
    sort: node.sort,
    isEnable: node.status === 1
  }

  if (isBranch) {
    const pathForRouter = rawPath.startsWith('/') ? rawPath.replace(/\/+$/, '') || '/' : rawPath
    return {
      path: pathForRouter || '/',
      name,
      component: '/index/index',
      meta,
      children: childrenRaw.map((ch) => convertNode(ch, absolutePath)),
      id: node.id
    }
  }

  const pathForRouter = leafRouterPath(rawPath)
  const componentStr = absolutePath.startsWith('/')
    ? absolutePath
    : `/${absolutePath}`.replace(/\/+/g, '/')

  return {
    path: pathForRouter || '/',
    name,
    component: componentStr,
    meta,
    id: node.id
  }
}

export function convertMyMenusToAppRoutes(nodes: MenuNode[]): AppRouteRecord[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return []
  return nodes.map((n) => convertNode(n, ''))
}
