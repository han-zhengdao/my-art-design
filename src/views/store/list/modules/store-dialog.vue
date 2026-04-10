<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    :width="680"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <ElSteps
      v-if="mode === 'add'"
      :active="addStep"
      align-center
      finish-status="success"
      class="store-dialog-steps"
    >
      <ElStep title="门店信息" />
      <ElStep title="门店账户" />
    </ElSteps>

    <ElForm
      v-if="mode !== 'detail' && showStoreForm"
      ref="storeFormRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
    >
      <ElFormItem label="门店名称" prop="storeName">
        <ElInput v-model="form.storeName" maxlength="100" show-word-limit />
      </ElFormItem>
      <ElFormItem label="门店地址" prop="storeAddress">
        <ElInput v-model="form.storeAddress" type="textarea" :rows="2" />
      </ElFormItem>
      <ElFormItem label="联系人" prop="contactName">
        <ElInput v-model="form.contactName" />
      </ElFormItem>
      <ElFormItem label="联系电话" prop="phone">
        <ElInput v-model="form.phone" />
      </ElFormItem>
      <ElFormItem label="所属国家" prop="countryCode">
        <ElSelect v-model="form.countryCode" class="w-full" placeholder="请选择">
          <ElOption
            v-for="opt in countryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="所属合作商" prop="partnerId">
        <ElSelect
          v-model="form.partnerId"
          class="w-full"
          :disabled="!form.countryCode"
          :placeholder="form.countryCode ? '请选择合作商' : '请先选择所属国家'"
        >
          <ElOption v-for="p in partnerOptions" :key="p.id" :label="p.partnerName" :value="p.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="所属区域" prop="regionId">
        <ElSelect
          v-model="form.regionId"
          class="w-full"
          :disabled="!form.partnerId || lockedRegionId != null"
          :placeholder="form.partnerId ? '请选择区域（可选）' : '请先选择合作商'"
        >
          <ElOption
            v-for="r in regionOptions"
            :key="String(r.value)"
            :label="r.label"
            :value="r.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="地图选择" prop="mapProvider">
        <ElSelect v-model="form.mapProvider" class="w-full">
          <ElOption label="腾讯地图" value="TENCENT" />
          <ElOption label="谷歌地图" value="GOOGLE" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="门店坐标" prop="storeCoordinateText">
        <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <ElInput
            v-model="form.storeCoordinateText"
            class="flex-1"
            placeholder="经度,纬度；可点击右侧在地图上选点"
          />
          <ElButton type="primary" plain @click="openMapPicker('coordinate')">地图选点</ElButton>
        </div>
      </ElFormItem>
      <ElFormItem label="电子围栏" prop="geofenceText">
        <div class="flex w-full flex-col gap-2">
          <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
            <ElInput
              v-model="form.geofenceText"
              class="flex-1"
              type="textarea"
              :rows="3"
              placeholder="至少 3 个顶点：lng,lat;lng,lat;… 可通过地图绘制填入"
            />
            <ElButton type="primary" plain @click="openMapPicker('geofence')"
              >地图绘制围栏</ElButton
            >
          </div>
          <span class="text-xs text-[var(--el-text-color-secondary)]">
            与上方「地图选择」一致：在子窗口中操作地图，确定后填入此处，不影响其它页面。
          </span>
        </div>
      </ElFormItem>
      <ElFormItem label="时区" prop="timezone">
        <div class="w-full">
          <ElSelect
            v-model="form.timezone"
            class="w-full"
            filterable
            placeholder="搜索城市、地区或在分组中选择"
          >
            <ElOptionGroup v-for="group in timezoneGroups" :key="group.label" :label="group.label">
              <ElOption
                v-for="opt in group.options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElOptionGroup>
          </ElSelect>
          <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="text-xs text-[var(--el-text-color-secondary)]">
              <template v-if="mode === 'add'">新增时默认已选本机时区（由浏览器提供）。</template>
              优先在「常用」中选择；其余按地区分组，支持输入关键字筛选。
            </span>
            <ElButton
              v-if="suggestedTimezone"
              link
              type="primary"
              class="!h-auto !p-0 text-xs"
              @click="form.timezone = suggestedTimezone"
            >
              填入{{ countryNameForSuggest }}推荐时区
            </ElButton>
          </div>
        </div>
      </ElFormItem>
    </ElForm>

    <ElForm
      v-if="mode === 'add' && addStep === 1"
      ref="accountFormRef"
      :model="accountForm"
      :rules="accountRules"
      label-width="120px"
    >
      <div class="mb-4">
        <ElAlert
          type="info"
          :closable="false"
          show-icon
          title="将创建门店管理员账户，并同步至用户管理；对应资产为门店名称。"
        />
      </div>
      <ElFormItem label="昵称" prop="userNickName">
        <ElInput v-model="accountForm.userNickName" maxlength="50" />
      </ElFormItem>
      <ElFormItem label="登录邮箱" prop="loginEmail">
        <ElInput v-model="accountForm.loginEmail" />
      </ElFormItem>
      <ElFormItem label="登录密码" prop="loginPassword">
        <ElInput
          v-model="accountForm.loginPassword"
          type="password"
          show-password
          autocomplete="new-password"
        />
      </ElFormItem>
    </ElForm>

    <!-- 详情（与车轮列表「车轮详情」弹窗一致：带边框 Descriptions、无底部栏） -->
    <ElDescriptions v-else-if="mode === 'detail'" :column="1" border class="store-detail-desc">
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="用户昵称">{{
        detailRow?.userNickName || '--'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="登录邮箱">{{ detailRow?.loginEmail || '--' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="门店名称">{{ detailRow?.storeName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="门店地址">{{ detailRow?.storeAddress }}</ElDescriptionsItem>
      <ElDescriptionsItem label="联系人">{{ detailRow?.contactName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="联系电话">{{ detailRow?.phone }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属区域">{{
        detailRow?.regionName || '无区域'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属合作商">{{ detailRow?.partnerName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属国家">{{ detailRow?.country }}</ElDescriptionsItem>
      <ElDescriptionsItem label="地图选择">{{
        mapLabel(detailRow?.mapProvider)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="门店坐标">{{
        pointToText(detailRow?.storeCoordinate)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="电子围栏">
        <div class="store-detail-geofence-scroll">
          {{ geofenceToText(detailRow?.geofence) }}
        </div>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="时区">{{
        formatTimezoneLabel(detailRow?.timezone)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="DC余额">{{ detailRow?.dcBalance }}</ElDescriptionsItem>
      <ElDescriptionsItem label="车轮总数">{{ detailRow?.wheelCount }}</ElDescriptionsItem>
      <ElDescriptionsItem label="信标总数">{{ detailRow?.beaconCount }}</ElDescriptionsItem>
      <ElDescriptionsItem label="未处理工单数">{{
        detailRow?.pendingTicketCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">{{ detailRow?.createTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作人">{{ detailRow?.operatorName }}</ElDescriptionsItem>
    </ElDescriptions>

    <template #footer v-if="mode !== 'detail'">
      <template v-if="mode === 'add'">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton v-if="addStep === 1" @click="goPrevStep">上一步</ElButton>
        <ElButton v-if="addStep === 0" type="primary" @click="goNextStep">下一步</ElButton>
        <ElButton v-if="addStep === 1" type="primary" @click="submitAdd">确定</ElButton>
      </template>
      <template v-else>
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" @click="submitEdit">确定</ElButton>
      </template>
    </template>
  </ElDialog>

  <StoreMapPickerDialog
    v-model="mapPickerVisible"
    :map-provider="form.mapProvider"
    :pick-mode="mapPickMode"
    :initial-coordinate-text="form.storeCoordinateText"
    :initial-geofence-text="form.geofenceText"
    @confirm="onMapPickerConfirm"
  />
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { fetchPartnersByCountry } from '@/api/partner'
  import { fetchRegionList } from '@/api/region'
  import {
    formatTimezoneLabel,
    getBrowserLocalTimeZone,
    getGroupedTimezoneSelectOptions,
    getSuggestedTimezoneForCountry
  } from '@/utils/timezone-options'
  import StoreMapPickerDialog from './store-map-picker-dialog.vue'
  import type { FormInstance, FormRules } from 'element-plus'

  type DialogMode = 'add' | 'edit' | 'detail'

  type StoreDialogSubmitPayload = Partial<Api.Store.StoreListItem> & {
    userNickName?: string
    loginEmail?: string
    loginPassword?: string
  }

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Store.StoreListItem | null
    countryCode?: string
    lockedPartnerId?: number
    /** 区域管理员新增/编辑时锁定为本人管辖区域 */
    lockedRegionId?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: StoreDialogSubmitPayload): void
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const dialogTitle = computed(() => {
    if (props.mode === 'add') return '新增门店'
    if (props.mode === 'edit') return '编辑门店'
    return '门店详情'
  })

  const detailRow = computed(() => props.row ?? null)

  const countryOptions = [
    { label: '中国', value: 'CN' },
    { label: '美国', value: 'US' },
    { label: '日本', value: 'JP' },
    { label: '挪威', value: 'NO' },
    { label: '德国', value: 'DE' }
  ]

  const addStep = ref(0)
  const storeFormRef = ref<FormInstance>()
  const accountFormRef = ref<FormInstance>()
  const partnerOptions = ref<Api.Partner.PartnerListItem[]>([])
  const regionOptions = ref<{ label: string; value: number | 'NONE' }[]>([])

  /** 子窗口地图选点/围栏（append-to-body，叠在主弹窗之上） */
  const mapPickerVisible = ref(false)
  const mapPickMode = ref<'coordinate' | 'geofence'>('coordinate')

  const showStoreForm = computed(() => {
    if (props.mode === 'edit') return true
    if (props.mode === 'add') return addStep.value === 0
    return false
  })

  const form = reactive({
    storeName: '',
    storeAddress: '',
    contactName: '',
    phone: '',
    countryCode: undefined as string | undefined,
    partnerId: undefined as number | undefined,
    regionId: undefined as number | 'NONE' | undefined,
    mapProvider: 'TENCENT' as Api.Store.MapProvider,
    storeCoordinateText: '',
    geofenceText: '',
    timezone: ''
  })

  /** 常用置顶 + 按地区分组；编辑时旧值不在标准列表则单独一组 */
  const timezoneGroups = computed(() => getGroupedTimezoneSelectOptions(form.timezone))

  const suggestedTimezone = computed(() => getSuggestedTimezoneForCountry(form.countryCode))

  const countryNameForSuggest = computed(() => {
    const code = form.countryCode
    if (!code) return ''
    return countryOptions.find((c) => c.value === code)?.label ?? code
  })

  const accountForm = reactive({
    userNickName: '',
    loginEmail: '',
    loginPassword: ''
  })

  const requiredCoordinate = (_: unknown, value: string, callback: (err?: Error) => void) => {
    try {
      parsePoint(value)
      callback()
    } catch {
      callback(new Error('请输入正确坐标格式：经度,纬度'))
    }
  }

  const requiredGeofence = (_: unknown, value: string, callback: (err?: Error) => void) => {
    try {
      const points = parsePoints(value)
      if (points.length < 3) throw new Error('need3')
      callback()
    } catch {
      callback(new Error('围栏至少 3 个顶点，格式：lng,lat;lng,lat;…'))
    }
  }

  const formRules: FormRules = {
    storeName: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
    storeAddress: [{ required: true, message: '请输入门店地址', trigger: 'blur' }],
    contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
    countryCode: [{ required: true, message: '请选择所属国家', trigger: 'change' }],
    partnerId: [{ required: true, message: '请选择所属合作商', trigger: 'change' }],
    mapProvider: [{ required: true, message: '请选择地图', trigger: 'change' }],
    storeCoordinateText: [
      { required: true, validator: requiredCoordinate, trigger: ['blur', 'change'] }
    ],
    geofenceText: [{ required: true, validator: requiredGeofence, trigger: ['blur', 'change'] }],
    timezone: [{ required: true, message: '请选择时区', trigger: 'change' }]
  }

  const accountRules: FormRules = {
    userNickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    loginEmail: [
      { required: true, message: '请输入登录邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入有效邮箱', trigger: 'blur' }
    ],
    loginPassword: [
      { required: true, message: '请输入登录密码', trigger: 'blur' },
      { min: 6, message: '密码至少 6 位', trigger: 'blur' }
    ]
  }

  function mapLabel(mapProvider?: Api.Store.MapProvider): string {
    if (mapProvider === 'GOOGLE') return '谷歌地图'
    return '腾讯地图'
  }

  function parsePoint(text: string): Api.Store.GeoPoint {
    const [lngStr, latStr] = text.split(',').map((s) => s.trim())
    const lng = Number(lngStr)
    const lat = Number(latStr)
    if (Number.isNaN(lng) || Number.isNaN(lat)) throw new Error('invalid point')
    return { lng, lat }
  }

  function parsePoints(text: string): Api.Store.GeoPoint[] {
    return text
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item) => parsePoint(item))
  }

  function pointToText(point?: Api.Store.GeoPoint): string {
    if (!point) return '--'
    return `${point.lng}, ${point.lat}`
  }

  function geofenceToText(points?: Api.Store.GeoPoint[]): string {
    if (!points || points.length === 0) return '--'
    return points.map((p) => `${p.lng}, ${p.lat}`).join('; ')
  }

  function openMapPicker(mode: 'coordinate' | 'geofence') {
    mapPickMode.value = mode
    mapPickerVisible.value = true
  }

  async function onMapPickerConfirm(text: string) {
    if (mapPickMode.value === 'coordinate') {
      form.storeCoordinateText = text
      await nextTick()
      await storeFormRef.value?.clearValidate('storeCoordinateText')
    } else {
      form.geofenceText = text
      await nextTick()
      await storeFormRef.value?.clearValidate('geofenceText')
    }
  }

  function resetAccountForm() {
    accountForm.userNickName = ''
    accountForm.loginEmail = ''
    accountForm.loginPassword = ''
  }

  async function loadPartners() {
    if (!form.countryCode) {
      partnerOptions.value = []
      form.partnerId = undefined
      return
    }
    let list = await fetchPartnersByCountry(form.countryCode)
    if (props.lockedPartnerId != null) {
      list = list.filter((p) => p.id === props.lockedPartnerId)
    }
    partnerOptions.value = list
    if (form.partnerId != null && !list.some((p) => p.id === form.partnerId)) {
      form.partnerId = undefined
    }
  }

  async function loadRegions() {
    if (form.partnerId == null) {
      regionOptions.value = [{ label: '无区域', value: 'NONE' }]
      form.regionId = 'NONE'
      return
    }
    const list = await fetchRegionList({
      current: 1,
      size: 500,
      partnerId: form.partnerId,
      countryCode: form.countryCode
    })
    let records = list.records
    if (props.lockedRegionId != null) {
      records = records.filter((r) => r.id === props.lockedRegionId)
    }
    const opts = records.map((r) => ({ label: r.regionName, value: r.id as number }))
    if (props.lockedRegionId != null) {
      regionOptions.value = opts
      form.regionId = props.lockedRegionId
      return
    }
    regionOptions.value = [...opts, { label: '无区域', value: 'NONE' }]
    if (form.regionId != null && !regionOptions.value.some((o) => o.value === form.regionId)) {
      form.regionId = 'NONE'
    }
    if (form.regionId == null) {
      form.regionId = 'NONE'
    }
  }

  watch(
    () => [visible.value, form.countryCode, props.lockedPartnerId, props.lockedRegionId] as const,
    async () => {
      if (!visible.value || props.mode === 'detail') return
      await loadPartners()
      await loadRegions()
    },
    { immediate: true }
  )

  watch(
    () => [props.modelValue, props.mode, props.row, props.countryCode] as const,
    ([open, mode, row, searchCountryCode]) => {
      if (!open || mode === 'detail') return
      if (mode === 'edit' && row) {
        addStep.value = 0
        form.storeName = row.storeName
        form.storeAddress = row.storeAddress
        form.contactName = row.contactName
        form.phone = row.phone
        form.countryCode = row.countryCode
        form.partnerId = row.partnerId
        form.regionId = row.regionId ?? 'NONE'
        form.mapProvider = row.mapProvider
        form.storeCoordinateText = pointToText(row.storeCoordinate)
        form.geofenceText = row.geofence.map((p) => `${p.lng},${p.lat}`).join(';')
        form.timezone = row.timezone
      } else if (mode === 'add') {
        addStep.value = 0
        form.storeName = ''
        form.storeAddress = ''
        form.contactName = ''
        form.phone = ''
        form.countryCode = searchCountryCode
        form.partnerId = props.lockedPartnerId
        form.regionId = props.lockedRegionId != null ? props.lockedRegionId : 'NONE'
        form.mapProvider = 'TENCENT'
        form.storeCoordinateText = ''
        form.geofenceText = ''
        form.timezone = getBrowserLocalTimeZone() ?? ''
        resetAccountForm()
      }
    },
    { immediate: true }
  )

  /** 已选国家且时区仍为空时自动填入推荐 IANA（不覆盖用户已选） */
  watch(
    () => [visible.value, props.mode, form.countryCode, form.timezone] as const,
    () => {
      if (!visible.value || props.mode === 'detail') return
      if (!form.countryCode || form.timezone) return
      const s = getSuggestedTimezoneForCountry(form.countryCode)
      if (s) form.timezone = s
    }
  )

  const handleClosed = () => {
    addStep.value = 0
    storeFormRef.value?.resetFields()
    accountFormRef.value?.resetFields()
    resetAccountForm()
  }

  const goNextStep = async () => {
    if (!storeFormRef.value) return
    await storeFormRef.value.validate()
    addStep.value = 1
  }

  const goPrevStep = () => {
    addStep.value = 0
  }

  const submitAdd = async () => {
    if (!accountFormRef.value) return
    await accountFormRef.value.validate()
    const partner = partnerOptions.value.find((p) => p.id === form.partnerId)
    const regionName =
      form.regionId === 'NONE'
        ? '无区域'
        : regionOptions.value.find((o) => o.value === form.regionId)?.label
    emit('submit', {
      storeName: form.storeName,
      storeAddress: form.storeAddress,
      contactName: form.contactName,
      phone: form.phone,
      countryCode: form.countryCode,
      country: partner?.country,
      partnerId: form.partnerId,
      partnerName: partner?.partnerName,
      regionId: form.regionId === 'NONE' ? undefined : (form.regionId as number),
      regionName,
      mapProvider: form.mapProvider,
      storeCoordinate: parsePoint(form.storeCoordinateText),
      geofence: parsePoints(form.geofenceText),
      timezone: form.timezone,
      userNickName: accountForm.userNickName.trim(),
      loginEmail: accountForm.loginEmail.trim(),
      loginPassword: accountForm.loginPassword
    })
    visible.value = false
  }

  const submitEdit = async () => {
    if (!storeFormRef.value) return
    await storeFormRef.value.validate()
    const partner = partnerOptions.value.find((p) => p.id === form.partnerId)
    const regionName =
      form.regionId === 'NONE'
        ? '无区域'
        : regionOptions.value.find((o) => o.value === form.regionId)?.label
    emit('submit', {
      id: props.row?.id,
      storeName: form.storeName,
      storeAddress: form.storeAddress,
      contactName: form.contactName,
      phone: form.phone,
      countryCode: form.countryCode,
      country: partner?.country,
      partnerId: form.partnerId,
      partnerName: partner?.partnerName,
      regionId: form.regionId === 'NONE' ? undefined : (form.regionId as number),
      regionName,
      mapProvider: form.mapProvider,
      storeCoordinate: parsePoint(form.storeCoordinateText),
      geofence: parsePoints(form.geofenceText),
      timezone: form.timezone
    })
    visible.value = false
  }
</script>

<style scoped>
  .store-dialog-steps {
    margin-bottom: 20px;
  }

  /** 详情表格固定布局，避免单格超长撑开整行；电子围栏单行展示 + 横向滚动查看 */
  .store-detail-desc :deep(.el-descriptions__table) {
    width: 100%;
    table-layout: fixed;
  }

  .store-detail-desc :deep(.el-descriptions__label) {
    width: 140px;
    vertical-align: top;
  }

  .store-detail-desc :deep(.el-descriptions__content) {
    min-width: 0;
  }

  .store-detail-geofence-scroll {
    display: block;
    max-width: 100%;
    padding-bottom: 2px;
    overflow: auto hidden;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
</style>
