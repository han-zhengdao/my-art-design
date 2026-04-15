<template>
  <ElDialog
    :title="dialogTitle"
    :model-value="visible"
    @update:model-value="handleCancel"
    width="860px"
    align-center
    class="menu-dialog"
    @closed="handleClosed"
  >
    <ArtForm
      ref="formRef"
      v-model="form"
      :items="formItems"
      :rules="rules"
      :span="width > 640 ? 12 : 24"
      :gutter="20"
      label-width="100px"
      :show-reset="false"
      :show-submit="false"
    >
      <template #menuType>
        <ElRadioGroup
          v-model="form.menuType"
          :disabled="disableMenuType"
          class="menu-type-radio-group flex flex-wrap items-center gap-y-8"
        >
          <ElRadio v-for="opt in menuTypeOptions" :key="opt.value" :label="opt.value">
            {{ opt.label }}
          </ElRadio>
        </ElRadioGroup>
      </template>
    </ArtForm>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleCancel">取 消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确 定</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormRules } from 'element-plus'
  import { ElIcon, ElTooltip } from 'element-plus'
  import { QuestionFilled } from '@element-plus/icons-vue'
  import { formatMenuTitle } from '@/utils/router'
  import type { AppRouteRecord } from '@/types/router'
  import type { FormItem } from '@/components/core/forms/art-form/index.vue'
  import ArtForm from '@/components/core/forms/art-form/index.vue'
  import { useWindowSize } from '@vueuse/core'
  import { useI18n } from 'vue-i18n'
  import { fetchGetDictDataByDictCodeList } from '@/api/system-manage'

  const { width } = useWindowSize()
  const { locale } = useI18n()

  /** 后端 dictKey → 表单 menuType */
  const dictKeyToMenuType = (dictKey: string): 'directory' | 'menu' => {
    return String(dictKey) === '2' ? 'menu' : 'directory'
  }

  const defaultMenuTypeOptions: { label: string; value: 'directory' | 'menu' }[] = [
    { label: '目录', value: 'directory' },
    { label: '菜单', value: 'menu' }
  ]

  const menuTypeOptions = ref<{ label: string; value: 'directory' | 'menu' }[]>([
    ...defaultMenuTypeOptions
  ])

  const loadMenuTypeDict = async (): Promise<void> => {
    try {
      const list = await fetchGetDictDataByDictCodeList('menu_type')
      if (!Array.isArray(list) || list.length === 0) return
      const sorted = [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      const mapped = sorted
        .map((item) => {
          const value = dictKeyToMenuType(String(item.dictKey))
          const isEn = locale.value?.toLowerCase().startsWith('en')
          const label = (isEn && item.dictValueEn?.trim()) || item.dictValue || ''
          if (!label) return null
          return { label, value }
        })
        .filter((x): x is { label: string; value: 'directory' | 'menu' } => x !== null)
      if (mapped.length > 0) menuTypeOptions.value = mapped
    } catch {
      menuTypeOptions.value = [...defaultMenuTypeOptions]
    }
  }

  /**
   * 创建带 tooltip 的表单标签
   * @param label 标签文本
   * @param tooltip 提示文本
   * @returns 渲染函数
   */
  const createLabelTooltip = (label: string, tooltip: string) => {
    return () =>
      h('span', { class: 'flex items-center' }, [
        h('span', label),
        h(
          ElTooltip,
          {
            content: tooltip,
            placement: 'top'
          },
          () => h(ElIcon, { class: 'ml-0.5 cursor-help' }, () => h(QuestionFilled))
        )
      ])
  }

  interface MenuFormData {
    id: number
    parentId: number
    name: string
    nameEn: string
    /** 权限标识，对应后端 menuCode；留空时由列表页用路由地址推导 */
    menuCode: string
    path: string
    label: string
    icon: string
    isEnable: boolean
    sort: number
    isMenu: boolean
    keepAlive: boolean
    isHide: boolean
    isHideTab: boolean
    fixedTab: boolean
    activePath: string
    roles: string[]
    isFullPage: boolean
    authIcon: string
    authSort: number
  }

  interface Props {
    visible: boolean
    editData?: AppRouteRecord | any
    type?: 'directory' | 'menu'
    lockType?: boolean
    defaultParentId?: number
    directoryOptions?: Api.SystemManage.DirectoryMenuItem[]
    menuNameMap?: Record<number, string>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: MenuFormData): void
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    type: 'directory',
    lockType: false,
    defaultParentId: 0,
    directoryOptions: () => [],
    menuNameMap: () => ({})
  })

  const emit = defineEmits<Emits>()

  const formRef = ref()
  const isEdit = ref(false)

  const form = reactive<MenuFormData & { menuType: 'directory' | 'menu' }>({
    menuType: 'directory',
    id: 0,
    parentId: 0,
    name: '',
    nameEn: '',
    menuCode: '',
    path: '',
    label: '',
    icon: '',
    isEnable: true,
    sort: 1,
    isMenu: true,
    keepAlive: true,
    isHide: false,
    isHideTab: false,
    fixedTab: false,
    activePath: '',
    roles: [],
    isFullPage: false,
    authIcon: '',
    authSort: 1
  })

  const rules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入菜单名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }]
  })

  /**
   * 表单项配置
   */
  const formItems = computed<FormItem[]>(() => {
    /** 放在输入项之后、开关之前 */
    const menuTypeItem: FormItem = { label: '菜单类型', key: 'menuType', span: 24 }

    // Switch 组件的 span：小屏幕 12，大屏幕 6
    const switchSpan = width.value < 640 ? 12 : 6

    if (form.menuType === 'directory' || form.menuType === 'menu') {
      const parentOptions = [
        { label: '顶级目录', value: 0 },
        ...props.directoryOptions.map((d) => ({ label: d.menuName, value: d.id }))
      ]
      // 编辑场景下若当前 parentId 不在目录列表里（例如后端仅返回部分目录），补一条兜底选项避免显示纯数字 id
      if (
        form.parentId !== 0 &&
        !parentOptions.some((opt) => Number(opt.value) === Number(form.parentId))
      ) {
        const fallbackName = props.menuNameMap[Number(form.parentId)] || `ID:${form.parentId}`
        parentOptions.push({ label: fallbackName, value: form.parentId })
      }
      return [
        {
          label: '父级菜单',
          key: 'parentId',
          type: 'select',
          props: { placeholder: '请选择父级菜单', options: parentOptions, clearable: false }
        },
        { label: '菜单名称', key: 'name', type: 'input', props: { placeholder: '菜单名称' } },
        {
          label: '菜单名称英文',
          key: 'nameEn',
          type: 'input',
          props: { placeholder: 'Menu Name (English)' }
        },
        {
          label: createLabelTooltip(
            '路由地址',
            '一级菜单：以 / 开头的绝对路径（如 /dashboard）\n二级及以下：相对路径（如 console、user）'
          ),
          key: 'path',
          type: 'input',
          props: { placeholder: '如：/dashboard 或 console' }
        },
        {
          label: createLabelTooltip(
            '权限标识',
            '对应后端 menuCode，需全局唯一。留空则默认与「路由地址」相同。\n若删除后再次新增报 500，可改为不同标识（如 console2）再试。'
          ),
          key: 'menuCode',
          type: 'input',
          props: { placeholder: '留空则与路由地址相同' }
        },
        { label: '图标', key: 'icon', type: 'input', props: { placeholder: '如：ri:user-line' } },
        {
          label: createLabelTooltip(
            '角色权限',
            '仅用于前端权限模式：配置角色标识（如 R_SUPER、R_ADMIN）\n后端权限模式：无需配置'
          ),
          key: 'roles',
          type: 'inputtag',
          props: { placeholder: '输入角色标识后按回车，如：R_SUPER' }
        },
        {
          label: '菜单排序',
          key: 'sort',
          type: 'number',
          props: { min: 1, controlsPosition: 'right', style: { width: '100%' } }
        },
        {
          label: createLabelTooltip(
            '激活路径',
            '用于详情页等隐藏菜单，指定高亮显示的父级菜单路径\n例如：用户详情页高亮显示"用户管理"菜单'
          ),
          key: 'activePath',
          type: 'input',
          props: { placeholder: '如：/system/user' }
        },
        menuTypeItem,
        { label: '是否启用', key: 'isEnable', type: 'switch', span: switchSpan },
        { label: '页面缓存', key: 'keepAlive', type: 'switch', span: switchSpan },
        { label: '隐藏菜单', key: 'isHide', type: 'switch', span: switchSpan },
        { label: '固定标签', key: 'fixedTab', type: 'switch', span: switchSpan },
        { label: '标签隐藏', key: 'isHideTab', type: 'switch', span: switchSpan },
        { label: '全屏页面', key: 'isFullPage', type: 'switch', span: switchSpan }
      ]
    }
    return []
  })

  const dialogTitle = computed(() => {
    const opt = menuTypeOptions.value.find((o) => o.value === form.menuType)
    const typeLabel = opt?.label ?? (form.menuType === 'menu' ? '菜单' : '目录')
    return isEdit.value ? `编辑${typeLabel}` : `新建${typeLabel}`
  })

  /**
   * 是否禁用菜单类型切换
   */
  /** 编辑时允许改类型（避免建错只能删重建）；仅「新增下级」且锁定子类型时禁止切换 */
  const disableMenuType = computed(() => {
    return !isEdit.value && form.menuType === 'menu' && props.lockType
  })

  /**
   * 重置表单数据
   */
  const resetForm = (): void => {
    formRef.value?.reset()
    form.menuType = 'directory'
  }

  /**
   * 加载表单数据（编辑模式）
   */
  const loadFormData = (): void => {
    if (!props.editData) return

    isEdit.value = true

    const row = props.editData
    form.id = row.id || 0
    form.parentId = Number(row.parentId ?? 0)
    form.menuType = Number(row.type) === 2 ? 'menu' : 'directory'
    form.name = row.menuNameZh || formatMenuTitle(row.meta?.title || '')
    form.nameEn = row.menuNameEn || ''
    form.menuCode = row.name || ''
    form.path = row.path || ''
    form.label = row.name || ''
    form.icon = row.meta?.icon || ''
    form.sort = row.meta?.sort || 1
    form.isMenu = row.meta?.isMenu ?? true
    form.keepAlive = row.meta?.keepAlive ?? false
    form.isHide = row.meta?.isHide ?? false
    form.isHideTab = row.meta?.isHideTab ?? false
    form.isEnable = row.meta?.isEnable ?? true
    form.fixedTab = row.meta?.fixedTab ?? false
    form.activePath = row.meta?.activePath || ''
    form.roles = row.meta?.roles || []
    form.isFullPage = row.meta?.isFullPage ?? false
  }

  /**
   * 提交表单
   */
  const handleSubmit = async (): Promise<void> => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      emit('submit', { ...form })
    } catch {
      ElMessage.error('表单校验失败，请检查输入')
    }
  }

  /**
   * 取消操作
   */
  const handleCancel = (): void => {
    emit('update:visible', false)
  }

  /**
   * 对话框关闭后的回调
   */
  const handleClosed = (): void => {
    resetForm()
    isEdit.value = false
  }

  /**
   * 监听对话框显示状态
   */
  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        void loadMenuTypeDict()
        form.menuType = props.type
        nextTick(() => {
          if (props.editData) {
            loadFormData()
          } else if (form.menuType === 'directory' || form.menuType === 'menu') {
            form.parentId = Number(props.defaultParentId ?? 0)
          }
        })
      }
    }
  )

  /**
   * 监听菜单类型变化
   */
  watch(
    () => props.type,
    (newType) => {
      if (props.visible) {
        form.menuType = newType
      }
    }
  )
</script>
