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
      <ElDescriptionsItem label="围栏内外">{{
        fenceLabel(detailRow?.fenceStatus)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="出围栏时间">{{
        detailRow != null
          ? detailRow.outFenceTime?.trim() ||
            (detailRow.outFenceDurationSec > 0
              ? formatSecondsAsHours(detailRow.outFenceDurationSec)
              : '--')
          : '--'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="出围栏距离">{{
        detailRow != null ? `${detailRow.outFenceDistanceM} m` : '--'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="最新定位">{{
        coordText(detailRow?.lastPosition)
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="最新定位时间">{{
        detailRow?.lastPositionTime ?? '--'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="最后通信时间">{{ detailRow?.lastCommTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">{{ detailRow?.createTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作人">{{ detailRow?.operatorName }}</ElDescriptionsItem>
    </ElDescriptions>

    <ElForm
      v-else-if="mode === 'edit'"
      ref="wheelFormRef"
      class="wheel-edit-form"
      :model="form"
      :rules="formRules"
      label-position="top"
    >
      <ElFormItem label="DevEUI" prop="devEui">
        <ElInput v-model="form.devEui" disabled maxlength="64" show-word-limit class="!w-full" />
      </ElFormItem>
      <ElFormItem label="设备状态" prop="deviceStatus">
        <ElRadioGroup
          v-model="form.deviceStatus"
          class="wheel-edit-radio-group flex w-full flex-wrap gap-x-6 gap-y-2"
        >
          <ElRadio value="IN_USE">使用中</ElRadio>
          <ElRadio value="SCRAPPED">已报废</ElRadio>
          <ElRadio value="LOST">已丢失</ElRadio>
        </ElRadioGroup>
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
          <ElForm ref="batchFormRef" :model="form" :rules="batchRules" label-width="120px"></ElForm>

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
            :title="`已解析 ${batchPreviewCount} 条，将导入到当前列表筛选所对应的门店`"
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
  import { fetchPartnerList, fetchPartnersByCountry } from '@/api/partner'
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
    /** 列表筛选（超级管理员新增时解析门店上下文） */
    countryCode?: string
    filterPartnerId?: number
    filterRegionId?: number | 'NONE'
    filterStoreId?: number
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
    deviceStatus: undefined as Api.Wheel.DeviceStatus | undefined,
    countryCode: undefined as string | undefined,
    partnerId: undefined as number | undefined,
    regionId: undefined as number | 'NONE' | undefined,
    storeId: undefined as number | undefined
  })

  function resetForm() {
    form.devEui = ''
    form.deviceStatus = undefined
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
    ...(props.mode === 'edit'
      ? {
          deviceStatus: [{ required: true, message: '请选择设备状态', trigger: 'change' }]
        }
      : {})
  }))

  const batchRules: FormRules = {}

  /** 新增：不展示国家/合作商/区域/门店表单项，从列表筛选或绑定门店解析 */
  async function resolveAddWheelContext(): Promise<void> {
    partnerOptions.value = []
    regionOptions.value = []
    storeOptions.value = []

    if (props.lockedStoreId != null) {
      const list = await fetchStoreList({ current: 1, size: 500 })
      const store = list.records.find((s) => s.id === props.lockedStoreId)
      if (store) {
        form.countryCode = store.countryCode
        form.partnerId = store.partnerId
        form.regionId = store.regionId == null ? 'NONE' : store.regionId
        form.storeId = store.id
        storeOptions.value = [store]
        const pres = await fetchPartnerList({ pageNum: 1, pageSize: 500 })
        const partner = pres.records.find((p) => p.id === store.partnerId)
        if (partner) partnerOptions.value = [partner]
        if (form.regionId !== 'NONE' && typeof form.regionId === 'number') {
          const rlist = await fetchRegionList({
            current: 1,
            size: 500,
            partnerId: store.partnerId,
            countryCode: store.countryCode
          })
          const rec = rlist.records.find((r) => r.id === form.regionId)
          regionOptions.value = rec ? [{ label: rec.regionName, value: rec.id }] : []
        } else {
          regionOptions.value = [{ label: '无区域', value: 'NONE' }]
        }
      }
      return
    }

    const code = props.countryCode
    const pid = props.filterPartnerId
    const rid = props.filterRegionId
    const sid = props.filterStoreId

    if (!code || pid == null) {
      form.countryCode = code
      form.partnerId = pid
      form.regionId = undefined
      form.storeId = undefined
      return
    }

    const partners = await fetchPartnersByCountry(code)
    partnerOptions.value = partners
    const partner = partners.find((p) => p.id === pid)
    if (!partner) {
      form.countryCode = code
      form.partnerId = undefined
      form.regionId = undefined
      form.storeId = undefined
      return
    }

    form.countryCode = code
    form.partnerId = pid

    const rlist = await fetchRegionList({
      current: 1,
      size: 500,
      partnerId: pid,
      countryCode: code
    })
    const ropts = rlist.records.map((r) => ({ label: r.regionName, value: r.id as number }))
    regionOptions.value = [...ropts, { label: '无区域', value: 'NONE' }]

    let regionVal: number | 'NONE'
    if (rid === 'NONE') {
      regionVal = 'NONE'
    } else if (typeof rid === 'number' && regionOptions.value.some((o) => o.value === rid)) {
      regionVal = rid
    } else {
      regionVal = 'NONE'
    }
    form.regionId = regionVal

    const slist = await fetchStoreList({
      current: 1,
      size: 500,
      partnerId: pid,
      countryCode: code,
      regionId: regionVal
    })
    storeOptions.value = slist.records
    if (sid != null && storeOptions.value.some((s) => s.id === sid)) {
      form.storeId = sid
    } else {
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
        ElMessage.warning('请先在列表上方筛选国家、合作商、区域与门店，或确认已绑定门店账号')
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
    () =>
      [
        props.modelValue,
        props.mode,
        props.row,
        props.countryCode,
        props.filterPartnerId,
        props.filterRegionId,
        props.filterStoreId,
        props.lockedStoreId,
        props.lockedPartnerId
      ] as const,
    async ([open, mode, row]) => {
      if (!open || mode === 'detail') return
      resetForm()

      if (mode === 'edit' && row) {
        form.devEui = row.devEui
        form.deviceStatus = row.deviceStatus
      } else if (mode === 'add') {
        await resolveAddWheelContext()
      }

      await nextTick()
    },
    { immediate: true }
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

    if (props.mode === 'edit') {
      const row = props.row
      if (!row) return
      emit('submit', {
        id: row.id,
        devEui: form.devEui.trim(),
        deviceStatus: form.deviceStatus,
        storeId: row.storeId,
        storeName: row.storeName,
        regionId: row.regionId ?? null,
        regionName: row.regionName ?? '无区域',
        partnerId: row.partnerId,
        partnerName: row.partnerName,
        countryCode: row.countryCode,
        country: row.country
      })
      return
    }

    const store = storeOptions.value.find((s) => s.id === form.storeId)
    const safeStore =
      store ??
      (await fetchStoreList({ current: 1, size: 500 })).records.find((s) => s.id === form.storeId)

    if (!safeStore || form.storeId == null) {
      ElMessage.warning(
        props.lockedStoreId != null
          ? '无法解析当前账号绑定的门店信息，请稍后重试'
          : '请先在列表上方筛选中选择国家、合作商、区域与门店，再新增车轮'
      )
      return
    }

    const regionId = safeStore.regionId == null ? null : safeStore.regionId

    emit('submit', {
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
      ElMessage.warning('请先确认列表筛选门店上下文并导入 Excel')
      return
    }
    emit('batch-submit', batchParsedPayloads.value)
  }

  function handleClosed() {
    resetForm()
  }
</script>

<style scoped>
  /** 编辑表单：标签置顶、与控件统一左对齐 */
  .wheel-edit-form :deep(.el-form-item__label) {
    justify-content: flex-start;
    padding: 0 0 4px;
    line-height: 1.5;
  }

  .wheel-edit-form :deep(.el-form-item__content) {
    padding-left: 18px;
    line-height: 1.5;
  }

  .wheel-edit-radio-group :deep(.el-radio) {
    padding-left: 8px;
    margin-right: 0;
  }
</style>
