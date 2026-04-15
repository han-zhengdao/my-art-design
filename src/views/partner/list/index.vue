<!-- 合作商管理 -->
<template>
  <div class="partner-page art-full-height">
    <PartnerSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="openDialog('add')" v-ripple>
              {{ $t('partnerPage.button.add') }}
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <PartnerDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :row="currentRow"
      @submit="handleDialogSubmit"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchPartnerList,
    createPartner,
    getPartnerDetail,
    updatePartner,
    deletePartner
  } from '@/api/partner'
  import { useUserStore } from '@/store/modules/user'
  import PartnerSearch from './modules/partner-search.vue'
  import PartnerDialog from './modules/partner-dialog.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { h, nextTick, ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  defineOptions({ name: 'PartnerList' })

  type PartnerItem = Api.Partner.PartnerListItem
  type DialogMode = 'add' | 'edit' | 'detail'

  const userStore = useUserStore()
  const { t } = useI18n()

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentRow = ref<PartnerItem | null>(null)

  const searchForm = ref<Api.Partner.PartnerSearchParams>({
    partnerName: undefined,
    countryId: undefined
  })

  const openDialog = async (mode: DialogMode, row?: PartnerItem) => {
    dialogMode.value = mode
    if (row?.id != null && (mode === 'edit' || mode === 'detail')) {
      try {
        currentRow.value = await getPartnerDetail(row.id)
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
      apiFn: fetchPartnerList,
      paginationKey: { current: 'pageNum', size: 'pageSize' },
      apiParams: {
        pageNum: 1,
        pageSize: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'index', width: 'auto', minWidth: 60, label: t('partnerPage.column.index') },
        { prop: 'id', label: t('partnerPage.column.id'), width: 'auto', minWidth: 90 },
        {
          prop: 'loginEmail',
          label: t('partnerPage.column.loginEmail'),
          width: 'auto',
          minWidth: 200
        },
        {
          prop: 'partnerName',
          label: t('partnerPage.column.partnerName'),
          width: 'auto',
          minWidth: 160
        },
        {
          prop: 'enterpriseAddress',
          label: t('partnerPage.column.enterpriseAddress'),
          width: 'auto',
          minWidth: 180
        },
        {
          prop: 'contactName',
          label: t('partnerPage.column.contactName'),
          width: 'auto',
          minWidth: 100
        },
        { prop: 'phone', label: t('partnerPage.column.phone'), width: 'auto', minWidth: 160 },
        { prop: 'country', label: t('partnerPage.column.country'), width: 'auto', minWidth: 120 },
        {
          prop: 'dcBalance',
          label: t('partnerPage.column.dcBalance'),
          width: 'auto',
          minWidth: 100
        },
        {
          prop: 'regionCount',
          label: t('partnerPage.column.regionCount'),
          width: 'auto',
          minWidth: 88
        },
        {
          prop: 'storeCount',
          label: t('partnerPage.column.storeCount'),
          width: 'auto',
          minWidth: 88
        },
        {
          prop: 'wheelCount',
          label: t('partnerPage.column.wheelCount'),
          width: 'auto',
          minWidth: 88
        },
        {
          prop: 'beaconCount',
          label: t('partnerPage.column.beaconCount'),
          width: 'auto',
          minWidth: 88
        },
        {
          prop: 'createTime',
          label: t('partnerPage.column.createTime'),
          width: 'auto',
          minWidth: 170
        },
        {
          prop: 'operatorName',
          label: t('partnerPage.column.operatorName'),
          width: 'auto',
          minWidth: 110
        },
        {
          prop: 'operation',
          label: t('partnerPage.column.operation'),
          width: 160,
          fixed: 'right',
          formatter: (row: PartnerItem) =>
            h(
              'div',
              [
                h(ArtButtonTable, {
                  type: 'view',
                  onClick: () => openDialog('detail', row)
                }),
                h(ArtButtonTable, {
                  type: 'edit',
                  onClick: () => openDialog('edit', row)
                }),
                userStore.info.roles?.includes('R_SUPER') &&
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

  const handleSearch = (params: Api.Partner.PartnerSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  const handleReset = () => {
    searchForm.value = { partnerName: undefined, countryId: undefined }
    replaceSearchParams({ partnerName: undefined, countryId: undefined })
    getData()
  }

  /** 是否存在需先清空的关联资产（任一项非 0 则不允许删除） */
  const hasPartnerAssetData = (row: PartnerItem) => {
    return (
      (row.dcBalance ?? 0) !== 0 ||
      (row.regionCount ?? 0) !== 0 ||
      (row.storeCount ?? 0) !== 0 ||
      (row.wheelCount ?? 0) !== 0 ||
      (row.beaconCount ?? 0) !== 0
    )
  }

  const handleDelete = (row: PartnerItem) => {
    if (hasPartnerAssetData(row)) {
      ElMessage.warning(t('partnerPage.messages.deleteBlocked'))
      return
    }
    ElMessageBox.confirm(
      t('partnerPage.messages.deleteConfirm', { name: row.partnerName }),
      t('partnerPage.messages.deleteTitle'),
      {
        type: 'warning',
        confirmButtonText: t('partnerPage.messages.btnDelete'),
        cancelButtonText: t('common.cancel')
      }
    ).then(async () => {
      await deletePartner(row.id)
      ElMessage.success(t('partnerPage.messages.deleted'))
      refreshData()
    })
  }

  const handleDialogSubmit = async (
    payload: Partial<PartnerItem> & {
      country?: string
      loginEmail?: string
      loginPassword?: string
    }
  ) => {
    try {
      if (dialogMode.value === 'add') {
        await createPartner({
          partnerName: payload.partnerName!.trim(),
          email: payload.loginEmail!.trim(),
          password: payload.loginPassword!,
          ...(payload.contactName?.trim() ? { contact: payload.contactName.trim() } : {}),
          ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
          ...(payload.enterpriseAddress?.trim()
            ? { address: payload.enterpriseAddress.trim() }
            : {}),
          ...(payload.countryId != null ? { countryId: payload.countryId } : {})
        })
        ElMessage.success(t('partnerPage.messages.addSuccess'))
      } else if (dialogMode.value === 'edit' && payload.id != null) {
        await updatePartner({
          id: payload.id,
          ...(payload.contactName?.trim() ? { contact: payload.contactName.trim() } : {}),
          ...(payload.phone?.trim() ? { phone: payload.phone.trim() } : {}),
          ...(payload.enterpriseAddress?.trim()
            ? { address: payload.enterpriseAddress.trim() }
            : {}),
          ...(payload.countryId != null ? { countryId: payload.countryId } : {})
        })
        ElMessage.success(t('partnerPage.messages.saveSuccess'))
      }
      refreshData()
    } catch (e) {
      console.error(e)
      ElMessage.error(t('partnerPage.messages.operationFailed'))
    }
  }
</script>
