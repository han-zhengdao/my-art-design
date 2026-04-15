<!-- 信标管理 -->
<template>
  <div class="beacon-list-page art-full-height">
    <BeaconSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="canOperateBeacon" type="primary" @click="openDialog('add')" v-ripple>
              新增信标
            </ElButton>
            <ElButton
              v-if="canOperateBeacon"
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

    <BeaconDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :row="currentRow"
      :country-code="searchForm.countryCode"
      :filter-partner-id="searchForm.partnerId"
      :filter-region-id="searchForm.regionId"
      :filter-store-id="searchForm.storeId"
      :locked-store-id="lockedStoreId"
      :locked-partner-id="lockedPartnerId"
      @submit="handleDialogSubmit"
      @batch-submit="handleBatchSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import BeaconSearch from './modules/beacon-search.vue'
  import BeaconDialog from './modules/beacon-dialog.vue'
  import {
    fetchBeaconList,
    createBeacon,
    updateBeacon,
    deleteBeacon,
    batchDeleteBeacons,
    batchCreateBeacons
  } from '@/api/beacon'
  import { useUserStore } from '@/store/modules/user'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { computed, h, nextTick, ref } from 'vue'

  defineOptions({ name: 'BeaconList' })

  type BeaconItem = Api.Beacon.BeaconListItem
  type DialogMode = 'add' | 'edit' | 'detail'

  const userStore = useUserStore()

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentRow = ref<BeaconItem | null>(null)
  const selectedRows = ref<BeaconItem[]>([])

  const searchForm = ref<Api.Beacon.BeaconSearchParams>({
    beaconMac: undefined,
    countryCode: undefined,
    partnerId: undefined,
    regionId: undefined,
    storeId: undefined
  })

  /** 平台超级管理员或门店管理员（可管理信标） */
  const canOperateBeacon = computed(() => {
    const roles = userStore.info.roles ?? []
    return roles.includes('R_SUPER') || roles.includes('STORE_ADMIN')
  })

  const lockedStoreId = computed(() => {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return undefined
    if (roles.includes('STORE_ADMIN') && userStore.info.storeId != null)
      return userStore.info.storeId
    return undefined
  })

  const lockedPartnerId = computed(() => {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return undefined
    if (roles.includes('STORE_ADMIN') && userStore.info.partnerId != null)
      return userStore.info.partnerId
    return undefined
  })

  function canManageBeaconRow(row: BeaconItem): boolean {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return true
    if (!roles.includes('STORE_ADMIN')) return false

    if (userStore.info.storeId != null) return row.storeId === userStore.info.storeId
    if (userStore.info.partnerId != null) return row.partnerId === userStore.info.partnerId
    return false
  }

  const openDialog = (mode: DialogMode, row?: BeaconItem) => {
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
    refreshData,
    getData,
    replaceSearchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      immediate: true,
      apiFn: fetchBeaconList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 'auto', minWidth: 60, label: '序号' },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 90 },
        { prop: 'beaconMac', label: '信标 MAC', width: 'auto', minWidth: 180 },
        { prop: 'regionCode', label: '区域编号', width: 'auto', minWidth: 140 },
        {
          prop: 'gpsCoordinate',
          label: 'GPS 坐标',
          width: 'auto',
          minWidth: 180,
          formatter: (row: BeaconItem) => `${row.gpsCoordinate.lng},${row.gpsCoordinate.lat}`
        },
        { prop: 'storeName', label: '所属门店', width: 'auto', minWidth: 160 },
        { prop: 'regionName', label: '所属区域', width: 'auto', minWidth: 140 },
        { prop: 'partnerName', label: '所属合作商', width: 'auto', minWidth: 160 },
        { prop: 'country', label: '所属国家', width: 'auto', minWidth: 140 },
        { prop: 'createTime', label: '创建时间', width: 'auto', minWidth: 170 },
        { prop: 'operatorName', label: '操作人', width: 'auto', minWidth: 110 },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right',
          formatter: (row: BeaconItem) =>
            h(
              'div',
              [
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => openDialog('detail', row)
                }),
                canOperateBeacon.value &&
                  canManageBeaconRow(row) &&
                  h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('edit', row)
                  }),
                canOperateBeacon.value &&
                  canManageBeaconRow(row) &&
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

  const handleSelectionChange = (selection: BeaconItem[]) => {
    selectedRows.value = selection
  }

  const handleSearch = (params: Api.Beacon.BeaconSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  const handleReset = () => {
    searchForm.value = {
      beaconMac: undefined,
      countryCode: undefined,
      partnerId: undefined,
      regionId: undefined,
      storeId: undefined
    }
    replaceSearchParams({
      beaconMac: undefined,
      countryCode: undefined,
      partnerId: undefined,
      regionId: undefined,
      storeId: undefined
    })
    getData()
  }

  const handleDelete = (row: BeaconItem) => {
    if (!canManageBeaconRow(row)) {
      ElMessage.warning('无权限删除该信标')
      return
    }
    ElMessageBox.confirm(`确定删除信标「${row.beaconMac}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    }).then(async () => {
      await deleteBeacon(row.id)
      ElMessage.success('已删除')
      refreshData()
    })
  }

  const handleBatchDelete = () => {
    if (!canOperateBeacon.value) return

    const manageable = selectedRows.value.filter((r) => canManageBeaconRow(r))
    const blocked = selectedRows.value.filter((r) => !canManageBeaconRow(r))

    if (blocked.length) {
      ElMessage.warning(`有 ${blocked.length} 条记录无权限删除，已跳过`)
    }
    if (manageable.length === 0) {
      ElMessage.warning('没有可删除的记录')
      return
    }

    ElMessageBox.confirm(
      `确定批量删除选中的 ${manageable.length} 条信标吗？此操作不可恢复。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    ).then(async () => {
      await batchDeleteBeacons(manageable.map((r) => r.id))
      ElMessage.success('已批量删除')
      selectedRows.value = []
      refreshData()
    })
  }

  const handleBatchSubmit = async (
    payloads: Array<Omit<Parameters<typeof createBeacon>[0], 'operatorName'>>
  ) => {
    const operatorName = userStore.info.userName ?? '系统'
    try {
      const { created, skipped } = await batchCreateBeacons(payloads, operatorName)
      let msg = `成功导入 ${created.length} 条`
      if (skipped.length) {
        msg += `；跳过 ${skipped.length} 条（${skipped.map((s) => `${s.beaconMac}: ${s.reason}`).join('；')}）`
      }
      ElMessage.success(msg)
      dialogVisible.value = false
      refreshData()
    } catch (e) {
      console.error(e)
      ElMessage.error('批量导入失败')
    }
  }

  const handleDialogSubmit = async (payload: Partial<BeaconItem> & { id?: number }) => {
    const operatorName = userStore.info.userName ?? '系统'
    try {
      if (dialogMode.value === 'add') {
        await createBeacon({
          beaconMac: payload.beaconMac as string,
          regionCode: payload.regionCode as string,
          gpsCoordinate: payload.gpsCoordinate as Api.Store.GeoPoint,
          storeId: payload.storeId as number,
          storeName: payload.storeName as string,
          regionId: payload.regionId as number | null | undefined,
          regionName: payload.regionName as string,
          partnerId: payload.partnerId as number,
          partnerName: payload.partnerName as string,
          countryCode: payload.countryCode as string,
          country: payload.country as string,
          operatorName
        })
        ElMessage.success('新增成功')
      } else if (dialogMode.value === 'edit' && payload.id != null) {
        const id = payload.id
        await updateBeacon(id, {
          regionCode: payload.regionCode as string,
          gpsCoordinate: payload.gpsCoordinate as Api.Store.GeoPoint,
          storeId: payload.storeId as number,
          storeName: payload.storeName as string,
          regionId: payload.regionId as number | null | undefined,
          regionName: payload.regionName as string,
          partnerId: payload.partnerId as number,
          partnerName: payload.partnerName as string,
          countryCode: payload.countryCode as string,
          country: payload.country as string
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
