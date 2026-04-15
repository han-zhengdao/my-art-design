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
  import { getDictDataDisplayLabel } from '@/utils/dict-label'
  import { useI18n } from 'vue-i18n'

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

  const { locale } = useI18n()

  const searchBarRef = ref()

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const rules = {}

  /** GET /system/dict/getDictDataByDictCodeList?dictCode=role_type */
  const roleTypeOptions = ref<{ label: string; value: number }[]>([])

  async function loadRoleTypeDict() {
    try {
      const list = await fetchGetDictDataByDictCodeList('role_type')
      if (!Array.isArray(list) || list.length === 0) {
        roleTypeOptions.value = []
        return
      }
      const sorted = [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      const lc = locale.value
      roleTypeOptions.value = sorted.map((d) => ({
        label: getDictDataDisplayLabel(d, lc),
        value: Number(d.dictKey)
      }))
    } catch {
      roleTypeOptions.value = []
    }
  }

  onMounted(() => {
    void loadRoleTypeDict()
  })

  watch(locale, () => {
    void loadRoleTypeDict()
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
