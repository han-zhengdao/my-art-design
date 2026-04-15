<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { fetchPartnerList } from '@/api/partner'
  import { fetchCountryList, getCountryDisplayName } from '@/api/country'
  import { useUserStore } from '@/store/modules/user'
  import { LanguageEnum } from '@/enums/appEnum'

  interface Props {
    modelValue: Api.Region.RegionSearchParams
  }
  interface Emits {
    (e: 'update:modelValue', value: Api.Region.RegionSearchParams): void
    (e: 'search', params: Api.Region.RegionSearchParams): void
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

  const countryOptions = ref<{ label: string; value: number }[]>([])
  const countryLoading = ref(false)
  const countryLocale = computed<'zh' | 'en'>(() =>
    userStore.language === LanguageEnum.EN ? 'en' : 'zh'
  )

  const partnerSearchOptions = ref<Api.Partner.PartnerListItem[]>([])

  async function loadCountryOptions() {
    countryLoading.value = true
    try {
      const list = await fetchCountryList()
      countryOptions.value = list.map((c) => ({
        label: getCountryDisplayName(c, countryLocale.value),
        value: c.id
      }))
    } finally {
      countryLoading.value = false
    }
  }

  watch(countryLocale, () => {
    loadCountryOptions()
  })

  watch(
    () => props.modelValue.countryId,
    async (countryId, prev) => {
      if (countryId !== prev && props.modelValue.partnerId != null) {
        emit('update:modelValue', { ...props.modelValue, partnerId: undefined })
      }
      if (!countryId) {
        partnerSearchOptions.value = []
        return
      }
      const res = await fetchPartnerList({
        pageNum: 1,
        pageSize: 500,
        countryId
      })
      partnerSearchOptions.value = res.records
    },
    { immediate: true }
  )

  loadCountryOptions()

  const formItems = computed(() => [
    {
      label: t('regionPage.search.regionName'),
      key: 'regionName',
      labelWidth: 'auto',
      type: 'input',
      placeholder: t('regionPage.search.regionNamePlaceholder'),
      clearable: true
    },
    {
      label: t('regionPage.search.country'),
      key: 'countryId',
      labelWidth: 'auto',
      span: 4,
      type: 'select',
      props: {
        placeholder: t('regionPage.search.placeholderAll'),
        clearable: true,
        loading: countryLoading.value,
        filterable: true,
        options: countryOptions.value
      }
    },
    {
      label: t('regionPage.search.partner'),
      key: 'partnerId',
      type: 'select',
      labelWidth: 'auto',
      props: {
        placeholder: formData.value.countryId
          ? t('regionPage.search.placeholderAll')
          : t('regionPage.search.placeholderSelectCountryFirst'),
        clearable: true,
        disabled: !formData.value.countryId,
        options: partnerSearchOptions.value.map((p) => ({
          label: p.partnerName,
          value: p.id
        }))
      }
    }
  ])

  const handleSearch = async () => {
    emit('search', { ...formData.value })
  }

  const handleReset = () => {
    partnerSearchOptions.value = []
    emit('reset')
  }
</script>
