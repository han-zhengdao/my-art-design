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

  const formItems = computed(() => [
    {
      label: '合作商名称',
      key: 'partnerName',
      // 使用 auto 让 label 宽度按内容自适应，避免被固定 labelWidth 挤压换行
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
    }
  ])

  const handleSearch = () => {
    emit('search', { ...formData.value })
  }

  const handleReset = () => {
    emit('reset')
  }
</script>
