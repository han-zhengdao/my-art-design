<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElSteps
      v-if="mode === 'add'"
      :active="addStep"
      align-center
      finish-status="success"
      class="partner-dialog-steps"
    >
      <ElStep title="合作商信息" />
      <ElStep title="合作商账户" />
    </ElSteps>

    <ElForm
      v-if="mode !== 'detail' && showPartnerForm"
      ref="partnerFormRef"
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

    <ElForm
      v-if="mode === 'add' && addStep === 1"
      ref="accountFormRef"
      :model="accountForm"
      :rules="accountRules"
      label-width="100px"
    >
      <div class="mb-4">
        <ElAlert
          type="info"
          :closable="false"
          show-icon
          title="将创建合作商管理员账户，并同步至「用户管理」。"
        />
      </div>
      <ElFormItem label="昵称" prop="userNickName">
        <ElInput v-model="accountForm.userNickName" placeholder="账户显示昵称" maxlength="50" />
      </ElFormItem>
      <ElFormItem label="登录邮箱" prop="loginEmail">
        <ElInput v-model="accountForm.loginEmail" placeholder="用于登录的邮箱" />
      </ElFormItem>
      <ElFormItem label="登录密码" prop="loginPassword">
        <ElInput
          v-model="accountForm.loginPassword"
          type="password"
          show-password
          placeholder="请设置登录密码"
          autocomplete="new-password"
        />
      </ElFormItem>
    </ElForm>

    <ElDescriptions v-else-if="mode === 'detail'" :column="1" class="border-g-200">
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="用户昵称">
        {{ detailRow?.userNickName || '--' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="登录邮箱">
        {{ detailRow?.loginEmail || '--' }}
      </ElDescriptionsItem>
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
      <template v-if="mode === 'add'">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton v-if="addStep === 1" @click="goPrevStep">上一步</ElButton>
        <ElButton v-if="addStep === 0" type="primary" @click="goNextStep">下一步</ElButton>
        <ElButton v-if="addStep === 1" type="primary" @click="submitAdd">确定</ElButton>
      </template>
      <template v-else>
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" @click="submitEdit">确定</ElButton>
      </template>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'

  type DialogMode = 'add' | 'edit' | 'detail'

  type PartnerDialogSubmitPayload = Partial<Api.Partner.PartnerListItem> & {
    country?: string
    userNickName?: string
    loginEmail?: string
    loginPassword?: string
  }

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Partner.PartnerListItem | null
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: PartnerDialogSubmitPayload): void
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

  const addStep = ref(0)
  const partnerFormRef = ref<FormInstance>()
  const accountFormRef = ref<FormInstance>()

  const showPartnerForm = computed(() => {
    if (props.mode === 'edit') return true
    if (props.mode === 'add') return addStep.value === 0
    return false
  })

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

  const accountForm = reactive({
    userNickName: '',
    loginEmail: '',
    loginPassword: ''
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

  const accountRules: FormRules = {
    userNickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    loginEmail: [
      { required: true, message: '请输入登录邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入有效邮箱', trigger: 'blur' }
    ],
    loginPassword: [
      { required: true, message: '请输入登录密码', trigger: 'blur' },
      { min: 6, message: '密码至少 6 位', trigger: 'blur' }
    ]
  }

  function resetAccountForm() {
    accountForm.userNickName = ''
    accountForm.loginEmail = ''
    accountForm.loginPassword = ''
  }

  watch(
    () => [props.modelValue, props.mode, props.row] as const,
    ([open, mode, row]) => {
      if (!open || mode === 'detail') return
      if (mode === 'edit' && row) {
        addStep.value = 0
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
        addStep.value = 0
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
        resetAccountForm()
      }
    },
    { immediate: true }
  )

  const handleClosed = () => {
    addStep.value = 0
    partnerFormRef.value?.resetFields()
    accountFormRef.value?.resetFields()
    resetAccountForm()
  }

  const goNextStep = async () => {
    if (!partnerFormRef.value) return
    await partnerFormRef.value.validate()
    addStep.value = 1
  }

  const goPrevStep = () => {
    addStep.value = 0
  }

  const submitAdd = async () => {
    if (!accountFormRef.value) return
    await accountFormRef.value.validate()
    emit('submit', {
      ...form,
      country: countryLabel(form.countryCode),
      userNickName: accountForm.userNickName.trim(),
      loginEmail: accountForm.loginEmail.trim(),
      loginPassword: accountForm.loginPassword
    })
    visible.value = false
  }

  const submitEdit = async () => {
    if (!partnerFormRef.value) return
    await partnerFormRef.value.validate()
    emit('submit', {
      ...form,
      country: countryLabel(form.countryCode),
      id: props.row?.id
    })
    visible.value = false
  }
</script>

<style scoped>
  .partner-dialog-steps {
    margin-bottom: 20px;
  }

  /* 步骤标题「合作商信息 / 合作商账户」文字颜色（随步骤状态区分） */
  .partner-dialog-steps :deep(.el-step__title) {
    font-size: 16px;
    font-weight: 500;
    line-height: 2.4;
  }

  /* .partner-dialog-steps :deep(.el-step.is-wait .el-step__title) {
    color: var(--el-text-color-secondary);
  }

  .partner-dialog-steps :deep(.el-step.is-process .el-step__title) {
    color: var(--color-g-200);
  }

  .partner-dialog-steps :deep(.el-step.is-finish .el-step__title) {
    color: var(--el-color-success);
  } */
</style>
