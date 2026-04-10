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

  const userTypeOptions = [
    { label: '全部', value: '' },
    { label: '平台超管', value: 'SUPER' },
    { label: '合作商', value: 'PARTNER' },
    { label: '区域', value: 'REGION' },
    { label: '门店', value: 'STORE' }
  ]

  // 表单配置
  const formItems = computed(() => [
    {
      label: '昵称',
      key: 'nickName',
      type: 'input',
      labelWidth: 'auto',
      placeholder: '请输入昵称',
      clearable: true
    },
    {
      label: '邮箱',
      key: 'email',
      type: 'input',
      labelWidth: 'auto',
      placeholder: '请输入登录邮箱',
      clearable: true
    },
    {
      label: '手机号',
      key: 'phone',
      type: 'input',
      labelWidth: 'auto',
      placeholder: '请输入手机号',
      clearable: true
    },
    {
      label: '用户类型',
      key: 'userType',
      type: 'select',
      labelWidth: 'auto',
      span: 4,
      props: {
        placeholder: '全部',
        clearable: true,
        options: userTypeOptions
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
