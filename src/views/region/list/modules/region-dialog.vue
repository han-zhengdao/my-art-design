<template>
  <ElDialog
    v-model="visible"
    :title="$t(dialogTitleKey)"
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
      <ElStep :title="$t('regionPage.dialog.stepInfo')" />
      <ElStep :title="$t('regionPage.dialog.stepAccount')" />
    </ElSteps>

    <ElForm
      v-if="mode !== 'detail' && showRegionForm"
      ref="regionFormRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
    >
      <ElFormItem :label="$t('regionPage.dialog.regionName')" prop="regionName">
        <ElInput
          v-model="form.regionName"
          :placeholder="$t('regionPage.dialog.inputPlaceholder')"
          maxlength="100"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem
        v-if="mode === 'add' && lockedPartnerId == null"
        :label="$t('regionPage.dialog.partner')"
        prop="partnerId"
      >
        <ElSelect
          v-model="form.partnerId"
          class="w-full"
          :placeholder="$t('regionPage.dialog.selectPartner')"
          filterable
          :loading="partnerLoading"
        >
          <ElOption v-for="opt in partnerOpts" :key="opt.id" :label="opt.name" :value="opt.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="$t('regionPage.dialog.regionAddress')" prop="regionAddress">
        <ElInput
          v-model="form.regionAddress"
          type="textarea"
          :rows="2"
          :placeholder="$t('regionPage.dialog.inputPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('regionPage.dialog.regionContactName')" prop="regionContactName">
        <ElInput
          v-model="form.regionContactName"
          :placeholder="$t('regionPage.dialog.inputPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('regionPage.dialog.regionPhone')" prop="regionPhone">
        <ElInput
          v-model="form.regionPhone"
          :placeholder="$t('regionPage.dialog.inputPlaceholder')"
        />
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
          :title="$t('regionPage.dialog.alertAccount')"
        />
      </div>
      <ElFormItem :label="$t('regionPage.dialog.loginEmail')" prop="loginEmail">
        <ElInput
          v-model="accountForm.loginEmail"
          :placeholder="$t('regionPage.dialog.loginEmailPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('regionPage.dialog.loginPassword')" prop="loginPassword">
        <ElInput
          v-model="accountForm.loginPassword"
          type="password"
          show-password
          :placeholder="$t('regionPage.dialog.loginPasswordPlaceholder')"
          autocomplete="new-password"
        />
      </ElFormItem>
    </ElForm>

    <ElDescriptions v-else-if="mode === 'detail'" :column="1" border>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.id')">{{
        detailRow?.id
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.loginEmail')">
        {{ detailRow?.loginEmail || $t('regionPage.emptyText') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.regionName')">{{
        detailRow?.regionName
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.regionAddress')">{{
        detailRow?.regionAddress
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.regionContactName')">{{
        detailRow?.regionContactName
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.regionPhone')">{{
        detailRow?.regionPhone
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.partnerName')">{{
        detailRow?.partnerName
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.country')">{{
        detailRow?.country
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.dcBalance')">{{
        detailRow?.dcBalance
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.storeCount')">{{
        detailRow?.storeCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.wheelCount')">{{
        detailRow?.wheelCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.beaconCount')">{{
        detailRow?.beaconCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.pendingTicketCount')">{{
        detailRow?.pendingTicketCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.createTime')">{{
        detailRow?.createTime
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('regionPage.dialog.detail.operatorName')">{{
        detailRow?.operatorName
      }}</ElDescriptionsItem>
    </ElDescriptions>

    <template #footer v-if="mode !== 'detail'">
      <template v-if="mode === 'add'">
        <ElButton @click="visible = false">{{ $t('regionPage.dialog.footerCancel') }}</ElButton>
        <ElButton v-if="addStep === 1" @click="goPrevStep">{{
          $t('regionPage.dialog.footerPrev')
        }}</ElButton>
        <ElButton v-if="addStep === 0" type="primary" @click="goNextStep">{{
          $t('regionPage.dialog.footerNext')
        }}</ElButton>
        <ElButton v-if="addStep === 1" type="primary" @click="submitAdd">{{
          $t('regionPage.dialog.footerConfirm')
        }}</ElButton>
      </template>
      <template v-else>
        <ElButton @click="visible = false">{{ $t('regionPage.dialog.footerCancel') }}</ElButton>
        <ElButton type="primary" @click="submitEdit">{{
          $t('regionPage.dialog.footerConfirm')
        }}</ElButton>
      </template>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { fetchListPartnerOptions } from '@/api/org-options'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

  type DialogMode = 'add' | 'edit' | 'detail'

  type RegionDialogSubmitPayload = Partial<Api.Region.RegionListItem> & {
    loginEmail?: string
    loginPassword?: string
  }

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Region.RegionListItem | null
    lockedPartnerId?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: RegionDialogSubmitPayload): void
  }>()
  const { t } = useI18n()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const dialogTitleKey = computed(() => {
    if (props.mode === 'add') return 'regionPage.dialog.titleAdd'
    if (props.mode === 'edit') return 'regionPage.dialog.titleEdit'
    return 'regionPage.dialog.titleDetail'
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
    partnerId: undefined as number | undefined
  })

  const accountForm = reactive({
    loginEmail: '',
    loginPassword: ''
  })

  const formRules = computed<FormRules>(() => {
    const base: FormRules = {
      regionName: [
        { required: true, message: t('regionPage.validation.regionName'), trigger: 'blur' }
      ],
      regionAddress: [
        { required: true, message: t('regionPage.validation.regionAddress'), trigger: 'blur' }
      ],
      regionContactName: [
        { required: true, message: t('regionPage.validation.regionContactName'), trigger: 'blur' }
      ],
      regionPhone: [
        { required: true, message: t('regionPage.validation.regionPhone'), trigger: 'blur' }
      ]
    }
    if (props.mode === 'add' && props.lockedPartnerId == null) {
      return {
        ...base,
        partnerId: [
          { required: true, message: t('regionPage.validation.partnerId'), trigger: 'change' }
        ]
      }
    }
    return base
  })

  const accountRules = computed<FormRules>(() => ({
    loginEmail: [
      { required: true, message: t('regionPage.validation.loginEmail'), trigger: 'blur' },
      { type: 'email', message: t('regionPage.validation.emailFormat'), trigger: 'blur' }
    ],
    loginPassword: [
      { required: true, message: t('regionPage.validation.loginPassword'), trigger: 'blur' },
      { min: 6, message: t('regionPage.validation.passwordMin'), trigger: 'blur' }
    ]
  }))

  const partnerOpts = ref<Api.Org.OptionItem[]>([])
  const partnerLoading = ref(false)

  function resetAccountForm() {
    accountForm.loginEmail = ''
    accountForm.loginPassword = ''
  }

  /** 新增区域：超管选择合作商；合作商账号使用锁定 partnerId */
  async function resolveAddPartnerContext(): Promise<void> {
    if (props.lockedPartnerId != null) {
      form.partnerId = props.lockedPartnerId
      partnerOpts.value = []
      return
    }
    partnerLoading.value = true
    try {
      partnerOpts.value = await fetchListPartnerOptions()
      form.partnerId = undefined
    } finally {
      partnerLoading.value = false
    }
  }

  watch(
    () => [props.modelValue, props.mode, props.row, props.lockedPartnerId] as const,
    async ([open, mode, row]) => {
      if (!open || mode === 'detail') return
      if (mode === 'edit' && row) {
        addStep.value = 0
        form.regionName = row.regionName
        form.regionAddress = row.regionAddress
        form.regionContactName = row.regionContactName
        form.regionPhone = row.regionPhone
      } else if (mode === 'add') {
        addStep.value = 0
        form.regionName = ''
        form.regionAddress = ''
        form.regionContactName = ''
        form.regionPhone = ''
        form.partnerId = undefined
        resetAccountForm()
        await resolveAddPartnerContext()
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
    if (form.partnerId == null) {
      ElMessage.warning(
        props.lockedPartnerId != null
          ? t('regionPage.messages.lockedPartnerMissing')
          : t('regionPage.messages.selectPartnerRequired')
      )
      return
    }
    emit('submit', {
      regionName: form.regionName,
      regionAddress: form.regionAddress,
      regionContactName: form.regionContactName,
      regionPhone: form.regionPhone,
      partnerId: form.partnerId,
      loginEmail: accountForm.loginEmail.trim(),
      loginPassword: accountForm.loginPassword
    })
    visible.value = false
  }

  const submitEdit = async () => {
    if (!regionFormRef.value) return
    await regionFormRef.value.validate()
    const row = props.row
    emit('submit', {
      regionName: form.regionName,
      regionAddress: form.regionAddress,
      regionContactName: form.regionContactName,
      regionPhone: form.regionPhone,
      partnerId: row?.partnerId,
      partnerName: row?.partnerName,
      country: row?.country,
      countryCode: row?.countryCode,
      id: row?.id
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
