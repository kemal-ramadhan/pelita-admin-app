<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Check, Hash, Layers, Package as PackageIcon, Users } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import { useAssessmentAdminStore } from '@/stores/assessmentAdmin'
import { toast } from '@/composables/useToast'
import { getErrorCode, getErrorMessage } from '@/utils/errors'
import { hasErrors, required } from '@/utils/validators'
import { BADGE_COLOR_CLASS, formatThousands, onlyDigits } from '@/utils/assessment'
import {
  BADGE_COLORS,
  INSTRUMENT_CODES,
  INSTRUMENTS,
  type AssessmentPackage,
  type InstrumentCode,
  type PackagePayload,
} from '@/types/assessment'

const props = defineProps<{ open: boolean; pkg?: AssessmentPackage | null }>()
const emit = defineEmits<{ close: []; saved: [pkg: AssessmentPackage | undefined] }>()

const store = useAssessmentAdminStore()
const isEdit = computed(() => !!props.pkg)

const blank = () => ({
  name: '',
  code: '',
  description: '',
  price: '',
  student_quota: '100' as string | number,
  instrument_codes: [] as InstrumentCode[],
  badge_color: 'indigo' as string,
})

const form = reactive(blank())
const submitted = ref(false)
const saving = ref(false)
const serverError = ref('')
const serverField = reactive({ code: '', instrument_codes: '' })

watch(
  () => props.open,
  (open) => {
    if (!open) return
    submitted.value = false
    serverError.value = ''
    serverField.code = ''
    serverField.instrument_codes = ''
    const p = props.pkg
    Object.assign(
      form,
      p
        ? {
            name: p.name ?? '',
            code: p.code ?? '',
            description: p.description ?? '',
            price: onlyDigits(Math.round(Number(p.price) || 0)),
            student_quota: String(p.student_quota ?? ''),
            instrument_codes: (p.instrument_codes ?? []).filter((c): c is InstrumentCode =>
              (INSTRUMENT_CODES as readonly string[]).includes(c),
            ),
            badge_color: p.badge_color || 'indigo',
          }
        : blank(),
    )
  },
  { immediate: true },
)

// Price is typed as digits and displayed with thousand separators (IDR).
const priceDisplay = computed({
  get: () => formatThousands(form.price),
  set: (v: string | number | null | undefined) => {
    form.price = onlyDigits(v).slice(0, 13)
  },
})

const isBundle = computed(() => form.instrument_codes.length > 1)

const toggleInstrument = (code: InstrumentCode) => {
  serverField.instrument_codes = ''
  const i = form.instrument_codes.indexOf(code)
  if (i >= 0) form.instrument_codes.splice(i, 1)
  else form.instrument_codes.push(code)
  // Keep canonical order TMB, RIA, PMK, ADN.
  form.instrument_codes.sort((a, b) => INSTRUMENT_CODES.indexOf(a) - INSTRUMENT_CODES.indexOf(b))
}

const quotaNum = computed(() => Number(form.student_quota))

const errors = computed(() => ({
  name: required(form.name, 'Nama paket'),
  code:
    required(form.code, 'Kode paket') ||
    (!/^[A-Za-z0-9_-]+$/.test(form.code.trim()) ? 'Kode hanya boleh huruf, angka, "-" atau "_".' : '') ||
    serverField.code,
  price: form.price === '' ? 'Harga wajib diisi (0 untuk gratis).' : '',
  student_quota:
    !Number.isInteger(quotaNum.value) || quotaNum.value <= 0 ? 'Kuota siswa harus bilangan bulat lebih dari 0.' : '',
  instrument_codes: form.instrument_codes.length === 0 ? 'Pilih minimal satu instrumen.' : serverField.instrument_codes,
}))
const err = (k: keyof typeof errors.value) => (submitted.value || (k === 'code' && serverField.code) ? errors.value[k] : '')

const submit = async () => {
  submitted.value = true
  serverError.value = ''
  if (hasErrors(errors.value)) {
    toast.warning('Periksa kembali isian formulir.')
    return
  }
  const payload: PackagePayload = {
    name: form.name.trim(),
    code: form.code.trim(),
    description: form.description.trim(),
    price: Number(form.price) || 0,
    student_quota: quotaNum.value,
    instrument_codes: [...form.instrument_codes],
    badge_color: form.badge_color,
  }
  saving.value = true
  try {
    const saved = props.pkg ? await store.updatePackage(props.pkg.id, payload) : await store.createPackage(payload)
    toast.success({ title: props.pkg ? 'Paket diperbarui' : 'Paket dibuat', description: payload.name })
    emit('saved', saved)
    emit('close')
  } catch (e) {
    const code = getErrorCode(e)
    const msg = getErrorMessage(e, 'Gagal menyimpan paket asesmen.')
    if (code === 'DUPLICATE_CODE') serverField.code = 'Kode paket sudah digunakan paket lain.'
    else if (code === 'INVALID_INSTRUMENT') serverField.instrument_codes = msg
    else serverError.value = msg
    toast.error({ title: 'Gagal menyimpan', description: code === 'DUPLICATE_CODE' ? serverField.code : msg })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    placement="right"
    size="lg"
    :title="isEdit ? 'Ubah paket asesmen' : 'Tambah paket asesmen'"
    description="Paket menentukan instrumen tes, kuota siswa, dan harga langganan untuk sekolah."
    :persistent="saving"
    @close="emit('close')"
  >
    <form id="package-form" class="space-y-8" novalidate @submit.prevent="submit">
      <InlineAlert v-if="serverError">{{ serverError }}</InlineAlert>

      <fieldset class="space-y-4">
        <legend class="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <PackageIcon :size="16" class="text-brand-500" aria-hidden="true" /> Informasi paket
        </legend>
        <BaseInput v-model="form.name" label="Nama paket" placeholder="Bundle 4 Asesmen Komplit" required :error="err('name')" data-autofocus />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseInput
            v-model="form.code"
            label="Kode paket"
            placeholder="BUNDLE-4"
            :icon="Hash"
            required
            hint="Unik di seluruh platform"
            :error="err('code')"
            @input="serverField.code = ''"
          />
          <BaseInput
            v-model="form.student_quota"
            label="Kuota siswa"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            :icon="Users"
            required
            hint="Jumlah siswa per lisensi"
            :error="err('student_quota')"
          />
        </div>
        <BaseInput
          v-model="priceDisplay"
          label="Harga (IDR)"
          inputmode="numeric"
          placeholder="0"
          required
          :hint="form.price === '0' ? 'Gratis — sekolah langsung aktif saat membeli.' : 'Isi 0 untuk paket gratis'"
          :error="err('price')"
        >
          <template #label-right>
            <span class="text-xs text-zinc-500 dark:text-zinc-400">Rp</span>
          </template>
        </BaseInput>
        <BaseTextarea v-model="form.description" label="Deskripsi" placeholder="Cakupan tes dan manfaat paket…" :rows="3" />
      </fieldset>

      <fieldset class="space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <legend class="mb-1 flex w-full items-center justify-between gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <span class="flex items-center gap-2">
            <Layers :size="16" class="text-brand-500" aria-hidden="true" /> Instrumen tes<span class="text-red-500" aria-hidden="true">*</span>
          </span>
        </legend>
        <div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          Jenis paket (ditentukan server):
          <BaseBadge :tone="isBundle ? 'brand' : 'neutral'">{{ isBundle ? 'Bundle' : 'Satuan' }}</BaseBadge>
        </div>
        <div class="grid grid-cols-1 gap-2" role="group" aria-label="Instrumen tes">
          <label
            v-for="inst in INSTRUMENTS"
            :key="inst.code"
            class="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors"
            :class="
              form.instrument_codes.includes(inst.code)
                ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-500/10'
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            "
          >
            <input
              type="checkbox"
              class="peer sr-only"
              :checked="form.instrument_codes.includes(inst.code)"
              @change="toggleInstrument(inst.code)"
            />
            <span
              class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500"
              :class="
                form.instrument_codes.includes(inst.code)
                  ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                  : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
              "
              aria-hidden="true"
            >
              <Check v-if="form.instrument_codes.includes(inst.code)" :size="14" />
            </span>
            <span class="min-w-0">
              <span class="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <BaseBadge tone="brand">{{ inst.code }}</BaseBadge>{{ inst.name }}
              </span>
              <span class="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{{ inst.description }}</span>
            </span>
          </label>
        </div>
        <p v-if="err('instrument_codes')" class="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {{ err('instrument_codes') }}
        </p>
      </fieldset>

      <fieldset class="space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <legend class="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Warna badge</legend>
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Warna badge">
          <button
            v-for="c in BADGE_COLORS"
            :key="c"
            type="button"
            role="radio"
            :aria-checked="form.badge_color === c"
            :aria-label="c"
            :title="c"
            class="grid size-9 place-items-center rounded-full ring-2 ring-offset-2 transition dark:ring-offset-zinc-900"
            :class="form.badge_color === c ? 'ring-brand-500' : 'ring-transparent hover:ring-zinc-200 dark:hover:ring-zinc-700'"
            @click="form.badge_color = c"
          >
            <span class="size-6 rounded-full" :class="BADGE_COLOR_CLASS[c].dot" />
          </button>
        </div>
      </fieldset>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="saving" @click="emit('close')">Batal</BaseButton>
      <BaseButton type="submit" form="package-form" :loading="saving">
        {{ isEdit ? 'Simpan perubahan' : 'Buat paket' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
