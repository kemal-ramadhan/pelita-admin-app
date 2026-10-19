<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

// class/style go on the wrapper (layout), everything else on the native control.
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'class' && k !== 'style')),
)

export interface SelectOption {
  label: string
  value: string
}

interface Props {
  label?: string
  options: readonly SelectOption[] | readonly string[]
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

const props = defineProps<Props>()
const model = defineModel<string | null>()

const autoId = useId()
const selectId = computed(() => props.id ?? `sel-${autoId}`)
const normalized = computed<SelectOption[]>(() =>
  props.options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o)),
)
</script>

<template>
  <div class="flex w-full flex-col gap-1.5" v-bind="rootAttrs">
    <label v-if="label" :for="selectId" class="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
      {{ label }}<span v-if="required" class="ml-0.5 text-red-500" aria-hidden="true">*</span>
    </label>
    <div class="relative">
      <select
        :id="selectId"
        v-bind="controlAttrs"
        v-model="model"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error ? `${selectId}-err` : hint ? `${selectId}-hint` : undefined"
        class="h-10 w-full cursor-pointer appearance-none rounded-(--radius-control) border bg-white pr-9 pl-3.5 text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] duration-150 focus:ring-4 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-800/60"
        :class="[
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-zinc-200 hover:border-zinc-300 focus:border-brand-500 focus:ring-brand-500/15 dark:border-zinc-700 dark:hover:border-zinc-600',
          !model && 'text-zinc-400 dark:text-zinc-500',
        ]"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="o in normalized" :key="o.value" :value="o.value" class="text-zinc-900 dark:text-zinc-100">
          {{ o.label }}
        </option>
      </select>
      <ChevronDown
        :size="16"
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400"
      />
    </div>
    <p v-if="error" :id="`${selectId}-err`" class="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${selectId}-hint`" class="text-xs text-zinc-500 dark:text-zinc-400">{{ hint }}</p>
  </div>
</template>
