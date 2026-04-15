<template>
  <ArtSearchBar
    v-model="formData"
    :items="formItems"
    :rules="rules"
    :default-expanded="true"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    modelValue: Api.WheelEntry.WheelEntrySearchParams
  }

  interface Emits {
    (e: 'update:modelValue', value: Api.WheelEntry.WheelEntrySearchParams): void
    (e: 'search', params: Api.WheelEntry.WheelEntrySearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  const formItems = computed(() => [
    {
      label: 'Device EUI',
      key: 'deviceEui',
      labelWidth: 'auto',
      span: 6,
      type: 'input',
      placeholder: '支持模糊搜索',
      clearable: true
    },
    {
      label: '产品型号',
      key: 'productModel',
      labelWidth: 'auto',
      span: 6,
      type: 'input',
      placeholder: '支持模糊搜索',
      clearable: true
    }
  ])

  const handleSearch = (params: Api.WheelEntry.WheelEntrySearchParams) => {
    emit('search', params)
  }

  const handleReset = () => {
    emit('reset')
  }
</script>
