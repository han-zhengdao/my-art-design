<template>
  <ElDialog v-model="dialogVisible" :title="dialogTitle" width="680px" align-center>
    <ElForm
      v-if="dialogType !== 'view'"
      ref="formRef"
      v-loading="detailLoading && dialogType === 'edit'"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <ElFormItem label="昵称" prop="nickName">
        <ElInput v-model="formData.nickName" placeholder="请输入昵称" />
      </ElFormItem>
      <ElFormItem label="头像地址" prop="headPic">
        <ElInput v-model="formData.headPic" placeholder="可选，头像 URL" clearable />
      </ElFormItem>
      <ElFormItem label="登录邮箱" prop="userEmail">
        <ElInput v-model="formData.userEmail" placeholder="请输入登录邮箱" />
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add'" label="登录密码" prop="password">
        <ElInput
          v-model="formData.password"
          type="password"
          placeholder="请输入登录密码"
          show-password
        />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="formData.phone" placeholder="请输入手机号" maxlength="20" />
      </ElFormItem>
      <ElFormItem label="对应角色" prop="roleId">
        <ElSelect
          v-model="formData.roleId"
          placeholder="请选择角色"
          filterable
          :loading="rolesLoading"
          style="width: 100%"
        >
          <ElOption
            v-for="r in roleOptions"
            :key="r.id"
            :label="`${r.roleName}（${r.roleCode}）`"
            :value="r.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add' && showOrgPartner" label="合作商" prop="partnerId">
        <ElSelect
          v-model="formData.partnerId"
          placeholder="请选择合作商"
          filterable
          clearable
          :loading="orgLoadingPartner"
          class="!w-full"
          @change="handleOrgPartnerChange"
        >
          <ElOption v-for="p in partnerOptions" :key="p.id" :label="p.name" :value="p.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add' && showOrgRegion" label="区域" prop="regionId">
        <ElSelect
          v-model="formData.regionId"
          :placeholder="orgRegionPlaceholder"
          filterable
          clearable
          :loading="orgLoadingRegion"
          :disabled="regionSelectDisabled"
          class="!w-full"
          @change="handleOrgRegionChange"
        >
          <ElOption v-for="r in regionOptions" :key="r.id" :label="r.name" :value="r.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add' && showOrgStore" label="门店" prop="storeId">
        <ElSelect
          v-model="formData.storeId"
          :placeholder="orgStorePlaceholder"
          filterable
          clearable
          :loading="orgLoadingStore"
          :disabled="storeSelectDisabled"
          class="!w-full"
        >
          <ElOption v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <ElDescriptions v-else v-loading="detailLoading" :column="1" border>
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="昵称">{{ detailRow?.nickName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="登录邮箱">{{ detailRow?.userEmail }}</ElDescriptionsItem>
      <ElDescriptionsItem label="对应角色">{{
        detailRow?.roleName || roleLabel(detailRow?.userRoles || [])
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
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit">提交</ElButton>
      </div>
      <div class="dialog-footer" v-else>
        <ElButton type="primary" @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    fetchCreateUser,
    fetchGetRoleByUserTypeList,
    fetchGetUserDetail,
    fetchUpdateUser
  } from '@/api/system-manage'
  import { useOrgCascadeOptions } from '@/hooks/useOrgCascadeOptions'
  import { useUserStore } from '@/store/modules/user'

  type OrgScope = 'super' | 'partner' | 'region' | 'store'

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

  const userStore = useUserStore()

  /** 当前登录用户组织范围：超管全量；合作商隐合作商；区域隐合作商+区域；门店全隐并带当前组织 id */
  const orgScope = computed((): OrgScope => {
    const info = userStore.info
    const ut = (info.userType || '').trim().toUpperCase()
    if (info.roles?.includes('R_SUPER') || ut === 'SUPER') return 'super'
    if (ut === 'PARTNER') return 'partner'
    if (ut === 'REGION') return 'region'
    if (ut === 'STORE') return 'store'
    return 'super'
  })

  const showOrgPartner = computed(() => dialogType.value !== 'view' && orgScope.value === 'super')
  const showOrgRegion = computed(() => {
    if (dialogType.value === 'view') return false
    return orgScope.value === 'super' || orgScope.value === 'partner'
  })
  const showOrgStore = computed(() => {
    if (dialogType.value === 'view') return false
    return ['super', 'partner', 'region'].includes(orgScope.value)
  })

  const orgRegionPlaceholder = computed(() => {
    if (orgScope.value === 'partner') return '请选择区域'
    return '请先选择合作商'
  })

  const orgStorePlaceholder = computed(() => {
    if (orgScope.value === 'region') return '请选择门店'
    return '请先选择区域'
  })

  const regionSelectDisabled = computed(() => {
    if (orgScope.value === 'partner' || orgScope.value === 'region') return false
    return !formData.partnerId
  })

  const storeSelectDisabled = computed(() => {
    if (orgScope.value === 'region') return false
    return !formData.regionId
  })

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

  const detailCache = ref<Api.SystemManage.UserDetail | null>(null)
  const detailLoading = ref(false)

  const detailRow = computed((): Partial<Api.SystemManage.UserListItem> => {
    const row = props.userData || {}
    const d = detailCache.value
    if (!d) return row
    return {
      ...row,
      id: d.id,
      nickName: d.nickName,
      userEmail: d.email,
      email: d.email,
      userRoles: d.roleCode ? [d.roleCode] : row.userRoles,
      roleName: d.roleName ?? row.roleName,
      userType: d.userType ?? row.userType,
      partnerId: d.partnerId ?? row.partnerId,
      regionId: d.regionId ?? row.regionId,
      storeId: d.storeId ?? row.storeId
    }
  })

  const editingUserId = computed(() => props.userData?.id ?? detailCache.value?.id)

  // 表单实例
  const formRef = ref<FormInstance>()

  const roleOptions = ref<Api.SystemManage.RoleByUserTypeItem[]>([])
  const rolesLoading = ref(false)
  const submitLoading = ref(false)

  // 表单数据
  const formData = reactive({
    nickName: '',
    headPic: '',
    userEmail: '',
    password: '',
    phone: '',
    roleId: undefined as number | undefined,
    partnerId: undefined as number | undefined,
    regionId: undefined as number | undefined,
    storeId: undefined as number | undefined
  })

  const {
    partnerOptions,
    regionOptions,
    storeOptions,
    loadingPartner: orgLoadingPartner,
    loadingRegion: orgLoadingRegion,
    loadingStore: orgLoadingStore,
    handlePartnerChange: handleOrgPartnerChange,
    handleRegionChange: handleOrgRegionChange,
    hydrateFromForm: hydrateOrgCascade,
    loadRegions,
    loadStores
  } = useOrgCascadeOptions(formData)

  // 表单验证规则
  const rules: FormRules = {
    nickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    userEmail: [
      { required: true, message: '请输入登录邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    password: [
      {
        validator: (_rule, value, callback) => {
          if (dialogType.value === 'add' && (!value || !String(value).trim())) {
            callback(new Error('请输入登录密码'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    roleId: [{ required: true, message: '请选择对应角色', trigger: 'change' }]
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

  const loadRoleOptions = async () => {
    rolesLoading.value = true
    try {
      const list = await fetchGetRoleByUserTypeList()
      roleOptions.value = Array.isArray(list) ? list : []
    } finally {
      rolesLoading.value = false
    }
  }

  async function loadUserDetail(id: number) {
    detailLoading.value = true
    try {
      const d = await fetchGetUserDetail(id)
      detailCache.value = d
      if (dialogType.value === 'edit') {
        formData.nickName = d.nickName ?? ''
        formData.headPic = d.headPic ?? ''
        formData.userEmail = d.email ?? ''
        formData.phone = d.phone ?? ''
        formData.roleId = d.roleId
        formData.password = ''
      }
    } finally {
      detailLoading.value = false
    }
  }

  /** 按登录用户类型加载合作商 / 区域 / 门店选项并回填 id */
  async function hydrateOrgByScope() {
    if (dialogType.value === 'view') return
    const scope = orgScope.value
    const info = userStore.info

    if (scope === 'super') {
      await hydrateOrgCascade()
      return
    }

    if (scope === 'partner') {
      const pid =
        info.partnerId != null && info.partnerId > 0
          ? info.partnerId
          : formData.partnerId != null && formData.partnerId > 0
            ? formData.partnerId
            : undefined
      if (!pid) return
      formData.partnerId = pid
      if (dialogType.value === 'add') {
        formData.regionId = undefined
        formData.storeId = undefined
      }
      await loadRegions(pid)
      const rid = formData.regionId
      if (rid != null && rid > 0) {
        await loadStores(pid, rid)
      }
      return
    }

    if (scope === 'region') {
      const pid =
        info.partnerId != null && info.partnerId > 0
          ? info.partnerId
          : formData.partnerId != null && formData.partnerId > 0
            ? formData.partnerId
            : undefined
      const rid =
        info.regionId != null && info.regionId > 0
          ? info.regionId
          : formData.regionId != null && formData.regionId > 0
            ? formData.regionId
            : undefined
      if (pid == null || rid == null) return
      formData.partnerId = pid
      formData.regionId = rid
      if (dialogType.value === 'add') {
        formData.storeId = undefined
      }
      await loadStores(pid, rid)
      return
    }

    if (scope === 'store') {
      if (dialogType.value === 'add') {
        if (info.partnerId != null && info.partnerId > 0) formData.partnerId = info.partnerId
        if (info.regionId != null && info.regionId > 0) formData.regionId = info.regionId
        if (info.storeId != null && info.storeId > 0) formData.storeId = info.storeId
      }
    }
  }

  /** 新增：重置表单 */
  function initFormDataAdd() {
    Object.assign(formData, {
      nickName: '',
      headPic: '',
      userEmail: '',
      password: '',
      phone: '',
      roleId: undefined,
      partnerId: undefined,
      regionId: undefined,
      storeId: undefined
    })
  }

  /**
   * 监听对话框：新增重置并联组织；编辑/查看拉取用户详情
   */
  watch(
    () => [props.visible, props.type, props.userData?.id] as const,
    async ([visible, type, id]) => {
      if (!visible) {
        detailCache.value = null
        return
      }
      if (type === 'add') {
        detailCache.value = null
        initFormDataAdd()
        loadRoleOptions()
        void hydrateOrgByScope()
        nextTick(() => formRef.value?.clearValidate())
        return
      }
      if ((type === 'edit' || type === 'view') && id != null) {
        await loadUserDetail(Number(id))
        if (type === 'edit') {
          loadRoleOptions()
          nextTick(() => formRef.value?.clearValidate())
        }
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
    } catch {
      return
    }

    if (dialogType.value === 'add') {
      if (formData.roleId == null) {
        ElMessage.warning('请选择对应角色')
        return
      }
      submitLoading.value = true
      try {
        await fetchCreateUser({
          nickName: formData.nickName.trim(),
          headPic: formData.headPic.trim() || '',
          email: formData.userEmail.trim(),
          password: formData.password,
          phone: formData.phone.trim() || '',
          roleId: formData.roleId,
          partnerId: formData.partnerId ?? 0,
          regionId: formData.regionId ?? 0,
          storeId: formData.storeId ?? 0
        })
        ElMessage.success('添加成功')
        dialogVisible.value = false
        emit('submit')
      } finally {
        submitLoading.value = false
      }
      return
    }

    if (dialogType.value === 'edit') {
      const id = editingUserId.value
      if (id == null || formData.roleId == null) {
        ElMessage.warning('缺少用户信息或未选择角色')
        return
      }
      submitLoading.value = true
      try {
        await fetchUpdateUser({
          id,
          email: formData.userEmail.trim(),
          nickName: formData.nickName.trim(),
          headPic: formData.headPic.trim() || '',
          phone: formData.phone.trim() || '',
          roleId: formData.roleId
        })
        ElMessage.success('更新成功')
        dialogVisible.value = false
        emit('submit')
      } finally {
        submitLoading.value = false
      }
    }
  }
</script>
