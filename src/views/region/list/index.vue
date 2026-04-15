<!-- 区域列表 -->
<template>
  <div class="region-list-page art-full-height">
    <RegionSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="canOperateRegion" type="primary" @click="openDialog('add')" v-ripple>
              {{ t('regionPage.button.add') }}
            </ElButton>
            <ElButton
              v-if="canOperateRegion"
              type="danger"
              plain
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
            >
              {{ t('regionPage.button.batchDelete') }}
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
    getRegionDetail,
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
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'RegionList' })

  type RegionItem = Api.Region.RegionListItem
  type DialogMode = 'add' | 'edit' | 'detail'

  const userStore = useUserStore()
  const { t } = useI18n()

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentRow = ref<RegionItem | null>(null)
  const selectedRows = ref<RegionItem[]>([])

  const searchForm = ref<Api.Region.RegionSearchParams>({
    regionName: undefined,
    countryId: undefined,
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

  const ASSET_BLOCK_MSG = t('regionPage.messages.assetBlocked')

  const openDialog = async (mode: DialogMode, row?: RegionItem) => {
    dialogMode.value = mode
    if (row?.id != null && (mode === 'edit' || mode === 'detail')) {
      try {
        currentRow.value = await getRegionDetail(row.id)
      } catch (e) {
        console.error(e)
        currentRow.value = row
      }
    } else {
      currentRow.value = row ?? null
    }
    await nextTick()
    dialogVisible.value = true
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
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      apiParams: {
        pageNum: 1,
        pageSize: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', width: 'auto', minWidth: 60, label: t('regionPage.column.index') },
        { prop: 'id', label: t('regionPage.column.id'), width: 'auto', minWidth: 90 },
        {
          prop: 'loginEmail',
          label: t('regionPage.column.loginEmail'),
          width: 'auto',
          minWidth: 200
        },
        {
          prop: 'regionName',
          label: t('regionPage.column.regionName'),
          width: 'auto',
          minWidth: 140
        },
        {
          prop: 'regionAddress',
          label: t('regionPage.column.regionAddress'),
          width: 'auto',
          minWidth: 180
        },
        {
          prop: 'regionContactName',
          label: t('regionPage.column.regionContactName'),
          width: 'auto',
          minWidth: 110
        },
        {
          prop: 'regionPhone',
          label: t('regionPage.column.regionPhone'),
          width: 'auto',
          minWidth: 140
        },
        {
          prop: 'partnerName',
          label: t('regionPage.column.partnerName'),
          width: 'auto',
          minWidth: 140
        },
        { prop: 'country', label: t('regionPage.column.country'), width: 'auto', minWidth: 100 },
        {
          prop: 'dcBalance',
          label: t('regionPage.column.dcBalance'),
          width: 'auto',
          minWidth: 100
        },
        {
          prop: 'storeCount',
          label: t('regionPage.column.storeCount'),
          width: 'auto',
          minWidth: 88
        },
        {
          prop: 'wheelCount',
          label: t('regionPage.column.wheelCount'),
          width: 'auto',
          minWidth: 88
        },
        {
          prop: 'beaconCount',
          label: t('regionPage.column.beaconCount'),
          width: 'auto',
          minWidth: 88
        },
        {
          prop: 'pendingTicketCount',
          label: t('regionPage.column.pendingTicketCount'),
          width: 'auto',
          minWidth: 120
        },
        {
          prop: 'createTime',
          label: t('regionPage.column.createTime'),
          width: 'auto',
          minWidth: 170
        },
        {
          prop: 'operatorName',
          label: t('regionPage.column.operatorName'),
          width: 'auto',
          minWidth: 110
        },
        {
          prop: 'operation',
          label: t('regionPage.column.operation'),
          width: 160,
          fixed: 'right',
          formatter: (row: RegionItem) =>
            h(
              'div',
              [
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => openDialog('detail', row)
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
    searchForm.value = { regionName: undefined, countryId: undefined, partnerId: undefined }
    replaceSearchParams({ regionName: undefined, countryId: undefined, partnerId: undefined })
    getData()
  }

  const handleDelete = (row: RegionItem) => {
    if (!canManagePartnerRow(row.partnerId)) {
      ElMessage.warning(t('regionPage.messages.deleteNoPermission'))
      return
    }
    if (hasRegionAssetData(row)) {
      ElMessage.warning(ASSET_BLOCK_MSG)
      return
    }
    ElMessageBox.confirm(
      t('regionPage.messages.deleteConfirm', { name: row.regionName }),
      t('regionPage.messages.deleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('regionPage.messages.btnDelete'),
        cancelButtonText: t('common.cancel')
      }
    ).then(async () => {
      await deleteRegion(row.id)
      ElMessage.success(t('regionPage.messages.deleted'))
      refreshData()
    })
  }

  const handleBatchDelete = () => {
    if (!canOperateRegion.value) return
    const manageable = selectedRows.value.filter((r) => canManagePartnerRow(r.partnerId))
    const blocked = selectedRows.value.filter((r) => !canManagePartnerRow(r.partnerId))
    if (blocked.length) {
      ElMessage.warning(
        t('regionPage.messages.batchNoPermissionSkipped', { count: blocked.length })
      )
    }
    if (manageable.length === 0) {
      ElMessage.warning(t('regionPage.messages.batchNoDeletable'))
      return
    }
    const withAsset = manageable.filter(hasRegionAssetData)
    if (withAsset.length > 0) {
      ElMessage.warning(ASSET_BLOCK_MSG)
      return
    }
    ElMessageBox.confirm(
      t('regionPage.messages.batchDeleteConfirm', { count: manageable.length }),
      t('regionPage.messages.batchDeleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('regionPage.messages.btnDelete'),
        cancelButtonText: t('common.cancel')
      }
    ).then(async () => {
      await batchDeleteRegions(manageable.map((r) => r.id))
      ElMessage.success(t('regionPage.messages.batchDeleted'))
      selectedRows.value = []
      refreshData()
    })
  }

  const handleDialogSubmit = async (
    payload: Partial<RegionItem> & {
      country?: string
      countryCode?: string
      loginEmail?: string
      loginPassword?: string
    }
  ) => {
    try {
      if (dialogMode.value === 'add') {
        await createRegion({
          regionName: payload.regionName!.trim(),
          partnerId: payload.partnerId!,
          email: payload.loginEmail!.trim(),
          password: payload.loginPassword!,
          ...(payload.regionContactName?.trim()
            ? { contact: payload.regionContactName.trim() }
            : {}),
          ...(payload.regionPhone?.trim() ? { phone: payload.regionPhone.trim() } : {}),
          ...(payload.regionAddress?.trim() ? { address: payload.regionAddress.trim() } : {})
        })
        ElMessage.success(t('regionPage.messages.addSuccess'))
      } else if (dialogMode.value === 'edit' && currentRow.value?.id != null) {
        await updateRegion({
          id: currentRow.value.id,
          regionName: payload.regionName!.trim(),
          ...(payload.regionContactName?.trim()
            ? { contact: payload.regionContactName.trim() }
            : {}),
          ...(payload.regionPhone?.trim() ? { phone: payload.regionPhone.trim() } : {}),
          ...(payload.regionAddress?.trim() ? { address: payload.regionAddress.trim() } : {})
        })
        ElMessage.success(t('regionPage.messages.saveSuccess'))
      }
      refreshData()
    } catch (e) {
      console.error(e)
      ElMessage.error(t('regionPage.messages.operationFailed'))
    }
  }
</script>
