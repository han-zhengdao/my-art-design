<!-- 个人中心页面 -->
<template>
  <div class="w-full min-w-650px mx-auto">
    <div class="art-card-sm p-6">
      <h1 class="text-xl font-medium mb-6">个人中心</h1>

      <ElForm
        ref="profileFormRef"
        class="my-0"
        :model="profileForm"
        :rules="profileRules"
        label-position="top"
      >
        <ElFormItem label="头像">
          <div class="flex-c gap-4">
            <ElAvatar :size="72" :src="profileForm.avatar" />
            <ElUpload action="#" :show-file-list="false" :before-upload="handleAvatarBeforeUpload">
              <ElButton>修改头像</ElButton>
            </ElUpload>
          </div>
        </ElFormItem>

        <ElRow :gutter="20">
          <ElCol :span="18">
            <ElFormItem label="昵称" prop="nickName">
              <ElInput v-model="profileForm.nickName" placeholder="请输入昵称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="18">
            <ElFormItem label="登录邮箱">
              <ElInput :model-value="profileForm.email" disabled />
            </ElFormItem>
          </ElCol>
        </ElRow>

        <div class="flex-c gap-3">
          <ElButton type="primary" v-ripple @click="saveProfile">保存资料</ElButton>
          <ElButton @click="pwdDialogVisible = true">修改密码</ElButton>
        </div>
      </ElForm>
    </div>

    <ElDialog
      v-model="pwdDialogVisible"
      title="修改密码"
      width="460px"
      destroy-on-close
      @closed="resetPwdForm"
    >
      <ElForm
        ref="pwdFormRef"
        class="pwd-dialog-form my-0"
        :model="pwdForm"
        :rules="pwdRules"
        label-position="top"
      >
        <ElFormItem label="当前密码" prop="oldPassword">
          <ElInput v-model="pwdForm.oldPassword" type="password" show-password />
        </ElFormItem>
        <ElFormItem label="新密码" prop="newPassword">
          <ElInput v-model="pwdForm.newPassword" type="password" show-password />
        </ElFormItem>
        <ElFormItem label="确认新密码" prop="confirmPassword">
          <ElInput v-model="pwdForm.confirmPassword" type="password" show-password />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="pwdDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="pwdSubmitting" @click="submitPassword">
          确认修改
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, UploadProps, UploadRawFile } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { fetchResetPassword } from '@/api/system-manage'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  const profileFormRef = ref<FormInstance>()
  const pwdFormRef = ref<FormInstance>()
  const pwdDialogVisible = ref(false)
  const pwdSubmitting = ref(false)

  const profileForm = reactive({
    avatar: userInfo.value.avatar || '/src/assets/images/user/avatar.webp',
    nickName: userInfo.value.userName || '',
    email: userInfo.value.email || ''
  })

  const pwdForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const profileRules: FormRules = {
    nickName: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ]
  }

  const pwdRules: FormRules = {
    oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (value !== pwdForm.newPassword) {
            callback(new Error('两次输入的密码不一致'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }

  const handleAvatarBeforeUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
    const isImage = rawFile.type.startsWith('image/')
    if (!isImage) {
      ElMessage.warning('请上传图片文件')
      return false
    }
    profileForm.avatar = URL.createObjectURL(rawFile)
    ElMessage.success('头像已更新')
    return false
  }

  const saveProfile = async () => {
    const valid = await profileFormRef.value?.validate().catch(() => false)
    if (!valid) return
    ElMessage.success('个人信息已保存')
  }

  function resetPwdForm() {
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdFormRef.value?.resetFields()
  }

  const submitPassword = async () => {
    const valid = await pwdFormRef.value?.validate().catch(() => false)
    if (!valid) return
    const id = userInfo.value.userId
    if (id == null) {
      ElMessage.error('无法获取当前用户，请重新登录后再试')
      return
    }
    pwdSubmitting.value = true
    try {
      await fetchResetPassword({
        id,
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword
      })
      pwdDialogVisible.value = false
      resetPwdForm()
    } catch {
      // 错误提示由 http 封装处理
    } finally {
      pwdSubmitting.value = false
    }
  }
</script>

<style scoped>
  /* 修改密码弹窗：表单项上下间距（紧凑） */
  .pwd-dialog-form :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .pwd-dialog-form :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
</style>
