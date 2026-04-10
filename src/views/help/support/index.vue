<template>
  <div
    class="flex h-[calc(100vh-180px)] min-h-[560px] overflow-hidden rounded border border-[var(--el-border-color)] bg-white"
  >
    <aside
      class="w-64 flex-shrink-0 border-r border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)]"
    >
      <div class="border-b border-[var(--el-border-color)] px-4 py-3 text-sm font-semibold"
        >帮助文档目录</div
      >
      <ElMenu :default-active="activeKey" class="border-none bg-transparent" @select="onSelect">
        <ElMenuItem index="contact">联系方式</ElMenuItem>
        <ElMenuItem index="faq">常见问题</ElMenuItem>
        <ElMenuItem index="ticket">问题提单</ElMenuItem>
      </ElMenu>
    </aside>

    <section class="flex-1 overflow-auto p-6">
      <h2 class="mb-3 text-lg font-semibold">{{ titleMap[activeKey] }}</h2>
      <ElAlert
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
        title="这里是帮助文档模板页（左侧目录 + 右侧内容）。后续可按业务接入真实说明文档、FAQ 与工单系统。"
      />

      <div
        class="rounded border border-dashed border-[var(--el-border-color)] p-6 text-sm text-[var(--el-text-color-secondary)]"
      >
        当前为占位内容区域：你可以在这里放富文本、表单、联系方式卡片、工单入口等。
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  defineOptions({ name: 'HelpSupport' })

  const activeKey = ref<'contact' | 'faq' | 'ticket'>('contact')
  const titleMap: Record<'contact' | 'faq' | 'ticket', string> = {
    contact: '联系方式',
    faq: '常见问题',
    ticket: '问题提单'
  }

  function onSelect(index: string) {
    if (index === 'contact' || index === 'faq' || index === 'ticket') {
      activeKey.value = index
    }
  }
</script>
