<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; description?: string; icon?: Component; tone?: 'neutral' | 'danger' }>(), {
  icon: () => Inbox,
  tone: 'neutral',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div class="relative mb-4">
      <div
        class="absolute inset-0 -m-3 rounded-full blur-xl"
        :class="tone === 'danger' ? 'bg-red-500/10' : 'bg-brand-500/10'"
        aria-hidden="true"
      />
      <div
        class="relative grid size-14 place-items-center rounded-2xl border bg-white shadow-sm dark:bg-zinc-900"
        :class="
          tone === 'danger'
            ? 'border-red-100 text-red-500 dark:border-red-500/20'
            : 'border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500'
        "
      >
        <component :is="icon" :size="24" aria-hidden="true" />
      </div>
    </div>
    <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5 flex flex-wrap justify-center gap-2"><slot /></div>
  </div>
</template>
