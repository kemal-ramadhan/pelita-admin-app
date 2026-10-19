<script setup lang="ts">
import { computed, type Component } from 'vue'
import BaseSpinner from './BaseSpinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'ghost-danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  /** Leading icon component (lucide). */
  icon?: Component
  /** Trailing icon component. */
  iconRight?: Component
  /** Square icon-only button — requires an aria-label via attrs. */
  iconOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const sizeClass = computed(() => {
  if (props.iconOnly) {
    return { sm: 'size-8 rounded-lg', md: 'size-9 rounded-(--radius-control)', lg: 'size-11 rounded-xl' }[props.size]
  }
  return {
    sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-sm gap-2 rounded-(--radius-control)',
    lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
  }[props.size]
})

const variantClass = computed(
  () =>
    ({
      primary:
        'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-white',
      secondary:
        'border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
      ghost:
        'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
      danger:
        'bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600',
      'ghost-danger':
        'text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300',
      soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25',
    })[props.variant],
)

const iconSize = computed(() => ({ sm: 15, md: 16, lg: 18 })[props.size])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="relative inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
    :class="[sizeClass, variantClass, block && 'w-full']"
  >
    <BaseSpinner v-if="loading" :size="iconSize" />
    <component :is="icon" v-else-if="icon" :size="iconSize" aria-hidden="true" />
    <slot v-if="!iconOnly" />
    <component :is="iconRight" v-if="iconRight && !iconOnly" :size="iconSize" aria-hidden="true" />
  </button>
</template>
