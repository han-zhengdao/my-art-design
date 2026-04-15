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
      <ElStep :title="t('storePage.dialog.stepInfo')" />
      <ElStep :title="t('storePage.dialog.stepAccount')" />
    </ElSteps>

    <ElForm
      v-if="mode !== 'detail' && showStoreForm"
      ref="storeFormRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
    >
      <ElFormItem :label="t('storePage.dialog.storeName')" prop="storeName">
        <ElInput v-model="form.storeName" maxlength="100" show-word-limit />
      </ElFormItem>
      <ElFormItem
        v-if="mode === 'add' && isSuperAdmin"
        :label="t('storePage.dialog.partner')"
        prop="partnerId"
      >
        <ElSelect
          v-model="form.partnerId"
          class="w-full"
          filterable
          clearable
          :placeholder="t('storePage.dialog.selectPartner')"
          @change="handlePartnerChange"
        >
          <ElOption
            v-for="partner in partnerOptions"
            :key="partner.id"
            :label="partner.partnerName"
            :value="partner.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        v-if="mode === 'add' && isSuperAdmin"
        :label="t('storePage.dialog.region')"
        prop="regionId"
      >
        <ElSelect
          v-model="form.regionId"
          class="w-full"
          clearable
          :placeholder="t('storePage.dialog.selectRegionOptional')"
        >
          <ElOption
            v-for="region in regionOptions"
            :key="String(region.value)"
            :label="region.label"
            :value="region.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('storePage.dialog.storeAddress')" prop="storeAddress">
        <ElInput v-model="form.storeAddress" type="textarea" :rows="2" />
      </ElFormItem>
      <ElFormItem :label="t('storePage.dialog.contactName')" prop="contactName">
        <ElInput v-model="form.contactName" />
      </ElFormItem>
      <ElFormItem :label="t('storePage.dialog.phone')" prop="phone">
        <ElInput v-model="form.phone" />
      </ElFormItem>
      <ElFormItem :label="t('storePage.dialog.mapProvider')" prop="mapProvider">
        <ElSelect v-model="form.mapProvider" class="w-full">
          <ElOption
            v-for="option in mapTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('storePage.dialog.storeCoordinate')" prop="storeCoordinateText">
        <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <ElInput
            v-model="form.storeCoordinateText"
            class="flex-1"
            :placeholder="t('storePage.dialog.storeCoordinatePlaceholder')"
          />
          <ElButton type="primary" plain @click="openMapPicker('coordinate')">
            {{ t('storePage.dialog.pickCoordinate') }}
          </ElButton>
        </div>
      </ElFormItem>
      <ElFormItem :label="t('storePage.dialog.geofence')" prop="geofenceText">
        <div class="flex w-full flex-col gap-2">
          <div class="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
            <ElInput
              v-model="form.geofenceText"
              class="flex-1"
              type="textarea"
              :rows="3"
              :placeholder="t('storePage.dialog.geofencePlaceholder')"
            />
            <ElButton type="primary" plain @click="openMapPicker('geofence')">{{
              t('storePage.dialog.pickGeofence')
            }}</ElButton>
          </div>
          <span class="text-xs text-[var(--el-text-color-secondary)]">
            {{ t('storePage.dialog.geofenceHelp') }}
          </span>
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
          :title="t('storePage.dialog.alertAccount')"
        />
      </div>
      <ElFormItem :label="t('storePage.dialog.loginEmail')" prop="loginEmail">
        <ElInput v-model="accountForm.loginEmail" />
      </ElFormItem>
      <ElFormItem :label="t('storePage.dialog.loginPassword')" prop="loginPassword">
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
      <ElDescriptionsItem :label="t('storePage.dialog.detail.id')">{{
        detailRow?.id
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.loginEmail')">{{
        detailRow?.loginEmail || t('storePage.common.emptyText')
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.storeName')">{{
        detailRow?.storeName
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.storeAddress')">{{
        detailRow?.storeAddress
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.contactName')">{{
        detailRow?.contactName
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.phone')">{{
        detailRow?.phone
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.regionName')">{{
        detailRow?.regionName || t('storePage.common.noRegion')
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.partnerName')">{{
        detailRow?.partnerName
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.country')">{{
        detailRow?.country
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.mapProvider')">{{
        mapLabel(detailRow?.mapProvider)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.storeCoordinate')">{{
        pointToText(detailRow?.storeCoordinate)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.geofence')">
        <div class="store-detail-geofence-scroll">
          {{ geofenceToText(detailRow?.geofence) }}
        </div>
      </ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.timezone')">{{
        formatTimezoneLabel(detailRow?.timezone)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.dcBalance')">{{
        detailRow?.dcBalance
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.wheelCount')">{{
        detailRow?.wheelCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.beaconCount')">{{
        detailRow?.beaconCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.pendingTicketCount')">{{
        detailRow?.pendingTicketCount
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.createTime')">{{
        detailRow?.createTime
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('storePage.dialog.detail.operatorName')">{{
        detailRow?.operatorName
      }}</ElDescriptionsItem>
    </ElDescriptions>

    <template #footer v-if="mode !== 'detail'">
      <template v-if="mode === 'add'">
        <ElButton @click="visible = false">{{ t('storePage.dialog.footerCancel') }}</ElButton>
        <ElButton v-if="addStep === 1" @click="goPrevStep">{{
          t('storePage.dialog.footerPrev')
        }}</ElButton>
        <ElButton v-if="addStep === 0" type="primary" @click="goNextStep">{{
          t('storePage.dialog.footerNext')
        }}</ElButton>
        <ElButton v-if="addStep === 1" type="primary" @click="submitAdd">{{
          t('storePage.dialog.footerConfirm')
        }}</ElButton>
      </template>
      <template v-else>
        <ElButton @click="visible = false">{{ t('storePage.dialog.footerCancel') }}</ElButton>
        <ElButton type="primary" @click="submitEdit">{{
          t('storePage.dialog.footerConfirm')
        }}</ElButton>
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
  import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
  import { countryIdToCountryCode, fetchPartnerList } from '@/api/partner'
  import { fetchRegionList } from '@/api/region'
  import { fetchGetDictDataByDictCodeList } from '@/api/system-manage'
  import { getDictDataDisplayLabel } from '@/utils/dict-label'
  import {
    formatTimezoneLabel,
    getBrowserLocalTimeZone,
    getSuggestedTimezoneForCountry
  } from '@/utils/timezone-options'
  import { useI18n } from 'vue-i18n'
  import StoreMapPickerDialog from './store-map-picker-dialog.vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

  type DialogMode = 'add' | 'edit' | 'detail'

  type StoreDialogSubmitPayload = Partial<Api.Store.StoreListItem> & {
    loginEmail?: string
    loginPassword?: string
  }

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Store.StoreListItem | null
    isSuperAdmin?: boolean
    lockedPartnerId?: number
    /** 区域管理员新增/编辑时锁定为本人管辖区域 */
    lockedRegionId?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: StoreDialogSubmitPayload): void
  }>()
  const { locale, t } = useI18n()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const isSuperAdmin = computed(() => !!props.isSuperAdmin)

  const dialogTitle = computed(() => {
    if (props.mode === 'add') return t('storePage.dialog.titleAdd')
    if (props.mode === 'edit') return t('storePage.dialog.titleEdit')
    return t('storePage.dialog.titleDetail')
  })

  const detailRow = computed(() => props.row ?? null)

  const addStep = ref(0)
  const storeFormRef = ref<FormInstance>()
  const accountFormRef = ref<FormInstance>()
  const partnerOptions = ref<Api.Partner.PartnerListItem[]>([])
  const regionOptions = ref<{ label: string; value: number | 'NONE' }[]>([])
  const getDefaultMapTypeOptions = (): { label: string; value: Api.Store.MapProvider }[] => [
    { label: t('storePage.map.tencent'), value: 'TENCENT' as Api.Store.MapProvider },
    { label: t('storePage.map.google'), value: 'GOOGLE' as Api.Store.MapProvider }
  ]
  const mapTypeOptions = ref<{ label: string; value: Api.Store.MapProvider }[]>([
    ...getDefaultMapTypeOptions()
  ])

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

  const accountForm = reactive({
    loginEmail: '',
    loginPassword: ''
  })

  const requiredCoordinate = (_: unknown, value: string, callback: (err?: Error) => void) => {
    try {
      parsePoint(value)
      callback()
    } catch {
      callback(new Error(t('storePage.validation.storeCoordinate')))
    }
  }

  const requiredGeofence = (_: unknown, value: string, callback: (err?: Error) => void) => {
    try {
      const points = parsePoints(value)
      if (points.length < 3) throw new Error('need3')
      callback()
    } catch {
      callback(new Error(t('storePage.validation.geofence')))
    }
  }

  const formRules: FormRules = {
    storeName: [{ required: true, message: t('storePage.validation.storeName'), trigger: 'blur' }],
    partnerId: [
      {
        validator: (_rule, value: number | undefined, callback: (err?: Error) => void) => {
          if (props.mode === 'add' && isSuperAdmin.value && value == null) {
            callback(new Error(t('storePage.validation.partner')))
            return
          }
          callback()
        },
        trigger: 'change'
      }
    ],
    storeAddress: [
      { required: true, message: t('storePage.validation.storeAddress'), trigger: 'blur' }
    ],
    contactName: [
      { required: true, message: t('storePage.validation.contactName'), trigger: 'blur' }
    ],
    phone: [{ required: true, message: t('storePage.validation.phone'), trigger: 'blur' }],
    mapProvider: [
      { required: true, message: t('storePage.validation.mapProvider'), trigger: 'change' }
    ],
    storeCoordinateText: [
      { required: true, validator: requiredCoordinate, trigger: ['blur', 'change'] }
    ],
    geofenceText: [{ required: true, validator: requiredGeofence, trigger: ['blur', 'change'] }]
  }

  const accountRules: FormRules = {
    loginEmail: [
      { required: true, message: t('storePage.validation.loginEmail'), trigger: 'blur' },
      { type: 'email', message: t('storePage.validation.emailFormat'), trigger: 'blur' }
    ],
    loginPassword: [
      { required: true, message: t('storePage.validation.loginPassword'), trigger: 'blur' },
      { min: 6, message: t('storePage.validation.passwordMin'), trigger: 'blur' }
    ]
  }

  const dictKeyToMapProvider = (dictKey: string): Api.Store.MapProvider =>
    String(dictKey) === '1' ? 'GOOGLE' : 'TENCENT'

  function mapLabel(mapProvider?: Api.Store.MapProvider): string {
    return (
      mapTypeOptions.value.find((opt) => opt.value === mapProvider)?.label ??
      t('storePage.map.tencent')
    )
  }

  async function loadMapTypeDict(): Promise<void> {
    try {
      const list = await fetchGetDictDataByDictCodeList('map_type')
      if (!Array.isArray(list) || list.length === 0) {
        mapTypeOptions.value = [...getDefaultMapTypeOptions()]
        return
      }
      const sorted = [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      const mapped = sorted
        .map((item) => ({
          label: getDictDataDisplayLabel(item, locale.value),
          value: dictKeyToMapProvider(String(item.dictKey))
        }))
        .filter((item) => item.label.trim().length > 0)
      mapTypeOptions.value = mapped.length > 0 ? mapped : [...getDefaultMapTypeOptions()]
    } catch {
      mapTypeOptions.value = [...getDefaultMapTypeOptions()]
    }
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
    if (!point) return t('storePage.common.emptyText')
    return `${point.lng}, ${point.lat}`
  }

  function geofenceToText(points?: Api.Store.GeoPoint[]): string {
    if (!points || points.length === 0) return t('storePage.common.emptyText')
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
    accountForm.loginEmail = ''
    accountForm.loginPassword = ''
  }

  /** 拉取当前合作商下区域下拉（用于解析 regionName） */
  async function loadRegionsForAdd(): Promise<void> {
    if (form.partnerId == null) {
      regionOptions.value = [{ label: t('storePage.common.noRegion'), value: 'NONE' }]
      return
    }
    const list = await fetchRegionList({
      current: 1,
      size: 500,
      partnerId: form.partnerId,
      ...(form.countryCode ? { countryCode: form.countryCode } : {})
    })
    const opts = list.records.map((r) => ({ label: r.regionName, value: r.id as number }))
    regionOptions.value = [...opts, { label: t('storePage.common.noRegion'), value: 'NONE' }]
  }

  async function handlePartnerChange(partnerId?: number): Promise<void> {
    if (!isSuperAdmin.value) return
    const partner = partnerOptions.value.find((item) => item.id === partnerId)
    form.countryCode = partner?.countryCode || countryIdToCountryCode(partner?.countryId)
    form.regionId = 'NONE'
    if (partner) {
      await loadRegionsForAdd()
    } else {
      regionOptions.value = [{ label: t('storePage.common.noRegion'), value: 'NONE' }]
    }
    form.timezone =
      getBrowserLocalTimeZone() ?? getSuggestedTimezoneForCountry(form.countryCode) ?? ''
  }

  /** 新增门店：超管可选合作商/区域，其它角色按账号锁定范围解析 */
  async function resolveAddStoreContext(): Promise<void> {
    partnerOptions.value = []
    regionOptions.value = []

    if (isSuperAdmin.value) {
      const res = await fetchPartnerList({ pageNum: 1, pageSize: 500 })
      partnerOptions.value = res.records
      form.countryCode = undefined
      form.partnerId = undefined
      form.regionId = 'NONE'
      regionOptions.value = [{ label: t('storePage.common.noRegion'), value: 'NONE' }]
      form.timezone = getBrowserLocalTimeZone() ?? ''
      return
    }

    if (props.lockedRegionId != null && props.lockedPartnerId != null) {
      const res = await fetchPartnerList({ pageNum: 1, pageSize: 500 })
      const partner = res.records.find((p) => p.id === props.lockedPartnerId)
      if (partner) {
        form.countryCode = partner.countryCode
        form.partnerId = partner.id
        partnerOptions.value = [partner]
      } else {
        form.countryCode = undefined
        form.partnerId = undefined
      }
      if (form.partnerId != null && form.countryCode) {
        const rlist = await fetchRegionList({
          current: 1,
          size: 500,
          partnerId: form.partnerId,
          countryCode: form.countryCode
        })
        const rec = rlist.records.find((r) => r.id === props.lockedRegionId)
        regionOptions.value = rec ? [{ label: rec.regionName, value: rec.id }] : []
        form.regionId = props.lockedRegionId
      }
      form.timezone =
        getBrowserLocalTimeZone() ?? getSuggestedTimezoneForCountry(form.countryCode) ?? ''
      return
    }

    if (props.lockedPartnerId != null) {
      const res = await fetchPartnerList({ pageNum: 1, pageSize: 500 })
      const partner = res.records.find((p) => p.id === props.lockedPartnerId)
      if (partner) {
        form.countryCode = partner.countryCode
        form.partnerId = partner.id
        partnerOptions.value = [partner]
        await loadRegionsForAdd()
        form.regionId = 'NONE'
      } else {
        form.countryCode = undefined
        form.partnerId = undefined
        form.regionId = undefined
      }
      form.timezone =
        getBrowserLocalTimeZone() ?? getSuggestedTimezoneForCountry(form.countryCode) ?? ''
      return
    }

    form.countryCode = undefined
    form.partnerId = undefined
    form.regionId = undefined
    form.timezone = getBrowserLocalTimeZone() ?? ''
  }

  watch(
    () =>
      [
        props.modelValue,
        props.mode,
        props.row,
        props.isSuperAdmin,
        props.lockedPartnerId,
        props.lockedRegionId
      ] as const,
    async ([open, mode, row]) => {
      if (!open || mode === 'detail') return
      if (mode === 'edit' && row) {
        addStep.value = 0
        form.storeName = row.storeName
        form.storeAddress = row.storeAddress
        form.contactName = row.contactName
        form.phone = row.phone
        form.mapProvider = row.mapProvider
        form.storeCoordinateText = pointToText(row.storeCoordinate)
        form.geofenceText = row.geofence.map((p) => `${p.lng},${p.lat}`).join(';')
      } else if (mode === 'add') {
        addStep.value = 0
        form.storeName = ''
        form.storeAddress = ''
        form.contactName = ''
        form.phone = ''
        form.mapProvider = 'TENCENT'
        form.storeCoordinateText = ''
        form.geofenceText = ''
        resetAccountForm()
        await resolveAddStoreContext()
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    void loadMapTypeDict()
  })

  watch(locale, () => {
    void loadMapTypeDict()
  })

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
    if (form.partnerId == null || !partner) {
      ElMessage.warning(
        props.lockedPartnerId != null
          ? t('storePage.messages.lockedPartnerMissing')
          : isSuperAdmin.value
            ? t('storePage.messages.selectPartnerRequired')
            : t('storePage.messages.boundPartnerMissing')
      )
      return
    }
    if (!form.timezone?.trim()) {
      ElMessage.warning(t('storePage.messages.timezoneMissing'))
      return
    }
    const regionName =
      form.regionId === 'NONE' || form.regionId === undefined
        ? t('storePage.common.noRegion')
        : (regionOptions.value.find((o) => o.value === form.regionId)?.label ??
          t('storePage.common.noRegion'))
    emit('submit', {
      storeName: form.storeName,
      storeAddress: form.storeAddress,
      contactName: form.contactName,
      phone: form.phone,
      countryCode: form.countryCode || countryIdToCountryCode(partner.countryId),
      country: partner.country || partner.countryName || '',
      partnerId: form.partnerId,
      partnerName: partner.partnerName,
      regionId: form.regionId === 'NONE' ? undefined : (form.regionId as number),
      regionName,
      mapProvider: form.mapProvider,
      storeCoordinate: parsePoint(form.storeCoordinateText),
      geofence: parsePoints(form.geofenceText),
      timezone: form.timezone,
      loginEmail: accountForm.loginEmail.trim(),
      loginPassword: accountForm.loginPassword
    })
    visible.value = false
  }

  const submitEdit = async () => {
    if (!storeFormRef.value) return
    await storeFormRef.value.validate()
    const row = props.row
    if (!row) return
    const regionName =
      row.regionId == null
        ? t('storePage.common.noRegion')
        : (row.regionName ?? t('storePage.common.noRegion'))
    emit('submit', {
      id: row.id,
      storeName: form.storeName,
      storeAddress: form.storeAddress,
      contactName: form.contactName,
      phone: form.phone,
      countryCode: row.countryCode,
      country: row.country,
      partnerId: row.partnerId,
      partnerName: row.partnerName,
      regionId: row.regionId,
      regionName,
      mapProvider: form.mapProvider,
      storeCoordinate: parsePoint(form.storeCoordinateText),
      geofence: parsePoints(form.geofenceText),
      timezone: row.timezone
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
