<!-- 区域列表 -->
<template>
  <div class="region-list-page art-full-height">
    <RegionSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="canOperateRegion" type="primary" @click="openDialog('add')" v-ripple>
              新增区域
            </ElButton>
            <ElButton
              v-if="canOperateRegion"
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

    <RegionDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :row="currentRow"
      :country-code="searchForm.countryCode"
      :locked-partner-id="lockedPartnerId"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchRegionList,
    createRegion,
    updateRegion,
    deleteRegion,
    batchDeleteRegions
  } from '@/api/region'
  import { useUserStore } from '@/store/modules/user'
  import RegionSearch from './modules/region-search.vue'
  import RegionDialog from './modules/region-dialog.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { computed, h, nextTick, ref } from 'vue'

  defineOptions({ name: 'RegionList' })

  type RegionItem = Api.Region.RegionListItem
  type DialogMode = 'add' | 'edit' | 'detail'

  const userStore = useUserStore()

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentRow = ref<RegionItem | null>(null)
  const selectedRows = ref<RegionItem[]>([])

  const searchForm = ref<Api.Region.RegionSearchParams>({
    regionName: undefined,
    countryCode: undefined,
    partnerId: undefined
  })

  /** 平台超级管理员或合作商管理员（可管理区域） */
  const canOperateRegion = computed(() => {
    const roles = userStore.info.roles ?? []
    return roles.includes('R_SUPER') || roles.includes('R_ADMIN')
  })

  /** 合作商管理员绑定的合作商（后端返回 partnerId 时锁定所属合作商） */
  const lockedPartnerId = computed(() => {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return undefined
    if (roles.includes('R_ADMIN') && userStore.info.partnerId != null) {
      return userStore.info.partnerId
    }
    return undefined
  })

  function canManagePartnerRow(partnerId: number): boolean {
    const roles = userStore.info.roles ?? []
    if (roles.includes('R_SUPER')) return true
    if (!roles.includes('R_ADMIN')) return false
    const scoped = userStore.info.partnerId
    if (scoped == null) return true
    return scoped === partnerId
  }

  const hasRegionAssetData = (row: RegionItem) =>
    (row.dcBalance ?? 0) !== 0 ||
    (row.storeCount ?? 0) !== 0 ||
    (row.wheelCount ?? 0) !== 0 ||
    (row.beaconCount ?? 0) !== 0

  const ASSET_BLOCK_MSG =
    '该区域下仍关联有效资产数据，不允许删除。请先清空其关联的 DC 余额、门店、车轮及信标信息。'

  const openDialog = (mode: DialogMode, row?: RegionItem) => {
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
      apiFn: fetchRegionList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 'auto', minWidth: 60, label: '序号' },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 90 },
        { prop: 'regionName', label: '区域名称', width: 'auto', minWidth: 140 },
        { prop: 'regionAddress', label: '区域地址', width: 'auto', minWidth: 180 },
        { prop: 'regionContactName', label: '区域联系人', width: 'auto', minWidth: 110 },
        { prop: 'regionPhone', label: '区域联系电话', width: 'auto', minWidth: 140 },
        { prop: 'partnerName', label: '所属合作商', width: 'auto', minWidth: 140 },
        { prop: 'country', label: '所属国家', width: 'auto', minWidth: 100 },
        { prop: 'dcBalance', label: 'DC余额', width: 'auto', minWidth: 100 },
        { prop: 'storeCount', label: '门店数', width: 'auto', minWidth: 88 },
        { prop: 'wheelCount', label: '车轮总数', width: 'auto', minWidth: 88 },
        { prop: 'beaconCount', label: '信标总数', width: 'auto', minWidth: 88 },
        { prop: 'pendingTicketCount', label: '未处理工单数', width: 'auto', minWidth: 120 },
        { prop: 'createTime', label: '创建时间', width: 'auto', minWidth: 170 },
        { prop: 'operatorName', label: '操作人', width: 'auto', minWidth: 110 },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right',
          formatter: (row: RegionItem) =>
            h(
              'div',
              [
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => {
                    dialogMode.value = 'detail'
                    currentRow.value = row
                    dialogVisible.value = true
                  }
                }),
                canOperateRegion.value &&
                  canManagePartnerRow(row.partnerId) &&
                  h(ArtButtonTable, {
                    type: 'edit',
                    onClick: () => openDialog('edit', row)
                  }),
                canOperateRegion.value &&
                  canManagePartnerRow(row.partnerId) &&
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

  const handleSelectionChange = (selection: RegionItem[]) => {
    selectedRows.value = selection
  }

  const handleSearch = (params: Api.Region.RegionSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  const handleReset = () => {
    searchForm.value = { regionName: undefined, countryCode: undefined, partnerId: undefined }
    replaceSearchParams({ regionName: undefined, countryCode: undefined, partnerId: undefined })
    getData()
  }

  const handleDelete = (row: RegionItem) => {
    if (!canManagePartnerRow(row.partnerId)) {
      ElMessage.warning('无权限删除该区域')
      return
    }
    if (hasRegionAssetData(row)) {
      ElMessage.warning(ASSET_BLOCK_MSG)
      return
    }
    ElMessageBox.confirm(`确定删除区域「${row.regionName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    }).then(async () => {
      await deleteRegion(row.id)
      ElMessage.success('已删除')
      refreshData()
    })
  }

  const handleBatchDelete = () => {
    if (!canOperateRegion.value) return
    const manageable = selectedRows.value.filter((r) => canManagePartnerRow(r.partnerId))
    const blocked = selectedRows.value.filter((r) => !canManagePartnerRow(r.partnerId))
    if (blocked.length) {
      ElMessage.warning(`有 ${blocked.length} 条记录无权限删除，已跳过`)
    }
    if (manageable.length === 0) {
      ElMessage.warning('没有可删除的记录')
      return
    }
    const withAsset = manageable.filter(hasRegionAssetData)
    if (withAsset.length > 0) {
      ElMessage.warning(ASSET_BLOCK_MSG)
      return
    }
    ElMessageBox.confirm(
      `确定批量删除选中的 ${manageable.length} 条区域吗？此操作不可恢复。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    ).then(async () => {
      await batchDeleteRegions(manageable.map((r) => r.id))
      ElMessage.success('已批量删除')
      selectedRows.value = []
      refreshData()
    })
  }

  const handleDialogSubmit = async (
    payload: Partial<RegionItem> & { country?: string; countryCode?: string }
  ) => {
    const operatorName = userStore.info.userName ?? '系统'
    try {
      if (dialogMode.value === 'add') {
        await createRegion({
          regionName: payload.regionName!,
          regionAddress: payload.regionAddress!,
          regionContactName: payload.regionContactName!,
          regionPhone: payload.regionPhone!,
          partnerId: payload.partnerId!,
          partnerName: payload.partnerName!,
          country: payload.country!,
          countryCode: payload.countryCode!,
          operatorName
        })
        ElMessage.success('新增成功')
      } else if (dialogMode.value === 'edit' && currentRow.value?.id != null) {
        await updateRegion(currentRow.value.id, {
          regionName: payload.regionName,
          regionAddress: payload.regionAddress,
          regionContactName: payload.regionContactName,
          regionPhone: payload.regionPhone,
          partnerId: payload.partnerId,
          partnerName: payload.partnerName,
          country: payload.country,
          countryCode: payload.countryCode
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
