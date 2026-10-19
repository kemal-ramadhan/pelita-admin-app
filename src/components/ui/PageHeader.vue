<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
