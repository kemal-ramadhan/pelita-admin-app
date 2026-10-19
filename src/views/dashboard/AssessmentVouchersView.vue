<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, Copy, History, Plus, Power, RefreshCw, Search, SearchX, ServerCrash, Ticket } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import VoucherFormModal from '@/components/assessment/VoucherFormModal.vue'
import type { DataTableColumn } from '@/types/table'
import { useAssessmentAdminStore } from '@/stores/assessmentAdmin'
import { confirm } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import { getErrorMessage } from '@/utils/errors'
import { formatDate, formatDateTime, formatNumber, formatRupiah } from '@/utils/assessment'
import { DISCOUNT_TYPE_LABELS, type AssessmentVoucher } from '@/types/assessment'

const store = useAssessmentAdminStore()
const route = useRoute()
const router = useRouter()

type Tab = 'vouchers' | 'logs'
const tab = ref<Tab>(route.query.tab === 'logs' ? 'logs' : 'vouchers')
const tabOptions: { label: string; value: Tab }[] = [
  { label: 'Daftar voucher', value: 'vouchers' },
  { label: 'Riwayat klaim', value: 'logs' },
]
watch(tab, (t) => {
  void router.replace({ query: t === 'logs' ? { tab: 'logs' } : {} })
  if (t === 'logs') void store.fetchVoucherLogs(1)
})

const voucherColumns: DataTableColumn[] = [
  { key: 'code', label: 'Voucher' },
  { key: 'discount', label: 'Potongan' },
  { key: 'usage', label: 'Pemakaian' },
  { key: 'validity', label: 'Masa berlaku', hideBelowLg: true },
  { key: 'packages', label: 'Paket', hideBelowLg: true },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Aksi', align: 'right', class: 'w-px whitespace-nowrap' },
]
const logColumns: DataTableColumn[] = [
  { key: 'voucher', label: 'Voucher' },
  { key: 'school', label: 'Sekolah' },
  { key: 'subscription_id', label: 'Langganan', hideBelowLg: true },
  { key: 'claimed_at', label: 'Waktu klaim', align: 'right' },
]

const search = ref('')
const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? store.vouchers.filter((v) => v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)) : store.vouchers
})

onMounted(() => {
  void store.fetchVouchers()
  if (!store.packagesLoaded) void store.fetchPackages()
  if (tab.value === 'logs') void store.fetchVoucherLogs(1)
})

const reload = () => (tab.value === 'logs' ? store.fetchVoucherLogs() : store.fetchVouchers())

// --- helpers ---
const packageName = (id: string) => store.packages.find((p) => p.id === id)?.name ?? id.slice(0, 8)
const packagesLabel = (v: AssessmentVoucher) => {
  const ids = v.applicable_package_ids ?? []
  if (!ids.length) return 'Semua paket'
  return ids.map(packageName).join(', ')
}
const discountLabel = (v: AssessmentVoucher) =>
  v.discount_type === 'percentage'
    ? `${v.discount_value}%`
    : v.discount_type === 'fixed_amount'
      ? formatRupiah(v.discount_value)
      : '100% gratis'
const usagePct = (v: AssessmentVoucher) => (v.max_usage > 0 ? Math.min(100, Math.round((v.used_count / v.max_usage) * 100)) : 0)
const validityState = (v: AssessmentVoucher) => {
  const now = Date.now()
  if (new Date(v.valid_until).getTime() < now) return { label: 'Kedaluwarsa', tone: 'danger' as const }
  if (new Date(v.valid_from).getTime() > now) return { label: 'Belum berlaku', tone: 'warning' as const }
  if (v.used_count >= v.max_usage) return { label: 'Kuota habis', tone: 'neutral' as const }
  return null
}

const copied = ref<string | null>(null)
const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = code
    setTimeout(() => (copied.value = null), 1500)
    toast.success(`Kode ${code} disalin.`)
  } catch {
    toast.error('Tidak dapat menyalin ke clipboard.')
  }
}

// --- Form ---
const formOpen = ref(false)
const onSaved = () => {
  void store.fetchVouchers()
  void store.fetchStats()
}

// --- Status ---
const togglingId = ref<string | null>(null)
const toggleStatus = async (v: AssessmentVoucher) => {
  const activate = !v.is_active
  await confirm({
    title: activate ? `Aktifkan voucher ${v.code}?` : `Nonaktifkan voucher ${v.code}?`,
    description: activate
      ? 'Sekolah dapat kembali mengklaim voucher ini selama masa berlaku dan kuota masih ada.'
      : 'Voucher tidak dapat diklaim lagi. Langganan yang sudah diklaim tetap berlaku.',
    confirmText: activate ? 'Aktifkan' : 'Nonaktifkan',
    tone: activate ? 'primary' : 'danger',
    onConfirm: async () => {
      togglingId.value = v.id
      try {
        await store.setVoucherStatus(v.id, activate)
        toast.success(activate ? `Voucher ${v.code} diaktifkan.` : `Voucher ${v.code} dinonaktifkan.`)
      } catch (err) {
        toast.error({ title: 'Gagal mengubah status', description: getErrorMessage(err) })
        throw err
      } finally {
        togglingId.value = null
      }
    },
  })
}
</script>

<template>
  <div>
    <PageHeader title="Voucher Asesmen" description="Kode klaim gratis atau potongan harga paket asesmen untuk sekolah mitra.">
      <template #actions>
        <BaseButton :icon="Plus" @click="formOpen = true">Buat voucher</BaseButton>
      </template>
    </PageHeader>

    <div class="mb-4">
      <SegmentedControl v-model="tab" :options="tabOptions" label="Tampilan voucher" />
    </div>

    <!-- Vouchers -->
    <DataTable
      v-if="tab === 'vouchers'"
      :columns="voucherColumns"
      :rows="rows"
      :row-key="(r) => r.id"
      :loading="store.vouchersLoading"
      caption="Daftar voucher asesmen"
    >
      <template #toolbar>
        <div class="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <BaseInput v-model="search" type="search" :icon="Search" placeholder="Cari kode atau nama voucher…" aria-label="Cari voucher" class="sm:max-w-xs" />
          <div class="flex items-center gap-2 sm:ml-auto">
            <span class="text-[13px] text-zinc-500 tabular-nums dark:text-zinc-400" aria-live="polite">{{ rows.length }} voucher</span>
            <BaseButton variant="ghost" size="sm" icon-only :icon="RefreshCw" :loading="store.vouchersLoading" aria-label="Muat ulang" @click="reload()" />
          </div>
        </div>
      </template>

      <template #cell-code="{ row }">
        <div class="flex min-w-0 items-center gap-2">
          <div class="min-w-0">
            <p class="flex items-center gap-1 font-mono text-[13px] font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
              {{ row.code }}
              <button
                type="button"
                class="grid size-6 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                :aria-label="`Salin kode ${row.code}`"
                title="Salin kode"
                @click="copyCode(row.code)"
              >
                <Check v-if="copied === row.code" :size="14" class="text-emerald-600" aria-hidden="true" />
                <Copy v-else :size="14" aria-hidden="true" />
              </button>
            </p>
            <p class="max-w-[240px] truncate text-xs text-zinc-500 dark:text-zinc-400">{{ row.name }}</p>
          </div>
        </div>
      </template>
      <template #cell-discount="{ row }">
        <BaseBadge :tone="row.discount_type === 'free_claim' ? 'success' : 'brand'">{{ DISCOUNT_TYPE_LABELS[row.discount_type] ?? row.discount_type }}</BaseBadge>
        <p class="mt-1 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{{ discountLabel(row) }}</p>
      </template>
      <template #cell-usage="{ row }">
        <div class="w-36">
          <div class="flex justify-between text-xs tabular-nums">
            <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ formatNumber(row.used_count) }} / {{ formatNumber(row.max_usage) }}</span>
            <span class="text-zinc-500 dark:text-zinc-400">{{ usagePct(row) }}%</span>
          </div>
          <div
            class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            role="progressbar"
            :aria-valuenow="row.used_count"
            :aria-valuemin="0"
            :aria-valuemax="row.max_usage"
            :aria-label="`Pemakaian ${row.code}`"
          >
            <div class="h-full rounded-full" :class="usagePct(row) >= 100 ? 'bg-red-500' : usagePct(row) >= 80 ? 'bg-amber-500' : 'bg-brand-500'" :style="{ width: `${usagePct(row)}%` }" />
          </div>
        </div>
      </template>
      <template #cell-validity="{ row }">
        <p class="text-[13px] whitespace-nowrap">{{ formatDate(row.valid_from) }} – {{ formatDate(row.valid_until) }}</p>
        <BaseBadge v-if="validityState(row)" :tone="validityState(row)!.tone" class="mt-1">{{ validityState(row)!.label }}</BaseBadge>
      </template>
      <template #cell-packages="{ row }">
        <p class="max-w-[200px] truncate text-[13px]" :title="packagesLabel(row)">{{ packagesLabel(row) }}</p>
      </template>
      <template #cell-is_active="{ row }">
        <BaseBadge :tone="row.is_active ? 'success' : 'danger'" dot>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
      </template>
      <template #cell-actions="{ row }">
        <BaseButton
          :variant="row.is_active ? 'ghost-danger' : 'ghost'"
          size="sm"
          icon-only
          :icon="Power"
          :loading="togglingId === row.id"
          :aria-label="row.is_active ? `Nonaktifkan ${row.code}` : `Aktifkan ${row.code}`"
          :title="row.is_active ? 'Nonaktifkan' : 'Aktifkan'"
          @click="toggleStatus(row)"
        />
      </template>

      <template #mobile="{ row }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{{ row.code }}</p>
            <p class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {{ row.name }} · {{ discountLabel(row) }} · {{ row.used_count }}/{{ row.max_usage }} klaim
            </p>
            <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">s.d. {{ formatDate(row.valid_until) }}</p>
          </div>
          <BaseBadge :tone="row.is_active ? 'success' : 'danger'" dot>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
        </div>
        <div class="mt-3 flex gap-2">
          <BaseButton variant="secondary" size="sm" :icon="Copy" @click="copyCode(row.code)">Salin</BaseButton>
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
        <EmptyState v-if="store.vouchersError" :icon="ServerCrash" tone="danger" title="Gagal memuat data" :description="store.vouchersError">
          <BaseButton variant="secondary" :icon="RefreshCw" @click="reload()">Coba lagi</BaseButton>
        </EmptyState>
        <EmptyState v-else-if="search.trim()" :icon="SearchX" title="Tidak ada hasil" description="Tidak ada voucher yang cocok dengan pencarian Anda.">
          <BaseButton variant="secondary" @click="search = ''">Hapus pencarian</BaseButton>
        </EmptyState>
        <EmptyState v-else :icon="Ticket" title="Belum ada voucher" description="Buat kode voucher pertama untuk sekolah atau acara seminar BK.">
          <BaseButton :icon="Plus" @click="formOpen = true">Buat voucher</BaseButton>
        </EmptyState>
      </template>
    </DataTable>

    <!-- Claim logs -->
    <DataTable
      v-else
      :columns="logColumns"
      :rows="store.voucherLogs"
      :row-key="(r) => r.id"
      :loading="store.voucherLogsLoading"
      caption="Riwayat klaim voucher"
    >
      <template #toolbar>
        <div class="flex items-center gap-2 border-b border-zinc-100 p-4 dark:border-zinc-800">
          <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Klaim voucher oleh sekolah</p>
          <div class="ml-auto flex items-center gap-2">
            <span class="text-[13px] text-zinc-500 tabular-nums dark:text-zinc-400" aria-live="polite">{{ store.voucherLogsMeta.total }} klaim</span>
            <BaseButton variant="ghost" size="sm" icon-only :icon="RefreshCw" :loading="store.voucherLogsLoading" aria-label="Muat ulang" @click="reload()" />
          </div>
        </div>
      </template>

      <template #cell-voucher="{ row }">
        <p class="font-mono text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{{ row.voucher?.code ?? '—' }}</p>
        <p class="max-w-[240px] truncate text-xs text-zinc-500 dark:text-zinc-400">{{ row.voucher?.name ?? '' }}</p>
      </template>
      <template #cell-school="{ row }">
        <p class="font-medium text-zinc-900 dark:text-zinc-100">{{ row.school_name || 'Sekolah tidak diketahui' }}</p>
        <p v-if="!row.school_name" class="font-mono text-xs text-zinc-500 dark:text-zinc-400">{{ row.school_id }}</p>
      </template>
      <template #cell-subscription_id="{ row }">
        <span class="font-mono text-xs text-zinc-500 dark:text-zinc-400">{{ row.subscription_id.slice(0, 8) }}…</span>
      </template>
      <template #cell-claimed_at="{ row }">
        <span class="text-[13px] whitespace-nowrap tabular-nums">{{ formatDateTime(row.claimed_at) }}</span>
      </template>

      <template #mobile="{ row }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-medium text-zinc-900 dark:text-zinc-100">{{ row.school_name || row.school_id }}</p>
            <p class="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">{{ row.voucher?.code ?? '—' }}</p>
          </div>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ formatDateTime(row.claimed_at) }}</span>
        </div>
      </template>

      <template #empty>
        <EmptyState v-if="store.voucherLogsError" :icon="ServerCrash" tone="danger" title="Gagal memuat data" :description="store.voucherLogsError">
          <BaseButton variant="secondary" :icon="RefreshCw" @click="reload()">Coba lagi</BaseButton>
        </EmptyState>
        <EmptyState v-else :icon="History" title="Belum ada klaim" description="Riwayat klaim voucher oleh sekolah akan tampil di sini." />
      </template>

      <template #footer>
        <TablePagination
          v-if="store.voucherLogsMeta.total > 0"
          :meta="store.voucherLogsMeta"
          :disabled="store.voucherLogsLoading"
          :limit-options="[20, 50, 100]"
          @update:page="(p) => store.fetchVoucherLogs(p)"
          @update:limit="(l) => store.fetchVoucherLogs(1, l)"
        />
      </template>
    </DataTable>

    <VoucherFormModal :open="formOpen" @close="formOpen = false" @saved="onSaved" />
  </div>
</template>
