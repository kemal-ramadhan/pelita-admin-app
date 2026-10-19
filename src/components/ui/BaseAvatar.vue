<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/** Avatar with locally generated initials fallback (no external avatar service). */
const props = withDefaults(defineProps<{ name?: string; src?: string | null; size?: number; ring?: boolean }>(), {
  name: '',
  size: 36,
})

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)

const initials = computed(() => {
  const parts = props.name.replace(/@.*/, '').trim().split(/[\s._-]+/).filter(Boolean)
  const letters = (parts.length > 1 ? [parts[0]![0], parts[parts.length - 1]![0]] : [parts[0]?.[0], parts[0]?.[1]])
    .filter(Boolean)
    .join('')
  return letters.toUpperCase() || '?'
})

const PALETTE = [
  'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
]
const colorClass = computed(() => {
  let h = 0
  for (const ch of props.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
})
const showImage = computed(() => !!props.src && !failed.value)
</script>

<template>
  <span
    class="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none"
    :class="[!showImage && colorClass, ring && 'ring-2 ring-white dark:ring-zinc-900']"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(10, Math.round(size * 0.38))}px` }"
  >
    <img v-if="showImage" :src="src!" :alt="name" class="size-full object-cover" @error="failed = true" />
    <span v-else aria-hidden="true">{{ initials }}</span>
    <span v-if="!showImage" class="sr-only">{{ name }}</span>
  </span>
</template>
