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
  import { fetchGetUserPageList } from '@/api/system-manage'
  import { deleteMockUsersByIds } from '@/api/user-mock'

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

  // 用户状态配置（仅展示 正常 / 注销）
  const USER_STATUS_CONFIG = {
    normal: { type: 'success' as const, text: '正常' },
    disabled: { type: 'danger' as const, text: '注销' }
  } as const

  /**
   * 获取用户状态配置
   */
  const getUserStatusConfig = (status?: string) => {
    const key = status === '4' ? 'disabled' : 'normal'
    return USER_STATUS_CONFIG[key]
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

  const getLogoutDate = (row: UserListItem) => {
    // 仅对已注销用户展示注销日期（暂用 updateTime 占位），否则显示 --
    if (row.status !== '4') return '--'
    return row.updateTime || '--'
  }

  /** 与单条删除一致：返回 null 表示允许删除，否则为拦截原因 */
  const getUserDeleteBlockReason = (row: UserListItem): string | null => {
    if (row.status !== '4') return '仅已注销的用户可删除'
    const logoutStr = getLogoutDate(row)
    if (!logoutStr) {
      return '缺少注销日期，无法删除'
    }
    const logoutTime = new Date(logoutStr).getTime()
    if (Number.isNaN(logoutTime)) {
      return '注销日期格式不正确，无法删除'
    }
    const now = Date.now()
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    if (now - logoutTime < oneYearMs) {
      return '用户注销未满一年，暂不允许删除'
    }
    return null
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
          width: 220
        },
        {
          prop: 'password',
          label: '登录密码',
          width: 140,
          formatter: () => '******'
        },
        {
          prop: 'userRoles',
          label: '对应角色',
          width: 200,
          formatter: (row: UserListItem) => row.roleName || getUserRoleLabel(row.userRoles)
        },
        {
          prop: 'assetName',
          label: '对应资产',
          width: 220,
          formatter: (row: UserListItem) => row.assetName || '--'
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row) => {
            const statusConfig = getUserStatusConfig(row.status)
            return h(ElTag, { type: statusConfig.type }, () => statusConfig.text)
          }
        },
        {
          prop: 'createTime',
          label: '创建时间',
          sortable: true,
          width: 180
        },
        {
          prop: 'createBy',
          label: '操作人',
          width: 120
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
        records.map((row) => ({
          ...row,
          userEmail: row.userEmail || row.email,
          userPhone: row.userPhone || row.phone,
          userRoles: row.userRoles || (row.roleCode ? [row.roleCode] : []),
          userName: row.userName || row.email
        }))
    }
  })

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
    const reason = getUserDeleteBlockReason(row)
    if (reason) {
      ElMessage.warning(reason)
      return
    }

    ElMessageBox.confirm(`确定要永久删除该用户吗？`, '删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      deleteMockUsersByIds([row.id])
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
    // 与单条删除规则一致：选中项须全部为「已注销满一年」等可删状态，否则整批不允许删除
    for (const row of selectedRows.value) {
      if (getUserDeleteBlockReason(row)) {
        ElMessage.warning('用户未注销或注销未满一年不允许删除')
        return
      }
    }
    const ids = selectedRows.value.map((r) => r.id)
    ElMessageBox.confirm(`确定永久删除选中的 ${ids.length} 个用户吗？`, '批量删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      deleteMockUsersByIds(ids)
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
