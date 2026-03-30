<template>
  <div class="art-card h-105 p-5 mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>待办与预警</h4>
        <p>车轮告警自动生成工单，展示本月工单进度与积压情况</p>
      </div>
    </div>

    <div class="mt-5 rounded-lg border border-g-200 p-4">
      <div class="flex-cb">
        <span class="text-sm">本月工单处理进度</span>
        <span class="text-sm font-medium">{{ monthCompleted }} / {{ workOrder.monthTotal }}</span>
      </div>
      <ElProgress
        class="mt-2"
        :percentage="progressPercent"
        :stroke-width="10"
        :format="formatPercent"
      />
    </div>

    <div class="grid grid-cols-2 gap-3 mt-5">
      <div class="rounded-lg bg-danger/8 px-3 py-3">
        <p class="text-xs text-g-600">告警工单总数（本月）</p>
        <p class="mt-1 text-xl font-semibold text-danger">{{ workOrder.monthAlertOrdersTotal }}</p>
        <p class="mt-1 text-xs text-g-600">
          {{ formatMom(workOrder.monthAlertOrdersMomPercent) }}
        </p>
      </div>
      <div class="rounded-lg bg-warning/10 px-3 py-3">
        <p class="text-xs text-g-600">待处理工单数（本月）</p>
        <p class="mt-1 text-xl font-semibold text-warning">{{ workOrder.pendingOrders }}</p>
      </div>
    </div>

    <p class="mt-5 text-xs text-g-600">车轮触发告警后会自动生成工单，告警与工单为同一流程。</p>
  </div>
</template>

<script setup lang="ts">
  import { dashboardMock } from '../mock'

  const workOrder = dashboardMock.workOrder

  const monthCompleted = computed(() => Math.max(workOrder.monthTotal - workOrder.pendingOrders, 0))

  const progressPercent = computed(() => {
    if (!workOrder.monthTotal) return 0
    return Number(((monthCompleted.value / workOrder.monthTotal) * 100).toFixed(1))
  })

  const formatMom = (n: number) => {
    const label = '较上月'
    const sign = n > 0 ? '+' : ''
    return `${label} ${sign}${n}%`
  }

  const formatPercent = (percentage: number) => `${percentage}%`
</script>
