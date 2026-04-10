<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />

    <div class="relative flex-1">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>

          <div
            class="login-mode-tabs mt-10 flex w-full border-b border-[var(--default-border)]"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="loginMode === 'password'"
              class="login-mode-tabs__item flex-1"
              :class="{ 'login-mode-tabs__item--active': loginMode === 'password' }"
              @click="loginMode = 'password'"
            >
              {{ $t('login.tabPassword') }}
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="loginMode === 'code'"
              class="login-mode-tabs__item flex-1"
              :class="{ 'login-mode-tabs__item--active': loginMode === 'code' }"
              @click="loginMode = 'code'"
            >
              {{ $t('login.tabCode') }}
            </button>
          </div>

          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            @keyup.enter="handleSubmit"
            style="margin-top: 20px"
          >
            <ElFormItem prop="email">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.email')"
                v-model.trim="formData.email"
                type="email"
                autocomplete="username"
              />
            </ElFormItem>

            <template v-if="loginMode === 'password'">
              <ElFormItem prop="password">
                <ElInput
                  class="custom-height"
                  :placeholder="$t('login.placeholder.password')"
                  v-model.trim="formData.password"
                  type="password"
                  autocomplete="current-password"
                  show-password
                />
              </ElFormItem>
            </template>

            <template v-else>
              <ElFormItem prop="verifyCode">
                <div class="flex gap-2">
                  <ElInput
                    class="custom-height flex-1 min-w-0"
                    :placeholder="$t('login.placeholder.verifyCode')"
                    v-model.trim="formData.verifyCode"
                    maxlength="8"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                  />
                  <ElButton
                    class="custom-height shrink-0 !px-3"
                    :disabled="codeCountdown > 0"
                    @click="handleSendCode"
                  >
                    {{ codeCountdown > 0 ? `${codeCountdown}s` : $t('login.sendCode') }}
                  </ElButton>
                </div>
              </ElFormItem>
            </template>

            <!-- 拖拽验证 -->
            <div class="relative pb-5 mt-6">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-lg border border-transparent tad-300"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  :text="$t('login.sliderText')"
                  textColor="var(--art-gray-700)"
                  :successText="$t('login.sliderSuccessText')"
                  progressBarBg="var(--main-color)"
                  :background="isDark ? '#26272F' : '#F1F1F4'"
                  handlerBg="var(--default-box-color)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                {{ $t('login.placeholder.slider') }}
              </p>
            </div>

            <div v-if="loginMode === 'password'" class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">{{
                $t('login.rememberPwd')
              }}</ElCheckbox>
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">{{
                $t('login.forgetPwd')
              }}</RouterLink>
            </div>
            <div v-else class="mt-2 text-right text-sm">
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">{{
                $t('login.forgetPwd')
              }}</RouterLink>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin } from '@/api/auth'
  import { ElMessage, ElNotification, type FormInstance, type FormRules } from 'element-plus'
  import { useSettingStore } from '@/store/modules/setting'

  defineOptions({ name: 'Login' })

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)
  const { t, locale } = useI18n()
  const formKey = ref(0)

  watch(locale, () => {
    formKey.value++
  })

  const dragVerify = ref()

  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()
  const isPassing = ref(false)
  const isClickPass = ref(false)

  /** 密码登录 | 邮箱验证码登录（验证码接口未接） */
  const loginMode = ref<'password' | 'code'>('password')

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  const formData = reactive({
    email: '',
    password: '',
    verifyCode: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => {
    const emailRules = [
      { required: true, message: t('login.placeholder.email'), trigger: 'blur' },
      {
        validator: (_: unknown, v: string, cb: (e?: Error) => void) => {
          if (!v?.trim()) {
            cb(new Error(t('login.placeholder.email')))
            return
          }
          if (!EMAIL_RE.test(v.trim())) {
            cb(new Error(t('login.emailInvalid')))
            return
          }
          cb()
        },
        trigger: 'blur'
      }
    ]

    if (loginMode.value === 'password') {
      return {
        email: emailRules,
        password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }]
      }
    }

    return {
      email: emailRules,
      verifyCode: [
        { required: true, message: t('login.placeholder.verifyCode'), trigger: 'blur' },
        { min: 4, max: 8, message: t('login.placeholder.verifyCode'), trigger: 'blur' }
      ]
    }
  })

  const loading = ref(false)

  const codeCountdown = ref(0)
  let codeTimer: ReturnType<typeof setInterval> | null = null

  onBeforeUnmount(() => {
    if (codeTimer) {
      clearInterval(codeTimer)
      codeTimer = null
    }
  })

  const resetDragState = () => {
    isClickPass.value = false
    isPassing.value = false
    dragVerify.value?.reset?.()
  }

  const onLoginModeChange = () => {
    nextTick(() => {
      formRef.value?.clearValidate()
      resetDragState()
    })
  }

  watch(loginMode, () => {
    onLoginModeChange()
  })

  /** 发送验证码：暂无后端，仅倒计时 + 提示 */
  const handleSendCode = () => {
    const email = formData.email?.trim()
    if (!email) {
      ElMessage.warning(t('login.placeholder.email'))
      return
    }
    if (!EMAIL_RE.test(email)) {
      ElMessage.warning(t('login.emailInvalid'))
      return
    }
    if (codeCountdown.value > 0) return

    if (codeTimer) {
      clearInterval(codeTimer)
      codeTimer = null
    }
    codeCountdown.value = 60
    codeTimer = setInterval(() => {
      codeCountdown.value -= 1
      if (codeCountdown.value <= 0 && codeTimer) {
        clearInterval(codeTimer)
        codeTimer = null
      }
    }, 1000)

    ElMessage.success(t('login.sendCodeMock'))
  }

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return

      if (!isPassing.value) {
        isClickPass.value = true
        return
      }

      if (loginMode.value === 'code') {
        ElMessage.info(t('login.codeLoginPending'))
        resetDragState()
        return
      }

      loading.value = true

      const { email, password } = formData
      const { token } = await fetchLogin({
        email,
        password
      })

      if (!token) {
        throw new Error('Login failed - no token received')
      }

      userStore.setToken(token)
      userStore.setLoginStatus(true)

      showLoginSuccessNotice()

      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } catch (error) {
      if (error instanceof HttpError) {
        // handled by http layer
      } else {
        console.error('[Login] Unexpected error:', error)
      }
    } finally {
      loading.value = false
      resetDragState()
    }
  }

  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 1000)
  }
</script>

<style scoped>
  @import './style.css';
</style>

<style scoped lang="scss">
  .login-mode-tabs__item {
    position: relative;
    padding: 10px 8px 16px;
    margin: 0;
    font-size: 15px;
    line-height: 1.25;
    color: var(--art-gray-700);
    text-align: center;
    cursor: pointer;
    background: transparent;
    border: none;
    transition:
      color 0.2s ease,
      font-weight 0.2s ease;

    &:hover {
      color: var(--theme-color);
    }

    &--active {
      font-weight: 500;
      color: var(--theme-color);

      &::after {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        height: 2px;
        content: '';
        background: var(--theme-color);
      }
    }
  }

  html.dark .login-mode-tabs__item {
    color: var(--art-gray-500);

    &:hover {
      color: var(--art-gray-700);
    }
  }
</style>
