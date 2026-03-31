<!-- 表格按钮 -->
<template>
  <div
    :class="[
      'inline-flex items-center justify-center min-w-8 h-8 px-2.5 mr-2.5 text-sm c-p rounded-md align-middle',
      'cursor-pointer select-none transition-colors duration-150 ease-out',
      buttonClass
    ]"
    :style="{ backgroundColor: buttonBgColor, color: iconColor }"
    @click="handleClick"
  >
    <ArtSvgIcon :icon="iconContent" />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtButtonTable' })

  interface Props {
    /** 按钮类型 */
    type?: 'add' | 'edit' | 'delete' | 'more' | 'view'
    /** 按钮图标 */
    icon?: string
    /** 按钮样式类 */
    iconClass?: string
    /** icon 颜色 */
    iconColor?: string
    /** 按钮背景色 */
    buttonBgColor?: string
  }

  const props = withDefaults(defineProps<Props>(), {})

  const emit = defineEmits<{
    (e: 'click'): void
  }>()

  // 默认按钮配置
  const defaultButtons = {
    add: {
      icon: 'ri:add-fill',
      class:
        'bg-theme/12 text-theme hover:bg-theme/22 hover:text-theme/90 active:bg-theme/18 active:text-theme'
    },
    edit: {
      icon: 'ri:pencil-line',
      class:
        'bg-secondary/12 text-secondary hover:bg-secondary/22 hover:text-secondary/90 active:bg-secondary/18 active:text-secondary'
    },
    delete: {
      icon: 'ri:delete-bin-5-line',
      class:
        'bg-error/12 text-error hover:bg-error/22 hover:text-error/90 active:bg-error/18 active:text-error'
    },
    view: {
      icon: 'ri:eye-line',
      class:
        'bg-info/12 text-info hover:bg-info/22 hover:text-info/90 active:bg-info/18 active:text-info'
    },
    more: {
      icon: 'ri:more-2-fill',
      class:
        'bg-g-300/15 text-g-700 hover:bg-g-300/30 hover:text-g-900 dark:bg-g-600/25 dark:text-g-200 dark:hover:bg-g-600/40 dark:hover:text-white'
    }
  } as const

  // 获取图标内容
  const iconContent = computed(() => {
    return props.icon || (props.type ? defaultButtons[props.type]?.icon : '') || ''
  })

  // 获取按钮样式类
  const buttonClass = computed(() => {
    return props.iconClass || (props.type ? defaultButtons[props.type]?.class : '') || ''
  })

  const handleClick = () => {
    emit('click')
  }
</script>
