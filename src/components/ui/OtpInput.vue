<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{ length?: number; disabled?: boolean; invalid?: boolean }>(), { length: 6 })
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [value: string] }>()

const inputs = ref<HTMLInputElement[]>([])
const digits = computed(() => Array.from({ length: props.length }, (_, i) => model.value[i] ?? ''))

const focusAt = (i: number) => inputs.value[Math.max(0, Math.min(props.length - 1, i))]?.focus()

const setValue = (v: string) => {
  model.value = v.replace(/\D/g, '').slice(0, props.length)
  if (model.value.length === props.length) emit('complete', model.value)
}

const onInput = (i: number, e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  const arr = digits.value.slice()
  if (raw.length > 1) {
    // Paste / autofill into one box.
    setValue(arr.slice(0, i).join('') + raw)
    focusAt(i + raw.length)
    return
  }
  arr[i] = raw
  setValue(arr.join(''))
  ;(e.target as HTMLInputElement).value = raw
  if (raw) focusAt(i + 1)
}

const onKeydown = (i: number, e: KeyboardEvent) => {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) {
    e.preventDefault()
    const arr = digits.value.slice()
    arr[i - 1] = ''
    setValue(arr.join(''))
    focusAt(i - 1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    focusAt(i - 1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    focusAt(i + 1)
  }
}

const onPaste = (e: ClipboardEvent) => {
  const text = e.clipboardData?.getData('text') ?? ''
  if (!text) return
  e.preventDefault()
  setValue(text)
  focusAt(text.replace(/\D/g, '').length)
}

defineExpose({ focus: () => focusAt(0) })
</script>

<template>
  <div class="flex justify-between gap-2 sm:gap-3" role="group" aria-label="Kode OTP">
    <input
      v-for="(d, i) in digits"
      :key="i"
      ref="inputs"
      :value="d"
      type="text"
      inputmode="numeric"
      :autocomplete="i === 0 ? 'one-time-code' : 'off'"
      maxlength="6"
      :disabled="disabled"
      :aria-label="`Digit ${i + 1}`"
      :aria-invalid="invalid || undefined"
      class="h-12 w-full min-w-0 rounded-xl border bg-white text-center text-lg font-semibold text-zinc-900 tabular-nums shadow-sm outline-none transition-[border-color,box-shadow] duration-150 focus:ring-4 disabled:opacity-60 sm:h-14 sm:text-xl dark:bg-zinc-900 dark:text-zinc-50"
      :class="
        invalid
          ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
          : 'border-zinc-200 focus:border-brand-500 focus:ring-brand-500/15 dark:border-zinc-700'
      "
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste"
      @focus="($event.target as HTMLInputElement).select()"
    />
  </div>
</template>
