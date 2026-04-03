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
  import { fetchPartnersByCountry } from '@/api/partner'

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

  const partnerSearchOptions = ref<Api.Partner.PartnerListItem[]>([])

  watch(
    () => props.modelValue.countryCode,
    async (code, prev) => {
      if (code !== prev && props.modelValue.partnerId != null) {
        emit('update:modelValue', { ...props.modelValue, partnerId: undefined })
      }
      if (!code) {
        partnerSearchOptions.value = []
        return
      }
      partnerSearchOptions.value = await fetchPartnersByCountry(code)
    },
    { immediate: true }
  )

  const formItems = computed(() => [
    {
      label: '区域名称',
      key: 'regionName',
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
      type: 'select',
      labelWidth: 'auto',
      props: {
        placeholder: formData.value.countryCode ? '全部' : '请先选择国家',
        clearable: true,
        disabled: !formData.value.countryCode,
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
