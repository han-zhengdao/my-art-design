<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
    width="480px"
    align-center
    @close="handleClose"
  >
    <div v-loading="detailLoading" class="role-edit-dialog-body w-full text-left">
      <ElForm
        ref="formRef"
        class="role-edit-dialog-form w-full"
        :model="form"
        :rules="rules"
        label-position="left"
        label-width="100px"
      >
        <ElFormItem label="角色名称" prop="roleName">
          <ElInput v-model="form.roleName" placeholder="请输入角色名称" />
        </ElFormItem>
        <ElFormItem label="角色编码" prop="roleCode">
          <ElSelect v-model="form.roleCode" placeholder="请选择角色编码" class="w-full">
            <ElOption
              v-for="opt in systemRoleCodeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="角色类型" prop="roleType">
          <ElSelect v-model="form.roleType" placeholder="请选择角色类型" class="w-full">
            <ElOption
              v-for="opt in roleTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </div>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import {
    fetchCreateRole,
    fetchGetDictDataByDictCodeList,
    fetchGetRoleDetail,
    fetchUpdateRole
  } from '@/api/system-manage'

  type RoleListItem = Api.SystemManage.RoleListItem
  type RoleForm = Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'roleType'>

  interface Props {
    modelValue: boolean
    dialogType: 'add' | 'edit'
    roleData?: RoleListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    roleData: undefined
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const detailLoading = ref(false)

  /**
   * 弹窗显示状态双向绑定
   */
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  /** 与用户管理「对应角色」一致（系统管理员、合作商管理员等） */
  const systemRoleCodeOptions = [
    { label: '系统管理员', value: 'R_ADMIN' },
    { label: '合作商管理员', value: 'PARTNER_ADMIN' },
    { label: '区域管理员', value: 'REGION_ADMIN' },
    { label: '门店管理员', value: 'STORE_ADMIN' },
    { label: '门店员工', value: 'STORE_STAFF' }
  ]

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

  /**
   * 表单验证规则
   */
  const rules = reactive<FormRules>({
    roleName: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    roleCode: [{ required: true, message: '请选择角色编码', trigger: 'change' }],
    roleType: [{ required: true, message: '请选择角色类型', trigger: 'change' }]
  })

  /**
   * 表单数据
   */
  const form = reactive<RoleForm>({
    roleId: 0,
    roleName: '',
    roleCode: '',
    roleType: 1
  })

  function applyDetail(d: Api.SystemManage.RoleDetail) {
    form.roleId = d.id
    form.roleName = d.roleName
    form.roleCode = d.roleCode
    form.roleType = Number(d.roleType)
  }

  /**
   * 初始化表单：新增重置；编辑拉取 GET /system/role/getRoleDetail
   */
  const initForm = async () => {
    if (props.dialogType === 'add') {
      Object.assign(form, {
        roleId: 0,
        roleName: '',
        roleCode: '',
        roleType: 1
      })
      return
    }
    const rid = props.roleData?.roleId
    if (rid == null) return
    detailLoading.value = true
    try {
      const d = await fetchGetRoleDetail(rid)
      applyDetail(d)
    } catch {
      ElMessage.error('加载角色详情失败')
    } finally {
      detailLoading.value = false
    }
  }

  watch(
    () => props.modelValue,
    async (open) => {
      if (open) await initForm()
    }
  )

  watch(
    () => props.roleData,
    async () => {
      if (props.modelValue && props.dialogType === 'edit') await initForm()
    },
    { deep: true }
  )

  /**
   * 关闭弹窗并重置表单
   */
  const handleClose = () => {
    visible.value = false
    formRef.value?.resetFields()
  }

  /**
   * 提交表单
   * 验证通过后调用接口保存数据
   */
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      if (props.dialogType === 'add') {
        await fetchCreateRole({
          roleName: form.roleName.trim(),
          roleCode: form.roleCode.trim(),
          roleType: form.roleType
        })
      } else {
        await fetchUpdateRole({
          id: form.roleId,
          roleName: form.roleName.trim(),
          roleCode: form.roleCode.trim(),
          roleType: form.roleType
        })
      }
      const message = props.dialogType === 'add' ? '新增成功' : '修改成功'
      ElMessage.success(message)
      emit('success')
      handleClose()
    } catch (error) {
      console.log('提交失败:', error)
      ElMessage.error('操作失败')
    }
  }
</script>

<style scoped lang="scss">
  .role-edit-dialog-body {
    box-sizing: border-box;
  }

  .role-edit-dialog-form :deep(.el-form-item__label) {
    justify-content: flex-start;
  }
</style>
