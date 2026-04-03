<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="680px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <!-- 详情 -->
    <ElDescriptions v-if="mode === 'detail'" :column="1" class="border-g-200">
      <ElDescriptionsItem label="ID">{{ detailRow?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="信标 MAC">{{ detailRow?.beaconMac }}</ElDescriptionsItem>
      <ElDescriptionsItem label="区域编号">{{ detailRow?.regionCode }}</ElDescriptionsItem>
      <ElDescriptionsItem label="GPS 坐标">{{
        `${detailRow?.gpsCoordinate.lng},${detailRow?.gpsCoordinate.lat}`
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属门店">{{ detailRow?.storeName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属区域">{{
        detailRow?.regionName ?? '无区域'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属合作商">{{ detailRow?.partnerName }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所属国家">{{ detailRow?.country }}</ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">{{ detailRow?.createTime }}</ElDescriptionsItem>
      <ElDescriptionsItem label="操作人">{{ detailRow?.operatorName }}</ElDescriptionsItem>
    </ElDescriptions>

    <!-- 编辑 -->
    <ElForm
      v-else-if="mode === 'edit'"
      ref="beaconFormRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
    >
      <ElFormItem label="信标 MAC" prop="beaconMac">
        <ElInput v-model="form.beaconMac" disabled maxlength="50" show-word-limit />
      </ElFormItem>
      <ElFormItem label="区域编号" prop="regionCode">
        <ElInput v-model="form.regionCode" maxlength="50" show-word-limit />
      </ElFormItem>
      <ElFormItem label="GPS 坐标" prop="gpsCoordinateText">
        <ElInput
          v-model="form.gpsCoordinateText"
          placeholder="格式：经度,纬度（如 121.503,31.236）"
        />
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

    <!-- 新增：单个 / 批量 -->
    <div v-else class="beacon-add-wrap">
      <ElTabs v-model="addMainTab">
        <ElTabPane label="单个添加" name="single" lazy>
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <span class="text-g-600">录入方式</span>
            <ElRadioGroup v-model="singleSubTab">
              <ElRadioButton label="manual">手动填写</ElRadioButton>
              <ElRadioButton label="scan">扫码录入</ElRadioButton>
            </ElRadioGroup>
          </div>

          <ElForm ref="beaconFormRef" :model="form" :rules="formRules" label-width="120px">
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
              <ElFormItem label="信标 MAC" prop="beaconMac">
                <ElInput v-model="form.beaconMac" maxlength="50" show-word-limit />
              </ElFormItem>
              <ElFormItem label="区域编号" prop="regionCode">
                <ElInput v-model="form.regionCode" maxlength="50" show-word-limit />
              </ElFormItem>
              <ElFormItem label="GPS 坐标" prop="gpsCoordinateText">
                <div class="flex w-full flex-wrap gap-2">
                  <ElInput
                    v-model="form.gpsCoordinateText"
                    class="min-w-[240px] flex-1"
                    placeholder="默认与门店坐标一致，可修改"
                  />
                  <ElButton @click="applyStoreGps">填入门店坐标</ElButton>
                </div>
              </ElFormItem>
            </template>

            <template v-else>
              <ElAlert
                class="mb-3"
                type="info"
                :closable="false"
                show-icon
                title="请先将焦点置于下方输入框，扫码枪扫描信标二维码；扫码完成会回车结束。"
              />
              <ElFormItem label="扫码识别" required>
                <ElInput
                  ref="scanInputRef"
                  v-model="scanBuffer"
                  type="textarea"
                  :rows="3"
                  placeholder="常见：仅一串 MAC"
                  @keydown.enter.prevent="onScanCommit"
                />
                <div class="mt-2">
                  <ElButton type="primary" @click="onScanCommit">解析并填入</ElButton>
                </div>
              </ElFormItem>
              <ElFormItem label="信标 MAC" prop="beaconMac">
                <ElInput v-model="form.beaconMac" maxlength="50" show-word-limit />
              </ElFormItem>
              <ElFormItem label="区域编号" prop="regionCode">
                <ElInput v-model="form.regionCode" maxlength="50" show-word-limit />
              </ElFormItem>
              <ElFormItem label="GPS 坐标" prop="gpsCoordinateText">
                <div class="flex w-full flex-wrap gap-2">
                  <ElInput
                    v-model="form.gpsCoordinateText"
                    class="min-w-[240px] flex-1"
                    placeholder="默认与门店坐标一致，可修改"
                  />
                  <ElButton @click="applyStoreGps">填入门店坐标</ElButton>
                </div>
              </ElFormItem>
            </template>
          </ElForm>
        </ElTabPane>

        <ElTabPane label="批量导入" name="batch" lazy>
          <ElAlert
            class="mb-3"
            type="warning"
            :closable="false"
            show-icon
            title="请先下载模板并填写后导入；坐标与门店归属一致，模板中需填写经度、纬度。"
          />
          <ElForm ref="batchFormRef" :model="form" :rules="formRules" label-width="120px">
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
            <ElButton type="primary" @click="downloadBeaconTemplate"
              >下载模板 TemplateBeaconDataList.xlsx</ElButton
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

    <template #footer>
      <template v-if="mode === 'detail'">
        <ElButton @click="visible = false">关闭</ElButton>
      </template>
      <template v-else-if="mode === 'edit'">
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
  import { fetchPartnersByCountry } from '@/api/partner'
  import { fetchRegionList } from '@/api/region'
  import { fetchStoreList } from '@/api/store'
  import type { BeaconCreatePayload } from '@/api/beacon'
  import { ElInput, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import * as XLSX from 'xlsx'

  type DialogMode = 'add' | 'edit' | 'detail'

  const props = defineProps<{
    modelValue: boolean
    mode: DialogMode
    row?: Api.Beacon.BeaconListItem | null
    lockedStoreId?: number
    lockedPartnerId?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: Partial<Api.Beacon.BeaconListItem> & { id?: number }): void
    (e: 'batch-submit', payloads: Array<Omit<BeaconCreatePayload, 'operatorName'>>): void
  }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const detailRow = computed(() => props.row ?? null)

  const dialogTitle = computed(() => {
    if (props.mode === 'add') return '新增信标'
    if (props.mode === 'edit') return '编辑信标'
    return '信标详情'
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

  const beaconFormRef = ref<FormInstance>()
  const batchFormRef = ref<FormInstance>()
  const scanInputRef = ref<InstanceType<typeof ElInput> | null>(null)

  const addMainTab = ref<'single' | 'batch'>('single')
  const singleSubTab = ref<'manual' | 'scan'>('manual')
  const scanBuffer = ref('')
  const batchParsedPayloads = ref<Array<Omit<BeaconCreatePayload, 'operatorName'>>>([])

  const batchPreviewCount = computed(() => batchParsedPayloads.value.length)

  const form = reactive({
    beaconMac: '',
    regionCode: '',
    gpsCoordinateText: '',
    countryCode: undefined as string | undefined,
    partnerId: undefined as number | undefined,
    regionId: undefined as number | 'NONE' | undefined,
    storeId: undefined as number | undefined
  })

  function resetForm() {
    form.beaconMac = ''
    form.regionCode = ''
    form.gpsCoordinateText = ''
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

  function parsePoint(text: string): Api.Store.GeoPoint {
    const [lngStr, latStr] = text.split(',').map((s) => s.trim())
    const lng = Number(lngStr)
    const lat = Number(latStr)
    if (Number.isNaN(lng) || Number.isNaN(lat)) throw new Error('invalid')
    return { lng, lat }
  }

  const requiredGps = (_: unknown, value: string, callback: (err?: Error) => void) => {
    try {
      if (!value?.trim()) throw new Error('empty')
      parsePoint(value)
      callback()
    } catch {
      callback(new Error('请输入正确 GPS 坐标格式：经度,纬度'))
    }
  }

  const formRules: FormRules = {
    beaconMac: [
      ...(props.mode === 'edit'
        ? []
        : [{ required: true, message: '信标 MAC 为必填项', trigger: ['blur', 'change'] }])
    ],
    regionCode: [{ required: true, message: '请输入区域编号', trigger: 'blur' }],
    gpsCoordinateText: [{ required: true, validator: requiredGps, trigger: ['blur', 'change'] }],
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
    if (form.storeId == null && storeOptions.value.length > 0) {
      form.storeId = storeOptions.value[0]!.id
    }
  }

  function syncGpsFromStore(store: Api.Store.StoreListItem) {
    form.gpsCoordinateText = `${store.storeCoordinate.lng},${store.storeCoordinate.lat}`
  }

  function applyStoreGps() {
    const store = storeOptions.value.find((s) => s.id === form.storeId)
    if (store) syncGpsFromStore(store)
    else ElMessage.warning('请先选择门店')
  }

  /** 扫码内容解析：纯 MAC（最常见）/ JSON / 管道分隔 */
  function parseScanPayload(raw: string): {
    beaconMac?: string
    regionCode?: string
    lng?: number
    lat?: number
  } | null {
    const s = raw.trim()
    if (!s) return null
    try {
      const parsed = JSON.parse(s) as unknown
      if (typeof parsed === 'string') {
        const mac = parsed.trim()
        return mac ? { beaconMac: mac } : null
      }
      if (parsed && typeof parsed === 'object') {
        const j = parsed as Record<string, unknown>
        const mac = (j.beaconMac ?? j.mac ?? j.beacon_mac ?? j.MAC) as string | undefined
        const regionCode = (j.regionCode ?? j.region_code ?? j.region) as string | undefined
        let lng = j.lng ?? j.longitude
        let lat = j.lat ?? j.latitude
        if (typeof j.gps === 'string' || typeof j.coordinate === 'string') {
          const gps = String(j.gps ?? j.coordinate)
          const [a, b] = gps.split(',').map((x) => x.trim())
          lng = Number(a)
          lat = Number(b)
        }
        return {
          beaconMac: mac,
          regionCode,
          lng: lng != null ? Number(lng) : undefined,
          lat: lat != null ? Number(lat) : undefined
        }
      }
    } catch {
      // 管道或 TAB：MAC|区域|经度|纬度 或 MAC|区域|经度,纬度
      const parts = s
        .split(/[|\t]/)
        .map((x) => x.trim())
        .filter(Boolean)
      if (parts.length >= 2) {
        const beaconMac = parts[0]
        const regionCode = parts[1]
        if (parts.length >= 4) {
          const lng = Number(parts[2])
          const lat = Number(parts[3])
          return { beaconMac, regionCode, lng, lat }
        }
        if (parts[2]) {
          const [lngs, lats] = parts[2].split(',').map((x) => x.trim())
          const lng = Number(lngs)
          const lat = Number(lats)
          return { beaconMac, regionCode, lng, lat }
        }
        return { beaconMac, regionCode }
      }
    }
    // 扫码枪常见：整段即为信标 MAC（无 JSON、无管道）
    const firstLine =
      s
        .split(/\r?\n/)
        .find((line) => line.trim())
        ?.trim() ?? s
    if (firstLine && !firstLine.includes('|') && !firstLine.startsWith('{')) {
      return { beaconMac: firstLine }
    }
    return null
  }

  function onScanCommit() {
    const text = scanBuffer.value.trim() || scanBuffer.value
    const parsed = parseScanPayload(text)
    if (!parsed) {
      ElMessage.error('无法解析扫码内容，请检查格式')
      return
    }
    if (!parsed.beaconMac?.trim()) {
      ElMessage.error('未识别到信标 MAC，扫码内容须包含 MAC（必填项）')
      return
    }
    form.beaconMac = parsed.beaconMac.trim()
    if (parsed.regionCode) form.regionCode = parsed.regionCode
    const store = storeOptions.value.find((s) => s.id === form.storeId)
    if (
      parsed.lng != null &&
      parsed.lat != null &&
      !Number.isNaN(parsed.lng) &&
      !Number.isNaN(parsed.lat)
    ) {
      form.gpsCoordinateText = `${parsed.lng},${parsed.lat}`
    } else if (store) {
      syncGpsFromStore(store)
    }
    scanBuffer.value = ''
    const onlyMac =
      !parsed.regionCode &&
      (parsed.lng == null ||
        parsed.lat == null ||
        Number.isNaN(parsed.lng) ||
        Number.isNaN(parsed.lat))
    ElMessage.success(
      onlyMac ? '已填入信标 MAC，请补充区域编号与坐标后提交' : '已填入，请检查信息后提交'
    )
    nextTick(() => beaconFormRef.value?.validateField('beaconMac'))
  }

  function downloadBeaconTemplate() {
    const aoa = [
      ['信标MAC', '区域编号', '经纬度'],
      ['AA:BB:CC:DD:EE:01', 'A-01', '121.503,31.236']
    ]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '信标')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'TemplateBeaconDataList.xlsx'
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
      const list: Array<Omit<BeaconCreatePayload, 'operatorName'>> = []
      for (const row of rows) {
        const macRaw = pickExcel(row, ['信标MAC', 'beaconMac', 'MAC', 'mac'])
        const regionRaw = pickExcel(row, ['区域编号', 'regionCode', '区域code'])
        const combinedRaw = pickExcel(row, ['经纬度', 'GPS坐标', 'gpsCoordinate', '坐标', 'gps'])
        let lng: number
        let lat: number
        if (combinedRaw != null && String(combinedRaw).trim() !== '') {
          const parts = String(combinedRaw)
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
          lng = Number(parts[0])
          lat = Number(parts[1])
        } else {
          const lngRaw = pickExcel(row, ['经度', 'lng', 'longitude', 'LNG'])
          const latRaw = pickExcel(row, ['纬度', 'lat', 'latitude', 'LAT'])
          lng = Number(lngRaw)
          lat = Number(latRaw)
        }
        const beaconMac = macRaw != null ? String(macRaw).trim() : ''
        const regionCode = regionRaw != null ? String(regionRaw).trim() : ''
        if (!beaconMac || !regionCode || Number.isNaN(lng) || Number.isNaN(lat)) continue
        list.push({
          beaconMac,
          regionCode,
          gpsCoordinate: { lng, lat },
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
    () => form.storeId,
    async (storeId) => {
      if (storeId == null) return
      const store = storeOptions.value.find((s) => s.id === storeId)
      if (!store) return
      if (form.countryCode !== store.countryCode) form.countryCode = store.countryCode
      if (form.partnerId !== store.partnerId) form.partnerId = store.partnerId
      const nextRegionId = store.regionId == null ? 'NONE' : store.regionId
      if (form.regionId !== nextRegionId) form.regionId = nextRegionId
      if (props.mode !== 'detail') {
        syncGpsFromStore(store)
      }
    }
  )

  watch(
    () => [props.modelValue, props.mode, props.row] as const,
    async ([open, mode, row]) => {
      if (!open || mode === 'detail') return
      resetForm()

      if (mode === 'edit' && row) {
        form.beaconMac = row.beaconMac
        form.regionCode = row.regionCode
        form.gpsCoordinateText = `${row.gpsCoordinate.lng},${row.gpsCoordinate.lat}`
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
            syncGpsFromStore(store)
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
    () => [form.countryCode, form.partnerId] as const,
    async () => {
      if (props.mode === 'detail' || !visible.value) return
      await loadPartners()
    }
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
    if (!beaconFormRef.value) return
    await beaconFormRef.value.validate()

    const store = storeOptions.value.find((s) => s.id === form.storeId)
    const safeStore =
      store ??
      (await fetchStoreList({ current: 1, size: 500 })).records.find((s) => s.id === form.storeId)

    if (!safeStore || form.storeId == null) return

    const gpsCoordinate = parsePoint(form.gpsCoordinateText)
    const regionId = safeStore.regionId == null ? null : safeStore.regionId

    emit('submit', {
      id: props.mode === 'edit' ? props.row?.id : undefined,
      beaconMac: form.beaconMac,
      regionCode: form.regionCode,
      gpsCoordinate,
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
