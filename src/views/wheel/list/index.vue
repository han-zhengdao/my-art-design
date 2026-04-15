<!-- 车轮管理 -->
<template>
  <div class="wheel-list-page art-full-height">
    <WheelSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="canOperate" type="primary" @click="openDialog('add')" v-ripple>
              新增车轮
            </ElButton>
            <ElButton
              v-if="canOperate"
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
        @sort-change="handleSortChange"
      />
    </ElCard>

    <WheelDialog
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

    <WheelExtraDialog v-model="extraVisible" :mode="extraMode" :row="extraRow" />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtIconButton from '@/components/core/widget/art-icon-button/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import WheelSearch from './modules/wheel-search.vue'
  import WheelDialog from './modules/wheel-dialog.vue'
  import WheelExtraDialog from './modules/wheel-extra-dialog.vue'
  import {
    fetchWheelList,
    createWheel,
    updateWheel,
    deleteWheel,
    batchDeleteWheels,
    batchCreateWheels
  } from '@/api/wheel'
  import { useUserStore } from '@/store/modules/user'
  import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { computed, h, nextTick, ref } from 'vue'

  defineOptions({ name: 'WheelList' })

  type WheelItem = Api.Wheel.WheelListItem
  type DialogMode = 'add' | 'edit' | 'detail'
  type ExtraMode = 'location' | 'track'

  const userStore = useUserStore()

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentRow = ref<WheelItem | null>(null)
  const selectedRows = ref<WheelItem[]>([])

  const extraVisible = ref(false)
  const extraMode = ref<ExtraMode>('location')
  const extraRow = ref<WheelItem | null>(null)

  const searchForm = ref<Api.Wheel.WheelSearchParams>({
    devEui: undefined,
    countryCode: undefined,
    partnerId: undefined,
    regionId: undefined,
    storeId: undefined,
    deviceStatus: undefined,
    gpsAccuracy: undefined,
    fenceStatus: undefined
  })

  /** 平台超级管理员或门店管理员（可管理车轮） */
  const canOperate = computed(() => {
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

  function canManageRow(row: WheelItem): boolean {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return true
    if (!roles.includes('STORE_ADMIN')) return false
    if (userStore.info.storeId != null) return row.storeId === userStore.info.storeId
    if (userStore.info.partnerId != null) return row.partnerId === userStore.info.partnerId
    return false
  }

  function deviceStatusLabel(s: Api.Wheel.DeviceStatus) {
    const m: Record<string, string> = { IN_USE: '使用中', SCRAPPED: '已报废', LOST: '已丢失' }
    return m[s] ?? s
  }
  function onlineLabel(s: Api.Wheel.OnlineStatus) {
    const m: Record<string, string> = { ONLINE: '已联网', OFFLINE: '未联网' }
    return m[s] ?? s
  }
  function fenceLabel(s: Api.Wheel.FenceStatus) {
    const m: Record<string, string> = { INSIDE: '围栏内', OUTSIDE: '围栏外' }
    return m[s] ?? s
  }
  function coordText(p: Api.Store.GeoPoint) {
    return `${p.lng},${p.lat}`
  }

  const openDialog = (mode: DialogMode, row?: WheelItem) => {
    dialogMode.value = mode
    currentRow.value = row ?? null
    nextTick(() => {
      dialogVisible.value = true
    })
  }

  const openExtra = (mode: ExtraMode, row: WheelItem) => {
    extraMode.value = mode
    extraRow.value = row
    extraVisible.value = true
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    searchParams,
    refreshData,
    getData,
    replaceSearchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      immediate: true,
      apiFn: fetchWheelList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 'auto', minWidth: 60, label: '序号' },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 90 },
        { prop: 'devEui', label: 'DevEUI', width: 'auto', minWidth: 160 },
        { prop: 'storeName', label: '所属门店', width: 'auto', minWidth: 140 },
        { prop: 'regionName', label: '所属区域', width: 'auto', minWidth: 120 },
        { prop: 'partnerName', label: '所属合作商', width: 'auto', minWidth: 140 },
        { prop: 'country', label: '所属国家', width: 'auto', minWidth: 100 },
        {
          prop: 'deviceStatus',
          label: '设备状态',
          width: 'auto',
          minWidth: 100,
          formatter: (row: WheelItem) => deviceStatusLabel(row.deviceStatus)
        },
        {
          prop: 'onlineStatus',
          label: '联网状态',
          width: 'auto',
          minWidth: 100,
          formatter: (row: WheelItem) => onlineLabel(row.onlineStatus)
        },
        {
          prop: 'batteryLevel',
          label: '电池电量',
          width: 'auto',
          minWidth: 110,
          sortable: 'custom',
          formatter: (row: WheelItem) => `${row.batteryLevel}%`
        },
        {
          prop: 'fenceStatus',
          label: '围栏内外',
          width: 'auto',
          minWidth: 100,
          formatter: (row: WheelItem) => fenceLabel(row.fenceStatus)
        },
        {
          prop: 'outFenceTime',
          label: '出围栏时间',
          width: 'auto',
          minWidth: 170,
          formatter: (row: WheelItem) => row.outFenceTime?.trim() || '--'
        },
        {
          prop: 'outFenceDistanceM',
          label: '出围栏距离',
          width: 'auto',
          minWidth: 120,
          formatter: (row: WheelItem) => `${row.outFenceDistanceM} m`
        },
        {
          prop: 'lastPosition',
          label: '最新定位',
          width: 'auto',
          minWidth: 180,
          formatter: (row: WheelItem) => coordText(row.lastPosition)
        },
        {
          prop: 'lastPositionTime',
          label: '最新定位时间',
          width: 'auto',
          minWidth: 170
        },
        { prop: 'lastCommTime', label: '最后通信时间', width: 'auto', minWidth: 170 },
        { prop: 'createTime', label: '创建时间', width: 'auto', minWidth: 170 },
        { prop: 'operatorName', label: '操作人', width: 'auto', minWidth: 100 },
        {
          prop: 'operation',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: WheelItem) =>
            h(
              'div',
              { class: 'flex flex-wrap items-center gap-1' },
              [
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => openDialog('detail', row)
                }),
                canOperate.value &&
                  canManageRow(row) &&
                  h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('edit', row)
                  }),
                canOperate.value &&
                  canManageRow(row) &&
                  h(ArtButtonTable, {
                    type: 'delete',
                    onClick: () => handleDelete(row)
                  }),
                h(
                  ElDropdown,
                  { trigger: 'click' },
                  {
                    default: () =>
                      h(ArtIconButton, {
                        icon: 'ri:more-2-fill',
                        class:
                          '!size-8 rounded-md bg-theme/12 text-theme hover:bg-theme/22 hover:text-theme/90 active:bg-theme/18 active:text-theme text-sm'
                      }),
                    dropdown: () =>
                      h(ElDropdownMenu, null, () => [
                        h(
                          ElDropdownItem,
                          { onClick: () => openExtra('location', row) },
                          () => '最新定位'
                        ),
                        h(
                          ElDropdownItem,
                          { onClick: () => openExtra('track', row) },
                          () => '轨迹回放'
                        )
                      ])
                  }
                )
              ].filter(Boolean) as any
            )
        }
      ]
    }
  })

  const handleSelectionChange = (selection: WheelItem[]) => {
    selectedRows.value = selection
  }

  const handleSearch = (params: Api.Wheel.WheelSearchParams) => {
    const sp = searchParams as Record<string, unknown>
    replaceSearchParams({
      ...params,
      sortField: sp.sortField as string | undefined,
      sortOrder: sp.sortOrder as 'ascending' | 'descending' | undefined
    })
    getData()
  }

  const handleReset = () => {
    searchForm.value = {
      devEui: undefined,
      countryCode: undefined,
      partnerId: undefined,
      regionId: undefined,
      storeId: undefined,
      deviceStatus: undefined,
      gpsAccuracy: undefined,
      fenceStatus: undefined
    }
    const sp = searchParams as Record<string, unknown>
    sp.sortField = undefined
    sp.sortOrder = undefined
    replaceSearchParams({ ...searchForm.value })
    getData()
  }

  function handleSortChange(data: { prop: string; order: 'ascending' | 'descending' | null }) {
    const map: Record<string, string> = {
      batteryLevel: 'batteryLevel'
    }
    const sp = searchParams as Record<string, unknown>
    if (!data.order) {
      sp.sortField = undefined
      sp.sortOrder = undefined
    } else {
      sp.sortField = map[data.prop]
      sp.sortOrder = data.order
    }
    sp.current = 1
    getData()
  }

  const handleDelete = (row: WheelItem) => {
    if (!canManageRow(row)) {
      ElMessage.warning('无权限删除该车轮')
      return
    }
    ElMessageBox.confirm(`确定删除车轮「${row.devEui}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    }).then(async () => {
      await deleteWheel(row.id)
      ElMessage.success('已删除')
      refreshData()
    })
  }

  const handleBatchDelete = () => {
    if (!canOperate.value) return
    const manageable = selectedRows.value.filter((r) => canManageRow(r))
    const blocked = selectedRows.value.filter((r) => !canManageRow(r))
    if (blocked.length) {
      ElMessage.warning(`有 ${blocked.length} 条记录无权限删除，已跳过`)
    }
    if (manageable.length === 0) {
      ElMessage.warning('没有可删除的记录')
      return
    }
    ElMessageBox.confirm(
      `确定批量删除选中的 ${manageable.length} 条车轮吗？此操作不可恢复。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    ).then(async () => {
      await batchDeleteWheels(manageable.map((r) => r.id))
      ElMessage.success('已批量删除')
      selectedRows.value = []
      refreshData()
    })
  }

  const handleBatchSubmit = async (payloads: Parameters<typeof batchCreateWheels>[0]) => {
    const operatorName = userStore.info.userName ?? '系统'
    try {
      const { created, skipped } = await batchCreateWheels(payloads, operatorName)
      let msg = `成功导入 ${created.length} 条`
      if (skipped.length) {
        msg += `；跳过 ${skipped.length} 条（${skipped.map((s) => `${s.devEui}: ${s.reason}`).join('；')}）`
      }
      ElMessage.success(msg)
      dialogVisible.value = false
      refreshData()
    } catch (e) {
      console.error(e)
      ElMessage.error('批量导入失败')
    }
  }

  const handleDialogSubmit = async (payload: Partial<WheelItem> & { id?: number }) => {
    const operatorName = userStore.info.userName ?? '系统'
    try {
      if (dialogMode.value === 'add') {
        await createWheel({
          devEui: payload.devEui as string,
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
        await updateWheel(payload.id, {
          deviceStatus: payload.deviceStatus,
          storeId: payload.storeId,
          storeName: payload.storeName,
          regionId: payload.regionId,
          regionName: payload.regionName,
          partnerId: payload.partnerId,
          partnerName: payload.partnerName,
          countryCode: payload.countryCode,
          country: payload.country
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
