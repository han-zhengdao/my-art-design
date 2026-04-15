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
  import { computed, ref } from 'vue'

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

  const usageTypeOptions = [
    { label: '全部', value: '' },
    { label: '车轮', value: 'WHEEL' },
    { label: '信标', value: 'BEACON' }
  ]

  const formItems = computed(() => [
    {
      label: '设备ID',
      key: 'deviceKeyword',
      labelWidth: 'auto',
      span: 6,
      type: 'input',
      placeholder: '模糊搜索',
      clearable: true
    },
    {
      label: '设备类型',
      key: 'usageType',
      labelWidth: 'auto',
      span: 5,
      type: 'select',
      props: { placeholder: '全部', clearable: true, options: usageTypeOptions }
    },
    {
      label: '使用时间',
      key: 'timeRange',
      labelWidth: 'auto',
      span: 9,
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
    emit('reset')
  }
</script>
