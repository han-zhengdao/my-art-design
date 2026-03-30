<template>
  <div class="art-card h-105 p-5 box-border mb-5 max-sm:mb-4">
    <div class="art-card-header">
      <div class="title">
        <h4>设备状态分布</h4>
        <p>展示在使用、报废、丢失、告警车轮在总量中的占比</p>
      </div>
    </div>

    <div class="mt-5">
      <div
        v-for="item in statusList"
        :key="item.label"
        class="mb-4 rounded-lg border border-g-200 px-3 py-2 last:mb-0"
      >
        <div class="flex-cb">
          <div class="flex-c">
            <span
              class="mr-2 inline-block size-2.5 rounded-full"
              :style="{ background: item.color }"
            ></span>
            <span class="text-sm">{{ item.label }}</span>
          </div>
          <span class="text-sm font-medium">{{ item.value }}</span>
        </div>

        <ElProgress
          class="mt-2"
          :stroke-width="8"
          :percentage="toPercent(item.value)"
          :format="formatPercent"
          :color="item.color"
        />
      </div>
    </div>

    <div class="mt-2 text-xs text-g-600">车轮总数：{{ totalWheels }}，分布比例按总数自动计算</div>
  </div>
</template>

<script setup lang="ts">
  import { dashboardMock } from '../mock'

  const statusList = dashboardMock.deviceStatus

  const totalWheels = computed(() => statusList.reduce((sum, item) => sum + item.value, 0))

  const toPercent = (value: number) => {
    if (!totalWheels.value) return 0
    return Number(((value / totalWheels.value) * 100).toFixed(1))
  }

  const formatPercent = (percentage: number) => `${percentage}%`
</script>

<style scoped>
  :deep(.el-progress-bar__outer) {
    background-color: var(--art-gray-200);
  }

  :deep(.el-progress__text) {
    font-size: 14px !important;
    color: var(--art-gray-600) !important;
  }
</style>
