<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BrainCircuit, Eye, Pencil, Plus, RefreshCw, Search, SearchX, ServerCrash, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import QuestionFormModal from '@/components/assessment/QuestionFormModal.vue'
import QuestionPreview from '@/components/assessment/QuestionPreview.vue'
import type { DataTableColumn } from '@/types/table'
import { useAssessmentAdminStore } from '@/stores/assessmentAdmin'
import { confirm } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import { getErrorMessage } from '@/utils/errors'
import {
  INSTRUMENT_CODES,
  QUESTION_TYPE_LABELS,
  findSubtest,
  optionText,
  subtestsOf,
  type AssessmentQuestion,
} from '@/types/assessment'

const store = useAssessmentAdminStore()
const route = useRoute()
const router = useRouter()

const columns: DataTableColumn[] = [
  { key: 'item_code', label: 'Kode' },
  { key: 'question_text', label: 'Butir soal' },
  { key: 'question_type', label: 'Tipe', hideBelowLg: true },
  { key: 'dimension', label: 'Dimensi', align: 'center' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Aksi', align: 'right', class: 'w-px whitespace-nowrap' },
]

type InstFilter = '' | (typeof INSTRUMENT_CODES)[number]
const instrumentOptions: { label: string; value: InstFilter }[] = [
  { label: 'Semua', value: '' },
  ...INSTRUMENT_CODES.map((c) => ({ label: c, value: c as InstFilter })),
]

// --- Query state (synced with URL) ---
const q = route.query
const instrument = ref<InstFilter>(
  typeof q.instrument === 'string' && (INSTRUMENT_CODES as readonly string[]).includes(q.instrument) ? (q.instrument as InstFilter) : '',
)
const subtest = ref(typeof q.subtest === 'string' && instrument.value && findSubtest(instrument.value, q.subtest) ? q.subtest : '')
const search = ref(typeof q.search === 'string' ? q.search : '')
const initialPage = Math.max(1, Number(q.page) || 1)

const subtestOptions = computed(() => [
  { value: '', label: 'Semua subtes' },
  ...(instrument.value ? subtestsOf(instrument.value).map((s) => ({ value: s.value, label: s.label })) : []),
])
const subtestModel = computed({
  get: () => subtest.value,
  set: (v: string | null | undefined) => {
    subtest.value = v ?? ''
  },
})

const syncUrl = () => {
  const { page, instrument_code, subtest: st, search: s } = store.questionsQuery
  void router.replace({
    query: {
      ...(page > 1 ? { page: String(page) } : {}),
      ...(instrument_code ? { instrument: instrument_code } : {}),
      ...(st ? { subtest: st } : {}),
      ...(s ? { search: s } : {}),
    },
  })
}
const load = async (patch: Parameters<typeof store.fetchQuestions>[0] = {}) => {
  await store.fetchQuestions(patch)
  syncUrl()
}

let debounce: ReturnType<typeof setTimeout> | undefined
watch(search, (v) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => void load({ search: v, page: 1 }), 350)
})
watch(instrument, (v) => {
  subtest.value = ''
  void load({ instrument_code: v, subtest: '', page: 1 })
})
watch(subtest, (v) => {
  if (v !== store.questionsQuery.subtest) void load({ subtest: v, page: 1 })
})
onBeforeUnmount(() => clearTimeout(debounce))

onMounted(() => {
  void store.fetchQuestions({
    page: initialPage,
    instrument_code: instrument.value,
    subtest: subtest.value,
    search: search.value,
  })
})

const filtered = computed(() => !!(store.questionsQuery.instrument_code || store.questionsQuery.subtest || store.questionsQuery.search))
const clearFilters = () => {
  search.value = ''
  instrument.value = ''
  subtest.value = ''
}

const subtestLabel = (row: AssessmentQuestion) => findSubtest(row.instrument_code, row.subtest)?.label ?? row.subtest

// --- Form ---
const formOpen = ref(false)
const editing = ref<AssessmentQuestion | null>(null)
const openCreate = () => {
  editing.value = null
  formOpen.value = true
}
const openEdit = (row: AssessmentQuestion) => {
  editing.value = row
  formOpen.value = true
}
const onSaved = () => {
  void load(editing.value ? {} : { page: 1 })
  void store.fetchStats()
}

// --- Preview ---
const previewing = ref<AssessmentQuestion | null>(null)
const previewOpen = ref(false)
const openPreview = (row: AssessmentQuestion) => {
  previewing.value = row
  previewOpen.value = true
}

// --- Delete ---
const deletingId = ref<string | null>(null)
const remove = async (row: AssessmentQuestion) => {
  await confirm({
    title: `Hapus butir ${row.item_code}?`,
    description:
      'Butir yang belum pernah dijawab akan dihapus permanen. Bila sudah ada jawaban siswa, butir hanya dinonaktifkan agar hasil asesmen lama tetap utuh.',
    confirmText: 'Hapus',
    tone: 'danger',
    onConfirm: async () => {
      deletingId.value = row.id
      try {
        const res = await store.deleteQuestion(row.id)
        if (res.soft) {
          toast.info({
            title: `${row.item_code} dinonaktifkan`,
            description: 'Butir sudah memiliki jawaban siswa, sehingga tidak dihapus permanen (is_active = false).',
          })
        } else {
          toast.success({ title: 'Butir soal dihapus', description: res.message || row.item_code })
        }
        void load()
        void store.fetchStats()
      } catch (err) {
        toast.error({ title: 'Gagal menghapus', description: getErrorMessage(err) })
        throw err
      } finally {
        deletingId.value = null
      }
    },
  })
}
</script>

<template>
  <div>
    <PageHeader title="Bank Soal Asesmen" description="Kelola butir instrumen TMB, RIASEC, PMK, dan ADN beserta skala, opsi, kunci, dan dimensinya.">
      <template #actions>
        <BaseButton :icon="Plus" @click="openCreate">Tambah butir</BaseButton>
      </template>
    </PageHeader>

    <DataTable :columns="columns" :rows="store.questions" :row-key="(r) => r.id" :loading="store.questionsLoading" caption="Bank soal asesmen">
      <template #toolbar>
        <div class="flex flex-col gap-3 border-b border-zinc-100 p-4 lg:flex-row lg:items-center dark:border-zinc-800">
          <SegmentedControl v-model="instrument" :options="instrumentOptions" label="Filter instrumen" />
          <BaseSelect
            v-model="subtestModel"
            :options="subtestOptions"
            :disabled="!instrument"
            aria-label="Filter subtes"
            class="lg:max-w-60"
          />
          <BaseInput v-model="search" type="search" :icon="Search" placeholder="Cari kode atau teks butir…" aria-label="Cari butir soal" class="lg:max-w-xs" />
          <div class="flex items-center gap-2 lg:ml-auto">
            <span class="text-[13px] whitespace-nowrap text-zinc-500 tabular-nums dark:text-zinc-400" aria-live="polite">{{ store.questionsMeta.total }} butir</span>
            <BaseButton variant="ghost" size="sm" icon-only :icon="RefreshCw" :loading="store.questionsLoading" aria-label="Muat ulang" @click="load()" />
          </div>
        </div>
      </template>

      <template #cell-item_code="{ row }">
        <p class="font-mono text-[13px] font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-100">{{ row.item_code }}</p>
        <BaseBadge tone="brand" class="mt-1">{{ row.instrument_code }}</BaseBadge>
      </template>
      <template #cell-question_text="{ row }">
        <p class="line-clamp-2 max-w-xl text-[13px] leading-relaxed text-zinc-900 dark:text-zinc-100">{{ row.question_text }}</p>
        <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {{ subtestLabel(row) }}
          <template v-if="row.question_type === 'multiple_choice'"> · {{ (row.options ?? []).length }} opsi · kunci {{ row.correct_key || '—' }}</template>
          <template v-else-if="row.question_type === 'likert'"> · skala {{ row.scale_min }}–{{ row.scale_max }}</template>
        </p>
      </template>
      <template #cell-question_type="{ row }">
        <BaseBadge tone="neutral">{{ QUESTION_TYPE_LABELS[row.question_type] ?? row.question_type }}</BaseBadge>
      </template>
      <template #cell-dimension="{ row }">
        <span v-if="row.dimension" class="font-mono text-[13px] font-semibold text-brand-700 dark:text-brand-300">{{ row.dimension }}</span>
        <span v-else class="text-zinc-400">—</span>
      </template>
      <template #cell-is_active="{ row }">
        <BaseBadge :tone="row.is_active ? 'success' : 'danger'" dot>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <BaseButton variant="ghost" size="sm" icon-only :icon="Eye" :aria-label="`Pratinjau ${row.item_code}`" title="Pratinjau" @click="openPreview(row)" />
          <BaseButton variant="ghost" size="sm" icon-only :icon="Pencil" :aria-label="`Ubah ${row.item_code}`" title="Ubah" @click="openEdit(row)" />
          <BaseButton
            variant="ghost-danger"
            size="sm"
            icon-only
            :icon="Trash2"
            :loading="deletingId === row.id"
            :aria-label="`Hapus ${row.item_code}`"
            title="Hapus"
            @click="remove(row)"
          />
        </div>
      </template>

      <template #mobile="{ row }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{{ row.item_code }}</p>
            <p class="mt-0.5 line-clamp-2 text-[13px] text-zinc-700 dark:text-zinc-300">{{ row.question_text }}</p>
            <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {{ row.instrument_code }} · {{ subtestLabel(row) }}<template v-if="row.dimension"> · {{ row.dimension }}</template>
            </p>
          </div>
          <BaseBadge :tone="row.is_active ? 'success' : 'danger'" dot>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
        </div>
        <div class="mt-3 flex gap-2">
          <BaseButton variant="secondary" size="sm" :icon="Eye" @click="openPreview(row)">Pratinjau</BaseButton>
          <BaseButton variant="secondary" size="sm" :icon="Pencil" @click="openEdit(row)">Ubah</BaseButton>
          <BaseButton variant="ghost-danger" size="sm" :icon="Trash2" :loading="deletingId === row.id" class="ml-auto" @click="remove(row)">
            Hapus
          </BaseButton>
        </div>
      </template>

      <template #empty>
        <EmptyState v-if="store.questionsError" :icon="ServerCrash" tone="danger" title="Gagal memuat data" :description="store.questionsError">
          <BaseButton variant="secondary" :icon="RefreshCw" @click="load()">Coba lagi</BaseButton>
        </EmptyState>
        <EmptyState v-else-if="filtered" :icon="SearchX" title="Tidak ada hasil" description="Tidak ada butir soal yang cocok dengan filter Anda.">
          <BaseButton variant="secondary" @click="clearFilters">Hapus filter</BaseButton>
        </EmptyState>
        <EmptyState v-else :icon="BrainCircuit" title="Bank soal kosong" description="Tambahkan butir soal pertama untuk instrumen asesmen.">
          <BaseButton :icon="Plus" @click="openCreate">Tambah butir</BaseButton>
        </EmptyState>
      </template>

      <template #footer>
        <div
          v-if="store.questionsError && store.questions.length > 0"
          class="border-t border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          {{ store.questionsError }}
        </div>
        <TablePagination
          v-if="store.questionsMeta.total > 0"
          :meta="store.questionsMeta"
          :disabled="store.questionsLoading"
          :limit-options="[20, 50, 100]"
          @update:page="(p) => load({ page: p })"
          @update:limit="(l) => load({ limit: l, page: 1 })"
        />
      </template>
    </DataTable>

    <QuestionFormModal
      :open="formOpen"
      :question="editing"
      :default-instrument="instrument || undefined"
      :default-subtest="subtest || undefined"
      @close="formOpen = false"
      @saved="onSaved"
    />

    <BaseModal :open="previewOpen" size="md" :title="previewing ? `Pratinjau ${previewing.item_code}` : 'Pratinjau'" @close="previewOpen = false">
      <QuestionPreview
        v-if="previewing"
        :text="previewing.question_text"
        :type="previewing.question_type"
        :scale-min="previewing.scale_min"
        :scale-max="previewing.scale_max"
        :scale-labels="previewing.scale_labels"
        :options="(previewing.options ?? []).map(optionText)"
        :correct-key="previewing.correct_key"
        :section="`${previewing.instrument_code} · ${subtestLabel(previewing)}`"
        :item-code="previewing.item_code"
        :dimension="previewing.dimension"
      />
      <template #footer>
        <BaseButton variant="secondary" @click="previewOpen = false">Tutup</BaseButton>
        <BaseButton
          v-if="previewing"
          :icon="Pencil"
          @click="
            () => {
              previewOpen = false
              if (previewing) openEdit(previewing)
            }
          "
        >
          Ubah butir
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
