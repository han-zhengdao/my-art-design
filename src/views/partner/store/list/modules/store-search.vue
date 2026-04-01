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
  import { computed, ref, watch } from 'vue'
  import { fetchPartnersByCountry } from '@/api/partner'
  import { fetchRegionList } from '@/api/region'

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

  const partnerOptions = ref<Api.Partner.PartnerListItem[]>([])
  const regionOptions = ref<{ label: string; value: number | 'NONE' }[]>([])

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
    // 区域下拉固定提供“无区域”选项
    regionOptions.value = [...opts, { label: '无区域', value: 'NONE' }]
  }

  watch(
    () => formData.value.countryCode,
    async (code, prev) => {
      if (code !== prev) {
        emit('update:modelValue', {
          ...formData.value,
          partnerId: undefined,
          regionId: undefined
        })
      }
      await loadPartnerOptions(code)
      regionOptions.value = []
    },
    { immediate: true }
  )

  watch(
    () => [formData.value.partnerId, formData.value.countryCode] as const,
    async ([partnerId, countryCode], oldValue) => {
      const prevPartnerId = oldValue?.[0]
      if (partnerId !== prevPartnerId) {
        emit('update:modelValue', { ...formData.value, regionId: undefined })
      }
      await loadRegionOptions(partnerId, countryCode)
    },
    { immediate: true }
  )

  const formItems = computed(() => [
    {
      label: '门店名称',
      key: 'storeName',
      labelWidth: 'auto',
      type: 'input',
      placeholder: '支持模糊搜索',
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
      span: 4,
      type: 'select',
      labelWidth: 'auto',
      props: {
        placeholder: formData.value.countryCode ? '全部' : '请先选择国家',
        clearable: true,
        disabled: !formData.value.countryCode,
        options: partnerOptions.value.map((p) => ({ label: p.partnerName, value: p.id }))
      }
    },
    {
      label: '所属区域',
      key: 'regionId',
      span: 4,
      type: 'select',
      labelWidth: 'auto',
      props: {
        placeholder: formData.value.partnerId ? '全部' : '请先选择合作商',
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
