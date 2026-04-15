<!-- DC 分配记录 -->
<template>
  <div class="art-full-height">
    <ArtSearchBar
      ref="searchBarRef"
      v-model="searchForm"
      :items="searchItems"
      :rules="{}"
      :is-expand="true"
      :show-expand="false"
      @reset="handleReset"
      @search="handleSearch"
    />
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
    <ElDialog v-model="detailVisible" title="分配记录详情" width="680px" destroy-on-close>
      <ElDescriptions v-if="detailRow" :column="1" border>
        <ElDescriptionsItem label="ID">{{ detailRow.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="分配对象">{{ detailRow.assignTypeLabel }}</ElDescriptionsItem>
        <ElDescriptionsItem label="对象名称">{{ detailRow.targetName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="分配金额">{{ detailRow.amount }}</ElDescriptionsItem>
        <ElDescriptionsItem label="分配时间">{{ detailRow.assignTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作人">{{ detailRow.operatorName }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDcAssignRecordList } from '@/api/dc'
  import { h, ref, computed } from 'vue'

  defineOptions({ name: 'DcAssignRecord' })

  type Row = Api.Dc.AssignRecordItem

  const searchForm = ref<Api.Dc.AssignRecordSearchParams>({
    targetKeyword: undefined,
    assignType: undefined,
    timeRange: undefined
  })

  const typeOptions = [
    { label: '全部', value: '' },
    { label: '区域', value: 'REGION' },
    { label: '门店', value: 'STORE' }
  ]

  const searchItems = computed(() => [
    {
      label: '对象名称',
      key: 'targetKeyword',
      type: 'input',
      labelWidth: 'auto',
      span: 5,
      placeholder: '模糊搜索',
      clearable: true
    },
    {
      label: '分配对象',
      key: 'assignType',
      type: 'select',
      labelWidth: 'auto',
      span: 5,
      props: { placeholder: '全部', clearable: true, options: typeOptions }
    },
    {
      label: '分配时间',
      key: 'timeRange',
      type: 'daterange',
      labelWidth: 'auto',
      span: 8,
      props: {
        type: 'datetimerange',
        startPlaceholder: '开始',
        endPlaceholder: '结束',
        valueFormat: 'YYYY-MM-DD HH:mm:ss'
      }
    }
  ])

  const detailVisible = ref(false)
  const detailRow = ref<Row | null>(null)

  const handleSearchParams = (p: Api.Dc.AssignRecordSearchParams) => {
    const next = { ...p }
    if (next.assignType === ('' as Api.Dc.AssignTargetType)) next.assignType = undefined
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
      apiFn: fetchDcAssignRecordList,
      apiParams: { current: 1, size: 20, ...searchForm.value },
      columnsFactory: () => [
        { type: 'index', label: '序号', width: 'auto', minWidth: 56 },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 80 },
        { prop: 'assignTypeLabel', label: '分配对象', width: 'auto', minWidth: 100 },
        { prop: 'targetName', label: '对象名称', width: 'auto', minWidth: 140 },
        { prop: 'amount', label: '分配金额', width: 'auto', minWidth: 100 },
        { prop: 'assignTime', label: '分配时间', width: 'auto', minWidth: 170 },
        { prop: 'operatorName', label: '操作人', width: 'auto', minWidth: 100 },
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

  const handleSearch = (p: Api.Dc.AssignRecordSearchParams) => {
    replaceSearchParams(handleSearchParams(p))
    getData()
  }

  const handleReset = () => {
    searchForm.value = {
      targetKeyword: undefined,
      assignType: undefined,
      timeRange: undefined
    }
    replaceSearchParams({ ...searchForm.value })
    getData()
  }
</script>
