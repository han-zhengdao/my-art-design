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
      label-width="100px"
    >
      <ElFormItem label="合作商名称" prop="partnerName">
        <ElInput v-model="form.partnerName" placeholder="请输入" maxlength="100" show-word-limit />
      </ElFormItem>
      <ElFormItem label="企业地址" prop="enterpriseAddress">
        <ElInput v-model="form.enterpriseAddress" placeholder="请输入企业地址" />
      </ElFormItem>
      <ElFormItem label="联系人" prop="contactName">
        <ElInput v-model="form.contactName" />
      </ElFormItem>
      <ElFormItem label="联系电话" prop="phone">
        <ElInput v-model="form.phone" />
      </ElFormItem>
      <ElFormItem label="所属国家" prop="countryCode">
        <ElSelect v-model="form.countryCode" placeholder="请选择" class="w-full">
          <ElOption
            v-for="opt in countryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="IoT Token" prop="iotToken">
        <ElInput v-model="form.iotToken" placeholder="请输入IoT Token" />
      </ElFormItem>
      <ElFormItem label="Tenant ID" prop="tenantId">
        <ElInput v-model="form.tenantId" placeholder="请输入Tenant ID" />
      </ElFormItem>
    </ElForm>

    <ElDescriptions v-else :column="1" class="border-g-200">
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="合作商名称">{{ detailRow?.partnerName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="企业地址">{{ detailRow?.enterpriseAddress }}</ElDescriptionsItem>
      <ElDescriptionsItem label="联系人">{{ detailRow?.contactName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="联系电话">{{ detailRow?.phone }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属国家">{{ detailRow?.country }}</ElDescriptionsItem>
      <ElDescriptionsItem label="IoT Token">{{ detailRow?.iotToken }}</ElDescriptionsItem>
      <ElDescriptionsItem label="Tenant ID">{{ detailRow?.tenantId }}</ElDescriptionsItem>
      <ElDescriptionsItem label="DC余额">{{ detailRow?.dcBalance }}</ElDescriptionsItem>
      <ElDescriptionsItem label="区域数">{{ detailRow?.regionCount }}</ElDescriptionsItem>
      <ElDescriptionsItem label="门店数">{{ detailRow?.storeCount }}</ElDescriptionsItem>
      <ElDescriptionsItem label="车轮总数">{{ detailRow?.wheelCount }}</ElDescriptionsItem>
      <ElDescriptionsItem label="信标总数">{{ detailRow?.beaconCount }}</ElDescriptionsItem>
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
  import type { FormInstance, FormRules } from 'element-plus'

  type DialogMode = 'add' | 'edit' | 'detail'

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Partner.PartnerListItem | null
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: Partial<Api.Partner.PartnerListItem>): void
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const countryOptions = [
    { label: '中国', value: 'CN' },
    { label: '美国', value: 'US' },
    { label: '日本', value: 'JP' },
    { label: '挪威', value: 'NO' },
    { label: '德国', value: 'DE' }
  ]

  const countryLabel = (code: string) => countryOptions.find((o) => o.value === code)?.label ?? code

  const dialogTitle = computed(() => {
    if (props.mode === 'add') return '新增合作商'
    if (props.mode === 'edit') return '编辑合作商'
    return '合作商详情'
  })

  const detailRow = computed(() => props.row ?? null)

  const formRef = ref<FormInstance>()
  const form = reactive({
    partnerName: '',
    countryCode: 'CN',
    iotToken: '',
    tenantId: '',
    contactName: '',
    phone: '',
    enterpriseAddress: '',
    regionCount: 0,
    storeCount: 0,
    wheelCount: 0
  })

  const formRules: FormRules = {
    partnerName: [{ required: true, message: '请输入合作商名称', trigger: 'blur' }],
    countryCode: [{ required: true, message: '请选择国家', trigger: 'change' }],
    iotToken: [{ required: true, message: '请输入IoT Token', trigger: 'blur' }],
    tenantId: [{ required: true, message: '请输入Tenant ID', trigger: 'blur' }],
    contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
    enterpriseAddress: [{ required: true, message: '请输入企业地址', trigger: 'blur' }]
  }

  watch(
    () => [props.modelValue, props.mode, props.row] as const,
    ([open, mode, row]) => {
      if (!open || mode === 'detail') return
      if (mode === 'edit' && row) {
        form.partnerName = row.partnerName
        form.countryCode = row.countryCode
        form.iotToken = row.iotToken
        form.tenantId = row.tenantId
        form.contactName = row.contactName
        form.phone = row.phone
        form.enterpriseAddress = row.enterpriseAddress
        form.regionCount = row.regionCount
        form.storeCount = row.storeCount
        form.wheelCount = row.wheelCount
      } else if (mode === 'add') {
        form.partnerName = ''
        form.countryCode = 'CN'
        form.iotToken = ''
        form.tenantId = ''
        form.contactName = ''
        form.phone = ''
        form.enterpriseAddress = ''
        form.regionCount = 0
        form.storeCount = 0
        form.wheelCount = 0
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
    emit('submit', {
      ...form,
      country: countryLabel(form.countryCode),
      id: props.row?.id
    })
    visible.value = false
  }
</script>
