<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    :is-expand="true"
    :show-expand="false"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { fetchPartnerList } from '@/api/partner'
  import { fetchRegionList } from '@/api/region'
  import { fetchCountryList, getCountryDisplayName } from '@/api/country'
  import { useUserStore } from '@/store/modules/user'
  import { LanguageEnum } from '@/enums/appEnum'

  interface Props {
    modelValue: Api.Store.StoreSearchParams
  }
  interface Emits {
    (e: 'update:modelValue', value: Api.Store.StoreSearchParams): void
    (e: 'search', params: Api.Store.StoreSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const userStore = useUserStore()
  const { t } = useI18n()

  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })
  const rules = {}

  const countryList = ref<Api.Country.CountryListItem[]>([])
  const countryLoading = ref(false)
  const countryLocale = computed<'zh' | 'en'>(() =>
    userStore.language === LanguageEnum.EN ? 'en' : 'zh'
  )
  const countryOptions = computed(() =>
    countryList.value.map((country) => ({
      label: getCountryDisplayName(country, countryLocale.value),
      value: country.id
    }))
  )

  const partnerOptions = ref<Api.Partner.PartnerListItem[]>([])
  const regionOptions = ref<{ label: string; value: number | 'NONE' }[]>([])

  async function loadCountries() {
    countryLoading.value = true
    try {
      countryList.value = await fetchCountryList()
    } finally {
      countryLoading.value = false
    }
  }

  async function loadPartnerOptions(countryId?: number) {
    if (countryId == null) {
      partnerOptions.value = []
      return
    }
    const res = await fetchPartnerList({ pageNum: 1, pageSize: 500, countryId })
    partnerOptions.value = res.records
  }

  async function loadRegionOptions(partnerId?: number, countryId?: number) {
    if (partnerId == null) {
      regionOptions.value = []
      return
    }
    const list = await fetchRegionList({ current: 1, size: 500, partnerId, countryId })
    const opts = list.records.map((r) => ({ label: r.regionName, value: r.id as number }))
    // 区域下拉固定提供“无区域”选项
    regionOptions.value = [...opts, { label: t('storePage.common.noRegion'), value: 'NONE' }]
  }

  watch(
    () => formData.value.countryId,
    async (countryId, prev) => {
      if (countryId !== prev) {
        emit('update:modelValue', {
          ...formData.value,
          partnerId: undefined,
          regionId: undefined
        })
      }
      await loadPartnerOptions(countryId)
      regionOptions.value = []
    },
    { immediate: true }
  )

  watch(countryLocale, () => {
    // 语言切换后仅需刷新文案，列表数据复用缓存
    void loadCountries()
  })

  onMounted(() => {
    void loadCountries()
  })

  watch(
    () => [formData.value.partnerId, formData.value.countryId] as const,
    async ([partnerId, countryId], oldValue) => {
      const prevPartnerId = oldValue?.[0]
      if (partnerId !== prevPartnerId) {
        emit('update:modelValue', { ...formData.value, regionId: undefined })
      }
      await loadRegionOptions(partnerId, countryId)
    },
    { immediate: true }
  )

  const formItems = computed(() => [
    {
      label: t('storePage.search.storeName'),
      key: 'storeName',
      labelWidth: 'auto',
      type: 'input',
      placeholder: t('storePage.search.storeNamePlaceholder'),
      clearable: true
    },
    {
      label: t('storePage.search.country'),
      key: 'countryId',
      labelWidth: 'auto',
      span: 4,
      type: 'select',
      props: {
        placeholder: t('storePage.search.placeholderAll'),
        clearable: true,
        loading: countryLoading.value,
        filterable: true,
        options: countryOptions.value
      }
    },
    {
      label: t('storePage.search.partner'),
      key: 'partnerId',
      span: 4,
      type: 'select',
      labelWidth: 'auto',
      props: {
        placeholder: formData.value.countryId
          ? t('storePage.search.placeholderAll')
          : t('storePage.search.placeholderSelectCountryFirst'),
        clearable: true,
        disabled: !formData.value.countryId,
        options: partnerOptions.value.map((p) => ({ label: p.partnerName, value: p.id }))
      }
    },
    {
      label: t('storePage.search.region'),
      key: 'regionId',
      span: 4,
      type: 'select',
      labelWidth: 'auto',
      props: {
        placeholder: formData.value.partnerId
          ? t('storePage.search.placeholderAll')
          : t('storePage.search.placeholderSelectPartnerFirst'),
        clearable: true,
        disabled: !formData.value.partnerId,
        options: regionOptions.value
      }
    }
  ])

  const handleSearch = () => {
    emit('search', { ...formData.value })
  }

  const handleReset = () => {
    partnerOptions.value = []
    regionOptions.value = []
    emit('reset')
  }
</script>
