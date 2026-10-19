<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { PaginationMeta } from '@/types/api'

const props = defineProps<{ meta: PaginationMeta; disabled?: boolean; limitOptions?: number[] }>()
const emit = defineEmits<{ 'update:page': [page: number]; 'update:limit': [limit: number] }>()

const totalPages = computed(() => Math.max(1, props.meta.total_pages || Math.ceil(props.meta.total / (props.meta.limit || 1))))
const from = computed(() => (props.meta.total === 0 ? 0 : (props.meta.page - 1) * props.meta.limit + 1))
const to = computed(() => Math.min(props.meta.total, props.meta.page * props.meta.limit))

/** Compact page list: 1 … 4 5 6 … 12 */
const pages = computed<(number | '…')[]>(() => {
  const total = totalPages.value
  const cur = props.meta.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, cur - 1, cur, cur + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1]
    if (i > 0 && prev !== undefined && p - prev > 1) out.push('…')
    out.push(p)
  })
  return out
})

const go = (p: number) => {
  if (props.disabled || p < 1 || p > totalPages.value || p === props.meta.page) return
  emit('update:page', p)
}

const btn =
  'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[13px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40'
</script>

<template>
  <nav
    class="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 sm:flex-row dark:border-zinc-800"
    aria-label="Navigasi halaman"
  >
    <div class="flex items-center gap-3 text-[13px] text-zinc-500 dark:text-zinc-400">
      <span>
        Menampilkan <span class="font-medium text-zinc-700 tabular-nums dark:text-zinc-200">{{ from }}–{{ to }}</span>
        dari <span class="font-medium text-zinc-700 tabular-nums dark:text-zinc-200">{{ meta.total }}</span>
      </span>
      <label v-if="limitOptions?.length" class="hidden items-center gap-1.5 sm:flex">
        <span class="sr-only">Baris per halaman</span>
        <select
          :value="meta.limit"
          :disabled="disabled"
          class="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-[13px] text-zinc-700 outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          @change="emit('update:limit', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="n in limitOptions" :key="n" :value="n">{{ n }} / hal</option>
        </select>
      </label>
    </div>
    <div class="flex items-center gap-1">
      <button
        type="button"
        :class="btn"
        class="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        :disabled="disabled || meta.page <= 1"
        aria-label="Halaman sebelumnya"
        @click="go(meta.page - 1)"
      >
        <ChevronLeft :size="16" aria-hidden="true" />
      </button>
      <template v-for="(p, i) in pages" :key="`${p}-${i}`">
        <span v-if="p === '…'" class="px-1 text-zinc-400" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          :class="[
            btn,
            p === meta.page
              ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
          ]"
          :aria-current="p === meta.page ? 'page' : undefined"
          :aria-label="`Halaman ${p}`"
          :disabled="disabled"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>
      <button
        type="button"
        :class="btn"
        class="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        :disabled="disabled || meta.page >= totalPages"
        aria-label="Halaman berikutnya"
        @click="go(meta.page + 1)"
      >
        <ChevronRight :size="16" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
