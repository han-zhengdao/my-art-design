<!-- 菜单管理页面 -->
<template>
  <div class="menu-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="formFilters"
      :items="formItems"
      :showExpand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
      <ArtTableHeader
        :showZebra="false"
        :loading="loading"
        v-model:columns="columnChecks"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElButton v-auth="'add'" type="primary" @click="handleAddMenu" v-ripple>
            添加菜单
          </ElButton>
          <ElButton @click="toggleExpand" v-ripple>
            {{ isExpanded ? '收起' : '展开' }}
          </ElButton>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        class="menu-manage-tree-table"
        row-key="id"
        :loading="loading"
        :columns="columns"
        :data="filteredTableData"
        :stripe="false"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      />

      <!-- 菜单弹窗 -->
      <MenuDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :editData="editData"
        :default-parent-id="defaultParentId"
        :directory-options="directoryOptions"
        :menu-name-map="menuNameMap"
        :lockType="lockMenuType"
        @submit="handleSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { formatMenuTitle } from '@/utils/router'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTableColumns } from '@/hooks/core/useTableColumns'
  import type { AppRouteRecord } from '@/types/router'
  import MenuDialog from './modules/menu-dialog.vue'
  import {
    fetchCreateMenu,
    fetchDeleteMenu,
    fetchGetMenuDetail,
    fetchGetMenuTree,
    fetchListDirectoryMenus,
    fetchUpdateMenu
  } from '@/api/system-manage'
  import { HttpError } from '@/utils/http/error'
  import { ElTag, ElMessage, ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'

  type MenuTreeItem = Api.SystemManage.MenuTreeItem

  defineOptions({ name: 'Menus' })
  const { locale } = useI18n()

  // 状态管理
  const loading = ref(false)
  const isExpanded = ref(false)
  const tableRef = ref()

  // 弹窗相关
  const dialogVisible = ref(false)
  const dialogType = ref<'directory' | 'menu'>('directory')
  const editData = ref<AppRouteRecord | any>(null)
  const lockMenuType = ref(false)
  const editingMenuDetail = ref<MenuTreeItem | null>(null)
  const defaultParentId = ref(0)
  const directoryOptions = ref<Api.SystemManage.DirectoryMenuItem[]>([])

  // 搜索相关
  const initialSearchState = {
    name: '',
    route: ''
  }

  const formFilters = reactive({ ...initialSearchState })
  const appliedFilters = reactive({ ...initialSearchState })

  const formItems = computed(() => [
    {
      label: '菜单名称',
      key: 'name',
      type: 'input',
      props: { clearable: true }
    },
    {
      label: '路由地址',
      key: 'route',
      type: 'input',
      props: { clearable: true }
    }
  ])

  onMounted(() => {
    loadDirectoryOptions()
    getMenuList()
  })

  function getDisplayMenuName(row: MenuTreeItem): string {
    const zh = (row.menuNameZh || '').trim()
    const en = (row.menuNameEn || '').trim()
    const fallback = (row.menuName || '').trim()
    const isEn = locale.value?.toLowerCase().startsWith('en')
    return isEn ? en || zh || fallback : zh || en || fallback
  }

  const loadDirectoryOptions = async (): Promise<void> => {
    try {
      const list = await fetchListDirectoryMenus()
      directoryOptions.value = Array.isArray(list) ? list : []
    } catch (error) {
      directoryOptions.value = []
      const msg =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
            ? error.message
            : '获取父级菜单失败'
      ElMessage.error(msg)
    }
  }

  /**
   * 获取菜单列表数据
   */
  const getMenuList = async (): Promise<void> => {
    loading.value = true

    try {
      const list = await fetchGetMenuTree()
      tableData.value = Array.isArray(list) ? list : []
    } catch (error) {
      tableData.value = []
      const msg =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
            ? error.message
            : '获取菜单失败'
      ElMessage.error(msg)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取菜单类型标签颜色
   * @param row 菜单行数据
   * @returns 标签颜色类型
   */
  const getMenuTypeTag = (
    row: MenuTreeItem
  ): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined => {
    if (row.children?.length) return 'primary'
    return row.type === 2 ? undefined : 'primary'
  }

  const getMenuTypeStyle = (row: MenuTreeItem) => {
    if (row.type !== 2 || row.children?.length) return undefined
    return {
      color: 'var(--art-menu-mgmt-type-menu-color)',
      backgroundColor: 'var(--art-menu-mgmt-type-menu-bg)',
      borderColor: 'var(--art-menu-mgmt-type-menu-border)'
    }
  }

  /**
   * 获取菜单类型文本（后端 type：1 目录 2 菜单）
   */
  const getMenuTypeText = (row: MenuTreeItem): string => {
    if (row.children?.length) return '目录'
    return row.type === 2 ? '菜单' : '目录'
  }

  // 表格列配置
  const { columnChecks, columns } = useTableColumns(() => [
    {
      prop: 'menuName',
      label: '菜单名称',
      minWidth: 100,
      width: 280,
      formatter: (row: MenuTreeItem) => formatMenuTitle(getDisplayMenuName(row) || '')
    },
    {
      prop: 'icon',
      label: '图标',
      width: 200,
      align: 'center',
      formatter: (row: MenuTreeItem) => {
        const icon = (row.icon || '').trim()
        if (!icon) return h('span', { class: 'text-g-400' }, '—')
        return h(ArtSvgIcon, { icon, class: 'text-xl text-g-700' })
      }
    },
    {
      prop: 'type',
      label: '菜单类型',
      formatter: (row: MenuTreeItem) => {
        return h(
          ElTag,
          {
            type: getMenuTypeTag(row),
            effect: row.type === 2 ? 'light' : undefined,
            style: getMenuTypeStyle(row)
          },
          () => getMenuTypeText(row)
        )
      }
    },
    {
      prop: 'path',
      label: '路由',
      formatter: (row: MenuTreeItem) => row.path || '—'
    },
    {
      prop: 'menuCode',
      label: '权限标识',
      formatter: (row: MenuTreeItem) => row.menuCode || '—'
    },
    {
      prop: 'sort',
      label: '排序',
      width: 100,
      formatter: (row: MenuTreeItem) => row.sort ?? '—'
    },
    {
      prop: 'status',
      label: '状态',
      formatter: (row: MenuTreeItem) =>
        h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
          row.status === 1 ? '启用' : '停用'
        )
    },
    {
      prop: 'operation',
      label: '操作',
      width: 180,
      align: 'right',
      formatter: (row: MenuTreeItem) => {
        const buttonStyle = { style: 'text-align: right' }

        return h('div', buttonStyle, [
          h(ArtButtonTable, {
            type: 'add',
            onClick: () => handleAddAuth(row),
            title: '新增下级'
          }),
          h(ArtButtonTable, {
            type: 'edit',
            onClick: () => handleEditMenu(row)
          }),
          h(ArtButtonTable, {
            type: 'delete',
            onClick: () => handleDeleteMenu(row)
          })
        ])
      }
    }
  ])

  // 数据相关（后端菜单树）
  const tableData = ref<MenuTreeItem[]>([])
  const menuNameMap = computed<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    const walk = (nodes: MenuTreeItem[]) => {
      nodes.forEach((n) => {
        map[n.id] = getDisplayMenuName(n)
        if (n.children?.length) walk(n.children)
      })
    }
    walk(tableData.value)
    return map
  })
  /**
   * 重置搜索条件
   */
  const handleReset = (): void => {
    Object.assign(formFilters, { ...initialSearchState })
    Object.assign(appliedFilters, { ...initialSearchState })
    getMenuList()
  }

  /**
   * 执行搜索
   */
  /** 仅本地按名称/路由筛选，不重复请求 getMenuTree */
  const handleSearch = (): void => {
    Object.assign(appliedFilters, { ...formFilters })
  }

  /**
   * 刷新菜单列表
   */
  const handleRefresh = (): void => {
    getMenuList()
  }

  /**
   * 搜索菜单（按名称、路由路径过滤树）
   */
  const searchMenu = (items: MenuTreeItem[]): MenuTreeItem[] => {
    const results: MenuTreeItem[] = []

    for (const item of items) {
      const searchName = appliedFilters.name?.toLowerCase().trim() || ''
      const searchRoute = appliedFilters.route?.toLowerCase().trim() || ''
      const menuTitle = getDisplayMenuName(item).toLowerCase()
      const menuPath = (item.path || '').toLowerCase()
      const nameMatch = !searchName || menuTitle.includes(searchName)
      const routeMatch = !searchRoute || menuPath.includes(searchRoute)

      if (item.children?.length) {
        const matchedChildren = searchMenu(item.children)
        if (matchedChildren.length > 0) {
          results.push({ ...item, children: matchedChildren })
          continue
        }
      }

      if (nameMatch && routeMatch) {
        results.push({ ...item })
      }
    }

    return results
  }

  const filteredTableData = computed(() => searchMenu(tableData.value))

  /** 将后端菜单节点转成菜单弹窗可识别的路由形态 */
  function mapMenuTreeToEditPayload(row: MenuTreeItem): AppRouteRecord {
    return {
      id: row.id,
      parentId: row.parentId,
      menuNameZh: row.menuNameZh,
      menuNameEn: row.menuNameEn,
      type: row.type,
      path: row.path,
      name: row.menuCode,
      meta: {
        title: getDisplayMenuName(row),
        icon: row.icon,
        sort: row.sort,
        isEnable: row.status === 1
      }
    } as AppRouteRecord
  }

  /**
   * 添加菜单
   */
  const handleAddMenu = (): void => {
    dialogType.value = 'directory'
    editData.value = null
    editingMenuDetail.value = null
    defaultParentId.value = 0
    lockMenuType.value = false
    dialogVisible.value = true
  }

  /**
   * 添加权限按钮
   */
  const handleAddAuth = (row: MenuTreeItem): void => {
    dialogType.value = 'directory'
    editData.value = null
    editingMenuDetail.value = null
    defaultParentId.value = Number(row.id || 0)
    lockMenuType.value = false
    dialogVisible.value = true
  }

  /**
   * 编辑菜单
   * @param row 菜单行数据
   */
  const handleEditMenu = async (row: MenuTreeItem): Promise<void> => {
    loading.value = true
    try {
      const detail = await fetchGetMenuDetail(row.id)
      editingMenuDetail.value = detail
      dialogType.value = Number(detail.type) === 2 ? 'menu' : 'directory'
      editData.value = mapMenuTreeToEditPayload(detail)
      lockMenuType.value = true
      dialogVisible.value = true
    } catch (error) {
      const msg =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
            ? error.message
            : '获取菜单详情失败'
      ElMessage.error(msg)
    } finally {
      loading.value = false
    }
  }

  /**
   * 菜单表单数据类型
   */
  interface MenuFormData {
    id?: number
    parentId?: number
    menuType?: 'directory' | 'menu'
    name: string
    nameEn?: string
    /** 权限标识 menuCode，可覆盖默认（与路由一致） */
    menuCode?: string
    label?: string
    path: string
    component?: string
    icon?: string
    isEnable?: boolean
    roles?: string[]
    sort?: number
    [key: string]: any
  }

  /**
   * 提交表单数据
   * @param formData 表单数据
   */
  const handleSubmit = async (formData: MenuFormData): Promise<void> => {
    const base = editingMenuDetail.value
    const fallbackMenuCode = (formData.path || formData.name || '').trim().replace(/\s+/g, '')
    const resolvedMenuCode = (formData.menuCode || '').trim() || base?.menuCode || fallbackMenuCode
    const resolvedMenuNameZh =
      (formData.name || '').trim() ||
      (base?.menuNameZh || '').trim() ||
      (base?.menuName || '').trim()
    const resolvedMenuNameEn = (formData.nameEn || '').trim() || (base?.menuNameEn || '').trim()
    const resolvedMenuName =
      resolvedMenuNameZh || resolvedMenuNameEn || (base?.menuName || '').trim()

    try {
      if (base && (formData.id ?? base.id)) {
        const payload: Api.SystemManage.UpdateMenuPayload = {
          id: formData.id ?? base.id,
          parentId: Number(formData.parentId ?? base.parentId ?? 0),
          menuName: resolvedMenuName,
          menuNameZh: resolvedMenuNameZh,
          menuNameEn: resolvedMenuNameEn,
          menuCode: resolvedMenuCode,
          icon: formData.icon ?? '',
          path: formData.path?.trim() || base.path,
          type: formData.menuType === 'menu' ? 2 : 1,
          status: formData.isEnable === false ? 0 : 1,
          sort: Number(formData.sort ?? base.sort ?? 1),
          children: base.children ?? []
        }
        await fetchUpdateMenu(payload)
        ElMessage.success('编辑成功')
      } else {
        const payload: Api.SystemManage.CreateMenuPayload = {
          parentId: Number(formData.parentId ?? 0),
          menuName: resolvedMenuName,
          menuNameZh: resolvedMenuNameZh,
          menuNameEn: resolvedMenuNameEn,
          menuCode: resolvedMenuCode,
          icon: formData.icon ?? '',
          path: (formData.path || '').trim(),
          type: formData.menuType === 'menu' ? 2 : 1,
          status: formData.isEnable === false ? 0 : 1,
          sort: Number(formData.sort ?? 1)
        }
        await fetchCreateMenu(payload)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      editingMenuDetail.value = null
      await getMenuList()
    } catch (error) {
      const msg =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
            ? error.message
            : '提交失败'
      ElMessage.error(msg)
    }
  }

  /**
   * 删除菜单
   */
  const handleDeleteMenu = async (row: MenuTreeItem): Promise<void> => {
    try {
      await ElMessageBox.confirm('确定要删除该菜单吗？删除后无法恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchDeleteMenu(row.id)
      ElMessage.success('删除成功')
      await getMenuList()
    } catch (error) {
      if (error !== 'cancel') {
        const msg =
          error instanceof HttpError
            ? error.message
            : error instanceof Error
              ? error.message
              : '删除失败'
        ElMessage.error(msg)
      }
    }
  }

  /**
   * 切换展开/收起所有菜单
   */
  const toggleExpand = (): void => {
    isExpanded.value = !isExpanded.value
    nextTick(() => {
      if (tableRef.value?.elTableRef && filteredTableData.value) {
        const processRows = (rows: MenuTreeItem[]) => {
          rows.forEach((row) => {
            if (row.children?.length) {
              tableRef.value.elTableRef.toggleRowExpansion(row, isExpanded.value)
              processRows(row.children)
            }
          })
        }
        processRows(filteredTableData.value)
      }
    })
  }
</script>

<style scoped lang="scss">
  /* 树表展开箭头：加大点击区域（Element Plus 默认箭头偏小） */
  .menu-manage-tree-table {
    :deep(.el-table__expand-icon) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      min-width: 32px;
      height: 32px;
      min-height: 32px;
      margin-right: 2px;
      border-radius: 6px;
      transition: background-color 0.15s ease;
    }

    :deep(.el-table__expand-icon:hover) {
      background-color: var(--art-hover-color);
    }

    /* 无子节点时的占位，与展开按钮同宽避免列错位 */
    :deep(.el-table__placeholder) {
      width: 32px;
      min-width: 32px;
    }
  }
</style>
