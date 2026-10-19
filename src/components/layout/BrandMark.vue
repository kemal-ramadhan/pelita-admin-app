<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean; subtitle?: string }>(), { subtitle: 'Admin Platform' })
</script>

<template>
  <div class="flex min-w-0 items-center gap-2.5">
    <div
      class="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
    >
      <img src="/logo-ep.png" alt="" class="size-6 object-contain" />
    </div>
    <div v-if="!compact" class="min-w-0 leading-tight">
      <p class="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Pelita Sekolah</p>
      <p class="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{{ subtitle }}</p>
    </div>
  </div>
</template>
