<script setup lang="ts">
import { computed, ref, useAttrs, useId, type Component } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })

// class/style go on the wrapper (layout), everything else on the native control.
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'class' && k !== 'style')),
)

interface Props {
  label?: string
  type?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  /** Leading icon (lucide component). */
  icon?: Component
  size?: 'md' | 'lg'
  id?: string
}

const props = withDefaults(defineProps<Props>(), { type: 'text', size: 'md' })
const model = defineModel<string | number | null>()

const autoId = useId()
const inputId = computed(() => props.id ?? `in-${autoId}`)
const describedBy = computed(() => (props.error ? `${inputId.value}-err` : props.hint ? `${inputId.value}-hint` : undefined))

const reveal = ref(false)
const actualType = computed(() => (props.type === 'password' ? (reveal.value ? 'text' : 'password') : props.type))
</script>

<template>
  <div class="flex w-full flex-col gap-1.5" v-bind="rootAttrs">
    <div v-if="label || $slots['label-right']" class="flex items-center justify-between gap-2">
      <label v-if="label" :for="inputId" class="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
        {{ label }}<span v-if="required" class="ml-0.5 text-red-500" aria-hidden="true">*</span>
      </label>
      <slot name="label-right" />
    </div>

    <div class="group relative">
      <component
        :is="icon"
        v-if="icon"
        :size="16"
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-brand-500"
      />
      <input
        :id="inputId"
        v-bind="controlAttrs"
        v-model="model"
        :type="actualType"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error || undefined"
        :aria-describedby="describedBy"
        class="w-full rounded-(--radius-control) border bg-white text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800/60"
        :class="[
          size === 'lg' ? 'h-11' : 'h-10',
          icon ? 'pl-9' : 'pl-3.5',
          type === 'password' ? 'pr-11' : 'pr-3.5',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/70'
            : 'border-zinc-200 hover:border-zinc-300 focus:border-brand-500 focus:ring-brand-500/15 dark:border-zinc-700 dark:hover:border-zinc-600',
        ]"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        :aria-label="reveal ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
        :aria-pressed="reveal"
        @click="reveal = !reveal"
      >
        <EyeOff v-if="reveal" :size="16" aria-hidden="true" />
        <Eye v-else :size="16" aria-hidden="true" />
      </button>
    </div>

    <p v-if="error" :id="`${inputId}-err`" class="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${inputId}-hint`" class="text-xs text-zinc-500 dark:text-zinc-400">{{ hint }}</p>
  </div>
</template>
