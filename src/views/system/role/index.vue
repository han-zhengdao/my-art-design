<!-- 角色管理页面 -->
<template>
  <div class="art-full-height">
    <RoleSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card mt-3">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElButton type="primary" @click="showDialog('add')" v-ripple>新增角色</ElButton>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>

    <!-- 角色编辑弹窗 -->
    <RoleEditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :role-data="currentRoleData"
      @success="refreshData"
    />

    <!-- 菜单权限弹窗 -->
    <RolePermissionDialog
      v-model="permissionDialog"
      :role-data="currentRoleData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDeleteRole, fetchGetRolePageList } from '@/api/system-manage'
  import RoleSearch from './modules/role-search.vue'
  import RoleEditDialog from './modules/role-edit-dialog.vue'
  import RolePermissionDialog from './modules/role-permission-dialog.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { LanguageEnum } from '@/enums/appEnum'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'Role' })

  type RoleListItem = Api.SystemManage.RoleListItem
  type RoleSearchFormParams = Api.SystemManage.RoleSearchParams

  const userStore = useUserStore()

  /** 角色类型：1 系统 2 用户（与字典 role_type 一致） */
  function normalizeRoleType(raw: unknown): number | undefined {
    if (raw == null || raw === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  function normalizeNumericId(raw: unknown): number | undefined {
    if (raw == null) return undefined
    if (typeof raw === 'string' && raw.trim() === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  function roleTypeShortLabel(roleType: number | undefined): string {
    if (roleType === 1) return userStore.language === LanguageEnum.EN ? 'System' : '系统'
    if (roleType === 2) return userStore.language === LanguageEnum.EN ? 'User' : '用户'
    return '—'
  }

  function roleTypeTagType(
    roleType: number | undefined
  ): 'primary' | 'success' | 'warning' | 'info' {
    if (roleType === 1) return 'primary'
    if (roleType === 2) return 'success'
    return 'info'
  }

  // 搜索表单
  const searchForm = ref<RoleSearchFormParams>({
    roleName: undefined,
    roleCode: undefined,
    roleType: undefined
  })

  const dialogVisible = ref(false)
  const permissionDialog = ref(false)
  const currentRoleData = ref<RoleListItem | undefined>(undefined)

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
      apiFn: fetchGetRolePageList,
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      apiParams: {
        pageNum: 1,
        pageSize: 20
      },
      columnsFactory: () => [
        {
          prop: 'roleId',
          label: '角色ID',
          width: 180
        },
        {
          prop: 'roleName',
          label: '角色名称',
          minWidth: 300
        },
        {
          prop: 'roleCode',
          label: '角色编码',
          minWidth: 300
        },
        {
          prop: 'roleType',
          label: '角色类型',
          minWidth: 200,
          formatter: (row) => {
            const t = normalizeRoleType(row.roleType)
            return h(ElTag, { type: roleTypeTagType(t), size: 'small' }, () =>
              roleTypeShortLabel(t)
            )
          }
        },
        {
          prop: 'operation',
          label: '操作',
          minWidth: 280,
          fixed: 'right',
          align: 'left',
          headerAlign: 'left',
          formatter: (row) =>
            h('div', { class: 'flex w-full min-w-0 flex-wrap items-center justify-start gap-2' }, [
              h(
                ElButton,
                {
                  link: true,
                  type: 'primary',
                  class: 'role-table-op-link',
                  onClick: () => showPermissionDialog(row)
                },
                () =>
                  h('span', { class: 'inline-flex items-center gap-1' }, [
                    h(ArtSvgIcon, { icon: 'ri:shield-keyhole-line', class: 'shrink-0 text-base' }),
                    '分配权限'
                  ])
              ),
              h(
                ElButton,
                {
                  link: true,
                  type: 'primary',
                  class: 'role-table-op-link',
                  onClick: () => showDialog('edit', row)
                },
                () =>
                  h('span', { class: 'inline-flex items-center gap-1' }, [
                    h(ArtSvgIcon, { icon: 'ri:pencil-line', class: 'shrink-0 text-base' }),
                    '编辑角色'
                  ])
              ),
              h(
                ElButton,
                {
                  link: true,
                  type: 'danger',
                  class: 'role-table-op-link',
                  onClick: () => deleteRole(row)
                },
                () =>
                  h('span', { class: 'inline-flex items-center gap-1' }, [
                    h(ArtSvgIcon, { icon: 'ri:delete-bin-line', class: 'shrink-0 text-base' }),
                    '删除角色'
                  ])
              )
            ])
        }
      ]
    },
    transform: {
      dataTransformer: (records) =>
        records.map((row) => {
          const r = row as RoleListItem & {
            id?: number
            role_id?: number
            roleType?: number
            role_type?: number
          }
          const rid = normalizeNumericId(r.roleId ?? r.id ?? r.role_id)
          const rt = normalizeRoleType(r.roleType ?? r.role_type)
          return {
            ...r,
            ...(rid != null && !Number.isNaN(rid) ? { roleId: rid } : {}),
            ...(rt != null ? { roleType: rt } : {})
          } as RoleListItem
        })
    }
  })

  const dialogType = ref<'add' | 'edit'>('add')

  const showDialog = (type: 'add' | 'edit', row?: RoleListItem) => {
    dialogVisible.value = true
    dialogType.value = type
    currentRoleData.value = row
  }

  /**
   * 搜索处理
   * @param params 搜索参数
   */
  const handleSearch = (params: RoleSearchFormParams) => {
    replaceSearchParams({ ...params })
    getData()
  }

  const showPermissionDialog = (row?: RoleListItem) => {
    permissionDialog.value = true
    currentRoleData.value = row
  }

  const deleteRole = (row: RoleListItem) => {
    ElMessageBox.confirm(`确定删除角色「${row.roleName}」吗？此操作不可恢复。`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteRole(row.roleId)
        ElMessage.success('删除成功')
        refreshData()
      })
      .catch(() => {
        ElMessage.info('已取消删除')
      })
  }
</script>

<style scoped lang="scss">
  /* 表格内操作链接：hover 时略加深主色/危险色（与 EP 色阶一致） */
  .art-table-card :deep(.role-table-op-link.is-link) {
    transition: color 0.15s ease;
  }

  .art-table-card :deep(.role-table-op-link.is-link.el-button--primary:hover) {
    color: var(--el-color-primary-dark-2);
  }

  .art-table-card :deep(.role-table-op-link.is-link.el-button--danger:hover) {
    color: var(--el-color-danger-dark-2);
  }
</style>
