<!-- 合作商管理 -->
<template>
  <div class="partner-page art-full-height">
    <PartnerSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="openDialog('add')" v-ripple>新增合作商</ElButton>
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
  import { fetchPartnerList, createPartner, updatePartner, deletePartner } from '@/api/partner'
  import { useUserStore } from '@/store/modules/user'
  import PartnerSearch from './modules/partner-search.vue'
  import PartnerDialog from './modules/partner-dialog.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { h, nextTick, ref } from 'vue'

  defineOptions({ name: 'PartnerList' })

  type PartnerItem = Api.Partner.PartnerListItem
  type DialogMode = 'add' | 'edit' | 'detail'

  const userStore = useUserStore()

  const dialogVisible = ref(false)
  const dialogMode = ref<DialogMode>('add')
  const currentRow = ref<PartnerItem | null>(null)

  const searchForm = ref<Api.Partner.PartnerSearchParams>({
    partnerName: undefined,
    countryCode: undefined
  })

  const openDialog = (mode: DialogMode, row?: PartnerItem) => {
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
      apiFn: fetchPartnerList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'index', width: 'auto', minWidth: 60, label: '序号' },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 90 },
        { prop: 'userNickName', label: '用户昵称', width: 'auto', minWidth: 130 },
        { prop: 'loginEmail', label: '登录邮箱', width: 'auto', minWidth: 200 },
        { prop: 'partnerName', label: '合作商名称', width: 'auto', minWidth: 160 },
        { prop: 'enterpriseAddress', label: '企业地址', width: 'auto', minWidth: 180 },
        { prop: 'contactName', label: '联系人', width: 'auto', minWidth: 100 },
        { prop: 'phone', label: '联系电话', width: 'auto', minWidth: 160 },
        { prop: 'country', label: '所属国家', width: 'auto', minWidth: 120 },
        { prop: 'iotToken', label: 'IoT Token', width: 'auto', minWidth: 200 },
        { prop: 'tenantId', label: 'Tenant ID', width: 'auto', minWidth: 160 },
        { prop: 'dcBalance', label: 'DC余额', width: 'auto', minWidth: 100 },
        { prop: 'regionCount', label: '区域数', width: 'auto', minWidth: 88 },
        { prop: 'storeCount', label: '门店数', width: 'auto', minWidth: 88 },
        { prop: 'wheelCount', label: '车轮总数', width: 'auto', minWidth: 88 },
        { prop: 'beaconCount', label: '信标总数', width: 'auto', minWidth: 88 },
        { prop: 'createTime', label: '创建时间', width: 'auto', minWidth: 170 },
        { prop: 'operatorName', label: '操作人', width: 'auto', minWidth: 110 },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right',
          formatter: (row: PartnerItem) =>
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
    searchForm.value = { partnerName: undefined, countryCode: undefined }
    replaceSearchParams({ partnerName: undefined, countryCode: undefined })
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
      ElMessage.warning(
        '该合作商下仍关联有效资产数据，不允许删除。请先清空其关联的 DC 余额、区域、门店、车轮及信标信息。'
      )
      return
    }
    ElMessageBox.confirm(`确定删除合作商「${row.partnerName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    }).then(async () => {
      await deletePartner(row.id)
      ElMessage.success('已删除')
      refreshData()
    })
  }

  const handleDialogSubmit = async (payload: Partial<PartnerItem> & { country?: string }) => {
    const operatorName = userStore.info.userName ?? '系统'
    try {
      if (dialogMode.value === 'add') {
        await createPartner({
          partnerName: payload.partnerName!,
          country: payload.country!,
          countryCode: payload.countryCode!,
          contactName: payload.contactName!,
          phone: payload.phone!,
          enterpriseAddress: payload.enterpriseAddress!,
          iotToken: payload.iotToken!,
          tenantId: payload.tenantId!,
          operatorName,
          regionCount: 0,
          storeCount: 0,
          wheelCount: 0,
          dcBalance: 0,
          beaconCount: 0
        })
        ElMessage.success('新增成功')
      } else if (dialogMode.value === 'edit' && payload.id != null) {
        await updatePartner(payload.id, {
          partnerName: payload.partnerName,
          country: payload.country,
          countryCode: payload.countryCode,
          contactName: payload.contactName,
          phone: payload.phone,
          enterpriseAddress: payload.enterpriseAddress,
          iotToken: payload.iotToken,
          tenantId: payload.tenantId
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
