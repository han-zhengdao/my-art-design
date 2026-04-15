<template>
  <ArtSearchBar
    v-if="!hidden"
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
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { fetchPartnersByCountry } from '@/api/partner'
  import { fetchRegionList } from '@/api/region'
  import { fetchStoreList } from '@/api/store'

  const { t, locale } = useI18n()

  interface Props {
    modelValue: Api.Dashboard.MapViewSearchParams
    /** 为 true 时不展示筛选（区域/门店用户由地图页自动带范围） */
    hidden?: boolean
    /** 合作商管理员：锁定合作商，不可改 */
    lockedPartnerId?: number
  }

  interface Emits {
    (e: 'update:modelValue', value: Api.Dashboard.MapViewSearchParams): void
    (e: 'search', params: Api.Dashboard.MapViewSearchParams): void
    (e: 'reset'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    hidden: false,
    lockedPartnerId: undefined
  })

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  const countryOptions = computed(() => [
    { label: t('mapView.countries.CN'), value: 'CN' },
    { label: t('mapView.countries.US'), value: 'US' },
    { label: t('mapView.countries.JP'), value: 'JP' },
    { label: t('mapView.countries.NO'), value: 'NO' },
    { label: t('mapView.countries.DE'), value: 'DE' }
  ])

  const partnerOptions = ref<Api.Partner.PartnerListItem[]>([])
  const regionOptions = ref<{ label: string; value: number | 'NONE' }[]>([])
  const storeOptions = ref<{ label: string; value: number }[]>([])

  async function loadPartnerOptions(code?: string) {
    partnerOptions.value = code ? await fetchPartnersByCountry(code) : []
  }

  async function loadRegionOptions(partnerId?: number, countryCode?: string) {
    if (partnerId == null) {
      regionOptions.value = []
      return
    }
    const list = await fetchRegionList({ current: 1, size: 500, partnerId, countryCode })
    const opts = list.records.map((r) => ({ label: r.regionName, value: r.id as number }))
    regionOptions.value = [...opts, { label: t('mapView.search.noRegion'), value: 'NONE' }]
  }

  async function loadStoreOptions(
    partnerId?: number,
    countryCode?: string,
    regionId?: number | 'NONE'
  ) {
    if (partnerId == null || !countryCode || regionId == null) {
      storeOptions.value = []
      return
    }
    const list = await fetchStoreList({
      current: 1,
      size: 500,
      partnerId,
      countryCode,
      regionId
    })
    storeOptions.value = list.records.map((s) => ({ label: s.storeName, value: s.id }))
  }

  watch(
    () => formData.value.countryCode,
    async (code, prev) => {
      if (code !== prev) {
        emit('update:modelValue', {
          ...formData.value,
          partnerId: props.lockedPartnerId ?? undefined,
          regionId: undefined,
          storeId: undefined
        })
      }
      await loadPartnerOptions(code)
      regionOptions.value = []
      storeOptions.value = []
    },
    { immediate: true }
  )

  watch(
    () => [formData.value.partnerId, formData.value.countryCode] as const,
    async ([partnerId, countryCode], oldValue) => {
      const prevPartnerId = oldValue?.[0]
      if (partnerId !== prevPartnerId) {
        emit('update:modelValue', {
          ...formData.value,
          regionId: undefined,
          storeId: undefined
        })
        storeOptions.value = []
      }
      await loadRegionOptions(partnerId, countryCode)
    },
    { immediate: true }
  )

  watch(
    () => formData.value.regionId,
    async (regionId, prev) => {
      if (regionId === prev) return
      emit('update:modelValue', { ...formData.value, storeId: undefined })
      await loadStoreOptions(formData.value.partnerId, formData.value.countryCode, regionId)
    },
    { immediate: true }
  )

  watch(
    () => props.lockedPartnerId,
    (pid) => {
      if (pid != null) {
        emit('update:modelValue', { ...formData.value, partnerId: pid })
      }
    },
    { immediate: true }
  )

  watch(locale, () => {
    if (formData.value.partnerId != null) {
      void loadRegionOptions(formData.value.partnerId, formData.value.countryCode)
    }
  })

  const formItems = computed(() => [
    {
      label: t('mapView.search.country'),
      key: 'countryCode',
      labelWidth: 'auto',
      span: 4,
      type: 'select',
      props: {
        placeholder: t('mapView.search.placeholderSelect'),
        clearable: true,
        options: countryOptions.value
      }
    },
    {
      label: t('mapView.search.partner'),
      key: 'partnerId',
      labelWidth: 'auto',
      span: 5,
      type: 'select',
      props: {
        placeholder: formData.value.countryCode
          ? t('mapView.search.placeholderAll')
          : t('mapView.search.placeholderSelectCountryFirst'),
        clearable: !props.lockedPartnerId,
        disabled: !formData.value.countryCode || props.lockedPartnerId != null,
        options: partnerOptions.value.map((p) => ({ label: p.partnerName, value: p.id }))
      }
    },
    {
      label: t('mapView.search.region'),
      key: 'regionId',
      labelWidth: 'auto',
      span: 5,
      type: 'select',
      props: {
        placeholder: formData.value.partnerId
          ? t('mapView.search.placeholderRegionAll')
          : t('mapView.search.placeholderSelectPartnerFirst'),
        clearable: true,
        disabled: !formData.value.partnerId,
        options: regionOptions.value
      }
    },
    {
      label: t('mapView.search.store'),
      key: 'storeId',
      labelWidth: 'auto',
      span: 5,
      type: 'select',
      props: {
        placeholder:
          formData.value.regionId != null
            ? t('mapView.search.placeholderStoreOptional')
            : t('mapView.search.placeholderSelectRegionFirst'),
        clearable: true,
        disabled: formData.value.regionId == null,
        options: storeOptions.value
      }
    }
  ])

  const handleSearch = (params: Api.Dashboard.MapViewSearchParams) => {
    emit('search', params)
  }

  const handleReset = () => {
    partnerOptions.value = []
    regionOptions.value = []
    storeOptions.value = []
    emit('reset')
  }
</script>
