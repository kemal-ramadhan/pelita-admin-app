<script setup lang="ts">
import { CircleAlert, CircleCheck, Info } from 'lucide-vue-next'

withDefaults(defineProps<{ tone?: 'error' | 'success' | 'info'; title?: string }>(), { tone: 'error' })
</script>

<template>
  <div
    class="flex gap-3 rounded-xl border px-3.5 py-3 text-sm"
    :class="{
      'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200': tone === 'error',
      'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200':
        tone === 'success',
      'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-100': tone === 'info',
    }"
    :role="tone === 'error' ? 'alert' : 'status'"
  >
    <CircleAlert v-if="tone === 'error'" :size="18" class="mt-px shrink-0" aria-hidden="true" />
    <CircleCheck v-else-if="tone === 'success'" :size="18" class="mt-px shrink-0" aria-hidden="true" />
    <Info v-else :size="18" class="mt-px shrink-0" aria-hidden="true" />
    <div class="min-w-0 leading-relaxed">
      <p v-if="title" class="font-medium">{{ title }}</p>
      <slot />
    </div>
  </div>
</template>
