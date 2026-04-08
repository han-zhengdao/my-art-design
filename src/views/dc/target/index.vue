<!-- DC 充值对象 -->
<template>
  <div class="dc-target-page art-full-height">
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

    <ElDialog v-model="detailVisible" title="合作商详情" width="560px" destroy-on-close>
      <ElDescriptions v-if="detailRow" :column="1" border>
        <ElDescriptionsItem label="合作商ID">{{ detailRow.partnerId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="合作商名称">{{ detailRow.partnerName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="所属国家">{{ detailRow.country }}</ElDescriptionsItem>
        <ElDescriptionsItem label="联系人">{{ detailRow.contactName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="联系电话">{{ detailRow.phone }}</ElDescriptionsItem>
        <ElDescriptionsItem label="邮箱">{{ detailRow.email }}</ElDescriptionsItem>
        <ElDescriptionsItem label="DC余额">{{ detailRow.dcBalance }}</ElDescriptionsItem>
        <ElDescriptionsItem label="可分配余额">{{
          detailRow.allocatableBalance
        }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>

    <ElDialog v-model="rechargeDcVisible" title="充值 DC" width="440px" destroy-on-close>
      <ElForm label-position="top">
        <ElFormItem label="合作商名称">
          <ElInput :model-value="actionRow?.partnerName" disabled />
        </ElFormItem>
        <ElFormItem label="可分配 DC 余额">
          <ElInput :model-value="String(actionRow?.allocatableBalance ?? '')" disabled />
        </ElFormItem>
        <ElFormItem label="充值额度" required>
          <ElInputNumber v-model="rechargeDcForm.amount" :min="1" :precision="0" class="!w-full" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="rechargeDcVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitRechargeDc">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="priceVisible" title="单价设置" width="480px" destroy-on-close>
      <ElForm label-position="top">
        <ElFormItem label="GPS 信息 / 条（DC）">
          <ElInputNumber v-model="priceForm.gpsPerRow" :min="0" :precision="2" class="!w-full" />
        </ElFormItem>
        <ElFormItem label="信标信息 / 条（DC）">
          <ElInputNumber v-model="priceForm.beaconPerRow" :min="0" :precision="2" class="!w-full" />
        </ElFormItem>
        <ElFormItem label="预警 DC 额度">
          <ElInputNumber
            v-model="priceForm.minBalanceDc"
            :min="0"
            :precision="0"
            class="!w-full"
            placeholder="例如 100"
          />
          <p class="mt-2 text-xs leading-relaxed text-g-500 dark:text-g-400">
            设置 DC 额度阈值：当合作商 DC 余额低于该数值时，系统将提醒用户处理（如充值）。
          </p>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="priceVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitPrice">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="assignVisible" title="DC 分配" width="480px" destroy-on-close>
      <ElForm label-position="top">
        <ElFormItem label="分配类型" required>
          <ElRadioGroup v-model="assignForm.assignType">
            <ElRadio value="REGION">区域</ElRadio>
            <ElRadio value="STORE">门店</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="分配对象" required>
          <ElSelect v-model="assignForm.targetName" placeholder="请选择" class="w-full" filterable>
            <ElOption v-for="opt in assignTargetOptions" :key="opt" :label="opt" :value="opt" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="可分配 DC 余额">
          <ElInput :model-value="String(actionRow?.allocatableBalance ?? '')" disabled />
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
  import { useTable } from '@/hooks/core/useTable'
  import { fetchDcRechargeTargetList } from '@/api/dc'
  import { ElMessage } from 'element-plus'
  import { computed, h, ref } from 'vue'
  import DcTargetActions from './modules/dc-target-actions.vue'

  defineOptions({ name: 'DcTarget' })

  type Row = Api.Dc.RechargeTargetItem

  const searchBarRef = ref()
  const searchForm = ref<Api.Dc.RechargeTargetSearchParams>({
    partnerName: undefined,
    countryCode: undefined
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
      span: 6,
      placeholder: '支持模糊搜索',
      clearable: true
    },
    {
      label: '所属国家',
      key: 'countryCode',
      type: 'select',
      labelWidth: 'auto',
      span: 4,
      props: { placeholder: '全部', clearable: true, options: countryOptions }
    }
  ])

  const detailVisible = ref(false)
  const detailRow = ref<Row | null>(null)
  const actionRow = ref<Row | null>(null)

  const rechargeDcVisible = ref(false)
  const rechargeDcForm = ref({ amount: undefined as number | undefined })

  const priceVisible = ref(false)
  const priceForm = ref({
    gpsPerRow: 0.1,
    beaconPerRow: 0.05,
    /** 低于该 DC 额度时触发余额提醒 */
    minBalanceDc: 100 as number | undefined
  })

  const assignVisible = ref(false)
  const assignForm = ref({
    assignType: 'REGION' as 'REGION' | 'STORE',
    targetName: '',
    amount: undefined as number | undefined
  })

  const assignTargetOptions = computed(() => {
    if (assignForm.value.assignType === 'REGION') {
      return ['华东一区', '西南运营中心', '加州湾区', '无区域']
    }
    return ['浦东旗舰店', '成都高新店', 'SF Bay Store', 'Oslo Downtown']
  })

  function openDetail(row: Row) {
    detailRow.value = row
    detailVisible.value = true
  }

  function openRechargeDc(row: Row) {
    actionRow.value = row
    rechargeDcForm.value = { amount: undefined }
    rechargeDcVisible.value = true
  }

  function openPrice(row: Row) {
    actionRow.value = row
    priceVisible.value = true
  }

  function openAssign(row: Row) {
    actionRow.value = row
    assignForm.value = { assignType: 'REGION', targetName: '', amount: undefined }
    assignVisible.value = true
  }

  function submitRechargeDc() {
    if (rechargeDcForm.value.amount == null || rechargeDcForm.value.amount <= 0) {
      ElMessage.warning('请输入有效充值额度')
      return
    }
    ElMessage.success('充值已提交（Mock）')
    rechargeDcVisible.value = false
  }

  function submitPrice() {
    if (priceForm.value.minBalanceDc == null || priceForm.value.minBalanceDc < 0) {
      ElMessage.warning('请填写有效的预警 DC 额度（≥0）')
      return
    }
    ElMessage.success('单价与预警额度已保存（Mock）')
    priceVisible.value = false
  }

  function submitAssign() {
    if (
      !assignForm.value.targetName ||
      assignForm.value.amount == null ||
      assignForm.value.amount <= 0
    ) {
      ElMessage.warning('请完善分配信息')
      return
    }
    ElMessage.success('分配已提交（Mock）')
    assignVisible.value = false
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
      apiFn: fetchDcRechargeTargetList,
      apiParams: { current: 1, size: 20, ...searchForm.value },
      columnsFactory: () => [
        { type: 'index', width: 'auto', minWidth: 56, label: '序号' },
        { prop: 'partnerId', label: '合作商ID', width: 'auto', minWidth: 100 },
        { prop: 'partnerName', label: '合作商名称', width: 'auto', minWidth: 160 },
        { prop: 'country', label: '所属国家', width: 'auto', minWidth: 100 },
        { prop: 'contactName', label: '联系人', width: 'auto', minWidth: 100 },
        { prop: 'phone', label: '联系电话', width: 'auto', minWidth: 130 },
        { prop: 'email', label: '邮箱', width: 'auto', minWidth: 180 },
        { prop: 'dcBalance', label: 'DC余额', width: 'auto', minWidth: 100 },
        { prop: 'allocatableBalance', label: '可分配余额', width: 'auto', minWidth: 110 },
        {
          prop: 'operation',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: Row) =>
            h(DcTargetActions, {
              onDetail: () => openDetail(row),
              onRechargeDc: () => openRechargeDc(row),
              onPrice: () => openPrice(row),
              onAssign: () => openAssign(row)
            })
        }
      ]
    }
  })

  const handleSearch = (params: Api.Dc.RechargeTargetSearchParams) => {
    replaceSearchParams(params)
    getData()
  }

  const handleReset = () => {
    searchForm.value = { partnerName: undefined, countryCode: undefined }
    replaceSearchParams({ ...searchForm.value })
    getData()
  }
</script>
