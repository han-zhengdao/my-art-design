<!-- DC 充值记录 -->
<template>
  <div class="art-full-height">
    <ArtSearchBar
      ref="searchBarRef"
      v-model="searchForm"
      :items="searchItems"
      :rules="{}"
      :default-expanded="true"
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
        @sort-change="handleSortChange"
      />
    </ElCard>
    <ElDialog v-model="detailVisible" title="充值记录详情" width="680px" destroy-on-close>
      <ElDescriptions v-if="detailRow" :column="1" border>
        <ElDescriptionsItem label="ID">{{ detailRow.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="合作商名称">{{ detailRow.partnerName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="所属国家">{{ detailRow.country }}</ElDescriptionsItem>
        <ElDescriptionsItem label="联系人">{{ detailRow.contactName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="联系电话">{{ detailRow.phone }}</ElDescriptionsItem>
        <ElDescriptionsItem label="邮箱">{{ detailRow.email }}</ElDescriptionsItem>
        <ElDescriptionsItem label="充值额度">{{ detailRow.amount }}</ElDescriptionsItem>
        <ElDescriptionsItem label="充值时间">{{ detailRow.rechargeTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作人">{{ detailRow.operatorName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="充值流水号">{{ detailRow.serialNo }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDcRechargeRecordList } from '@/api/dc'
  import { h, ref, computed } from 'vue'

  defineOptions({ name: 'DcRechargeRecord' })

  type Row = Api.Dc.RechargeRecordItem

  const searchForm = ref<Api.Dc.RechargeRecordSearchParams>({
    partnerName: undefined,
    countryCode: undefined,
    timeRange: undefined
  })

  const countryOptions = [
    { label: '中国', value: 'CN' },
    { label: '美国', value: 'US' },
    { label: '日本', value: 'JP' },
    { label: '挪威', value: 'NO' },
    { label: '德国', value: 'DE' }
  ]

  const searchItems = computed(() => [
    {
      label: '合作商名称',
      key: 'partnerName',
      type: 'input',
      labelWidth: 'auto',
      span: 5,
      placeholder: '模糊搜索',
      clearable: true
    },
    {
      label: '所属国家',
      key: 'countryCode',
      type: 'select',
      labelWidth: 'auto',
      span: 4,
      props: { placeholder: '全部', clearable: true, options: countryOptions }
    },
    {
      label: '充值时间',
      key: 'timeRange',
      type: 'daterange',
      labelWidth: 'auto',
      span: 7,
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
      apiFn: fetchDcRechargeRecordList,
      apiParams: { current: 1, size: 20, ...searchForm.value },
      columnsFactory: () => [
        { type: 'index', label: '序号', width: 'auto', minWidth: 56 },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 80 },
        { prop: 'partnerName', label: '合作商名称', width: 'auto', minWidth: 150 },
        { prop: 'country', label: '所属国家', width: 'auto', minWidth: 90 },
        { prop: 'contactName', label: '联系人', width: 'auto', minWidth: 90 },
        { prop: 'phone', label: '联系电话', width: 'auto', minWidth: 130 },
        { prop: 'email', label: '邮箱', width: 'auto', minWidth: 180 },
        { prop: 'amount', label: '充值额度', width: 'auto', minWidth: 100 },
        {
          prop: 'rechargeTime',
          label: '充值时间',
          width: 'auto',
          minWidth: 170,
          sortable: 'custom'
        },
        { prop: 'operatorName', label: '操作人', width: 'auto', minWidth: 100 },
        { prop: 'serialNo', label: '充值流水号', width: 'auto', minWidth: 200 },
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

  const handleSearch = (p: Api.Dc.RechargeRecordSearchParams) => {
    const sp = searchParams as Record<string, unknown>
    replaceSearchParams({
      ...p,
      sortField: sp.sortField as string | undefined,
      sortOrder: sp.sortOrder as 'ascending' | 'descending' | undefined
    })
    getData()
  }

  const handleReset = () => {
    searchForm.value = { partnerName: undefined, countryCode: undefined, timeRange: undefined }
    const sp = searchParams as Record<string, unknown>
    sp.sortField = undefined
    sp.sortOrder = undefined
    replaceSearchParams({ ...searchForm.value })
    getData()
  }

  function handleSortChange(data: { prop: string; order: 'ascending' | 'descending' | null }) {
    const sp = searchParams as Record<string, unknown>
    if (!data.order) {
      sp.sortField = undefined
      sp.sortOrder = undefined
    } else if (data.prop === 'rechargeTime') {
      sp.sortField = 'rechargeTime'
      sp.sortOrder = data.order
    }
    sp.current = 1
    getData()
  }
</script>
