<template>
  <div class="store-list-page art-full-height">
    <StoreSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="canOperateStore" type="primary" @click="openDialog('add')" v-ripple>
              {{ t('storePage.button.add') }}
            </ElButton>
            <ElButton
              v-if="canOperateStore"
              type="danger"
              plain
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
            >
              {{ t('storePage.button.batchDelete') }}
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <StoreDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :row="currentRow"
      :is-super-admin="isSuperAdmin"
      :locked-partner-id="lockedPartnerId"
      :locked-region-id="lockedRegionId"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchStoreList,
    createStore,
    getStoreDetail,
    updateStore,
    deleteStore,
    batchDeleteStores
  } from '@/api/store'
  import { useUserStore } from '@/store/modules/user'
  import StoreSearch from './modules/store-search.vue'
  import StoreDialog from './modules/store-dialog.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { computed, h, nextTick, ref } from 'vue'

  defineOptions({ name: 'StoreList' })

  type StoreItem = Api.Store.StoreListItem
  type DialogMode = 'add' | 'edit' | 'detail'

  const userStore = useUserStore()
  const { t } = useI18n()

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentRow = ref<StoreItem | null>(null)
  const selectedRows = ref<StoreItem[]>([])

  const searchForm = ref<Api.Store.StoreSearchParams>({
    storeName: undefined,
    countryId: undefined,
    partnerId: undefined,
    regionId: undefined
  })

  /**
   * 可进入门店操作区（新增/批量删除等）：超管、合作商管理员、区域管理员
   * 行级数据权限见 canManageStoreRow
   */
  const canOperateStore = computed(() => {
    const roles = userStore.info.roles ?? []
    return (
      roles.includes('R_SUPER') || roles.includes('PARTNER_ADMIN') || roles.includes('REGION_ADMIN')
    )
  })

  const isSuperAdmin = computed(() => {
    const roles = userStore.info.roles ?? []
    return roles.includes('R_SUPER')
  })

  const lockedPartnerId = computed(() => {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return undefined
    if (
      (roles.includes('PARTNER_ADMIN') || roles.includes('REGION_ADMIN')) &&
      userStore.info.partnerId != null
    ) {
      return userStore.info.partnerId
    }
    return undefined
  })

  /** 区域管理员新增门店时锁定所属区域 */
  const lockedRegionId = computed(() => {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return undefined
    if (roles.includes('REGION_ADMIN') && userStore.info.regionId != null) {
      return userStore.info.regionId
    }
    return undefined
  })

  /**
   * 有区域：仅超管或该区域管理员可管；
   * 无区域：仅超管或该合作商管理员可管。
   */
  function canManageStoreRow(row: StoreItem): boolean {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return true
    const hasRegion = row.regionId != null
    if (hasRegion) {
      if (!roles.includes('REGION_ADMIN')) return false
      return userStore.info.regionId === row.regionId
    }
    if (!roles.includes('PARTNER_ADMIN')) return false
    const scoped = userStore.info.partnerId
    if (scoped == null) return true
    return scoped === row.partnerId
  }

  const hasStoreAssetData = (row: StoreItem) =>
    (row.dcBalance ?? 0) !== 0 || (row.wheelCount ?? 0) !== 0 || (row.beaconCount ?? 0) !== 0

  const ASSET_BLOCK_MSG = computed(() => t('storePage.messages.assetBlocked'))

  const openDialog = async (mode: DialogMode, row?: StoreItem) => {
    dialogMode.value = mode
    if (mode === 'add') {
      currentRow.value = null
      nextTick(() => {
        dialogVisible.value = true
      })
      return
    }
    if (!row) return
    try {
      const detail = await getStoreDetail(row.id)
      currentRow.value = {
        ...row,
        ...detail,
        loginEmail: detail.loginEmail ?? row.loginEmail,
        country: detail.country || row.country,
        countryCode: detail.countryCode || row.countryCode,
        timezone: detail.timezone || row.timezone,
        createTime: detail.createTime || row.createTime,
        operatorName: detail.operatorName || row.operatorName
      }
      nextTick(() => {
        dialogVisible.value = true
      })
    } catch (error) {
      console.error(error)
      ElMessage.error(
        mode === 'edit'
          ? t('storePage.messages.loadEditFailed')
          : t('storePage.messages.loadDetailFailed')
      )
    }
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      immediate: true,
      apiFn: fetchStoreList,
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      apiParams: {
        pageNum: 1,
        pageSize: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 'auto', minWidth: 60, label: t('storePage.column.index') },
        { prop: 'id', label: t('storePage.column.id'), width: 'auto', minWidth: 90 },
        {
          prop: 'loginEmail',
          label: t('storePage.column.loginEmail'),
          width: 'auto',
          minWidth: 200
        },
        { prop: 'storeName', label: t('storePage.column.storeName'), width: 'auto', minWidth: 150 },
        {
          prop: 'storeAddress',
          label: t('storePage.column.storeAddress'),
          width: 'auto',
          minWidth: 200
        },
        {
          prop: 'contactName',
          label: t('storePage.column.contactName'),
          width: 'auto',
          minWidth: 100
        },
        { prop: 'phone', label: t('storePage.column.phone'), width: 'auto', minWidth: 140 },
        {
          prop: 'regionName',
          label: t('storePage.column.regionName'),
          width: 'auto',
          minWidth: 140
        },
        {
          prop: 'partnerName',
          label: t('storePage.column.partnerName'),
          width: 'auto',
          minWidth: 160
        },
        { prop: 'country', label: t('storePage.column.country'), width: 'auto', minWidth: 100 },
        {
          prop: 'mapProvider',
          label: t('storePage.column.mapProvider'),
          width: 'auto',
          minWidth: 130,
          formatter: (row: StoreItem) =>
            row.mapProvider === 'GOOGLE' ? t('storePage.map.google') : t('storePage.map.tencent')
        },
        {
          prop: 'storeCoordinate',
          label: t('storePage.column.storeCoordinate'),
          width: 'auto',
          minWidth: 200,
          formatter: (row: StoreItem) => `${row.storeCoordinate.lng},${row.storeCoordinate.lat}`
        },
        {
          prop: 'geofence',
          label: t('storePage.column.geofence'),
          width: 'auto',
          minWidth: 200,
          formatter: (row: StoreItem) => row.geofence.map((p) => `${p.lng},${p.lat}`).join('; ')
        },
        { prop: 'timezone', label: t('storePage.column.timezone'), width: 'auto', minWidth: 140 },
        { prop: 'dcBalance', label: t('storePage.column.dcBalance'), width: 'auto', minWidth: 90 },
        {
          prop: 'wheelCount',
          label: t('storePage.column.wheelCount'),
          width: 'auto',
          minWidth: 90
        },
        {
          prop: 'beaconCount',
          label: t('storePage.column.beaconCount'),
          width: 'auto',
          minWidth: 90
        },
        {
          prop: 'pendingTicketCount',
          label: t('storePage.column.pendingTicketCount'),
          width: 'auto',
          minWidth: 120
        },
        {
          prop: 'createTime',
          label: t('storePage.column.createTime'),
          width: 'auto',
          minWidth: 170
        },
        {
          prop: 'operatorName',
          label: t('storePage.column.operatorName'),
          width: 'auto',
          minWidth: 110
        },
        {
          prop: 'operation',
          label: t('storePage.column.operation'),
          width: 160,
          fixed: 'right',
          formatter: (row: StoreItem) =>
            h(
              'div',
              [
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => void openDialog('detail', row)
                }),
                canOperateStore.value &&
                  canManageStoreRow(row) &&
                  h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => void openDialog('edit', row)
                  }),
                canOperateStore.value &&
                  canManageStoreRow(row) &&
                  h(ArtButtonTable, {
                    type: 'delete',
                    onClick: () => handleDelete(row)
                  })
              ].filter(Boolean) as any
            )
        }
      ]
    }
  })

  const handleSelectionChange = (selection: StoreItem[]) => {
    selectedRows.value = selection
  }

  const handleSearch = (params: Api.Store.StoreSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  const handleReset = () => {
    searchForm.value = {
      storeName: undefined,
      countryId: undefined,
      partnerId: undefined,
      regionId: undefined
    }
    replaceSearchParams({ ...searchForm.value })
    getData()
  }

  const handleDelete = (row: StoreItem) => {
    if (!canManageStoreRow(row)) {
      ElMessage.warning(t('storePage.messages.deleteNoPermission'))
      return
    }
    if (hasStoreAssetData(row)) {
      ElMessage.warning(ASSET_BLOCK_MSG.value)
      return
    }
    ElMessageBox.confirm(
      t('storePage.messages.deleteConfirm', { name: row.storeName }),
      t('storePage.messages.deleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('storePage.messages.btnDelete'),
        cancelButtonText: t('storePage.dialog.footerCancel')
      }
    ).then(async () => {
      await deleteStore(row.id)
      ElMessage.success(t('storePage.messages.deleted'))
      refreshData()
    })
  }

  const handleBatchDelete = () => {
    if (!canOperateStore.value) return
    const manageable = selectedRows.value.filter((r) => canManageStoreRow(r))
    const blocked = selectedRows.value.filter((r) => !canManageStoreRow(r))
    if (blocked.length) {
      ElMessage.warning(t('storePage.messages.batchNoPermissionSkipped', { count: blocked.length }))
    }
    if (manageable.length === 0) {
      ElMessage.warning(t('storePage.messages.batchNoDeletable'))
      return
    }
    const withAsset = manageable.filter(hasStoreAssetData)
    if (withAsset.length > 0) {
      ElMessage.warning(ASSET_BLOCK_MSG.value)
      return
    }
    ElMessageBox.confirm(
      t('storePage.messages.batchDeleteConfirm', { count: manageable.length }),
      t('storePage.messages.batchDeleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('storePage.messages.btnDelete'),
        cancelButtonText: t('storePage.dialog.footerCancel')
      }
    ).then(async () => {
      await batchDeleteStores(manageable.map((r) => r.id))
      ElMessage.success(t('storePage.messages.batchDeleted'))
      selectedRows.value = []
      refreshData()
    })
  }

  const handleDialogSubmit = async (
    payload: Partial<StoreItem> & {
      loginEmail?: string
      loginPassword?: string
    }
  ) => {
    try {
      if (dialogMode.value === 'add') {
        await createStore({
          storeName: payload.storeName!,
          partnerId: payload.partnerId!,
          email: payload.loginEmail!,
          password: payload.loginPassword!,
          regionId: payload.regionId,
          contact: payload.contactName,
          phone: payload.phone,
          address: payload.storeAddress,
          lat: payload.storeCoordinate ? String(payload.storeCoordinate.lat) : undefined,
          lng: payload.storeCoordinate ? String(payload.storeCoordinate.lng) : undefined,
          fenceData: Array.isArray(payload.geofence) ? JSON.stringify(payload.geofence) : undefined,
          mapType: payload.mapProvider === 'GOOGLE' ? 1 : 2
        })
        ElMessage.success(t('storePage.messages.addSuccess'))
      } else if (dialogMode.value === 'edit' && payload.id != null) {
        await updateStore({
          id: payload.id,
          storeName: payload.storeName!,
          contact: payload.contactName,
          phone: payload.phone,
          address: payload.storeAddress,
          lat: payload.storeCoordinate ? String(payload.storeCoordinate.lat) : undefined,
          lng: payload.storeCoordinate ? String(payload.storeCoordinate.lng) : undefined,
          fenceData: Array.isArray(payload.geofence) ? JSON.stringify(payload.geofence) : undefined,
          mapType: payload.mapProvider === 'GOOGLE' ? 1 : 2
        })
        ElMessage.success(t('storePage.messages.saveSuccess'))
      }
      refreshData()
    } catch (e) {
      console.error(e)
      ElMessage.error(t('storePage.messages.operationFailed'))
    }
  }
</script>
