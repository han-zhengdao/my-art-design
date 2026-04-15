<template>
  <ElDialog
    v-model="visible"
    :title="$t(dialogTitleKey)"
    :width="720"
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
      <ElStep :title="$t('partnerPage.dialog.stepInfo')" />
      <ElStep :title="$t('partnerPage.dialog.stepAccount')" />
    </ElSteps>

    <ElForm
      v-if="mode !== 'detail' && showPartnerForm"
      ref="partnerFormRef"
      :model="form"
      :rules="formRules"
      label-width="150px"
    >
      <ElFormItem :label="$t('partnerPage.dialog.partnerName')" prop="partnerName">
        <ElInput
          v-model="form.partnerName"
          :placeholder="$t('partnerPage.dialog.inputPlaceholder')"
          maxlength="100"
          show-word-limit
          :disabled="mode === 'edit'"
        />
      </ElFormItem>
      <ElFormItem :label="$t('partnerPage.dialog.address')" prop="enterpriseAddress">
        <ElInput
          v-model="form.enterpriseAddress"
          :placeholder="$t('partnerPage.dialog.addressPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('partnerPage.dialog.contactName')" prop="contactName">
        <ElInput
          v-model="form.contactName"
          :placeholder="$t('partnerPage.dialog.inputPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('partnerPage.dialog.phone')" prop="phone">
        <ElInput v-model="form.phone" :placeholder="$t('partnerPage.dialog.inputPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="$t('partnerPage.dialog.country')" prop="countryId">
        <ElSelect
          v-model="form.countryId"
          :placeholder="$t('partnerPage.dialog.selectCountry')"
          class="w-full"
          filterable
          :loading="countriesLoading"
        >
          <ElOption
            v-for="opt in countrySelectOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
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
          :title="$t('partnerPage.dialog.alertAccount')"
        />
      </div>
      <ElFormItem :label="$t('partnerPage.dialog.loginEmail')" prop="loginEmail">
        <ElInput
          v-model="accountForm.loginEmail"
          :placeholder="$t('partnerPage.dialog.loginEmailPlaceholder')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('partnerPage.dialog.loginPassword')" prop="loginPassword">
        <ElInput
          v-model="accountForm.loginPassword"
          type="password"
          show-password
          :placeholder="$t('partnerPage.dialog.loginPasswordPlaceholder')"
          autocomplete="new-password"
        />
      </ElFormItem>
    </ElForm>

    <ElDescriptions v-else-if="mode === 'detail'" :column="1" border>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.id')">{{
        detailRow?.id
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.loginEmail')">
        {{ detailRow?.loginEmail || $t('partnerPage.emptyText') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.partnerName')">{{
        detailRow?.partnerName
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.address')">{{
        detailRow?.enterpriseAddress || detailRow?.address || $t('partnerPage.emptyText')
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.contactName')">{{
        detailRow?.contactName || detailRow?.contact || $t('partnerPage.emptyText')
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.phone')">{{
        detailRow?.phone
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.country')">{{
        detailRow?.country
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.dcBalance')">{{
        detailRow?.dcBalance
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.regionCount')">{{
        detailRow?.regionCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.storeCount')">{{
        detailRow?.storeCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.wheelCount')">{{
        detailRow?.wheelCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="$t('partnerPage.dialog.detail.beaconCount')">{{
        detailRow?.beaconCount
      }}</ElDescriptionsItem>
    </ElDescriptions>

    <template #footer v-if="mode !== 'detail'">
      <template v-if="mode === 'add'">
        <ElButton @click="visible = false">{{ $t('partnerPage.dialog.footerCancel') }}</ElButton>
        <ElButton v-if="addStep === 1" @click="goPrevStep">{{
          $t('partnerPage.dialog.footerPrev')
        }}</ElButton>
        <ElButton v-if="addStep === 0" type="primary" @click="goNextStep">{{
          $t('partnerPage.dialog.footerNext')
        }}</ElButton>
        <ElButton v-if="addStep === 1" type="primary" @click="submitAdd">{{
          $t('partnerPage.dialog.footerConfirm')
        }}</ElButton>
      </template>
      <template v-else>
        <ElButton @click="visible = false">{{ $t('partnerPage.dialog.footerCancel') }}</ElButton>
        <ElButton type="primary" @click="submitEdit">{{
          $t('partnerPage.dialog.footerConfirm')
        }}</ElButton>
      </template>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { fetchCountryList, getCountryDisplayName } from '@/api/country'
  import { PARTNER_COUNTRY_CODE_TO_ID } from '@/api/partner'
  import { useUserStore } from '@/store/modules/user'
  import { LanguageEnum } from '@/enums/appEnum'

  type DialogMode = 'add' | 'edit' | 'detail'

  type PartnerDialogSubmitPayload = Partial<Api.Partner.PartnerListItem> & {
    country?: string
    countryId?: number
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

  const userStore = useUserStore()
  const { t } = useI18n()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const countryList = ref<Api.Country.CountryListItem[]>([])
  const countriesLoading = ref(false)

  const countryLocale = computed<'zh' | 'en'>(() =>
    userStore.language === LanguageEnum.EN ? 'en' : 'zh'
  )

  const countrySelectOptions = computed(() =>
    countryList.value.map((c) => ({
      label: getCountryDisplayName(c, countryLocale.value),
      value: c.id
    }))
  )

  function countryLabelById(cid: number | undefined): string {
    if (cid == null) return ''
    const row = countryList.value.find((c) => c.id === cid)
    return row ? getCountryDisplayName(row, countryLocale.value) : ''
  }

  const dialogTitleKey = computed(() => {
    if (props.mode === 'add') return 'partnerPage.dialog.titleAdd'
    if (props.mode === 'edit') return 'partnerPage.dialog.titleEdit'
    return 'partnerPage.dialog.titleDetail'
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
    countryId: undefined as number | undefined,
    contactName: '',
    phone: '',
    enterpriseAddress: '',
    regionCount: 0,
    storeCount: 0,
    wheelCount: 0
  })

  const accountForm = reactive({
    loginEmail: '',
    loginPassword: ''
  })

  const formRules = computed<FormRules>(() => ({
    partnerName: [
      { required: true, message: t('partnerPage.validation.partnerName'), trigger: 'blur' }
    ],
    countryId: [{ required: true, message: t('partnerPage.validation.country'), trigger: 'change' }]
  }))

  const accountRules = computed<FormRules>(() => ({
    loginEmail: [
      { required: true, message: t('partnerPage.validation.loginEmail'), trigger: 'blur' },
      { type: 'email', message: t('partnerPage.validation.emailFormat'), trigger: 'blur' }
    ],
    loginPassword: [
      { required: true, message: t('partnerPage.validation.loginPassword'), trigger: 'blur' },
      { min: 6, message: t('partnerPage.validation.passwordMin'), trigger: 'blur' }
    ]
  }))

  function resetAccountForm() {
    accountForm.loginEmail = ''
    accountForm.loginPassword = ''
  }

  watch(
    () => [props.modelValue, props.mode, props.row] as const,
    async ([open, mode, row]) => {
      if (!open || mode === 'detail') return

      countriesLoading.value = true
      try {
        const list = await fetchCountryList()
        countryList.value = list
      } finally {
        countriesLoading.value = false
      }

      if (mode === 'edit' && row) {
        addStep.value = 0
        form.partnerName = row.partnerName ?? ''
        form.countryId =
          row.countryId ??
          (row.countryCode ? PARTNER_COUNTRY_CODE_TO_ID[row.countryCode] : undefined) ??
          countryList.value[0]?.id
        form.contactName = row.contactName ?? row.contact ?? ''
        form.phone = row.phone ?? ''
        form.enterpriseAddress = row.enterpriseAddress ?? row.address ?? ''
        form.regionCount = row.regionCount ?? 0
        form.storeCount = row.storeCount ?? 0
        form.wheelCount = row.wheelCount ?? 0
      } else if (mode === 'add') {
        addStep.value = 0
        form.partnerName = ''
        form.countryId = countryList.value[0]?.id
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
      country: countryLabelById(form.countryId),
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
      country: countryLabelById(form.countryId),
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
