<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="50%"
    destroy-on-close
    @closed="handleClosed"
  >
    <ElForm
      v-if="mode !== 'detail'"
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
    >
      <ElFormItem label="区域名称" prop="regionName">
        <ElInput v-model="form.regionName" placeholder="请输入" maxlength="100" show-word-limit />
      </ElFormItem>
      <ElFormItem label="区域地址" prop="regionAddress">
        <ElInput v-model="form.regionAddress" type="textarea" :rows="2" placeholder="请输入" />
      </ElFormItem>
      <ElFormItem label="区域联系人" prop="regionContactName">
        <ElInput v-model="form.regionContactName" placeholder="请输入" />
      </ElFormItem>
      <ElFormItem label="区域联系电话" prop="regionPhone">
        <ElInput v-model="form.regionPhone" placeholder="请输入" />
      </ElFormItem>
      <ElFormItem label="所属国家" prop="countryCode">
        <ElSelect v-model="form.countryCode" placeholder="请选择所属国家" class="w-full">
          <ElOption
            v-for="opt in countryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="所属合作商" prop="partnerId">
        <ElSelect
          v-model="form.partnerId"
          :placeholder="form.countryCode ? '请选择合作商' : '请先选择所属国家'"
          class="w-full"
          :disabled="!form.countryCode"
        >
          <ElOption v-for="p in partnerOpts" :key="p.id" :label="p.partnerName" :value="p.id" />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <ElDescriptions v-else :column="1" class="border-g-200">
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="区域名称">{{ detailRow?.regionName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="区域地址">{{ detailRow?.regionAddress }}</ElDescriptionsItem>
      <ElDescriptionsItem label="区域联系人">{{ detailRow?.regionContactName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="区域联系电话">{{ detailRow?.regionPhone }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属合作商">{{ detailRow?.partnerName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属国家">{{ detailRow?.country }}</ElDescriptionsItem>
      <ElDescriptionsItem label="DC余额">{{ detailRow?.dcBalance }}</ElDescriptionsItem>
      <ElDescriptionsItem label="门店数">{{ detailRow?.storeCount }}</ElDescriptionsItem>
      <ElDescriptionsItem label="车轮总数">{{ detailRow?.wheelCount }}</ElDescriptionsItem>
      <ElDescriptionsItem label="信标总数">{{ detailRow?.beaconCount }}</ElDescriptionsItem>
      <ElDescriptionsItem label="未处理工单数">{{
        detailRow?.pendingTicketCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">{{ detailRow?.createTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作人">{{ detailRow?.operatorName }}</ElDescriptionsItem>
    </ElDescriptions>

    <template #footer v-if="mode !== 'detail'">
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" @click="submit">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { fetchPartnersByCountry } from '@/api/partner'
  import type { FormInstance, FormRules } from 'element-plus'

  type DialogMode = 'add' | 'edit' | 'detail'

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Region.RegionListItem | null
    /** 新增时由列表页搜索栏传入，用于加载合作商下拉 */
    countryCode?: string
    /** 合作商管理员绑定的合作商，有值时锁定所属合作商 */
    lockedPartnerId?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: Partial<Api.Region.RegionListItem>): void
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const dialogTitle = computed(() => {
    if (props.mode === 'add') return '新增区域'
    if (props.mode === 'edit') return '编辑区域'
    return '区域详情'
  })

  const detailRow = computed(() => props.row)

  const formRef = ref<FormInstance>()
  const form = reactive({
    regionName: '',
    regionAddress: '',
    regionContactName: '',
    regionPhone: '',
    countryCode: undefined as string | undefined,
    partnerId: undefined as number | undefined
  })

  const formRules: FormRules = {
    regionName: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
    regionAddress: [{ required: true, message: '请输入区域地址', trigger: 'blur' }],
    regionContactName: [{ required: true, message: '请输入区域联系人', trigger: 'blur' }],
    regionPhone: [{ required: true, message: '请输入区域联系电话', trigger: 'blur' }],
    countryCode: [{ required: true, message: '请选择所属国家', trigger: 'change' }],
    partnerId: [{ required: true, message: '请选择所属合作商', trigger: 'change' }]
  }

  const countryOptions = [
    { label: '中国', value: 'CN' },
    { label: '美国', value: 'US' },
    { label: '日本', value: 'JP' },
    { label: '挪威', value: 'NO' },
    { label: '德国', value: 'DE' }
  ]

  const partnerOpts = ref<Api.Partner.PartnerListItem[]>([])

  watch(
    () => [visible.value, form.countryCode, props.lockedPartnerId] as const,
    async () => {
      if (!visible.value || props.mode === 'detail') return
      const code = form.countryCode
      if (!code) {
        partnerOpts.value = []
        form.partnerId = undefined
        return
      }
      let list = await fetchPartnersByCountry(code)
      if (props.lockedPartnerId != null) {
        list = list.filter((p) => p.id === props.lockedPartnerId)
      }
      partnerOpts.value = list
      if (form.partnerId != null && !list.some((p) => p.id === form.partnerId)) {
        form.partnerId = undefined
      }
    },
    { immediate: true }
  )

  watch(
    () => [props.mode, props.row, visible.value] as const,
    () => {
      if (!visible.value) return
      if (props.mode === 'add') {
        form.regionName = ''
        form.regionAddress = ''
        form.regionContactName = ''
        form.regionPhone = ''
        form.countryCode = props.countryCode
        form.partnerId = undefined
      } else if (props.row && props.mode === 'edit') {
        form.regionName = props.row.regionName
        form.regionAddress = props.row.regionAddress
        form.regionContactName = props.row.regionContactName
        form.regionPhone = props.row.regionPhone
        form.countryCode = props.row.countryCode
        form.partnerId = props.row.partnerId
      }
    },
    { immediate: true }
  )

  const handleClosed = () => {
    formRef.value?.resetFields()
  }

  const submit = async () => {
    if (!formRef.value) return
    await formRef.value.validate()
    const partner = partnerOpts.value.find((p) => p.id === form.partnerId)
    emit('submit', {
      regionName: form.regionName,
      regionAddress: form.regionAddress,
      regionContactName: form.regionContactName,
      regionPhone: form.regionPhone,
      partnerId: form.partnerId,
      partnerName: partner?.partnerName,
      country: partner?.country,
      countryCode: partner?.countryCode
    })
    visible.value = false
  }
</script>
