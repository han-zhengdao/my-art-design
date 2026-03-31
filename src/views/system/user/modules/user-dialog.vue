<template>
  <ElDialog v-model="dialogVisible" :title="dialogTitle" width="420px" align-center>
    <ElForm
      v-if="dialogType !== 'view'"
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <ElFormItem label="昵称" prop="nickName">
        <ElInput v-model="formData.nickName" placeholder="请输入昵称" />
      </ElFormItem>
      <ElFormItem label="登录邮箱" prop="userEmail">
        <ElInput v-model="formData.userEmail" placeholder="请输入登录邮箱" />
      </ElFormItem>
      <ElFormItem label="登录密码" prop="password">
        <ElInput
          v-model="formData.password"
          type="password"
          placeholder="请输入登录密码"
          show-password
        />
      </ElFormItem>
      <ElFormItem label="对应角色" prop="role">
        <ElSelect v-model="formData.role" placeholder="请选择角色">
          <ElOption label="系统管理员" value="R_ADMIN" />
          <ElOption label="合作商管理员" value="PARTNER_ADMIN" />
          <ElOption label="区域管理员" value="REGION_ADMIN" />
          <ElOption label="门店管理员" value="STORE_ADMIN" />
          <ElOption label="门店员工" value="STORE_STAFF" />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <ElDescriptions v-else :column="1" class="border-g-200">
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="昵称">{{ detailRow?.nickName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="登录邮箱">{{ detailRow?.userEmail }}</ElDescriptionsItem>
      <ElDescriptionsItem label="对应角色">{{
        roleLabel(detailRow?.userRoles || [])
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="状态">{{
        detailRow?.status === '4' ? '注销' : '正常'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">{{ detailRow?.createTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作人">{{ detailRow?.createBy }}</ElDescriptionsItem>
      <ElDescriptionsItem label="注销日期">{{
        detailRow && logoutDate(detailRow)
      }}</ElDescriptionsItem>
    </ElDescriptions>
    <template #footer>
      <div class="dialog-footer" v-if="dialogType !== 'view'">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">提交</ElButton>
      </div>
      <div class="dialog-footer" v-else>
        <ElButton type="primary" @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: string
    userData?: Partial<Api.SystemManage.UserListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type as 'add' | 'edit' | 'view')

  const dialogTitle = computed(() => {
    if (dialogType.value === 'add') return '新增用户'
    if (dialogType.value === 'edit') return '编辑用户'
    return '用户详情'
  })

  const detailRow = computed(() => props.userData)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    nickName: '',
    userEmail: '',
    password: '',
    role: '' as string
  })

  // 表单验证规则
  const rules: FormRules = {
    nickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    userEmail: [
      { required: true, message: '请输入登录邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    password: [
      {
        required: computed(() => dialogType.value === 'add').value,
        message: '请输入登录密码',
        trigger: 'blur'
      }
    ],
    role: [{ required: true, message: '请选择对应角色', trigger: 'change' }]
  }

  const roleLabel = (roles?: string[]) => {
    const map: Record<string, string> = {
      R_SUPER: '系统超级管理员',
      R_ADMIN: '系统管理员',
      PARTNER_ADMIN: '合作商管理员',
      REGION_ADMIN: '区域管理员',
      STORE_ADMIN: '门店管理员',
      STORE_STAFF: '门店员工'
    }
    return (
      (roles || [])
        .map((r) => map[r])
        .filter(Boolean)
        .join('、') || '-'
    )
  }

  const logoutDate = (row?: Partial<Api.SystemManage.UserListItem>) => {
    if (!row) return '--'
    if (row.status !== '4') return '--'
    return row.updateTime || '--'
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.userData
    const row = props.userData

    Object.assign(formData, {
      nickName: isEdit && row ? row.nickName || '' : '',
      userEmail: isEdit && row ? row.userEmail || '' : '',
      password: '',
      role: isEdit && row && Array.isArray(row.userRoles) ? row.userRoles[0] || '' : ''
    })
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, props.userData],
    ([visible]) => {
      if (visible) {
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   * 验证通过后触发提交事件
   */
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate((valid) => {
      if (valid) {
        ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        emit('submit')
      }
    })
  }
</script>
