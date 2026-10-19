<script setup lang="ts">
import { computed, type Component } from 'vue'
import { TrendingDown, TrendingUp } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    label: string
    value?: number | string | null
    icon?: Component
    tone?: 'brand' | 'success' | 'danger' | 'info'
    loading?: boolean
    hint?: string
    /** Optional trend in percent (positive / negative). */
    trend?: number | null
    trendLabel?: string
  }>(),
  { tone: 'brand' },
)

const toneClass = computed(
  () =>
    ({
      brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
      success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
      danger: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
      info: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    })[props.tone],
)

const formatted = computed(() =>
  typeof props.value === 'number' ? new Intl.NumberFormat('id-ID').format(props.value) : (props.value ?? '—'),
)
</script>

<template>
  <div class="card group p-5 transition-shadow duration-200 hover:shadow-md">
    <div class="flex items-start justify-between gap-3">
      <p class="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{{ label }}</p>
      <div v-if="icon" class="grid size-9 shrink-0 place-items-center rounded-xl" :class="toneClass">
        <component :is="icon" :size="18" aria-hidden="true" />
      </div>
    </div>
    <div class="mt-2">
      <div v-if="loading" class="skeleton h-8 w-24" aria-hidden="true" />
      <p v-else class="text-[28px] leading-9 font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
        {{ formatted }}
      </p>
    </div>
    <div class="mt-2 flex min-h-5 items-center gap-2 text-xs">
      <template v-if="loading"><div class="skeleton h-3.5 w-32" aria-hidden="true" /></template>
      <template v-else>
        <span
          v-if="trend !== null && trend !== undefined"
          class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
          :class="
            trend >= 0
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
          "
        >
          <TrendingUp v-if="trend >= 0" :size="12" aria-hidden="true" />
          <TrendingDown v-else :size="12" aria-hidden="true" />
          {{ trend >= 0 ? '+' : '' }}{{ trend.toFixed(1) }}%
        </span>
        <span class="text-zinc-500 dark:text-zinc-400">{{ trendLabel ?? hint }}</span>
      </template>
    </div>
  </div>
</template>
