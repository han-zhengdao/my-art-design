<!-- DC 分配 -->
<template>
  <div class="dc-allocate-page art-full-height">
    <ElRow :gutter="16" class="mb-4">
      <ElCol :xs="24" :sm="12" :md="12">
        <ElCard shadow="never" class="border border-g-200/80 dark:border-g-600/50">
          <div class="text-sm text-g-500 dark:text-g-400 mb-1">DC 余额</div>
          <div class="text-2xl font-semibold text-g-800 dark:text-g-100 tabular-nums">
            {{ summary.dcBalance.toLocaleString() }}
          </div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :sm="12" :md="12">
        <ElCard shadow="never" class="border border-g-200/80 dark:border-g-600/50">
          <div class="text-sm text-g-500 dark:text-g-400 mb-1">可分配 DC 余额</div>
          <div class="text-2xl font-semibold text-theme tabular-nums">
            {{ summary.allocatableBalance.toLocaleString() }}
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :rules="{}"
      :is-expand="true"
      :show-expand="false"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="onRefresh" />
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ElDialog v-model="detailVisible" title="详情" width="680px" destroy-on-close>
      <ElDescriptions v-if="detailRow" :column="1" border>
        <ElDescriptionsItem label="ID">{{ detailRow.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="分配对象">{{
          assignTypeLabel(detailRow.assignType)
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="对象名称">{{ detailRow.targetName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="账户邮箱">{{ detailRow.email }}</ElDescriptionsItem>
        <ElDescriptionsItem label="联系人">{{ detailRow.contactName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="联系电话">{{ detailRow.phone }}</ElDescriptionsItem>
        <ElDescriptionsItem v-if="detailRow.currentDcBalance != null" label="当前 DC 余额">{{
          detailRow.currentDcBalance
        }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>

    <ElDialog v-model="assignVisible" title="分配 DC" width="480px" destroy-on-close>
      <ElForm label-position="top">
        <ElFormItem label="分配对象">
          <ElInput :model-value="assignTypeLabel(actionRow?.assignType)" disabled />
        </ElFormItem>
        <ElFormItem label="对象名称">
          <ElInput :model-value="actionRow?.targetName" disabled />
        </ElFormItem>
        <ElFormItem label="可分配 DC 余额">
          <ElInput :model-value="String(summary.allocatableBalance)" disabled />
        </ElFormItem>
        <ElFormItem label="分配额度" required>
          <ElInputNumber v-model="assignForm.amount" :min="1" :precision="0" class="!w-full" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="assignVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitAssign">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { applyDcAllocateMock, fetchDcAllocateSummary, fetchDcAllocateTargetList } from '@/api/dc'
  import { ElButton, ElMessage } from 'element-plus'
  import { computed, h, onMounted, ref } from 'vue'

  defineOptions({ name: 'DcAllocate' })

  type Row = Api.Dc.AllocateTargetItem

  const searchForm = ref<Api.Dc.AllocateTargetSearchParams>({
    targetKeyword: undefined,
    assignType: undefined
  })

  const typeFilterOptions = [
    { label: '全部', value: '' },
    { label: '区域', value: 'REGION' },
    { label: '门店', value: 'STORE' }
  ]

  const searchItems = computed(() => [
    {
      label: '对象名称 / 邮箱 / 联系人',
      key: 'targetKeyword',
      type: 'input',
      labelWidth: 'auto',
      span: 8,
      placeholder: '支持模糊搜索',
      clearable: true
    },
    {
      label: '分配对象',
      key: 'assignType',
      type: 'select',
      labelWidth: 'auto',
      span: 5,
      props: { placeholder: '全部', clearable: true, options: typeFilterOptions }
    }
  ])

  const summary = ref<Api.Dc.AllocateSummary>({ dcBalance: 0, allocatableBalance: 0 })

  async function loadSummary() {
    const s = await fetchDcAllocateSummary()
    summary.value = s
  }

  onMounted(() => {
    loadSummary()
  })

  function assignTypeLabel(t?: Api.Dc.AssignTargetType) {
    if (t === 'REGION') return '区域'
    if (t === 'STORE') return '门店'
    return '--'
  }

  const detailVisible = ref(false)
  const detailRow = ref<Row | null>(null)
  const assignVisible = ref(false)
  const actionRow = ref<Row | null>(null)
  const assignForm = ref({ amount: undefined as number | undefined })

  function openDetail(row: Row) {
    detailRow.value = row
    detailVisible.value = true
  }

  function openAssign(row: Row) {
    actionRow.value = row
    assignForm.value = { amount: undefined }
    assignVisible.value = true
  }

  function submitAssign() {
    const amt = assignForm.value.amount
    if (amt == null || amt <= 0) {
      ElMessage.warning('请输入有效分配额度')
      return
    }
    if (amt > summary.value.allocatableBalance) {
      ElMessage.warning('分配额度不能超过可分配 DC 余额')
      return
    }
    applyDcAllocateMock(amt)
    ElMessage.success('分配已提交（Mock）')
    assignVisible.value = false
    loadSummary()
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
      apiFn: fetchDcAllocateTargetList,
      apiParams: { current: 1, size: 20, ...searchForm.value },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 72 },
        {
          prop: 'assignType',
          label: '分配对象',
          width: 'auto',
          minWidth: 96,
          formatter: (row: Row) => assignTypeLabel(row.assignType)
        },
        { prop: 'targetName', label: '对象名称', width: 'auto', minWidth: 140 },
        { prop: 'email', label: '邮箱账户', width: 'auto', minWidth: 180 },
        { prop: 'contactName', label: '联系人', width: 'auto', minWidth: 100 },
        { prop: 'phone', label: '联系电话', width: 'auto', minWidth: 130 },
        {
          prop: 'operation',
          label: '操作',
          width: 220,
          fixed: 'right',
          formatter: (row: Row) =>
            h('div', { class: 'flex flex-wrap items-center gap-1' }, [
              h(ArtButtonTable, {
                type: 'view',
                onClick: () => openDetail(row)
              }),
              h(
                ElButton,
                {
                  type: 'primary',
                  class: '!h-8 px-3 text-sm rounded-md',
                  onClick: () => openAssign(row)
                },
                () => '分配DC'
              )
            ])
        }
      ]
    }
  })

  const handleSearchParams = (p: Api.Dc.AllocateTargetSearchParams) => {
    const next = { ...p }
    if (next.assignType === ('' as Api.Dc.AssignTargetType)) next.assignType = undefined
    return next
  }

  const handleSearch = (params: Api.Dc.AllocateTargetSearchParams) => {
    replaceSearchParams(handleSearchParams(params))
    getData()
  }

  const handleReset = () => {
    searchForm.value = { targetKeyword: undefined, assignType: undefined }
    replaceSearchParams(handleSearchParams({ ...searchForm.value }))
    getData()
  }

  function onRefresh() {
    loadSummary()
    refreshData()
  }
</script>
