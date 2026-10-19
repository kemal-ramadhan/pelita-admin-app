<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Package as PackageIcon, Pencil, Plus, Power, RefreshCw, Search, SearchX, ServerCrash } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import AssessmentStats from '@/components/assessment/AssessmentStats.vue'
import PackageFormModal from '@/components/assessment/PackageFormModal.vue'
import type { DataTableColumn } from '@/types/table'
import { useAssessmentAdminStore } from '@/stores/assessmentAdmin'
import { confirm } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import { getErrorMessage } from '@/utils/errors'
import { badgeColorClass, formatNumber, formatRupiah } from '@/utils/assessment'
import { instrumentName, type AssessmentPackage } from '@/types/assessment'

const store = useAssessmentAdminStore()

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Paket' },
  { key: 'instrument_codes', label: 'Instrumen' },
  { key: 'student_quota', label: 'Kuota', align: 'right' },
  { key: 'price', label: 'Harga', align: 'right' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Aksi', align: 'right', class: 'w-px whitespace-nowrap' },
]

type StatusFilter = 'all' | 'active' | 'inactive'
const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
]
const search = ref('')
const status = ref<StatusFilter>('all')

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.packages.filter(
    (p) =>
      (status.value === 'all' || p.is_active === (status.value === 'active')) &&
      (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
  )
})
const filtered = computed(() => !!search.value.trim() || status.value !== 'all')

onMounted(() => void store.fetchPackages())

const reload = () => {
  void store.fetchPackages()
  void store.fetchStats()
}

// --- Form ---
const formOpen = ref(false)
const editing = ref<AssessmentPackage | null>(null)
const openCreate = () => {
  editing.value = null
  formOpen.value = true
}
const openEdit = (p: AssessmentPackage) => {
  editing.value = p
  formOpen.value = true
}
const onSaved = () => reload()

// --- Status ---
const togglingId = ref<string | null>(null)
const toggleStatus = async (p: AssessmentPackage) => {
  const activate = !p.is_active
  await confirm({
    title: activate ? `Aktifkan ${p.name}?` : `Nonaktifkan ${p.name}?`,
    description: activate
      ? 'Paket akan tampil kembali di katalog sekolah dan dapat dibeli atau diklaim.'
      : 'Paket tidak lagi tampil di katalog sekolah. Langganan yang sudah berjalan tetap berlaku.',
    confirmText: activate ? 'Aktifkan' : 'Nonaktifkan',
    tone: activate ? 'primary' : 'danger',
    onConfirm: async () => {
      togglingId.value = p.id
      try {
        await store.setPackageStatus(p.id, activate)
        toast.success(activate ? `${p.name} diaktifkan.` : `${p.name} dinonaktifkan.`)
        void store.fetchStats()
      } catch (err) {
        toast.error({ title: 'Gagal mengubah status', description: getErrorMessage(err) })
        throw err
      } finally {
        togglingId.value = null
      }
    },
  })
}

const clearFilters = () => {
  search.value = ''
  status.value = 'all'
}
</script>

<template>
  <div>
    <PageHeader
      title="Paket Asesmen"
      description="Katalog paket asesmen psikologi: instrumen tes, kuota siswa, dan harga langganan sekolah."
    >
      <template #actions>
        <BaseButton :icon="Plus" @click="openCreate">Tambah paket</BaseButton>
      </template>
    </PageHeader>

    <AssessmentStats />

    <DataTable :columns="columns" :rows="rows" :row-key="(r) => r.id" :loading="store.packagesLoading" caption="Daftar paket asesmen">
      <template #toolbar>
        <div class="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <BaseInput v-model="search" type="search" :icon="Search" placeholder="Cari nama atau kode paket…" aria-label="Cari paket" class="sm:max-w-xs" />
          <SegmentedControl v-model="status" :options="statusOptions" label="Filter status" />
          <div class="flex items-center gap-2 sm:ml-auto">
            <span class="text-[13px] text-zinc-500 tabular-nums dark:text-zinc-400" aria-live="polite">{{ rows.length }} paket</span>
            <BaseButton variant="ghost" size="sm" icon-only :icon="RefreshCw" :loading="store.packagesLoading" aria-label="Muat ulang" @click="reload" />
          </div>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="flex min-w-0 items-center gap-3">
          <div class="grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset" :class="badgeColorClass(row.badge_color).chip">
            <PackageIcon :size="17" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="flex items-center gap-2 truncate font-medium text-zinc-900 dark:text-zinc-100">
              {{ row.name }}
              <BaseBadge :tone="row.is_bundle ? 'brand' : 'neutral'">{{ row.is_bundle ? 'Bundle' : 'Satuan' }}</BaseBadge>
            </p>
            <p class="max-w-[320px] truncate text-xs text-zinc-500 dark:text-zinc-400">
              {{ row.code }}<template v-if="row.description"> · {{ row.description }}</template>
            </p>
          </div>
        </div>
      </template>
      <template #cell-instrument_codes="{ row }">
        <div class="flex flex-wrap gap-1">
          <BaseBadge v-for="c in row.instrument_codes" :key="c" tone="neutral" :title="instrumentName(c)">{{ c }}</BaseBadge>
        </div>
      </template>
      <template #cell-student_quota="{ row }">
        <span class="tabular-nums">{{ formatNumber(row.student_quota) }}</span>
        <span class="ml-1 text-xs text-zinc-500 dark:text-zinc-400">siswa</span>
      </template>
      <template #cell-price="{ row }">
        <span class="font-medium tabular-nums">{{ row.price > 0 ? formatRupiah(row.price) : 'Gratis' }}</span>
      </template>
      <template #cell-is_active="{ row }">
        <BaseBadge :tone="row.is_active ? 'success' : 'danger'" dot>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <BaseButton variant="ghost" size="sm" icon-only :icon="Pencil" :aria-label="`Ubah ${row.name}`" title="Ubah" @click="openEdit(row)" />
          <BaseButton
            :variant="row.is_active ? 'ghost-danger' : 'ghost'"
            size="sm"
            icon-only
            :icon="Power"
            :loading="togglingId === row.id"
            :aria-label="row.is_active ? `Nonaktifkan ${row.name}` : `Aktifkan ${row.name}`"
            :title="row.is_active ? 'Nonaktifkan' : 'Aktifkan'"
            @click="toggleStatus(row)"
          />
        </div>
      </template>

      <template #mobile="{ row }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-medium text-zinc-900 dark:text-zinc-100">{{ row.name }}</p>
            <p class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {{ row.code }} · {{ row.instrument_codes.join(', ') }} · {{ formatNumber(row.student_quota) }} siswa
            </p>
            <p class="mt-1 text-sm font-medium tabular-nums">{{ row.price > 0 ? formatRupiah(row.price) : 'Gratis' }}</p>
          </div>
          <BaseBadge :tone="row.is_active ? 'success' : 'danger'" dot>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
        </div>
        <div class="mt-3 flex gap-2">
          <BaseButton variant="secondary" size="sm" :icon="Pencil" @click="openEdit(row)">Ubah</BaseButton>
          <BaseButton
            :variant="row.is_active ? 'ghost-danger' : 'soft'"
            size="sm"
            :icon="Power"
            :loading="togglingId === row.id"
            class="ml-auto"
            @click="toggleStatus(row)"
          >
            {{ row.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
          </BaseButton>
        </div>
      </template>

      <template #empty>
        <EmptyState v-if="store.packagesError" :icon="ServerCrash" tone="danger" title="Gagal memuat data" :description="store.packagesError">
          <BaseButton variant="secondary" :icon="RefreshCw" @click="reload">Coba lagi</BaseButton>
        </EmptyState>
        <EmptyState v-else-if="filtered" :icon="SearchX" title="Tidak ada hasil" description="Tidak ada paket yang cocok dengan pencarian atau filter Anda.">
          <BaseButton variant="secondary" @click="clearFilters">Hapus filter</BaseButton>
        </EmptyState>
        <EmptyState v-else :icon="PackageIcon" title="Belum ada paket asesmen" description="Buat paket pertama yang dapat dibeli atau diklaim sekolah.">
          <BaseButton :icon="Plus" @click="openCreate">Tambah paket</BaseButton>
        </EmptyState>
      </template>

      <template #footer>
        <div
          v-if="store.packagesError && store.packages.length > 0"
          class="border-t border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          {{ store.packagesError }}
        </div>
      </template>
    </DataTable>

    <PackageFormModal :open="formOpen" :pkg="editing" @close="formOpen = false" @saved="onSaved" />
  </div>
</template>
