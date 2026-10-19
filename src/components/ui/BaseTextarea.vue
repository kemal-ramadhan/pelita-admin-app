<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })

// class/style go on the wrapper (layout), everything else on the native control.
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'class' && k !== 'style')),
)

const props = defineProps<{ label?: string; hint?: string; error?: string; placeholder?: string; rows?: number }>()
const model = defineModel<string | null>()
const autoId = useId()
const id = computed(() => `ta-${autoId}`)
</script>

<template>
  <div class="flex w-full flex-col gap-1.5" v-bind="rootAttrs">
    <label v-if="label" :for="id" class="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{{ label }}</label>
    <textarea
      :id="id"
      v-bind="controlAttrs"
      v-model="model"
      :rows="rows ?? 3"
      :placeholder="placeholder"
      :aria-invalid="!!error || undefined"
      class="w-full resize-y rounded-(--radius-control) border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
    />
    <p v-if="error" class="text-xs font-medium text-red-600 dark:text-red-400" role="alert">{{ error }}</p>
    <p v-else-if="props.hint" class="text-xs text-zinc-500 dark:text-zinc-400">{{ props.hint }}</p>
  </div>
</template>
