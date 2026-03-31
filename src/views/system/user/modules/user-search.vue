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
  >
  </ArtSearchBar>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: Api.SystemManage.UserSearchParams
  }
  interface Emits {
    (e: 'update:modelValue', value: Api.SystemManage.UserSearchParams): void
    (e: 'search', params: Api.SystemManage.UserSearchParams): void
    (e: 'reset'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 表单数据双向绑定
  const searchBarRef = ref()
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 校验规则
  const rules = {
    // userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  }

  const statusOptions = [
    { label: '全部', value: '' },
    { label: '正常', value: 'normal' },
    { label: '注销', value: 'disabled' }
  ]

  const roleOptions = [
    { label: '全部', value: '' },
    { label: '系统管理员', value: 'R_ADMIN' },
    { label: '合作商管理员', value: 'PARTNER_ADMIN' },
    { label: '区域管理员', value: 'REGION_ADMIN' },
    { label: '门店管理员', value: 'STORE_ADMIN' },
    { label: '门店员工', value: 'STORE_STAFF' }
  ]

  // 表单配置
  const formItems = computed(() => [
    {
      label: '用户名/邮箱',
      key: 'keyword',
      type: 'input',
      labelWidth: 'auto',
      placeholder: '支持模糊搜索',
      clearable: true
    },
    {
      label: '角色',
      key: 'role',
      type: 'select',
      labelWidth: 'auto',
      span: 4,
      props: {
        placeholder: '全部',
        clearable: true,
        options: roleOptions
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      labelWidth: 'auto',
      span: 4,
      props: {
        placeholder: '全部',
        clearable: true,
        options: statusOptions
      }
    },
    {
      label: '注销时间',
      key: 'logoutTimeRange',
      type: 'daterange',
      labelWidth: 'auto',
      props: {
        type: 'daterange',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        valueFormat: 'YYYY-MM-DD HH:mm:ss'
      }
    }
  ])

  // 事件
  function handleReset() {
    console.log('重置表单')
    emit('reset')
  }

  async function handleSearch(params: Api.SystemManage.UserSearchParams) {
    await searchBarRef.value.validate()
    emit('search', params)
    console.log('表单数据', params)
  }
</script>
