<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ImagePlus, RefreshCw } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { getErrorMessage } from '@/utils/errors'

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'] as const
const MAX_BYTES = 2 * 1024 * 1024

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    shape?: 'circle' | 'cover'
    /**
     * Parent-provided upload. The modal shows progress/loading until it resolves,
     * closes on success and stays open (with the error) on failure.
     */
    upload: (file: File, onProgress: (percent: number) => void) => Promise<unknown>
  }>(),
  { title: 'Unggah Gambar', shape: 'circle' },
)
const emit = defineEmits<{ close: [] }>()

const input = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const error = ref('')
const uploading = ref(false)
const progress = ref(0)
const dragging = ref(false)

const revoke = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

const reset = () => {
  revoke()
  file.value = null
  error.value = ''
  progress.value = 0
  if (input.value) input.value.value = ''
}

watch(
  () => props.open,
  (v) => {
    if (!v) reset()
  },
)
onBeforeUnmount(revoke)

const accept = (f: File | undefined | null) => {
  error.value = ''
  if (!f) return
  if (!ACCEPTED.includes(f.type as (typeof ACCEPTED)[number])) {
    error.value = 'Format tidak didukung. Gunakan PNG, JPG, atau WEBP.'
    return
  }
  if (f.size > MAX_BYTES) {
    error.value = `Ukuran file ${(f.size / 1024 / 1024).toFixed(1)} MB melebihi batas 2 MB.`
    return
  }
  revoke()
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

const onChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  accept(files && files.length > 0 ? files[0] : null)
}

const onDrop = (e: DragEvent) => {
  dragging.value = false
  accept(e.dataTransfer?.files?.[0] ?? null)
}

const pick = () => input.value?.click()

const submit = async () => {
  if (!file.value || uploading.value) return
  uploading.value = true
  progress.value = 0
  error.value = ''
  try {
    await props.upload(file.value, (p) => (progress.value = p))
    emit('close')
  } catch (err) {
    error.value = getErrorMessage(err, 'Gagal mengunggah gambar.')
  } finally {
    uploading.value = false
  }
}

const sizeLabel = computed(() => (file.value ? `${(file.value.size / 1024).toFixed(0)} KB` : ''))
</script>

<template>
  <BaseModal :open="open" :title="title" :description="description" size="sm" :persistent="uploading" @close="emit('close')">
    <input
      ref="input"
      type="file"
      class="sr-only"
      accept="image/png,image/jpeg,image/webp"
      tabindex="-1"
      aria-hidden="true"
      @change="onChange"
    />

    <button
      type="button"
      class="group relative flex w-full flex-col items-center justify-center overflow-hidden border-2 border-dashed text-center transition-colors"
      :class="[
        shape === 'circle' ? 'mx-auto aspect-square max-w-[200px] rounded-full' : 'aspect-[3/1] rounded-xl',
        dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
          : 'border-zinc-200 bg-zinc-50 hover:border-brand-400 hover:bg-brand-50/50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-brand-500 dark:hover:bg-brand-500/10',
      ]"
      :disabled="uploading"
      :aria-label="previewUrl ? 'Ganti gambar' : 'Pilih gambar'"
      @click="pick"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <img v-if="previewUrl" :src="previewUrl" alt="Pratinjau" class="absolute inset-0 size-full object-cover" />
      <template v-else>
        <ImagePlus :size="28" class="text-zinc-400 transition-colors group-hover:text-brand-500" aria-hidden="true" />
        <span class="mt-2 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">Klik atau seret gambar</span>
        <span class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">PNG, JPG, WEBP · maks. 2 MB</span>
      </template>
      <span
        v-if="previewUrl && !uploading"
        class="absolute inset-0 grid place-items-center bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <span class="inline-flex items-center gap-1.5"><RefreshCw :size="14" aria-hidden="true" /> Ganti</span>
      </span>
    </button>

    <p v-if="file && !error" class="mt-3 truncate text-center text-xs text-zinc-500 dark:text-zinc-400">
      {{ file.name }} · {{ sizeLabel }}
    </p>

    <div v-if="uploading" class="mt-4" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
      <div class="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div class="h-full rounded-full bg-brand-500 transition-[width] duration-200" :style="{ width: `${Math.max(progress, 4)}%` }" />
      </div>
      <p class="mt-1.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {{ progress < 100 ? `Mengunggah… ${progress}%` : 'Memproses di server…' }}
      </p>
    </div>

    <p v-if="error" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">
      {{ error }}
    </p>

    <template #footer>
      <BaseButton variant="secondary" :disabled="uploading" @click="emit('close')">Batal</BaseButton>
      <BaseButton :disabled="!file" :loading="uploading" @click="submit">Simpan</BaseButton>
    </template>
  </BaseModal>
</template>
