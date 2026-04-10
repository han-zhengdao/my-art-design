<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    :width="680"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElSteps
      v-if="mode === 'add'"
      :active="addStep"
      align-center
      finish-status="success"
      class="region-dialog-steps"
    >
      <ElStep title="区域信息" />
      <ElStep title="区域账户" />
    </ElSteps>

    <ElForm
      v-if="mode !== 'detail' && showRegionForm"
      ref="regionFormRef"
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

    <ElForm
      v-if="mode === 'add' && addStep === 1"
      ref="accountFormRef"
      :model="accountForm"
      :rules="accountRules"
      label-width="120px"
    >
      <div class="mb-4">
        <ElAlert
          type="info"
          :closable="false"
          show-icon
          title="将创建区域管理员账户，并同步至用户管理。"
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

    <ElDescriptions v-else-if="mode === 'detail'" :column="1" border>
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="用户昵称">
        {{ detailRow?.userNickName || '--' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="登录邮箱">
        {{ detailRow?.loginEmail || '--' }}
      </ElDescriptionsItem>
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
  import { fetchPartnersByCountry } from '@/api/partner'
  import type { FormInstance, FormRules } from 'element-plus'

  type DialogMode = 'add' | 'edit' | 'detail'

  type RegionDialogSubmitPayload = Partial<Api.Region.RegionListItem> & {
    userNickName?: string
    loginEmail?: string
    loginPassword?: string
  }

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Region.RegionListItem | null
    countryCode?: string
    lockedPartnerId?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: RegionDialogSubmitPayload): void
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

  const addStep = ref(0)
  const regionFormRef = ref<FormInstance>()
  const accountFormRef = ref<FormInstance>()

  const showRegionForm = computed(() => {
    if (props.mode === 'edit') return true
    if (props.mode === 'add') return addStep.value === 0
    return false
  })

  const form = reactive({
    regionName: '',
    regionAddress: '',
    regionContactName: '',
    regionPhone: '',
    countryCode: undefined as string | undefined,
    partnerId: undefined as number | undefined
  })

  const accountForm = reactive({
    userNickName: '',
    loginEmail: '',
    loginPassword: ''
  })

  const formRules: FormRules = {
    regionName: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
    regionAddress: [{ required: true, message: '请输入区域地址', trigger: 'blur' }],
    regionContactName: [{ required: true, message: '请输入区域联系人', trigger: 'blur' }],
    regionPhone: [{ required: true, message: '请输入区域联系电话', trigger: 'blur' }],
    countryCode: [{ required: true, message: '请选择所属国家', trigger: 'change' }],
    partnerId: [{ required: true, message: '请选择所属合作商', trigger: 'change' }]
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

  const countryOptions = [
    { label: '中国', value: 'CN' },
    { label: '美国', value: 'US' },
    { label: '日本', value: 'JP' },
    { label: '挪威', value: 'NO' },
    { label: '德国', value: 'DE' }
  ]

  const partnerOpts = ref<Api.Partner.PartnerListItem[]>([])

  function resetAccountForm() {
    accountForm.userNickName = ''
    accountForm.loginEmail = ''
    accountForm.loginPassword = ''
  }

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
    () => [props.modelValue, props.mode, props.row, props.countryCode] as const,
    ([open, mode, row, searchCountryCode]) => {
      if (!open || mode === 'detail') return
      if (mode === 'edit' && row) {
        addStep.value = 0
        form.regionName = row.regionName
        form.regionAddress = row.regionAddress
        form.regionContactName = row.regionContactName
        form.regionPhone = row.regionPhone
        form.countryCode = row.countryCode
        form.partnerId = row.partnerId
      } else if (mode === 'add') {
        addStep.value = 0
        form.regionName = ''
        form.regionAddress = ''
        form.regionContactName = ''
        form.regionPhone = ''
        form.countryCode = searchCountryCode
        form.partnerId = undefined
        resetAccountForm()
      }
    },
    { immediate: true }
  )

  const handleClosed = () => {
    addStep.value = 0
    regionFormRef.value?.resetFields()
    accountFormRef.value?.resetFields()
    resetAccountForm()
  }

  const goNextStep = async () => {
    if (!regionFormRef.value) return
    await regionFormRef.value.validate()
    addStep.value = 1
  }

  const goPrevStep = () => {
    addStep.value = 0
  }

  const submitAdd = async () => {
    if (!accountFormRef.value) return
    await accountFormRef.value.validate()
    const partner = partnerOpts.value.find((p) => p.id === form.partnerId)
    emit('submit', {
      regionName: form.regionName,
      regionAddress: form.regionAddress,
      regionContactName: form.regionContactName,
      regionPhone: form.regionPhone,
      partnerId: form.partnerId,
      partnerName: partner?.partnerName,
      country: partner?.country,
      countryCode: partner?.countryCode,
      userNickName: accountForm.userNickName.trim(),
      loginEmail: accountForm.loginEmail.trim(),
      loginPassword: accountForm.loginPassword
    })
    visible.value = false
  }

  const submitEdit = async () => {
    if (!regionFormRef.value) return
    await regionFormRef.value.validate()
    const partner = partnerOpts.value.find((p) => p.id === form.partnerId)
    emit('submit', {
      regionName: form.regionName,
      regionAddress: form.regionAddress,
      regionContactName: form.regionContactName,
      regionPhone: form.regionPhone,
      partnerId: form.partnerId,
      partnerName: partner?.partnerName,
      country: partner?.country,
      countryCode: partner?.countryCode,
      id: props.row?.id
    })
    visible.value = false
  }
</script>

<style scoped>
  .region-dialog-steps {
    margin-bottom: 20px;
  }

  .region-dialog-steps :deep(.el-step__title) {
    font-size: 16px;
    font-weight: 500;
    line-height: 2.4;
  }
</style>
