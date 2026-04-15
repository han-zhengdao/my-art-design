<!-- DC 使用记录 -->
<template>
  <div class="art-full-height">
    <UsageSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

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
    <ElDialog v-model="detailVisible" title="使用记录详情" width="680px" destroy-on-close>
      <ElDescriptions v-if="detailRow" :column="1" border>
        <ElDescriptionsItem label="ID">{{ detailRow.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="设备类型">{{ detailRow.usageTypeLabel }}</ElDescriptionsItem>
        <ElDescriptionsItem label="设备ID">{{ detailRow.deviceId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="使用额度">{{ detailRow.amount }}</ElDescriptionsItem>
        <ElDescriptionsItem label="使用时间">{{ detailRow.usageTime }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDcUsageRecordList } from '@/api/dc'
  import { h, ref } from 'vue'
  import UsageSearch from './modules/usage-search.vue'

  defineOptions({ name: 'DcUsageRecord' })

  type Row = Api.Dc.UsageRecordItem

  const searchForm = ref<Api.Dc.UsageRecordSearchParams>({
    deviceKeyword: undefined,
    usageType: undefined,
    timeRange: undefined
  })

  const detailVisible = ref(false)
  const detailRow = ref<Row | null>(null)

  const cleanParams = (p: Api.Dc.UsageRecordSearchParams) => {
    const next = { ...p }
    if (next.usageType === ('' as Api.Dc.UsageKind)) next.usageType = undefined
    return next
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
      apiFn: fetchDcUsageRecordList,
      apiParams: { current: 1, size: 20, ...searchForm.value },
      columnsFactory: () => [
        { type: 'index', label: '序号', width: 'auto', minWidth: 56 },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 80 },
        { prop: 'usageTypeLabel', label: '设备类型', width: 'auto', minWidth: 90 },
        { prop: 'deviceId', label: '设备ID', width: 'auto', minWidth: 200 },
        { prop: 'amount', label: '使用额度', width: 'auto', minWidth: 90 },
        { prop: 'usageTime', label: '使用时间', width: 'auto', minWidth: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 90,
          fixed: 'right',
          formatter: (row: Row) =>
            h(ArtButtonTable, {
              type: 'view',
              onClick: () => {
                detailRow.value = row
                detailVisible.value = true
              }
            })
        }
      ]
    }
  })

  const handleSearch = (p: Api.Dc.UsageRecordSearchParams) => {
    replaceSearchParams(cleanParams(p))
    getData()
  }

  const handleReset = () => {
    searchForm.value = {
      deviceKeyword: undefined,
      usageType: undefined,
      timeRange: undefined
    }
    replaceSearchParams({ ...searchForm.value })
    getData()
  }
</script>
