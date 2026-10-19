<script setup lang="ts">
import { computed } from 'vue'
import { TriangleAlert, CircleHelp } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { acceptConfirm, cancelConfirm, confirmState } from '@/composables/useConfirm'

/** Global host — mount once in App.vue, open via `confirm()` from useConfirm. */
const danger = computed(() => confirmState.options.tone === 'danger')
</script>

<template>
  <BaseModal
    :open="confirmState.open"
    size="sm"
    role="alertdialog"
    hide-close
    labelledby="confirm-dialog-title"
    :persistent="confirmState.loading"
    @close="cancelConfirm"
  >
    <div class="flex gap-4">
      <div
        class="grid size-10 shrink-0 place-items-center rounded-full"
        :class="
          danger
            ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
            : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
        "
      >
        <TriangleAlert v-if="danger" :size="20" aria-hidden="true" />
        <CircleHelp v-else :size="20" aria-hidden="true" />
      </div>
      <div class="min-w-0 pt-0.5">
        <h2 id="confirm-dialog-title" class="text-base font-semibold text-zinc-900 dark:text-zinc-50">{{ confirmState.options.title }}</h2>
        <p v-if="confirmState.options.description" class="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {{ confirmState.options.description }}
        </p>
      </div>
    </div>
    <template #footer>
      <BaseButton variant="secondary" :disabled="confirmState.loading" @click="cancelConfirm">
        {{ confirmState.options.cancelText ?? 'Batal' }}
      </BaseButton>
      <BaseButton
        :variant="danger ? 'danger' : 'primary'"
        :loading="confirmState.loading"
        data-autofocus
        @click="acceptConfirm"
      >
        {{ confirmState.options.confirmText ?? 'Ya, lanjutkan' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
