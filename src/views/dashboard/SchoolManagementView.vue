<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Pencil, Plus, Power, RefreshCw, Search, SearchX, ServerCrash, School as SchoolIcon, Users } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'
import type { DataTableColumn } from '@/types/table'
import TablePagination from '@/components/ui/TablePagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import SchoolFormDrawer from '@/components/school/SchoolFormDrawer.vue'
import SchoolAccountsDrawer from '@/components/school/SchoolAccountsDrawer.vue'
import { useAdminSchoolStore } from '@/stores/adminSchool'
import { confirm } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import { getErrorMessage } from '@/utils/errors'
import type { School, SchoolStatusFilter } from '@/types/school'

const store = useAdminSchoolStore()
const route = useRoute()
const router = useRouter()

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Sekolah' },
  { key: 'school_level', label: 'Jenjang' },
  { key: 'contact', label: 'Kontak', hideBelowLg: true },
  { key: 'account_count', label: 'Akun', align: 'center' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Aksi', align: 'right', class: 'w-px whitespace-nowrap' },
]

const statusOptions: { label: string; value: SchoolStatusFilter }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
]

// --- Query state (synced with URL) ---
const q = route.query
const search = ref(typeof q.search === 'string' ? q.search : '')
const status = ref<SchoolStatusFilter>(q.status === 'active' || q.status === 'inactive' ? q.status : 'all')
const initialPage = Math.max(1, Number(q.page) || 1)

const syncUrl = () => {
  const { page, search: s, status: st } = store.query
  void router.replace({
    query: {
      ...(page > 1 ? { page: String(page) } : {}),
      ...(s ? { search: s } : {}),
      ...(st !== 'all' ? { status: st } : {}),
    },
  })
}

const load = async (patch: Parameters<typeof store.fetchSchools>[0] = {}) => {
  await store.fetchSchools(patch)
  syncUrl()
}

let debounce: ReturnType<typeof setTimeout> | undefined
watch(search, (v) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => void load({ search: v, page: 1 }), 350)
})
watch(status, (v) => void load({ status: v, page: 1 }))
onBeforeUnmount(() => clearTimeout(debounce))

// --- Drawers ---
const formOpen = ref(false)
const editing = ref<School | null>(null)
const accountsOpen = ref(false)
const accountsSchool = ref<School | null>(null)

const openCreate = () => {
  editing.value = null
  formOpen.value = true
}
const openEdit = (s: School) => {
  editing.value = s
  formOpen.value = true
}
const openAccounts = (s: School) => {
  accountsSchool.value = s
  accountsOpen.value = true
}

onMounted(() => {
  void store.fetchSchools({ page: initialPage, search: search.value, status: status.value, limit: store.query.limit })
  if (route.query.new === '1') openCreate()
})

const onSaved = () => {
  void load(editing.value ? {} : { page: 1 })
}

// --- Status toggle ---
const togglingId = ref<string | null>(null)
const toggleStatus = async (s: School) => {
  const activate = !s.is_active
  await confirm({
    title: activate ? `Aktifkan ${s.name}?` : `Nonaktifkan ${s.name}?`,
    description: activate
      ? 'Sekolah dan seluruh akunnya dapat kembali mengakses platform.'
      : 'Seluruh akun sekolah ini tidak dapat mengakses dasbor sekolah sampai diaktifkan kembali.',
    confirmText: activate ? 'Aktifkan' : 'Nonaktifkan',
    tone: activate ? 'primary' : 'danger',
    onConfirm: async () => {
      togglingId.value = s.id
      try {
        await store.setSchoolStatus(s.id, activate)
        toast.success(activate ? `${s.name} diaktifkan.` : `${s.name} dinonaktifkan.`)
        if (store.query.status !== 'all') void load()
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
    <PageHeader title="Manajemen Sekolah" description="Kelola tenant sekolah, status langganan, dan akun institusi.">
      <template #actions>
        <BaseButton :icon="Plus" @click="openCreate">Tambah sekolah</BaseButton>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="store.schools"
      :row-key="(r) => r.id"
      :loading="store.loading"
      caption="Daftar sekolah"
    >
      <template #toolbar>
        <div class="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <BaseInput
            v-model="search"
            type="search"
            :icon="Search"
            placeholder="Cari nama, kode, atau NPSN…"
            aria-label="Cari sekolah"
            class="sm:max-w-xs"
          />
          <SegmentedControl v-model="status" :options="statusOptions" label="Filter status" />
          <div class="flex items-center gap-2 sm:ml-auto">
            <span class="text-[13px] text-zinc-500 tabular-nums dark:text-zinc-400" aria-live="polite">
              {{ store.meta.total }} sekolah
            </span>
            <BaseButton variant="ghost" size="sm" icon-only :icon="RefreshCw" :loading="store.loading" aria-label="Muat ulang" @click="load()" />
          </div>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="flex min-w-0 items-center gap-3">
          <div class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <SchoolIcon :size="17" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="truncate font-medium text-zinc-900 dark:text-zinc-100">{{ row.name }}</p>
            <p class="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {{ row.code }}<template v-if="row.npsn"> · NPSN {{ row.npsn }}</template>
            </p>
          </div>
        </div>
      </template>
      <template #cell-school_level="{ row }">
        <BaseBadge tone="brand">{{ row.school_level || '—' }}</BaseBadge>
        <span v-if="row.school_status" class="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400">{{ row.school_status }}</span>
      </template>
      <template #cell-contact="{ row }">
        <p class="max-w-[220px] truncate text-[13px]">{{ row.email || '—' }}</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ row.phone || '' }}</p>
      </template>
      <template #cell-account_count="{ row }">
        <span class="tabular-nums">{{ row.account_count ?? '—' }}</span>
      </template>
      <template #cell-is_active="{ row }">
        <BaseBadge :tone="row.is_active ? 'success' : 'danger'" dot>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <BaseButton variant="ghost" size="sm" icon-only :icon="Users" :aria-label="`Kelola akun ${row.name}`" :title="'Kelola akun'" @click="openAccounts(row)" />
          <BaseButton variant="ghost" size="sm" icon-only :icon="Pencil" :aria-label="`Ubah ${row.name}`" :title="'Ubah'" @click="openEdit(row)" />
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
              {{ row.code }} · {{ row.school_level || '—' }} · {{ row.account_count ?? 0 }} akun
            </p>
          </div>
          <BaseBadge :tone="row.is_active ? 'success' : 'danger'" dot>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
        </div>
        <div class="mt-3 flex gap-2">
          <BaseButton variant="secondary" size="sm" :icon="Users" @click="openAccounts(row)">Akun</BaseButton>
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
        <EmptyState v-if="store.error" :icon="ServerCrash" tone="danger" title="Gagal memuat data" :description="store.error">
          <BaseButton variant="secondary" :icon="RefreshCw" @click="load()">Coba lagi</BaseButton>
        </EmptyState>
        <EmptyState
          v-else-if="store.query.search || store.query.status !== 'all'"
          :icon="SearchX"
          title="Tidak ada hasil"
          description="Tidak ada sekolah yang cocok dengan pencarian atau filter Anda."
        >
          <BaseButton variant="secondary" @click="clearFilters">Hapus filter</BaseButton>
        </EmptyState>
        <EmptyState v-else :icon="SchoolIcon" title="Belum ada sekolah" description="Daftarkan sekolah pertama beserta akun institusinya.">
          <BaseButton :icon="Plus" @click="openCreate">Tambah sekolah</BaseButton>
        </EmptyState>
      </template>

      <template #footer>
        <div v-if="store.error && store.schools.length > 0" class="border-t border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" role="alert">
          {{ store.error }}
        </div>
        <TablePagination
          v-if="store.meta.total > 0"
          :meta="store.meta"
          :disabled="store.loading"
          :limit-options="[10, 25, 50]"
          @update:page="(p) => load({ page: p })"
          @update:limit="(l) => load({ limit: l, page: 1 })"
        />
      </template>
    </DataTable>

    <SchoolFormDrawer :open="formOpen" :school="editing" @close="formOpen = false" @saved="onSaved" />
    <SchoolAccountsDrawer :open="accountsOpen" :school="accountsSchool" @close="accountsOpen = false" @changed="load()" />
  </div>
</template>
