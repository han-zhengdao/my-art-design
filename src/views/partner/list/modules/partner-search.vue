<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    :button-left-limit="1"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { fetchCountryList, getCountryDisplayName } from '@/api/country'
  import { useUserStore } from '@/store/modules/user'
  import { LanguageEnum } from '@/enums/appEnum'

  interface Props {
    modelValue: Api.Partner.PartnerSearchParams
  }
  interface Emits {
    (e: 'update:modelValue', value: Api.Partner.PartnerSearchParams): void
    (e: 'search', params: Api.Partner.PartnerSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { t } = useI18n()
  const userStore = useUserStore()

  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  const countryList = ref<Api.Country.CountryListItem[]>([])
  const countriesLoading = ref(false)

  const countryLocale = computed<'zh' | 'en'>(() =>
    userStore.language === LanguageEnum.EN ? 'en' : 'zh'
  )

  const countryOptions = computed(() =>
    countryList.value.map((c) => ({
      value: c.id,
      label: getCountryDisplayName(c, countryLocale.value)
    }))
  )

  async function loadCountries() {
    countriesLoading.value = true
    try {
      countryList.value = await fetchCountryList()
    } finally {
      countriesLoading.value = false
    }
  }

  onMounted(() => {
    loadCountries()
  })

  const formItems = computed(() => [
    {
      label: t('partnerPage.search.partnerName'),
      key: 'partnerName',
      // 使用 auto 让 label 宽度按内容自适应，避免被固定 labelWidth 挤压换行
      labelWidth: 'auto',
      type: 'input',
      placeholder: t('partnerPage.search.partnerNamePlaceholder'),
      clearable: true
    },
    {
      label: t('partnerPage.search.country'),
      key: 'countryId',
      labelWidth: 'auto',
      span: 5,
      type: 'select',
      props: {
        placeholder: t('partnerPage.search.placeholderAll'),
        clearable: true,
        filterable: true,
        loading: countriesLoading.value,
        options: countryOptions.value
      }
    }
  ])

  const handleSearch = () => {
    emit('search', { ...formData.value })
  }

  const handleReset = () => {
    emit('reset')
  }
</script>
