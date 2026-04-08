<!-- 工单列表 -->
<template>
  <div class="ticket-list-page art-full-height">
    <ElTabs v-model="searchForm.ticketTab" class="mb-4" @tab-change="handleTabChange">
      <ElTabPane label="全部" name="all" />
      <ElTabPane label="待处理" name="pending" />
      <ElTabPane label="已处理" name="done" />
    </ElTabs>

    <TicketSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <ElDialog v-model="detailVisible" title="工单详情" width="560px" destroy-on-close>
      <ElDescriptions v-if="detailRow" :column="1" border>
        <ElDescriptionsItem label="ID">{{ detailRow.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="设备编号（DevEUI）">{{ detailRow.devEui }}</ElDescriptionsItem>
        <ElDescriptionsItem label="所属门店">{{ detailRow.storeName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="所属区域">{{ detailRow.regionName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="所属合作商">{{ detailRow.partnerName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="所属国家">{{ detailRow.country }}</ElDescriptionsItem>
        <ElDescriptionsItem label="告警类型">{{ detailRow.alertTypeLabel }}</ElDescriptionsItem>
        <ElDescriptionsItem label="告警时间">{{ detailRow.alertTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="告警坐标">
          {{ detailRow.alertCoordinate.lng }}, {{ detailRow.alertCoordinate.lat }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="工单状态">{{
          statusLabel(detailRow.ticketStatus)
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="处理结果">
          {{ detailRow.processResult ? processLabel(detailRow.processResult) : '—' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="处理时间">
          {{ displayOrDash(detailRow.processTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="处理人">
          {{ displayOrDash(detailRow.processorName) }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>

    <ElDialog
      v-model="processVisible"
      title="工单处理"
      width="420px"
      destroy-on-close
      @closed="resetProcessForm"
    >
      <ElForm label-position="top">
        <ElFormItem label="处理结果" required>
          <ElRadioGroup v-model="processForm.result" class="flex gap-3 items-start">
            <ElRadio value="RECYCLE">回收</ElRadio>
            <ElRadio value="LOST">丢失</ElRadio>
            <ElRadio value="SCRAPPED">报废</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="processVisible = false">取消</ElButton>
        <ElButton type="primary" :disabled="!processForm.result" @click="submitProcess"
          >确认</ElButton
        >
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchTicketList, processTicket } from '@/api/ticket'
  import { useUserStore } from '@/store/modules/user'
  import { ElButton, ElMessage } from 'element-plus'
  import { h, ref } from 'vue'
  import TicketSearch from './modules/ticket-search.vue'

  defineOptions({ name: 'TicketList' })

  type TicketRow = Api.Ticket.TicketListItem

  const userStore = useUserStore()

  const searchForm = ref<Api.Ticket.TicketSearchParams>({
    ticketTab: 'pending',
    devEui: undefined,
    countryCode: undefined,
    partnerId: undefined,
    regionId: undefined,
    storeId: undefined,
    processResult: undefined,
    alertTimeRange: undefined
  })

  const detailVisible = ref(false)
  const detailRow = ref<TicketRow | null>(null)
  const processVisible = ref(false)
  const processRow = ref<TicketRow | null>(null)
  const processForm = ref<{ result: Api.Ticket.ProcessResult | '' }>({ result: '' })

  function statusLabel(s: Api.Ticket.TicketStatus) {
    return s === 'PENDING' ? '待处理' : '已完成'
  }

  function processLabel(p: Api.Ticket.ProcessResult) {
    const map: Record<Api.Ticket.ProcessResult, string> = {
      RECYCLE: '回收',
      LOST: '丢失',
      SCRAPPED: '报废'
    }
    return map[p] ?? p
  }

  /** 与「处理结果」列一致：无有效值时展示 —（含 null/undefined/空串/异常字符串） */
  function displayOrDash(v: unknown): string {
    if (v == null) return '—'
    const s = String(v).trim()
    if (s === '' || s === 'null' || s === 'undefined') return '—'
    return s
  }

  function openDetail(row: TicketRow) {
    detailRow.value = row
    detailVisible.value = true
  }

  /**
   * 粗略判断经纬度是否落在中国境内（外接矩形，非精确国界，边界仅供参考）
   */
  function isLngLatInChina(lng: number, lat: number): boolean {
    return lng >= 73.0 && lng <= 135.5 && lat >= 18.0 && lat <= 54.0
  }

  function openNavigate(row: TicketRow) {
    const { lat, lng } = row.alertCoordinate
    const url = isLngLatInChina(lng, lat)
      ? `https://uri.amap.com/marker?position=${lng},${lat}`
      : `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function openProcess(row: TicketRow) {
    processRow.value = row
    processForm.value = { result: '' }
    processVisible.value = true
  }

  function resetProcessForm() {
    processRow.value = null
    processForm.value = { result: '' }
  }

  async function submitProcess() {
    const row = processRow.value
    const result = processForm.value.result
    if (!row || !result) return
    const name = userStore.info.userName ?? '系统'
    try {
      await processTicket(row.id, { processResult: result, processorName: name })
      ElMessage.success('处理成功')
      processVisible.value = false
      refreshData()
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '处理失败')
    }
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    refreshData,
    getData,
    replaceSearchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      immediate: true,
      apiFn: fetchTicketList,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'index', width: 'auto', minWidth: 56, label: '序号' },
        { prop: 'id', label: 'ID', width: 'auto', minWidth: 72 },
        { prop: 'devEui', label: '设备编号（DevEUI）', width: 'auto', minWidth: 200 },
        { prop: 'storeName', label: '所属门店', width: 'auto', minWidth: 140 },
        { prop: 'regionName', label: '所属区域', width: 'auto', minWidth: 120 },
        { prop: 'partnerName', label: '所属合作商', width: 'auto', minWidth: 140 },
        { prop: 'country', label: '所属国家', width: 'auto', minWidth: 100 },
        { prop: 'alertTypeLabel', label: '告警类型', width: 'auto', minWidth: 110 },
        { prop: 'alertTime', label: '告警时间', width: 'auto', minWidth: 170 },
        {
          prop: 'alertCoordinate',
          label: '告警坐标',
          width: 'auto',
          minWidth: 200,
          formatter: (row: TicketRow) =>
            `${row.alertCoordinate.lng.toFixed(6)}, ${row.alertCoordinate.lat.toFixed(6)}`
        },
        {
          prop: 'ticketStatus',
          label: '工单状态',
          width: 'auto',
          minWidth: 100,
          formatter: (row: TicketRow) => statusLabel(row.ticketStatus)
        },
        {
          prop: 'processResult',
          label: '处理结果',
          width: 'auto',
          minWidth: 90,
          formatter: (row: TicketRow) => (row.processResult ? processLabel(row.processResult) : '—')
        },
        {
          prop: 'processTime',
          label: '处理时间',
          width: 'auto',
          minWidth: 170,
          formatter: (row: TicketRow) => displayOrDash(row.processTime)
        },
        {
          prop: 'processorName',
          label: '处理人',
          width: 'auto',
          minWidth: 100,
          formatter: (row: TicketRow) => displayOrDash(row.processorName)
        },
        {
          prop: 'operation',
          label: '操作',
          width: 'auto',
          minWidth: 240,
          fixed: 'right',
          formatter: (row: TicketRow) => {
            const nodes = [
              h(ArtButtonTable, {
                type: 'view',
                onClick: () => openDetail(row)
              })
            ]
            if (row.ticketStatus === 'PENDING') {
              nodes.push(
                h(
                  ElButton,
                  {
                    size: 'small',
                    onClick: () => openNavigate(row)
                  },
                  () => '一键导航'
                ),
                h(
                  ElButton,
                  {
                    type: 'primary',
                    size: 'small',
                    onClick: () => openProcess(row)
                  },
                  () => '工单处理'
                )
              )
            }
            return h('div', { class: 'flex flex-wrap items-center gap-1' }, nodes)
          }
        }
      ]
    }
  })

  const handleSearch = (params: Api.Ticket.TicketSearchParams) => {
    replaceSearchParams({
      ...params,
      ticketTab: searchForm.value.ticketTab ?? 'pending'
    })
    getData()
  }

  const handleReset = () => {
    searchForm.value = {
      ticketTab: 'pending',
      devEui: undefined,
      countryCode: undefined,
      partnerId: undefined,
      regionId: undefined,
      storeId: undefined,
      processResult: undefined,
      alertTimeRange: undefined
    }
    replaceSearchParams({ ...searchForm.value })
    getData()
  }

  const handleTabChange = () => {
    replaceSearchParams({ ...searchForm.value })
    getData()
  }
</script>
