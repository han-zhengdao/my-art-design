<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    :rules="rules"
    :default-expanded="true"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { fetchPartnersByCountry } from '@/api/partner'
  import { fetchRegionList } from '@/api/region'
  import { fetchStoreList } from '@/api/store'

  interface Props {
    modelValue: Api.Dc.UsageRecordSearchParams
  }

  interface Emits {
    (e: 'update:modelValue', value: Api.Dc.UsageRecordSearchParams): void
    (e: 'search', params: Api.Dc.UsageRecordSearchParams): void
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

  const countryOptions = [
    { label: '中国', value: 'CN' },
    { label: '美国', value: 'US' },
    { label: '日本', value: 'JP' },
    { label: '挪威', value: 'NO' },
    { label: '德国', value: 'DE' }
  ]

  const usageTypeOptions = [
    { label: '全部', value: '' },
    { label: '车轮', value: 'WHEEL' },
    { label: '信标', value: 'BEACON' }
  ]

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
    regionOptions.value = [...opts, { label: '无区域', value: 'NONE' }]
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
          partnerId: undefined,
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

  const formItems = computed(() => [
    {
      label: '设备ID',
      key: 'deviceKeyword',
      labelWidth: 'auto',
      span: 5,
      type: 'input',
      placeholder: '模糊搜索',
      clearable: true
    },
    {
      label: '所属国家',
      key: 'countryCode',
      labelWidth: 'auto',
      span: 4,
      type: 'select',
      props: {
        placeholder: '全部',
        clearable: true,
        options: countryOptions
      }
    },
    {
      label: '所属合作商',
      key: 'partnerId',
      labelWidth: 'auto',
      span: 4,
      type: 'select',
      props: {
        placeholder: formData.value.countryCode ? '全部' : '请先选择所属国家',
        clearable: true,
        disabled: !formData.value.countryCode,
        options: partnerOptions.value.map((p) => ({ label: p.partnerName, value: p.id }))
      }
    },
    {
      label: '所属区域',
      key: 'regionId',
      labelWidth: 'auto',
      span: 4,
      type: 'select',
      props: {
        placeholder: formData.value.partnerId ? '全部（含无区域）' : '请先选择合作商',
        clearable: true,
        disabled: !formData.value.partnerId,
        options: regionOptions.value
      }
    },
    {
      label: '所属门店',
      key: 'storeId',
      labelWidth: 'auto',
      span: 4,
      type: 'select',
      props: {
        placeholder: formData.value.regionId != null ? '请选择门店' : '请先选择所属区域',
        clearable: true,
        disabled: formData.value.regionId == null,
        options: storeOptions.value
      }
    },
    {
      label: '设备类型',
      key: 'usageType',
      labelWidth: 'auto',
      span: 4,
      type: 'select',
      props: { placeholder: '全部', clearable: true, options: usageTypeOptions }
    },
    {
      label: '使用时间',
      key: 'timeRange',
      labelWidth: 'auto',
      span: 7,
      type: 'daterange',
      props: {
        type: 'datetimerange',
        startPlaceholder: '开始',
        endPlaceholder: '结束',
        valueFormat: 'YYYY-MM-DD HH:mm:ss'
      }
    }
  ])

  const handleSearch = (params: Api.Dc.UsageRecordSearchParams) => {
    emit('search', params)
  }

  const handleReset = () => {
    partnerOptions.value = []
    regionOptions.value = []
    storeOptions.value = []
    emit('reset')
  }
</script>
