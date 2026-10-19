<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Plus, RotateCcw, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import QuestionPreview from './QuestionPreview.vue'
import { useAssessmentAdminStore } from '@/stores/assessmentAdmin'
import { toast } from '@/composables/useToast'
import { getErrorCode, getErrorMessage, getErrorStatus } from '@/utils/errors'
import { hasErrors, required } from '@/utils/validators'
import {
  INSTRUMENTS,
  OPTION_KEYS,
  QUESTION_TYPE_LABELS,
  findSubtest,
  optionText,
  subtestsOf,
  type AssessmentQuestion,
  type InstrumentCode,
  type QuestionPayload,
  type QuestionType,
  type SubtestDef,
} from '@/types/assessment'

const props = defineProps<{ open: boolean; question?: AssessmentQuestion | null; defaultInstrument?: string; defaultSubtest?: string }>()
const emit = defineEmits<{ close: []; saved: [q: AssessmentQuestion | undefined] }>()

const store = useAssessmentAdminStore()
const isEdit = computed(() => !!props.question)

const NO_DIMENSION = '__none'
const MIN_OPTIONS = 2
const MAX_OPTIONS = OPTION_KEYS.length

const form = reactive({
  instrument_code: 'TMB' as InstrumentCode,
  subtest: 'part1_minat',
  item_code: '',
  question_text: '',
  question_type: 'likert' as QuestionType,
  scale_min: 1 as number | string,
  scale_max: 4 as number | string,
  scale_labels: [] as string[],
  options: ['', '', '', '', ''] as string[],
  correct_key: 'A',
  dimension: '',
  weight: 1 as number | string,
  order_num: 0 as number | string,
  is_active: true,
})

const submitted = ref(false)
const saving = ref(false)
const serverError = ref('')
const duplicate = ref('')
const typeMismatch = ref(false)

const subtestDef = computed<SubtestDef | undefined>(() => findSubtest(form.instrument_code, form.subtest))

const instrumentOptions = INSTRUMENTS.map((i) => ({ value: i.code, label: `${i.code} — ${i.name}` }))
const subtestOptions = computed(() => subtestsOf(form.instrument_code).map((s) => ({ value: s.value, label: s.label })))
const dimensionOptions = computed(() => {
  const def = subtestDef.value
  if (!def) return []
  const opts = def.dimensions.map((d) => ({ ...d }))
  return def.allowNoDimension ? [...opts, { value: NO_DIMENSION, label: 'Tanpa dimensi (butir cek perhatian)' }] : opts
})

/** Apply PRD defaults for the chosen subtest (type, scale, labels) and drop invalid dimension. */
const applySubtestDefaults = () => {
  const def = subtestDef.value
  if (!def) return
  form.question_type = def.type
  form.scale_min = def.scaleMin
  form.scale_max = def.scaleMax
  form.scale_labels = [...def.scaleLabels]
  if (def.type === 'multiple_choice' && form.options.length < MIN_OPTIONS) form.options = ['', '', '', '', '']
  if (!def.dimensions.some((d) => d.value === form.dimension)) form.dimension = def.dimensions[0]?.value ?? ''
  typeMismatch.value = false
}

const instrumentModel = computed({
  get: () => form.instrument_code as string,
  set: (v: string | null | undefined) => {
    form.instrument_code = (v as InstrumentCode) || 'TMB'
    form.subtest = subtestsOf(form.instrument_code)[0]?.value ?? ''
    applySubtestDefaults()
  },
})
const subtestModel = computed({
  get: () => form.subtest,
  set: (v: string | null | undefined) => {
    form.subtest = v ?? ''
    applySubtestDefaults()
  },
})
const dimensionModel = computed({
  get: () => (form.dimension === '' && subtestDef.value?.allowNoDimension ? NO_DIMENSION : form.dimension),
  set: (v: string | null | undefined) => {
    form.dimension = !v || v === NO_DIMENSION ? '' : v
  },
})
const itemCodeModel = computed({
  get: () => form.item_code,
  set: (v: string | number | null | undefined) => {
    duplicate.value = ''
    form.item_code = String(v ?? '').toUpperCase().replace(/\s+/g, '')
  },
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    submitted.value = false
    serverError.value = ''
    duplicate.value = ''
    typeMismatch.value = false
    const q = props.question
    if (q) {
      const def = findSubtest(q.instrument_code, q.subtest)
      const opts = (q.options ?? []).map(optionText)
      Object.assign(form, {
        instrument_code: q.instrument_code as InstrumentCode,
        subtest: q.subtest,
        item_code: q.item_code,
        question_text: q.question_text,
        question_type: def?.type ?? q.question_type,
        scale_min: q.scale_min ?? def?.scaleMin ?? 1,
        scale_max: q.scale_max ?? def?.scaleMax ?? 5,
        scale_labels: q.scale_labels?.length ? [...q.scale_labels] : [...(def?.scaleLabels ?? [])],
        options: opts.length >= MIN_OPTIONS ? opts.slice(0, MAX_OPTIONS) : ['', '', '', '', ''],
        correct_key: q.correct_key || 'A',
        dimension: q.dimension ?? '',
        weight: q.weight ?? 1,
        order_num: q.order_num ?? 0,
        is_active: q.is_active,
      })
      typeMismatch.value = !!def && def.type !== q.question_type
    } else {
      const inst = (INSTRUMENTS.find((i) => i.code === props.defaultInstrument)?.code ?? 'TMB') as InstrumentCode
      form.instrument_code = inst
      form.subtest = findSubtest(inst, props.defaultSubtest ?? '')?.value ?? subtestsOf(inst)[0]?.value ?? ''
      Object.assign(form, {
        item_code: '',
        question_text: '',
        options: ['', '', '', '', ''],
        correct_key: 'A',
        dimension: '',
        weight: 1,
        order_num: 0,
        is_active: true,
      })
      applySubtestDefaults()
    }
    syncLabelCount()
  },
  { immediate: true },
)

// --- Likert labels follow the scale range (count = max − min + 1) ---
const scaleMinN = computed(() => Number(form.scale_min))
const scaleMaxN = computed(() => Number(form.scale_max))
const rangeValid = computed(
  () => Number.isInteger(scaleMinN.value) && Number.isInteger(scaleMaxN.value) && scaleMinN.value < scaleMaxN.value && scaleMaxN.value - scaleMinN.value <= 10,
)
const labelCount = computed(() => (rangeValid.value ? scaleMaxN.value - scaleMinN.value + 1 : 0))
function syncLabelCount() {
  if (form.question_type === 'boolean') {
    form.scale_labels = [form.scale_labels[0] ?? 'Tidak', form.scale_labels[1] ?? 'Ya']
    return
  }
  if (form.question_type !== 'likert' || !labelCount.value) return
  const next = form.scale_labels.slice(0, labelCount.value)
  while (next.length < labelCount.value) next.push('')
  form.scale_labels = next
}
watch([scaleMinN, scaleMaxN], syncLabelCount)
const resetLabels = () => {
  const def = subtestDef.value
  if (!def) return
  form.scale_min = def.scaleMin
  form.scale_max = def.scaleMax
  form.scale_labels = [...def.scaleLabels]
}

// --- Multiple choice options (2–5, keys A–E) ---
const addOption = () => {
  if (form.options.length < MAX_OPTIONS) form.options.push('')
}
const removeOption = (i: number) => {
  if (form.options.length <= MIN_OPTIONS) return
  form.options.splice(i, 1)
  const keyIdx = OPTION_KEYS.indexOf(form.correct_key as (typeof OPTION_KEYS)[number])
  if (keyIdx === i) form.correct_key = 'A'
  else if (keyIdx > i) form.correct_key = OPTION_KEYS[keyIdx - 1] ?? 'A'
}

// --- Validation (mirrors §13.3) ---
const errors = computed(() => {
  const def = subtestDef.value
  const e = {
    subtest: def ? '' : 'Pilih subtes yang valid untuk instrumen ini.',
    item_code:
      required(form.item_code, 'Kode butir') ||
      (!/^[A-Z0-9][A-Z0-9-]{1,49}$/.test(form.item_code) ? 'Gunakan huruf kapital, angka, dan "-" (mis. RIA-R1).' : '') ||
      duplicate.value,
    question_text: required(form.question_text, 'Teks pertanyaan'),
    dimension:
      def && !(form.dimension === '' ? def.allowNoDimension : def.dimensions.some((d) => d.value === form.dimension))
        ? 'Dimensi tidak valid untuk subtes ini.'
        : '',
    scale: '',
    scale_labels: '',
    options: '',
    correct_key: '',
    order_num: Number.isInteger(Number(form.order_num)) && Number(form.order_num) >= 0 ? '' : 'Nomor urut harus bilangan bulat ≥ 0.',
    weight: Number(form.weight) > 0 ? '' : 'Bobot harus lebih dari 0.',
  }
  if (form.question_type === 'likert') {
    if (!rangeValid.value) e.scale = 'Skala minimum harus lebih kecil dari maksimum (maks. 11 titik).'
    else if (form.scale_labels.length !== labelCount.value || form.scale_labels.some((l) => !l.trim()))
      e.scale_labels = `Isi ${labelCount.value} label skala (satu per nilai).`
  } else if (form.question_type === 'boolean') {
    if (form.scale_labels.length !== 2 || form.scale_labels.some((l) => !l.trim())) e.scale_labels = 'Isi kedua label pilihan.'
  } else {
    const filled = form.options.map((o) => o.trim())
    if (filled.length < MIN_OPTIONS || filled.length > MAX_OPTIONS) e.options = 'Pilihan ganda memerlukan 2–5 opsi.'
    else if (filled.some((o) => !o)) e.options = 'Semua opsi harus diisi (hapus opsi yang tidak dipakai).'
    const idx = OPTION_KEYS.indexOf(form.correct_key as (typeof OPTION_KEYS)[number])
    if (idx < 0 || idx >= filled.length) e.correct_key = 'Kunci jawaban harus salah satu opsi yang tersedia.'
  }
  return e
})
const err = (k: keyof typeof errors.value) => (submitted.value || (k === 'item_code' && duplicate.value) ? errors.value[k] : '')

const buildPayload = (): QuestionPayload => {
  const mc = form.question_type === 'multiple_choice'
  return {
    instrument_code: form.instrument_code,
    subtest: form.subtest,
    item_code: form.item_code.trim(),
    question_text: form.question_text.trim(),
    question_type: form.question_type,
    scale_min: form.question_type === 'likert' ? scaleMinN.value : 0,
    scale_max: form.question_type === 'likert' ? scaleMaxN.value : 1,
    scale_labels: mc ? [] : form.scale_labels.map((l) => l.trim()),
    options: mc ? form.options.map((o) => o.trim()) : [],
    correct_key: mc ? form.correct_key : '',
    dimension: form.dimension,
    weight: Number(form.weight),
    order_num: Number(form.order_num),
    is_active: form.is_active,
  }
}

const submit = async () => {
  submitted.value = true
  serverError.value = ''
  if (hasErrors(errors.value)) {
    toast.warning('Periksa kembali isian formulir.')
    return
  }
  const payload = buildPayload()
  saving.value = true
  try {
    const saved = props.question ? await store.updateQuestion(props.question.id, payload) : await store.createQuestion(payload)
    toast.success({ title: props.question ? 'Butir soal diperbarui' : 'Butir soal ditambahkan', description: payload.item_code })
    emit('saved', saved)
    emit('close')
  } catch (e) {
    const msg = getErrorMessage(e, 'Gagal menyimpan butir soal.')
    if (getErrorStatus(e) === 409 || getErrorCode(e) === 'DUPLICATE_CODE') duplicate.value = 'Kode butir sudah dipakai butir lain.'
    else serverError.value = msg
    toast.error({ title: 'Gagal menyimpan', description: duplicate.value || msg })
  } finally {
    saving.value = false
  }
}

const previewOptions = computed(() => form.options)
</script>

<template>
  <BaseModal
    :open="open"
    size="xl"
    :title="isEdit ? `Ubah butir ${question?.item_code ?? ''}` : 'Tambah butir soal'"
    description="Struktur kolom menyesuaikan instrumen dan subtes (PRD §6–9)."
    :persistent="saving"
    @close="emit('close')"
  >
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <form id="question-form" class="space-y-5 lg:col-span-3" novalidate @submit.prevent="submit">
        <InlineAlert v-if="serverError">{{ serverError }}</InlineAlert>
        <InlineAlert v-if="typeMismatch" tone="info">
          Tipe butir tersimpan ({{ QUESTION_TYPE_LABELS[question?.question_type ?? 'likert'] }}) berbeda dari standar subtes ini. Saat disimpan akan
          memakai tipe {{ QUESTION_TYPE_LABELS[form.question_type] }}.
        </InlineAlert>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseSelect v-model="instrumentModel" label="Instrumen" :options="instrumentOptions" required />
          <BaseSelect v-model="subtestModel" label="Subtes / modul" :options="subtestOptions" required :error="err('subtest')" />
          <BaseInput
            v-model="itemCodeModel"
            label="Kode butir"
            :placeholder="subtestDef?.codeExample ?? 'RIA-R1'"
            required
            autocomplete="off"
            class="font-mono"
            hint="Unik; contoh TMB-SP1 untuk spasial"
            :error="err('item_code')"
          />
          <BaseSelect
            v-model="dimensionModel"
            label="Dimensi"
            :options="dimensionOptions"
            placeholder="Pilih dimensi"
            required
            :error="err('dimension')"
          />
        </div>

        <div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          Tipe jawaban: <BaseBadge tone="brand">{{ QUESTION_TYPE_LABELS[form.question_type] }}</BaseBadge>
        </div>

        <BaseTextarea
          v-model="form.question_text"
          label="Teks pertanyaan / pernyataan"
          placeholder="Tuliskan butir soal dengan jelas…"
          :rows="3"
          :error="err('question_text')"
        />

        <!-- Likert -->
        <fieldset v-if="form.question_type === 'likert'" class="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
          <legend class="sr-only">Pengaturan skala</legend>
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Skala Likert</p>
            <BaseButton variant="ghost" size="sm" :icon="RotateCcw" @click="resetLabels">Label standar</BaseButton>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <BaseInput v-model="form.scale_min" label="Nilai minimum" type="number" step="1" required :error="err('scale')" />
            <BaseInput v-model="form.scale_max" label="Nilai maksimum" type="number" step="1" required />
          </div>
          <div v-if="labelCount" class="space-y-2">
            <p class="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Label per nilai ({{ labelCount }})</p>
            <div v-for="(_, i) in form.scale_labels" :key="i" class="flex items-center gap-2">
              <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 tabular-nums dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700">
                {{ scaleMinN + i }}
              </span>
              <BaseInput v-model="form.scale_labels[i]" :aria-label="`Label nilai ${scaleMinN + i}`" placeholder="Label" />
            </div>
          </div>
          <p v-if="err('scale_labels')" class="text-xs font-medium text-red-600 dark:text-red-400" role="alert">{{ err('scale_labels') }}</p>
        </fieldset>

        <!-- Two-choice -->
        <fieldset v-else-if="form.question_type === 'boolean'" class="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
          <legend class="sr-only">Label pilihan</legend>
          <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Label dua pilihan</p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BaseInput v-model="form.scale_labels[1]" label="Nilai 1 (dihitung)" placeholder="Suka / Bisa / Tertarik" required />
            <BaseInput v-model="form.scale_labels[0]" label="Nilai 0" placeholder="Tidak / Belum" required />
          </div>
          <p v-if="err('scale_labels')" class="text-xs font-medium text-red-600 dark:text-red-400" role="alert">{{ err('scale_labels') }}</p>
        </fieldset>

        <!-- Multiple choice -->
        <fieldset v-else class="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
          <legend class="sr-only">Opsi jawaban</legend>
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Opsi jawaban ({{ form.options.length }}/{{ MAX_OPTIONS }})</p>
            <BaseButton variant="ghost" size="sm" :icon="Plus" :disabled="form.options.length >= MAX_OPTIONS" @click="addOption">Tambah opsi</BaseButton>
          </div>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Klik huruf untuk menetapkan kunci jawaban.</p>
          <div role="radiogroup" aria-label="Kunci jawaban" class="space-y-2">
            <div v-for="(_, i) in form.options" :key="i" class="flex items-center gap-2">
              <button
                type="button"
                role="radio"
                :aria-checked="form.correct_key === OPTION_KEYS[i]"
                :aria-label="`Jadikan ${OPTION_KEYS[i]} kunci jawaban`"
                class="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold ring-1 transition-colors"
                :class="
                  form.correct_key === OPTION_KEYS[i]
                    ? 'bg-emerald-600 text-white ring-emerald-600'
                    : 'bg-white text-zinc-700 ring-zinc-200 hover:ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700'
                "
                @click="form.correct_key = OPTION_KEYS[i] ?? 'A'"
              >
                {{ OPTION_KEYS[i] }}
              </button>
              <BaseInput v-model="form.options[i]" :aria-label="`Teks opsi ${OPTION_KEYS[i]}`" :placeholder="`Teks opsi ${OPTION_KEYS[i]}`" />
              <BaseButton
                variant="ghost-danger"
                size="sm"
                icon-only
                :icon="Trash2"
                :disabled="form.options.length <= MIN_OPTIONS"
                :aria-label="`Hapus opsi ${OPTION_KEYS[i]}`"
                @click="removeOption(i)"
              />
            </div>
          </div>
          <p v-if="err('options') || err('correct_key')" class="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
            {{ err('options') || err('correct_key') }}
          </p>
        </fieldset>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BaseInput v-model="form.order_num" label="Nomor urut" type="number" min="0" step="1" :error="err('order_num')" />
          <BaseInput v-model="form.weight" label="Bobot" type="number" min="0" step="0.01" :error="err('weight')" />
          <div class="flex flex-col gap-1.5">
            <span class="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Status</span>
            <label class="flex h-10 cursor-pointer items-center gap-3">
              <span class="relative inline-flex shrink-0">
                <input v-model="form.is_active" type="checkbox" role="switch" class="peer sr-only" :aria-checked="form.is_active" />
                <span
                  class="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 dark:bg-zinc-700 dark:peer-checked:bg-brand-500"
                />
                <span class="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-150 peer-checked:translate-x-5" />
              </span>
              <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ form.is_active ? 'Aktif' : 'Nonaktif' }}</span>
            </label>
          </div>
        </div>
      </form>

      <aside class="lg:col-span-2">
        <div class="lg:sticky lg:top-0">
          <QuestionPreview
            :text="form.question_text"
            :type="form.question_type"
            :scale-min="scaleMinN"
            :scale-max="scaleMaxN"
            :scale-labels="form.scale_labels"
            :options="previewOptions"
            :correct-key="form.correct_key"
            :section="subtestDef ? `${form.instrument_code} · ${subtestDef.label}` : form.instrument_code"
            :item-code="form.item_code"
            :dimension="form.dimension"
          />
        </div>
      </aside>
    </div>

    <template #footer>
      <BaseButton variant="secondary" :disabled="saving" @click="emit('close')">Batal</BaseButton>
      <BaseButton type="submit" form="question-form" :loading="saving">
        {{ isEdit ? 'Simpan perubahan' : 'Tambah ke bank soal' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
