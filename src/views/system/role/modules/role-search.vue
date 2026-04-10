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
  import { fetchGetDictDataByDictCodeList } from '@/api/system-manage'

  type RoleSearchFormParams = Api.SystemManage.RoleSearchParams

  interface Props {
    modelValue: RoleSearchFormParams
  }

  interface Emits {
    (e: 'update:modelValue', value: RoleSearchFormParams): void
    (e: 'search', params: RoleSearchFormParams): void
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

  /** 字典 role_type，展示为「系统 / 用户」 */
  const roleTypeOptions = ref<{ label: string; value: number }[]>([])

  function roleTypeSelectLabel(dictKey: string, dictValue: string): string {
    const k = Number(dictKey)
    if (k === 1) return '系统'
    if (k === 2) return '用户'
    return dictValue
  }

  onMounted(async () => {
    try {
      const list = await fetchGetDictDataByDictCodeList('role_type')
      roleTypeOptions.value = list.map((d) => ({
        label: roleTypeSelectLabel(d.dictKey, d.dictValue),
        value: Number(d.dictKey)
      }))
    } catch {
      roleTypeOptions.value = []
    }
  })

  const formItems = computed(() => [
    {
      label: '角色名称',
      key: 'roleName',
      type: 'input',
      placeholder: '请输入角色名称',
      clearable: true
    },
    {
      label: '角色编码',
      key: 'roleCode',
      type: 'input',
      placeholder: '请输入角色编码',
      clearable: true
    },
    {
      label: '角色类型',
      key: 'roleType',
      type: 'select',
      props: {
        placeholder: '请选择角色类型',
        options: roleTypeOptions.value,
        clearable: true
      }
    }
  ])

  const handleReset = () => {
    emit('reset')
  }

  const handleSearch = async (params: RoleSearchFormParams) => {
    await searchBarRef.value.validate()
    emit('search', params)
  }
</script>
