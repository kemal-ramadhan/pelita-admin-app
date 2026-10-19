<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Eye } from 'lucide-vue-next'
import { OPTION_KEYS, type QuestionType } from '@/types/assessment'

/** Read-only rendering of an item roughly as the student sees it (correct key highlighted for admins). */
const props = defineProps<{
  text: string
  type: QuestionType
  scaleMin?: number | null
  scaleMax?: number | null
  scaleLabels?: string[] | null
  options?: string[] | null
  correctKey?: string | null
  section?: string
  itemCode?: string
  dimension?: string | null
}>()

const picked = ref<string | null>(null)
watch(
  () => [props.type, props.scaleMin, props.scaleMax, props.options?.length],
  () => (picked.value = null),
)

const scale = computed(() => {
  const min = Number(props.scaleMin)
  const max = Number(props.scaleMax)
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min || max - min > 10) return []
  return Array.from({ length: max - min + 1 }, (_, i) => ({ value: String(min + i), label: props.scaleLabels?.[i] ?? '' }))
})
const twoChoice = computed(() => {
  const labels = props.scaleLabels ?? []
  // Stored as [value 0 label, value 1 label]; shown positive first.
  return [
    { value: '1', label: labels[1] || 'Ya' },
    { value: '0', label: labels[0] || 'Tidak' },
  ]
})
const choices = computed(() =>
  (props.options ?? []).map((text, i) => ({ key: OPTION_KEYS[i] ?? String(i + 1), text })).filter((o) => o.text.trim() !== ''),
)
</script>

<template>
  <div class="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
    <p class="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
      <Eye :size="14" aria-hidden="true" /> Pratinjau siswa
    </p>
    <div class="card p-4">
      <p v-if="section" class="text-xs font-medium text-brand-600 dark:text-brand-300">{{ section }}</p>
      <p class="mt-1 text-[15px] leading-relaxed font-medium text-zinc-900 dark:text-zinc-100">
        {{ text.trim() || 'Teks pertanyaan akan tampil di sini…' }}
      </p>

      <!-- Likert -->
      <div v-if="type === 'likert'" class="mt-4">
        <div class="grid gap-1.5" :style="{ gridTemplateColumns: `repeat(${Math.max(scale.length, 1)}, minmax(0, 1fr))` }">
          <button
            v-for="s in scale"
            :key="s.value"
            type="button"
            class="flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition-colors"
            :class="
              picked === s.value
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300'
            "
            @click="picked = s.value"
          >
            <span class="text-sm font-semibold tabular-nums">{{ s.value }}</span>
            <span class="text-[11px] leading-tight">{{ s.label || '—' }}</span>
          </button>
        </div>
        <p v-if="!scale.length" class="text-xs text-red-600 dark:text-red-400">Rentang skala tidak valid.</p>
      </div>

      <!-- Multiple choice -->
      <div v-else-if="type === 'multiple_choice'" class="mt-4 space-y-1.5">
        <button
          v-for="o in choices"
          :key="o.key"
          type="button"
          class="flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors"
          :class="
            picked === o.key
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15'
              : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700'
          "
          @click="picked = o.key"
        >
          <span
            class="grid size-6 shrink-0 place-items-center rounded-lg text-xs font-semibold"
            :class="o.key === correctKey ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'"
          >
            {{ o.key }}
          </span>
          <span class="min-w-0 flex-1 text-zinc-800 dark:text-zinc-200">{{ o.text }}</span>
          <Check v-if="o.key === correctKey" :size="15" class="text-emerald-600" aria-label="Kunci jawaban" />
        </button>
        <p v-if="!choices.length" class="text-xs text-zinc-500 dark:text-zinc-400">Belum ada opsi jawaban.</p>
      </div>

      <!-- Two choices -->
      <div v-else class="mt-4 grid grid-cols-2 gap-2">
        <button
          v-for="c in twoChoice"
          :key="c.value"
          type="button"
          class="rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
          :class="
            picked === c.value
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
              : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300'
          "
          @click="picked = c.value"
        >
          {{ c.label }}
        </button>
      </div>
    </div>
    <p v-if="itemCode || dimension" class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
      <span v-if="itemCode" class="font-mono">{{ itemCode }}</span>
      <template v-if="dimension"> · dimensi {{ dimension }}</template>
      <template v-if="type === 'multiple_choice' && correctKey"> · kunci {{ correctKey }} (tidak dikirim ke siswa)</template>
    </p>
  </div>
</template>
