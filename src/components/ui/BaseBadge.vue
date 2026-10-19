<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ tone?: 'neutral' | 'brand' | 'success' | 'danger' | 'warning'; dot?: boolean }>(),
  { tone: 'neutral' },
)

const toneClass = computed(
  () =>
    ({
      neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
      brand: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30',
      success:
        'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
      danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
      warning: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
    })[props.tone],
)
const dotClass = computed(
  () =>
    ({
      neutral: 'bg-zinc-400',
      brand: 'bg-brand-500',
      success: 'bg-emerald-500',
      danger: 'bg-red-500',
      warning: 'bg-amber-500',
    })[props.tone],
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset"
    :class="toneClass"
  >
    <span v-if="dot" class="size-1.5 rounded-full" :class="dotClass" aria-hidden="true" />
    <slot />
  </span>
</template>
