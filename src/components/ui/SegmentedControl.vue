<script setup lang="ts" generic="T extends string">
const props = defineProps<{ options: { label: string; value: T }[]; label: string }>()
const model = defineModel<T>({ required: true })

const onKey = (e: KeyboardEvent, idx: number) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  e.preventDefault()
  const n = props.options.length
  const next = props.options[(idx + (e.key === 'ArrowRight' ? 1 : n - 1)) % n]
  if (next) {
    model.value = next.value
    const el = (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')
    el?.[(idx + (e.key === 'ArrowRight' ? 1 : n - 1)) % n]?.focus()
  }
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="inline-flex h-10 items-center gap-0.5 rounded-(--radius-control) bg-zinc-100 p-1 dark:bg-zinc-800/80"
  >
    <button
      v-for="(o, i) in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      :tabindex="model === o.value ? 0 : -1"
      class="h-full rounded-md px-3 text-[13px] font-medium transition-all duration-150"
      :class="
        model === o.value
          ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50'
          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
      "
      @click="model = o.value"
      @keydown="onKey($event, i)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
