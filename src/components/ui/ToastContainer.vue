<script setup lang="ts">
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-vue-next'
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const icons = { success: CircleCheck, error: CircleX, info: Info, warning: TriangleAlert } satisfies Record<ToastType, unknown>
const tones: Record<ToastType, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-brand-600 dark:text-brand-300',
  warning: 'text-amber-600 dark:text-amber-400',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      aria-live="polite"
      aria-relevant="additions"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-4"
        leave-active-class="transition duration-150 ease-in absolute"
        leave-to-class="opacity-0"
        move-class="transition-transform duration-200"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          :role="t.type === 'error' ? 'alert' : 'status'"
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-zinc-200 bg-white/95 p-3.5 pr-2.5 shadow-(--shadow-pop) backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95"
        >
          <component :is="icons[t.type]" :size="18" class="mt-0.5 shrink-0" :class="tones[t.type]" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-50">{{ t.title }}</p>
            <p v-if="t.description" class="mt-0.5 text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
              {{ t.description }}
            </p>
          </div>
          <button
            type="button"
            class="grid size-7 shrink-0 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Tutup notifikasi"
            @click="dismiss(t.id)"
          >
            <X :size="15" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
