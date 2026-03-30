<template>
  <ElRow :gutter="20" class="flex">
    <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="12" :lg="6">
      <div class="art-card relative flex flex-col justify-center h-35 px-5 mb-5 max-sm:mb-4">
        <span class="text-g-700 text-sm">{{ item.label }}</span>
        <div class="flex-c mt-2">
          <ArtCountTo class="text-[26px] font-medium" :target="item.value" :duration="1300" />
          <span v-if="item.unit" class="ml-1 text-base text-g-700">{{ item.unit }}</span>
        </div>

        <div v-if="item.momChangePercent != null" class="flex-c mt-1">
          <span class="text-xs text-g-600">{{ item.momPeriodLabel ?? '较上月' }}</span>
          <span
            class="ml-1 text-xs font-semibold"
            :class="[item.momChangePercent >= 0 ? 'text-success' : 'text-danger']"
          >
            {{ formatMomPercent(item.momChangePercent) }}
          </span>
        </div>

        <div v-else-if="item.onlineRatePercent != null" class="flex-c mt-1 text-xs text-g-600">
          <span>在线率</span>
          <span class="ml-1 font-semibold text-g-800">{{ item.onlineRatePercent }}%</span>
          <span class="ml-1">(在使用数 / 车轮总数)</span>
        </div>

        <div class="flex-c mt-1 text-xs text-g-600 line-clamp-2">
          {{ item.description }}
        </div>
        <div
          class="absolute top-0 bottom-0 right-5 m-auto size-12.5 rounded-xl flex-cc bg-theme/10"
        >
          <ArtSvgIcon :icon="item.icon" class="text-xl text-theme" />
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import { dashboardMock, type CoreKpiItem } from '../mock'

  type CardDataItem = CoreKpiItem

  const dataList = reactive<CardDataItem[]>(dashboardMock.coreKpis)

  const formatMomPercent = (n: number) => {
    const sign = n > 0 ? '+' : ''
    return `${sign}${n}%`
  }
</script>
