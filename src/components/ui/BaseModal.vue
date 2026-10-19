<script setup lang="ts">
import { computed, ref, toRef, useId } from 'vue'
import { X } from 'lucide-vue-next'
import { useOverlay } from '@/composables/useOverlay'

interface Props {
  open: boolean
  title?: string
  description?: string
  /** `center` = dialog, `right` = side drawer (sheet). */
  placement?: 'center' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Prevent closing (Esc / backdrop / X) e.g. while submitting. */
  persistent?: boolean
  role?: 'dialog' | 'alertdialog'
  hideClose?: boolean
  /** id of an element in the body that labels the dialog (when no `title`). */
  labelledby?: string
}

const props = withDefaults(defineProps<Props>(), { placement: 'center', size: 'md', role: 'dialog' })
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const uid = useId()
const titleId = `modal-title-${uid}`
const descId = `modal-desc-${uid}`

const requestClose = () => {
  if (!props.persistent) emit('close')
}

useOverlay(toRef(props, 'open'), panel, requestClose, { closeOnEsc: () => !props.persistent })

const widthClass = computed(() =>
  props.placement === 'right'
    ? { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-2xl' }[props.size]
    : { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[props.size],
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] dark:bg-black/60" aria-hidden="true" @click="requestClose" />
    </Transition>

    <Transition
      :enter-active-class="placement === 'right' ? 'transition duration-200 ease-out' : 'transition duration-200 ease-out'"
      :enter-from-class="placement === 'right' ? 'translate-x-full opacity-60' : 'opacity-0 translate-y-2 scale-[0.98]'"
      :leave-active-class="'transition duration-150 ease-in'"
      :leave-to-class="placement === 'right' ? 'translate-x-full opacity-60' : 'opacity-0 translate-y-2 scale-[0.98]'"
    >
      <div
        v-if="open"
        class="pointer-events-none fixed inset-0 z-50 flex"
        :class="placement === 'right' ? 'justify-end' : 'items-end justify-center p-0 sm:items-center sm:p-4'"
      >
        <div
          ref="panel"
          :role="role"
          aria-modal="true"
          :aria-labelledby="title ? titleId : labelledby"
          :aria-describedby="description ? descId : undefined"
          tabindex="-1"
          class="pointer-events-auto flex w-full flex-col bg-white shadow-(--shadow-pop) outline-none dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800"
          :class="[
            widthClass,
            placement === 'right'
              ? 'h-full border-l border-zinc-200 dark:border-zinc-800'
              : 'max-h-[92dvh] rounded-t-2xl sm:rounded-2xl',
          ]"
        >
          <header
            v-if="title || $slots.header"
            class="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6 dark:border-zinc-800"
          >
            <slot name="header">
              <div class="min-w-0">
                <h2 :id="titleId" class="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {{ title }}
                </h2>
                <p v-if="description" :id="descId" class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {{ description }}
                </p>
              </div>
            </slot>
            <button
              v-if="!hideClose"
              type="button"
              class="-mt-1 -mr-2 grid size-8 shrink-0 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Tutup"
              :disabled="persistent"
              @click="requestClose"
            >
              <X :size="18" aria-hidden="true" />
            </button>
          </header>

          <div class="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="flex flex-col-reverse gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/60"
            :class="placement === 'center' && 'sm:rounded-b-2xl'"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
