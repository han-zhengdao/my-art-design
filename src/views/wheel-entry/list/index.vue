<!-- 车轮录入列表 -->
<template>
  <div class="art-full-height">
    <WheelEntrySearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ElDialog v-model="detailVisible" title="车轮录入详情" width="760px" destroy-on-close>
      <ElDescriptions v-if="detailRow" :column="1" border>
        <ElDescriptionsItem label="包装编号">{{ detailRow.packagingNo }}</ElDescriptionsItem>
        <ElDescriptionsItem label="产品型号">{{ detailRow.productModel }}</ElDescriptionsItem>
        <ElDescriptionsItem label="蓝牙连接密码">{{
          detailRow.bluetoothPassword
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="Device EUI">{{ detailRow.deviceEui }}</ElDescriptionsItem>
        <ElDescriptionsItem label="Join EUI">{{ detailRow.joinEui }}</ElDescriptionsItem>
        <ElDescriptionsItem label="入网方式">{{ detailRow.joinMethod }}</ElDescriptionsItem>
        <ElDescriptionsItem label="Application key">{{
          detailRow.applicationKey
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="Device address">{{
          detailRow.deviceAddress
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="Network session key">{{
          detailRow.networkSessionKey
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="Application session key">{{
          detailRow.applicationSessionKey
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="包装时间">{{ detailRow.packagingTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="批次ID">{{ detailRow.batchId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="生产线ID">{{ detailRow.productionLineId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="工厂ID">{{ detailRow.factoryId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作员ID">{{ detailRow.operatorId }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { deleteWheelEntry, fetchWheelEntryList } from '@/api/wheel-entry'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { h, ref } from 'vue'
  import WheelEntrySearch from './modules/wheel-entry-search.vue'

  defineOptions({ name: 'WheelEntryList' })

  type Row = Api.WheelEntry.WheelEntryItem

  const searchForm = ref<Api.WheelEntry.WheelEntrySearchParams>({
    deviceEui: undefined,
    productModel: undefined
  })

  const detailVisible = ref(false)
  const detailRow = ref<Row | null>(null)

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
      apiFn: fetchWheelEntryList,
      apiParams: { current: 1, size: 20, ...searchForm.value },
      columnsFactory: () => [
        { prop: 'packagingNo', label: '包装编号', minWidth: 150 },
        { prop: 'productModel', label: '产品型号', minWidth: 120 },
        { prop: 'bluetoothPassword', label: '蓝牙连接密码', minWidth: 120 },
        { prop: 'deviceEui', label: 'Device EUI', minWidth: 170 },
        { prop: 'joinEui', label: 'Join EUI', minWidth: 160 },
        { prop: 'joinMethod', label: '入网方式', minWidth: 100 },
        { prop: 'applicationKey', label: 'Application key', minWidth: 160 },
        { prop: 'deviceAddress', label: 'Device address', minWidth: 120 },
        { prop: 'networkSessionKey', label: 'Network session key', minWidth: 160 },
        { prop: 'applicationSessionKey', label: 'Application session key', minWidth: 170 },
        { prop: 'packagingTime', label: '包装时间', minWidth: 170 },
        { prop: 'batchId', label: '批次ID', minWidth: 130 },
        { prop: 'productionLineId', label: '生产线ID', minWidth: 120 },
        { prop: 'factoryId', label: '工厂ID', minWidth: 120 },
        { prop: 'operatorId', label: '操作员ID', minWidth: 120 },
        {
          prop: 'operation',
          label: '操作',
          width: 130,
          fixed: 'right',
          formatter: (row: Row) =>
            h('div', { class: 'flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                onClick: () => {
                  detailRow.value = row
                  detailVisible.value = true
                }
              }),
              h(ArtButtonTable, {
                type: 'delete',
                onClick: () => handleDelete(row)
              })
            ])
        }
      ]
    }
  })

  async function handleDelete(row: Row) {
    try {
      await ElMessageBox.confirm(`确认删除 Device EUI：${row.deviceEui} 吗？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      })
      await deleteWheelEntry(row.id)
      ElMessage.success('删除成功')
      await refreshData()
    } catch {
      // 用户取消删除
    }
  }

  const handleSearch = (p: Api.WheelEntry.WheelEntrySearchParams) => {
    replaceSearchParams(p)
    getData()
  }

  const handleReset = () => {
    searchForm.value = {
      deviceEui: undefined,
      productModel: undefined
    }
    replaceSearchParams({ ...searchForm.value })
    getData()
  }
</script>
