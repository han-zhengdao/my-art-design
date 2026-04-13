<!-- 用户管理页面 -->
<!-- art-full-height 自动计算出页面剩余高度 -->
<!-- art-table-card 一个符合系统样式的 class，同时自动撑满剩余高度 -->
<!-- 更多 useTable 使用示例请移步至 功能示例 下面的高级表格示例或者查看官方文档 -->
<!-- useTable 文档：https://www.artd.pro/docs/zh/guide/hooks/use-table.html -->
<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <UserSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams"></UserSearch>

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="showDialog('add')" v-ripple>新增用户</ElButton>
            <ElButton
              v-if="isSuperAdmin"
              type="danger"
              plain
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
            >
              批量删除
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <!-- 用户弹窗 -->
      <UserDialog
        v-model:visible="dialogVisible"
        :type="dialogType"
        :user-data="currentUserData"
        @submit="handleDialogSubmit"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import UserSearch from './modules/user-search.vue'
  import UserDialog from './modules/user-dialog.vue'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { DialogType } from '@/types'
  import { useUserStore } from '@/store/modules/user'
  import { fetchDeleteUser, fetchGetUserPageList } from '@/api/system-manage'

  defineOptions({ name: 'User' })

  type UserListItem = Api.SystemManage.UserListItem

  // 弹窗相关
  const dialogType = ref<DialogType>('add')
  const dialogVisible = ref(false)
  const currentUserData = ref<Partial<UserListItem>>({})

  // 选中行
  const selectedRows = ref<UserListItem[]>([])

  const userStore = useUserStore()
  const isSuperAdmin = computed(() => userStore.info.roles?.includes('R_SUPER') ?? false)

  // 搜索表单
  const searchForm = ref<Api.SystemManage.UserSearchParams>({
    nickName: undefined,
    email: undefined,
    phone: undefined,
    userType: undefined,
    roleId: undefined
  })

  /** 是否启用：0/4 为禁用，其余视为启用（接口未定时可按后端约定再改） */
  const isUserEnabled = (status?: string): boolean => {
    const s = String(status ?? '1').trim()
    return s !== '0' && s !== '4'
  }

  const getUserRoleLabel = (roles?: string[]): string => {
    if (!Array.isArray(roles) || roles.length === 0) return '-'
    const map: Record<string, string> = {
      R_SUPER: '系统超级管理员',
      R_ADMIN: '系统管理员',
      PARTNER_ADMIN: '合作商管理员',
      partner_admin: '合作商管理员',
      REGION_ADMIN: '区域管理员',
      region_admin: '区域管理员',
      STORE_ADMIN: '门店管理员',
      store_admin: '门店管理员',
      STORE_STAFF: '门店员工',
      store_staff: '门店员工'
    }
    const matched = roles
      .map((r) => map[r])
      .filter(Boolean)
      .join('、')
    return matched || '-'
  }

  /** 用户类型（字典 user_type），与搜索栏「用户类型」选项一致 */
  const getUserTypeLabel = (userType?: string): string => {
    if (!userType) return '--'
    const map: Record<string, string> = {
      SUPER: '平台超管',
      PARTNER: '合作商',
      REGION: '区域',
      STORE: '门店'
    }
    const key = userType.trim().toUpperCase()
    return map[key] || userType
  }

  const getLogoutDate = (row: UserListItem) => {
    // 仅对已注销用户展示注销日期（暂用 updateTime 占位），否则显示 --
    if (row.status !== '4') return '--'
    return row.updateTime || '--'
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    // 核心配置
    core: {
      apiFn: fetchGetUserPageList,
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      apiParams: {
        pageNum: 1,
        pageSize: 20,
        ...searchForm.value
      },
      // 自定义分页字段映射，未设置时将使用全局配置 tableConfig.ts 中的 paginationKey
      // paginationKey: {
      //   current: 'pageNum',
      //   size: 'pageSize'
      // },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 60, label: '序号' }, // 序号
        {
          prop: 'id',
          label: 'ID',
          width: 80
        },
        {
          prop: 'nickName',
          label: '昵称',
          width: 160
        },
        {
          prop: 'userEmail',
          label: '登录邮箱',
          minWidth: 200
        },
        {
          prop: 'userType',
          label: '用户类型',
          width: 120,
          formatter: (row: UserListItem) => getUserTypeLabel(row.userType)
        },
        {
          prop: 'userRoles',
          label: '对应角色',
          minWidth: 160,
          formatter: (row: UserListItem) => row.roleName || getUserRoleLabel(row.userRoles)
        },
        {
          prop: 'partnerName',
          label: '所属合作商',
          minWidth: 140,
          formatter: (row: UserListItem) => row.partnerName || '--'
        },
        {
          prop: 'regionName',
          label: '所属区域',
          minWidth: 140,
          formatter: (row: UserListItem) => row.regionName || '--'
        },
        {
          prop: 'storeName',
          label: '所属门店',
          minWidth: 140,
          formatter: (row: UserListItem) => row.storeName || '--'
        },
        {
          prop: 'assetName',
          label: '对应资产',
          minWidth: 200,
          formatter: (row: UserListItem) => row.assetName || '--'
        },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row: UserListItem) => {
            const enabled = isUserEnabled(row.status)
            if (!isSuperAdmin.value) {
              return h(ElTag, { type: enabled ? 'success' : 'info' }, () =>
                enabled ? '启用' : '禁用'
              )
            }
            return h(
              ElTag,
              {
                type: enabled ? 'success' : 'info',
                class: 'cursor-pointer select-none',
                onClick: (e: MouseEvent) => {
                  e.stopPropagation()
                  handleToggleUserStatus(row)
                }
              },
              () => (enabled ? '启用' : '禁用')
            )
          }
        },
        {
          prop: 'logoutTime',
          label: '注销日期',
          width: 180,
          sortable: true,
          formatter: (row: UserListItem) => getLogoutDate(row)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right', // 固定列
          formatter: (row) =>
            h(
              'div',
              [
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => showDialog('view', row)
                }),
                isSuperAdmin.value &&
                  h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => showDialog('edit', row)
                  }),
                isSuperAdmin.value &&
                  h(ArtButtonTable, {
                    type: 'delete',
                    onClick: () => deleteUser(row)
                  })
              ].filter(Boolean) as any
            )
        }
      ]
    },
    transform: {
      dataTransformer: (records) =>
        records.map((row) => {
          const r = row as UserListItem & {
            partner_name?: string
            region_name?: string
            store_name?: string
          }
          return {
            ...r,
            userEmail: r.userEmail || r.email,
            userPhone: r.userPhone || r.phone,
            userRoles: r.userRoles || (r.roleCode ? [r.roleCode] : []),
            userName: r.userName || r.email,
            partnerName: r.partnerName ?? r.partner_name,
            regionName: r.regionName ?? r.region_name,
            storeName: r.storeName ?? r.store_name
          }
        })
    }
  })

  /** 切换启用/禁用（暂无接口：仅更新当前列表行数据） */
  const handleToggleUserStatus = (row: UserListItem) => {
    if (!isSuperAdmin.value) {
      ElMessage.warning('仅平台超级管理员可修改用户状态')
      return
    }
    const enabled = isUserEnabled(row.status)
    const nextText = enabled ? '禁用' : '启用'
    const nextStatus = enabled ? '0' : '1'
    ElMessageBox.confirm(`确认将该用户状态改为「${nextText}」吗？`, '修改状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        row.status = nextStatus
        ElMessage.success(`已切换为「${nextText}」（本地生效，待接口对接）`)
      })
      .catch(() => {})
  }

  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: Api.SystemManage.UserSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  /**
   * 显示用户弹窗
   */
  const showDialog = (type: DialogType, row?: UserListItem): void => {
    dialogType.value = type
    currentUserData.value = row || {}
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  /**
   * 删除用户
   */
  const deleteUser = (row: UserListItem): void => {
    if (!isSuperAdmin.value) {
      ElMessage.warning('仅平台超级管理员可删除用户')
      return
    }

    ElMessageBox.confirm(`确定要永久删除该用户吗？`, '删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await fetchDeleteUser(row.id)
      ElMessage.success('删除成功')
      refreshData()
    })
  }

  const handleBatchDelete = (): void => {
    if (!isSuperAdmin.value) {
      ElMessage.warning('仅平台超级管理员可删除用户')
      return
    }
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要删除的用户')
      return
    }
    const ids = selectedRows.value.map((r) => r.id)
    ElMessageBox.confirm(`确定永久删除选中的 ${ids.length} 个用户吗？`, '批量删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await Promise.all(ids.map((id) => fetchDeleteUser(id)))
      ElMessage.success('删除成功')
      selectedRows.value = []
      refreshData()
    })
  }

  /**
   * 处理弹窗提交事件
   */
  const handleDialogSubmit = async () => {
    try {
      dialogVisible.value = false
      currentUserData.value = {}
      refreshData()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  /**
   * 处理表格行选择变化
   */
  const handleSelectionChange = (selection: UserListItem[]): void => {
    selectedRows.value = selection
  }
</script>

<style scoped lang="scss">
  /* 列总宽小于容器时仍铺满宽度，避免右侧留白、操作列与卡片右缘出现空隙 */
  .user-page {
    :deep(.art-table .el-table) {
      width: 100% !important;
    }
  }
</style>
