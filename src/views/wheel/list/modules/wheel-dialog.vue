<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    :width="680"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <!-- 详情（与信标列表「信标详情」弹窗一致：带边框 Descriptions、无底部栏） -->
    <ElDescriptions v-if="mode === 'detail'" :column="1" border>
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="DevEUI">{{ detailRow?.devEui }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属门店">{{ detailRow?.storeName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属区域">{{
        detailRow?.regionName ?? '无区域'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属合作商">{{ detailRow?.partnerName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属国家">{{ detailRow?.country }}</ElDescriptionsItem>
      <ElDescriptionsItem label="设备状态">{{
        deviceStatusLabel(detailRow?.deviceStatus)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="联网状态">{{
        onlineLabel(detailRow?.onlineStatus)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="电池电量">{{ detailRow?.batteryLevel }}%</ElDescriptionsItem>
      <ElDescriptionsItem label="GPS精度">{{
        gpsAccLabel(detailRow?.gpsAccuracy)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="信标信号">{{
        detailRow != null ? formatSignalStrength(detailRow.beaconSignal) : '--'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="LoRa信号">{{
        detailRow != null ? formatSignalStrength(detailRow.loraSignal) : '--'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="围栏内外">{{
        fenceLabel(detailRow?.fenceStatus)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="出围栏时长">{{
        detailRow != null ? formatSecondsAsHours(detailRow.outFenceDurationSec) : '--'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="出围栏距离">{{
        detailRow != null ? `${detailRow.outFenceDistanceM} m` : '--'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="最新定位">{{
        coordText(detailRow?.lastPosition)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="最后通信时间">{{ detailRow?.lastCommTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">{{ detailRow?.createTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作人">{{ detailRow?.operatorName }}</ElDescriptionsItem>
    </ElDescriptions>

    <ElForm
      v-else-if="mode === 'edit'"
      ref="wheelFormRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
    >
      <ElFormItem label="DevEUI" prop="devEui">
        <ElInput v-model="form.devEui" disabled maxlength="64" show-word-limit />
      </ElFormItem>
      <ElFormItem label="所属国家" prop="countryCode">
        <ElSelect
          v-model="form.countryCode"
          class="w-full"
          :disabled="isLockedByStore"
          placeholder="请选择"
        >
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
          :disabled="isLockedByStore || !form.countryCode"
          placeholder="请选择"
        >
          <ElOption v-for="p in partnerOptions" :key="p.id" :label="p.partnerName" :value="p.id" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="所属区域" prop="regionId">
        <ElSelect
          v-model="form.regionId"
          class="w-full"
          :disabled="isLockedByStore || form.partnerId == null"
          placeholder="请选择"
        >
          <ElOption
            v-for="r in regionOptions"
            :key="String(r.value)"
            :label="r.label"
            :value="r.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="所属门店" prop="storeId">
        <ElSelect
          v-model="form.storeId"
          class="w-full"
          :disabled="isLockedByStore || form.regionId == null"
          placeholder="请选择"
        >
          <ElOption v-for="s in storeOptions" :key="s.id" :label="s.storeName" :value="s.id" />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <div v-else class="wheel-add-wrap">
      <ElTabs v-model="addMainTab">
        <ElTabPane label="单个添加" name="single" lazy>
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <span class="text-g-600">录入方式</span>
            <ElRadioGroup v-model="singleSubTab">
              <ElRadioButton label="manual">手动填写</ElRadioButton>
              <ElRadioButton label="scan">扫码录入</ElRadioButton>
            </ElRadioGroup>
          </div>

          <ElForm ref="wheelFormRef" :model="form" :rules="formRules" label-width="120px">
            <ElFormItem label="所属国家" prop="countryCode">
              <ElSelect
                v-model="form.countryCode"
                class="w-full"
                :disabled="isLockedByStore"
                placeholder="请选择"
              >
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
                :disabled="isLockedByStore || !form.countryCode"
                placeholder="请选择"
              >
                <ElOption
                  v-for="p in partnerOptions"
                  :key="p.id"
                  :label="p.partnerName"
                  :value="p.id"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="所属区域" prop="regionId">
              <ElSelect
                v-model="form.regionId"
                class="w-full"
                :disabled="isLockedByStore || form.partnerId == null"
                placeholder="请选择"
              >
                <ElOption
                  v-for="r in regionOptions"
                  :key="String(r.value)"
                  :label="r.label"
                  :value="r.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="所属门店" prop="storeId">
              <ElSelect
                v-model="form.storeId"
                class="w-full"
                :disabled="isLockedByStore || form.regionId == null"
                placeholder="请选择"
              >
                <ElOption
                  v-for="s in storeOptions"
                  :key="s.id"
                  :label="s.storeName"
                  :value="s.id"
                />
              </ElSelect>
            </ElFormItem>

            <template v-if="singleSubTab === 'manual'">
              <ElFormItem label="DevEUI" prop="devEui">
                <ElInput
                  v-model="form.devEui"
                  maxlength="64"
                  show-word-limit
                  placeholder="设备唯一标识"
                />
              </ElFormItem>
            </template>

            <template v-else>
              <ElAlert
                class="mb-3"
                type="info"
                :closable="false"
                show-icon
                title="请将焦点置于下方输入框，使用扫码枪扫描设备二维码；扫码结束会回车提交。"
              />
              <ElFormItem label="扫码">
                <ElInput
                  ref="scanInputRef"
                  v-model="scanBuffer"
                  type="textarea"
                  :rows="2"
                  placeholder="扫码内容"
                  @keydown.enter.prevent="onScanCommit"
                />
              </ElFormItem>
              <ElFormItem label="DevEUI" prop="devEui">
                <ElInput
                  v-model="form.devEui"
                  maxlength="64"
                  show-word-limit
                  placeholder="扫码后将自动填入，可核对或修改"
                />
              </ElFormItem>
            </template>
          </ElForm>
        </ElTabPane>

        <ElTabPane label="批量添加" name="batch" lazy>
          <ElForm ref="batchFormRef" :model="form" :rules="batchRules" label-width="120px">
            <ElFormItem label="所属国家" prop="countryCode">
              <ElSelect
                v-model="form.countryCode"
                class="w-full"
                :disabled="isLockedByStore"
                placeholder="请选择"
              >
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
                :disabled="isLockedByStore || !form.countryCode"
                placeholder="请选择"
              >
                <ElOption
                  v-for="p in partnerOptions"
                  :key="p.id"
                  :label="p.partnerName"
                  :value="p.id"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="所属区域" prop="regionId">
              <ElSelect
                v-model="form.regionId"
                class="w-full"
                :disabled="isLockedByStore || form.partnerId == null"
                placeholder="请选择"
              >
                <ElOption
                  v-for="r in regionOptions"
                  :key="String(r.value)"
                  :label="r.label"
                  :value="r.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="所属门店" prop="storeId">
              <ElSelect
                v-model="form.storeId"
                class="w-full"
                :disabled="isLockedByStore || form.regionId == null"
                placeholder="请选择"
              >
                <ElOption
                  v-for="s in storeOptions"
                  :key="s.id"
                  :label="s.storeName"
                  :value="s.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElForm>

          <div class="mb-3 flex flex-wrap items-center gap-3">
            <ElButton type="primary" @click="downloadWheelTemplate"
              >下载模板 TemplateWheelDataList.xlsx</ElButton
            >
            <ElUpload
              :auto-upload="false"
              accept=".xlsx,.xls"
              :show-file-list="false"
              @change="onBatchExcelChange"
            >
              <ElButton>选择 Excel 文件</ElButton>
            </ElUpload>
          </div>
          <ElAlert
            v-if="batchPreviewCount > 0"
            type="success"
            :closable="false"
            show-icon
            :title="`已解析 ${batchPreviewCount} 条，将导入到当前所选门店`"
          />
        </ElTabPane>
      </ElTabs>
    </div>

    <template #footer v-if="mode !== 'detail'">
      <template v-if="mode === 'edit'">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确定</ElButton>
      </template>
      <template v-else>
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton
          v-if="addMainTab === 'batch'"
          type="primary"
          :disabled="batchPreviewCount === 0"
          @click="handleBatchImportSubmit"
        >
          确认导入
        </ElButton>
        <ElButton v-else type="primary" @click="handleSubmit">确定</ElButton>
      </template>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, nextTick, reactive, ref, watch } from 'vue'
  import { formatSecondsAsHours } from '@/utils/duration'
  import { formatSignalStrength } from '@/utils/signal-strength'
  import { fetchPartnersByCountry } from '@/api/partner'
  import { fetchRegionList } from '@/api/region'
  import { fetchStoreList } from '@/api/store'
  import type { WheelCreatePayload } from '@/api/wheel'
  import { ElInput, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import * as XLSX from 'xlsx'

  type DialogMode = 'add' | 'edit' | 'detail'

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Wheel.WheelListItem | null
    lockedStoreId?: number
    lockedPartnerId?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: Partial<Api.Wheel.WheelListItem> & { id?: number }): void
    (e: 'batch-submit', payloads: Array<Omit<WheelCreatePayload, 'operatorName'>>): void
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const detailRow = computed(() => props.row ?? null)

  const dialogTitle = computed(() => {
    if (props.mode === 'add') return '新增车轮'
    if (props.mode === 'edit') return '编辑车轮'
    return '车轮详情'
  })

  const isLockedByStore = computed(() => props.lockedStoreId != null)

  const countryOptions = [
    { label: '中国', value: 'CN' },
    { label: '美国', value: 'US' },
    { label: '日本', value: 'JP' },
    { label: '挪威', value: 'NO' },
    { label: '德国', value: 'DE' }
  ]

  const partnerOptions = ref<Api.Partner.PartnerListItem[]>([])
  const regionOptions = ref<{ label: string; value: number | 'NONE' }[]>([])
  const storeOptions = ref<Api.Store.StoreListItem[]>([])

  const wheelFormRef = ref<FormInstance>()
  const batchFormRef = ref<FormInstance>()
  const scanInputRef = ref<InstanceType<typeof ElInput> | null>(null)

  const addMainTab = ref<'single' | 'batch'>('single')
  const singleSubTab = ref<'manual' | 'scan'>('manual')
  const scanBuffer = ref('')
  const batchParsedPayloads = ref<Array<Omit<WheelCreatePayload, 'operatorName'>>>([])
  const batchPreviewCount = computed(() => batchParsedPayloads.value.length)

  const form = reactive({
    devEui: '',
    countryCode: undefined as string | undefined,
    partnerId: undefined as number | undefined,
    regionId: undefined as number | 'NONE' | undefined,
    storeId: undefined as number | undefined
  })

  function resetForm() {
    form.devEui = ''
    form.countryCode = undefined
    form.partnerId = undefined
    form.regionId = undefined
    form.storeId = undefined
    partnerOptions.value = []
    regionOptions.value = []
    storeOptions.value = []
    addMainTab.value = 'single'
    singleSubTab.value = 'manual'
    scanBuffer.value = ''
    batchParsedPayloads.value = []
  }

  function deviceStatusLabel(s?: Api.Wheel.DeviceStatus) {
    const m: Record<string, string> = { IN_USE: '使用中', SCRAPPED: '已报废', LOST: '已丢失' }
    return s ? (m[s] ?? s) : '--'
  }
  function onlineLabel(s?: Api.Wheel.OnlineStatus) {
    const m: Record<string, string> = { ONLINE: '已联网', OFFLINE: '未联网' }
    return s ? (m[s] ?? s) : '--'
  }
  function gpsAccLabel(s?: Api.Wheel.GpsAccuracy) {
    const m: Record<string, string> = { PRECISE: '精确', IMPRECISE: '不精确' }
    return s ? (m[s] ?? s) : '--'
  }
  function fenceLabel(s?: Api.Wheel.FenceStatus) {
    const m: Record<string, string> = { INSIDE: '围栏内', OUTSIDE: '围栏外' }
    return s ? (m[s] ?? s) : '--'
  }
  function coordText(p?: Api.Store.GeoPoint) {
    if (!p) return '--'
    return `${p.lng}, ${p.lat}`
  }

  const formRules = computed<FormRules>(() => ({
    devEui: [
      ...(props.mode === 'edit'
        ? []
        : [{ required: true, message: '请输入 DevEUI', trigger: ['blur', 'change'] }])
    ],
    countryCode: [{ required: true, message: '请选择所属国家', trigger: 'change' }],
    partnerId: [{ required: true, message: '请选择所属合作商', trigger: 'change' }],
    regionId: [{ required: true, message: '请选择所属区域', trigger: 'change' }],
    storeId: [{ required: true, message: '请选择所属门店', trigger: 'change' }]
  }))

  const batchRules: FormRules = {
    countryCode: [{ required: true, message: '请选择所属国家', trigger: 'change' }],
    partnerId: [{ required: true, message: '请选择所属合作商', trigger: 'change' }],
    regionId: [{ required: true, message: '请选择所属区域', trigger: 'change' }],
    storeId: [{ required: true, message: '请选择所属门店', trigger: 'change' }]
  }

  async function loadPartners() {
    if (!form.countryCode) {
      partnerOptions.value = []
      form.partnerId = undefined
      return
    }
    let list = await fetchPartnersByCountry(form.countryCode)
    if (props.lockedPartnerId != null && !isLockedByStore.value) {
      list = list.filter((p) => p.id === props.lockedPartnerId)
    }
    partnerOptions.value = list
    if (form.partnerId != null && !list.some((p) => p.id === form.partnerId)) {
      form.partnerId = undefined
    }
  }

  async function loadRegions() {
    if (form.partnerId == null || !form.countryCode) {
      regionOptions.value = []
      form.regionId = undefined
      return
    }
    const list = await fetchRegionList({
      current: 1,
      size: 500,
      partnerId: form.partnerId,
      countryCode: form.countryCode
    })
    const opts = list.records.map((r) => ({ label: r.regionName, value: r.id as number }))
    regionOptions.value = [...opts, { label: '无区域', value: 'NONE' }]
    if (form.regionId != null && !regionOptions.value.some((o) => o.value === form.regionId)) {
      form.regionId = 'NONE'
    }
    if (form.regionId == null) {
      form.regionId = 'NONE'
    }
  }

  async function loadStores() {
    if (form.partnerId == null || !form.countryCode || form.regionId == null) {
      storeOptions.value = []
      form.storeId = undefined
      return
    }
    const list = await fetchStoreList({
      current: 1,
      size: 500,
      partnerId: form.partnerId,
      countryCode: form.countryCode,
      regionId: form.regionId
    })
    storeOptions.value = list.records
    if (form.storeId != null && !storeOptions.value.some((s) => s.id === form.storeId)) {
      form.storeId = undefined
    }
  }

  function parseScanPayload(raw: string): { devEui?: string } | null {
    const s = raw.trim()
    if (!s) return null
    try {
      const parsed = JSON.parse(s) as unknown
      if (typeof parsed === 'string') {
        const v = parsed.trim()
        return v ? { devEui: v } : null
      }
      if (parsed && typeof parsed === 'object') {
        const j = parsed as Record<string, unknown>
        const mac = (j.devEui ?? j.DevEUI ?? j.deveui ?? j.DEVEUI) as string | undefined
        return mac ? { devEui: String(mac).trim() } : null
      }
    } catch {
      const firstLine =
        s
          .split(/\r?\n/)
          .find((line) => line.trim())
          ?.trim() ?? s
      if (firstLine && !firstLine.startsWith('{')) {
        return { devEui: firstLine }
      }
    }
    return null
  }

  function onScanCommit() {
    const text = scanBuffer.value.trim() || scanBuffer.value
    const parsed = parseScanPayload(text)
    if (!parsed?.devEui) {
      ElMessage.error('无法解析 DevEUI')
      return
    }
    form.devEui = parsed.devEui
    scanBuffer.value = ''
    ElMessage.success('已填入 DevEUI')
    nextTick(() => wheelFormRef.value?.validateField('devEui'))
  }

  function downloadWheelTemplate() {
    const aoa = [['DevEUI'], ['0004A30B00119999']]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '车轮')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'TemplateWheelDataList.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  function pickExcel(row: Record<string, unknown>, keys: string[]): string | number | undefined {
    for (const k of keys) {
      if (k in row && row[k] !== '' && row[k] != null) return row[k] as string | number
    }
    return undefined
  }

  async function importExcelFile(file: File): Promise<Array<Record<string, unknown>>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]!]
          const rows = XLSX.utils.sheet_to_json(sheet) as Array<Record<string, unknown>>
          resolve(rows)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  async function onBatchExcelChange(uploadFile: UploadFile) {
    batchParsedPayloads.value = []
    if (!uploadFile.raw) return
    try {
      const rows = await importExcelFile(uploadFile.raw)
      const store = storeOptions.value.find((s) => s.id === form.storeId)
      const safeStore =
        store ??
        (await fetchStoreList({ current: 1, size: 500 })).records.find((s) => s.id === form.storeId)
      if (!safeStore || form.storeId == null) {
        ElMessage.warning('请先选择所属门店')
        return
      }
      const regionId = safeStore.regionId == null ? null : safeStore.regionId
      const list: Array<Omit<WheelCreatePayload, 'operatorName'>> = []
      for (const row of rows) {
        const devRaw = pickExcel(row, ['DevEUI', 'devEui', 'deveui', 'DEVEUI'])
        const devEui = devRaw != null ? String(devRaw).trim() : ''
        if (!devEui) continue
        list.push({
          devEui,
          storeId: safeStore.id,
          storeName: safeStore.storeName,
          regionId,
          regionName: safeStore.regionName ?? '无区域',
          partnerId: safeStore.partnerId,
          partnerName: safeStore.partnerName,
          countryCode: safeStore.countryCode,
          country: safeStore.country
        })
      }
      batchParsedPayloads.value = list
      if (list.length === 0) ElMessage.warning('未解析到有效行，请检查列名与数据')
      else ElMessage.success(`已解析 ${list.length} 条`)
    } catch {
      ElMessage.error('Excel 读取失败')
    }
  }

  watch(
    () => form.countryCode,
    async () => {
      if (!visible.value || props.mode === 'detail') return
      await loadPartners()
    }
  )

  watch(
    () => [props.modelValue, props.mode, props.row] as const,
    async ([open, mode, row]) => {
      if (!open || mode === 'detail') return
      resetForm()

      if (mode === 'edit' && row) {
        form.devEui = row.devEui
        form.countryCode = row.countryCode
        form.partnerId = row.partnerId
        form.regionId = row.regionId == null ? 'NONE' : row.regionId
        form.storeId = row.storeId
      } else if (mode === 'add') {
        if (props.lockedStoreId != null) {
          const list = await fetchStoreList({ current: 1, size: 500 })
          const store = list.records.find((s) => s.id === props.lockedStoreId)
          if (store) {
            form.countryCode = store.countryCode
            form.partnerId = store.partnerId
            form.regionId = store.regionId == null ? 'NONE' : store.regionId
            form.storeId = store.id
          }
        } else if (props.lockedPartnerId != null) {
          form.partnerId = props.lockedPartnerId
        }
      }

      await nextTick()
      await loadPartners()
      await loadRegions()
      await loadStores()
    },
    { immediate: true }
  )

  watch(
    () => [form.partnerId, form.countryCode, form.regionId] as const,
    async () => {
      if (props.mode === 'detail' || !visible.value) return
      await loadRegions()
      await loadStores()
    }
  )

  watch(
    () => [visible.value, props.mode, addMainTab.value, singleSubTab.value] as const,
    async ([open, mode, main, sub]) => {
      if (!open || mode !== 'add' || main !== 'single' || sub !== 'scan') return
      await nextTick()
      scanInputRef.value?.focus?.()
    }
  )

  watch(
    () => [form.storeId, addMainTab.value, props.mode] as const,
    () => {
      if (props.mode === 'add' && addMainTab.value === 'batch') {
        batchParsedPayloads.value = []
      }
    }
  )

  async function handleSubmit() {
    if (!wheelFormRef.value) return
    await wheelFormRef.value.validate()

    const store = storeOptions.value.find((s) => s.id === form.storeId)
    const safeStore =
      store ??
      (await fetchStoreList({ current: 1, size: 500 })).records.find((s) => s.id === form.storeId)

    if (!safeStore || form.storeId == null) return

    const regionId = safeStore.regionId == null ? null : safeStore.regionId

    emit('submit', {
      id: props.mode === 'edit' ? props.row?.id : undefined,
      devEui: form.devEui.trim(),
      storeId: safeStore.id,
      storeName: safeStore.storeName,
      regionId,
      regionName: safeStore.regionName ?? '无区域',
      partnerId: safeStore.partnerId,
      partnerName: safeStore.partnerName,
      countryCode: safeStore.countryCode,
      country: safeStore.country
    })
  }

  async function handleBatchImportSubmit() {
    if (batchFormRef.value) {
      await batchFormRef.value.validate()
    }
    if (batchParsedPayloads.value.length === 0) {
      ElMessage.warning('请先选择门店并导入 Excel')
      return
    }
    emit('batch-submit', batchParsedPayloads.value)
  }

  function handleClosed() {
    resetForm()
  }
</script>
