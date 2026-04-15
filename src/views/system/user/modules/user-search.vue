<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    :default-expanded="true"
    @reset="handleReset"
    @search="handleSearch"
  >
    <template #partnerId>
      <ElSelect
        v-model="orgForm.partnerId"
        :placeholder="t('systemUser.search.selectPartner')"
        filterable
        clearable
        :loading="loadingPartner"
        class="!w-full"
        @change="onPartnerChange"
      >
        <ElOption v-for="p in partnerOptions" :key="p.id" :label="p.name" :value="p.id" />
      </ElSelect>
    </template>
    <template #regionId>
      <ElSelect
        v-model="orgForm.regionId"
        :placeholder="t('systemUser.search.selectRegion')"
        filterable
        clearable
        :loading="loadingRegion"
        :disabled="regionSelectDisabled"
        class="!w-full"
        @change="onRegionChange"
      >
        <ElOption v-for="r in regionOptions" :key="r.id" :label="r.name" :value="r.id" />
      </ElSelect>
    </template>
    <template #storeId>
      <ElSelect
        v-model="orgForm.storeId"
        :placeholder="t('systemUser.search.selectStore')"
        filterable
        clearable
        :loading="loadingStore"
        :disabled="storeSelectDisabled"
        class="!w-full"
        @change="emitOrgToParent"
      >
        <ElOption v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
      </ElSelect>
    </template>
  </ArtSearchBar>
</template>

<script setup lang="ts">
  import { useOrgCascadeOptions, type OrgCascadeFormSlice } from '@/hooks/useOrgCascadeOptions'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  interface Props {
    modelValue: Api.SystemManage.UserSearchParams
  }
  interface Emits {
    (e: 'update:modelValue', value: Api.SystemManage.UserSearchParams): void
    (e: 'search', params: Api.SystemManage.UserSearchParams): void
    (e: 'reset'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  const orgForm = reactive<OrgCascadeFormSlice>({})
  const {
    partnerOptions,
    regionOptions,
    storeOptions,
    loadingPartner,
    loadingRegion,
    loadingStore,
    loadPartners,
    handlePartnerChange,
    handleRegionChange,
    hydrateFromForm
  } = useOrgCascadeOptions(orgForm)

  const hasPartner = () => orgForm.partnerId != null && orgForm.partnerId! > 0
  const hasRegion = () => orgForm.regionId != null && orgForm.regionId! > 0
  const regionSelectDisabled = computed(() => !hasPartner())
  const storeSelectDisabled = computed(() => !hasPartner() || !hasRegion())

  onMounted(() => {
    void loadPartners()
  })

  watch(
    () =>
      [props.modelValue.partnerId, props.modelValue.regionId, props.modelValue.storeId] as const,
    async ([p, r, s]) => {
      if (orgForm.partnerId === p && orgForm.regionId === r && orgForm.storeId === s) {
        return
      }
      Object.assign(orgForm, { partnerId: p, regionId: r, storeId: s })
      await hydrateFromForm()
    },
    { flush: 'post' }
  )

  function emitOrgToParent() {
    emit('update:modelValue', {
      ...props.modelValue,
      partnerId: orgForm.partnerId,
      regionId: orgForm.regionId,
      storeId: orgForm.storeId
    })
  }

  function onPartnerChange() {
    handlePartnerChange()
    emitOrgToParent()
  }

  function onRegionChange() {
    handleRegionChange()
    emitOrgToParent()
  }

  const userTypeOptions = computed(() => [
    { label: t('systemUser.userTypes.ALL'), value: '' },
    { label: t('systemUser.userTypes.SUPER'), value: 'SUPER' },
    { label: t('systemUser.userTypes.PARTNER'), value: 'PARTNER' },
    { label: t('systemUser.userTypes.REGION'), value: 'REGION' },
    { label: t('systemUser.userTypes.STORE'), value: 'STORE' }
  ])

  const formItems = computed(() => [
    {
      label: t('systemUser.search.name'),
      key: 'nickName',
      type: 'input',
      span: 5,
      labelWidth: 'auto',
      placeholder: t('systemUser.search.namePlaceholder'),
      clearable: true
    },
    {
      label: t('systemUser.search.email'),
      key: 'email',
      type: 'input',
      span: 5,
      labelWidth: 'auto',
      placeholder: t('systemUser.search.emailPlaceholder'),
      clearable: true
    },
    {
      label: t('systemUser.search.partner'),
      key: 'partnerId',
      type: 'input',
      labelWidth: 'auto',
      span: 5
    },
    {
      label: t('systemUser.search.region'),
      key: 'regionId',
      type: 'input',
      labelWidth: 'auto',
      span: 5
    },
    {
      label: t('systemUser.search.store'),
      key: 'storeId',
      type: 'input',
      labelWidth: 'auto',
      span: 5
    },
    {
      label: t('systemUser.search.userType'),
      key: 'userType',
      type: 'select',
      labelWidth: 'auto',
      span: 4,
      props: {
        placeholder: t('systemUser.search.placeholderAllUserTypes'),
        clearable: true,
        options: userTypeOptions.value
      }
    }
  ])

  function handleReset() {
    emit('reset')
  }

  async function handleSearch(params: Api.SystemManage.UserSearchParams) {
    await searchBarRef.value.validate()
    emit('search', params)
  }
</script>
