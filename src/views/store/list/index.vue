<template>
  <div class="store-list-page art-full-height">
    <StoreSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="canOperateStore" type="primary" @click="openDialog('add')" v-ripple>
              新增门店
            </ElButton>
            <ElButton
              v-if="canOperateStore"
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
      :country-code="searchForm.countryCode"
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
    updateStore,
    deleteStore,
    batchDeleteStores
  } from '@/api/store'
  import { useUserStore } from '@/store/modules/user'
  import StoreSearch from './modules/store-search.vue'
  import StoreDialog from './modules/store-dialog.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { computed, h, nextTick, ref } from 'vue'

  defineOptions({ name: 'StoreList' })

  type StoreItem = Api.Store.StoreListItem
  type DialogMode = 'add' | 'edit' | 'detail'

  const userStore = useUserStore()

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentRow = ref<StoreItem | null>(null)
  const selectedRows = ref<StoreItem[]>([])

  const searchForm = ref<Api.Store.StoreSearchParams>({
    storeName: undefined,
    countryCode: undefined,
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

  const ASSET_BLOCK_MSG =
    '该合作商下仍关联有效资产数据，不允许删除。请先清空其关联的 DC 余额、车轮及信标信息。'

  const openDialog = (mode: DialogMode, row?: StoreItem) => {
    dialogMode.value = mode
    currentRow.value = row ?? null
    nextTick(() => {
      dialogVisible.value = true
    })
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
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 'auto', minWidth: 60, label: '序号' },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 90 },
        { prop: 'userNickName', label: '用户昵称', width: 'auto', minWidth: 130 },
        { prop: 'loginEmail', label: '登录邮箱', width: 'auto', minWidth: 200 },
        { prop: 'storeName', label: '门店名称', width: 'auto', minWidth: 150 },
        { prop: 'storeAddress', label: '门店地址', width: 'auto', minWidth: 200 },
        { prop: 'contactName', label: '联系人', width: 'auto', minWidth: 100 },
        { prop: 'phone', label: '联系电话', width: 'auto', minWidth: 140 },
        { prop: 'regionName', label: '所属区域', width: 'auto', minWidth: 140 },
        { prop: 'partnerName', label: '所属合作商', width: 'auto', minWidth: 160 },
        { prop: 'country', label: '所属国家', width: 'auto', minWidth: 100 },
        {
          prop: 'mapProvider',
          label: '地图选择',
          width: 'auto',
          minWidth: 130,
          formatter: (row: StoreItem) => (row.mapProvider === 'GOOGLE' ? '谷歌地图' : '腾讯地图')
        },
        {
          prop: 'storeCoordinate',
          label: '门店坐标',
          width: 'auto',
          minWidth: 200,
          formatter: (row: StoreItem) => `${row.storeCoordinate.lng},${row.storeCoordinate.lat}`
        },
        {
          prop: 'geofence',
          label: '电子围栏',
          width: 'auto',
          minWidth: 200,
          formatter: (row: StoreItem) => row.geofence.map((p) => `${p.lng},${p.lat}`).join('; ')
        },
        { prop: 'timezone', label: '时区', width: 'auto', minWidth: 140 },
        { prop: 'dcBalance', label: 'DC余额', width: 'auto', minWidth: 90 },
        { prop: 'wheelCount', label: '车轮总数', width: 'auto', minWidth: 90 },
        { prop: 'beaconCount', label: '信标总数', width: 'auto', minWidth: 90 },
        { prop: 'pendingTicketCount', label: '未处理工单数', width: 'auto', minWidth: 120 },
        { prop: 'createTime', label: '创建时间', width: 'auto', minWidth: 170 },
        { prop: 'operatorName', label: '操作人', width: 'auto', minWidth: 110 },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right',
          formatter: (row: StoreItem) =>
            h(
              'div',
              [
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => openDialog('detail', row)
                }),
                canOperateStore.value &&
                  canManageStoreRow(row) &&
                  h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('edit', row)
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
      countryCode: undefined,
      partnerId: undefined,
      regionId: undefined
    }
    replaceSearchParams({ ...searchForm.value })
    getData()
  }

  const handleDelete = (row: StoreItem) => {
    if (!canManageStoreRow(row)) {
      ElMessage.warning('无权限删除该门店')
      return
    }
    if (hasStoreAssetData(row)) {
      ElMessage.warning(ASSET_BLOCK_MSG)
      return
    }
    ElMessageBox.confirm(`确定删除门店「${row.storeName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    }).then(async () => {
      await deleteStore(row.id)
      ElMessage.success('已删除')
      refreshData()
    })
  }

  const handleBatchDelete = () => {
    if (!canOperateStore.value) return
    const manageable = selectedRows.value.filter((r) => canManageStoreRow(r))
    const blocked = selectedRows.value.filter((r) => !canManageStoreRow(r))
    if (blocked.length) {
      ElMessage.warning(`有 ${blocked.length} 条记录无权限删除，已跳过`)
    }
    if (manageable.length === 0) {
      ElMessage.warning('没有可删除的记录')
      return
    }
    const withAsset = manageable.filter(hasStoreAssetData)
    if (withAsset.length > 0) {
      ElMessage.warning(ASSET_BLOCK_MSG)
      return
    }
    ElMessageBox.confirm(
      `确定批量删除选中的 ${manageable.length} 条门店吗？此操作不可恢复。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    ).then(async () => {
      await batchDeleteStores(manageable.map((r) => r.id))
      ElMessage.success('已批量删除')
      selectedRows.value = []
      refreshData()
    })
  }

  const handleDialogSubmit = async (
    payload: Partial<StoreItem> & {
      userNickName?: string
      loginEmail?: string
    }
  ) => {
    const operatorName = userStore.info.userName ?? '系统'
    try {
      if (dialogMode.value === 'add') {
        await createStore({
          storeName: payload.storeName!,
          storeAddress: payload.storeAddress!,
          contactName: payload.contactName!,
          phone: payload.phone!,
          regionId: payload.regionId,
          regionName: payload.regionName,
          partnerId: payload.partnerId!,
          partnerName: payload.partnerName!,
          country: payload.country!,
          countryCode: payload.countryCode!,
          mapProvider: payload.mapProvider!,
          storeCoordinate: payload.storeCoordinate!,
          geofence: payload.geofence!,
          timezone: payload.timezone!,
          operatorName,
          userNickName: payload.userNickName,
          loginEmail: payload.loginEmail
        })
        ElMessage.success('新增成功')
      } else if (dialogMode.value === 'edit' && payload.id != null) {
        await updateStore(payload.id, {
          storeName: payload.storeName,
          storeAddress: payload.storeAddress,
          contactName: payload.contactName,
          phone: payload.phone,
          regionId: payload.regionId,
          regionName: payload.regionName,
          partnerId: payload.partnerId,
          partnerName: payload.partnerName,
          country: payload.country,
          countryCode: payload.countryCode,
          mapProvider: payload.mapProvider,
          storeCoordinate: payload.storeCoordinate,
          geofence: payload.geofence,
          timezone: payload.timezone
        })
        ElMessage.success('保存成功')
      }
      refreshData()
    } catch (e) {
      console.error(e)
      ElMessage.error('操作失败')
    }
  }
</script>
