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
            <ElButton type="primary" @click="showDialog('add')" v-ripple>{{
              t('systemUser.actions.addUser')
            }}</ElButton>
            <ElButton
              v-if="isSuperAdmin"
              type="danger"
              plain
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
            >
              {{ t('systemUser.actions.batchDelete') }}
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
  import { useI18n } from 'vue-i18n'
  import { watch } from 'vue'

  defineOptions({ name: 'User' })

  const { t, locale } = useI18n()

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
    userType: undefined,
    roleId: undefined,
    partnerId: undefined,
    regionId: undefined,
    storeId: undefined
  })

  /** 是否启用：0/4 为禁用，其余视为启用（接口未定时可按后端约定再改） */
  const isUserEnabled = (status?: string): boolean => {
    const s = String(status ?? '1').trim()
    return s !== '0' && s !== '4'
  }

  const getUserRoleLabel = (roles?: string[]): string => {
    if (!Array.isArray(roles) || roles.length === 0) return '-'
    const sep = t('systemUser.listSeparator')
    const matched = roles.map((r) => {
      const i18nKey = `systemUser.roles.${r}`
      const label = t(i18nKey)
      return label === i18nKey ? r : label
    })
    return matched.length ? matched.join(sep) : '-'
  }

  /** 用户类型（字典 user_type），与搜索栏「用户类型」选项一致 */
  const getUserTypeLabel = (userType?: string): string => {
    if (!userType) return '--'
    const key = userType.trim().toUpperCase()
    const i18nKey = `systemUser.userTypes.${key}` as const
    const label = t(i18nKey)
    if (label === i18nKey) return userType
    return label
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
    refreshData,
    resetColumns
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
        { type: 'index', width: 60, label: t('systemUser.table.index') },
        {
          prop: 'id',
          label: t('systemUser.table.id'),
          width: 80
        },
        {
          prop: 'nickName',
          label: t('systemUser.table.nickName'),
          width: 160
        },
        {
          prop: 'userEmail',
          label: t('systemUser.table.userEmail'),
          minWidth: 200
        },
        {
          prop: 'userType',
          label: t('systemUser.table.userType'),
          width: 120,
          formatter: (row: UserListItem) => getUserTypeLabel(row.userType)
        },
        {
          prop: 'userRoles',
          label: t('systemUser.table.userRoles'),
          minWidth: 160,
          formatter: (row: UserListItem) => row.roleName || getUserRoleLabel(row.userRoles)
        },
        {
          prop: 'partnerName',
          label: t('systemUser.table.partnerName'),
          minWidth: 140,
          formatter: (row: UserListItem) => row.partnerName || '--'
        },
        {
          prop: 'regionName',
          label: t('systemUser.table.regionName'),
          minWidth: 140,
          formatter: (row: UserListItem) => row.regionName || '--'
        },
        {
          prop: 'storeName',
          label: t('systemUser.table.storeName'),
          minWidth: 140,
          formatter: (row: UserListItem) => row.storeName || '--'
        },
        {
          prop: 'status',
          label: t('systemUser.table.status'),
          width: 120,
          formatter: (row: UserListItem) => {
            const enabled = isUserEnabled(row.status)
            const statusLabel = enabled
              ? t('systemUser.status.enabled')
              : t('systemUser.status.disabled')
            if (!isSuperAdmin.value) {
              return h(ElTag, { type: enabled ? 'success' : 'info' }, () => statusLabel)
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
              () => statusLabel
            )
          }
        },
        {
          prop: 'operation',
          label: t('systemUser.table.operation'),
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

  watch(locale, () => {
    resetColumns?.()
  })

  /** 切换启用/禁用（暂无接口：仅更新当前列表行数据） */
  const handleToggleUserStatus = (row: UserListItem) => {
    if (!isSuperAdmin.value) {
      ElMessage.warning(t('systemUser.messages.onlySuperChangeStatus'))
      return
    }
    const enabled = isUserEnabled(row.status)
    const nextTargetLabel = enabled
      ? t('systemUser.status.disabled')
      : t('systemUser.status.enabled')
    const nextStatus = enabled ? '0' : '1'
    ElMessageBox.confirm(
      t('systemUser.messages.toggleStatusConfirm', { status: nextTargetLabel }),
      t('systemUser.confirm.changeStatusTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
      .then(() => {
        row.status = nextStatus
        ElMessage.success(t('systemUser.messages.toggleStatusSuccess', { status: nextTargetLabel }))
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
      ElMessage.warning(t('systemUser.messages.onlySuperDelete'))
      return
    }

    ElMessageBox.confirm(
      t('systemUser.confirm.deleteUserBody'),
      t('systemUser.confirm.deleteUserTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    ).then(async () => {
      await fetchDeleteUser(row.id)
      ElMessage.success(t('systemUser.messages.deleteSuccess'))
      refreshData()
    })
  }

  const handleBatchDelete = (): void => {
    if (!isSuperAdmin.value) {
      ElMessage.warning(t('systemUser.messages.onlySuperDelete'))
      return
    }
    if (selectedRows.value.length === 0) {
      ElMessage.warning(t('systemUser.messages.selectUsersFirst'))
      return
    }
    const ids = selectedRows.value.map((r) => r.id)
    ElMessageBox.confirm(
      t('systemUser.confirm.batchDeleteBody', { count: ids.length }),
      t('systemUser.confirm.batchDeleteTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    ).then(async () => {
      await Promise.all(ids.map((id) => fetchDeleteUser(id)))
      ElMessage.success(t('systemUser.messages.deleteSuccess'))
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
