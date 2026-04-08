<template>
  <div class="flex items-center gap-1 flex-wrap">
    <ArtButtonTable type="view" @click="emit('detail')" />
    <ElDropdown trigger="click">
      <ArtIconButton
        icon="ri:more-2-fill"
        class="!size-8 rounded-md bg-theme/12 text-theme hover:bg-theme/22 hover:text-theme/90 active:bg-theme/18 active:text-theme text-sm"
      />
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem @click="emit('recharge-dc')">充值 DC</ElDropdownItem>
          <ElDropdownItem @click="emit('price')">单价设置</ElDropdownItem>
          <ElDropdownItem @click="emit('assign')">分配 DC</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </div>
</template>

<script setup lang="ts">
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'

  defineOptions({ name: 'DcTargetActions' })

  const emit = defineEmits<{
    detail: []
    'recharge-dc': []
    price: []
    assign: []
  }>()
</script>
