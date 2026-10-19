<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCheck, CircleX, RefreshCw, SearchX, ServerCrash, WalletCards } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'
import TablePagination from '@/components/ui/TablePagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import type { DataTableColumn } from '@/types/table'
import { useAssessmentAdminStore } from '@/stores/assessmentAdmin'
import { confirm } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import { getErrorMessage } from '@/utils/errors'
import { formatDate, formatDateTime, formatNumber, formatRupiah, subscriptionStatusMeta } from '@/utils/assessment'
import { SUBSCRIPTION_STATUSES, type SchoolSubscription, type SubscriptionStatusFilter } from '@/types/assessment'

const store = useAssessmentAdminStore()
const route = useRoute()
const router = useRouter()

const columns: DataTableColumn[] = [
  { key: 'school', label: 'Sekolah' },
  { key: 'package', label: 'Paket' },
  { key: 'claim', label: 'Sumber' },
  { key: 'quota', label: 'Kuota', align: 'right' },
  { key: 'amount_due', label: 'Tagihan', align: 'right', hideBelowLg: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Aksi', align: 'right', class: 'w-px whitespace-nowrap' },
]

const statusOptions: { label: string; value: SubscriptionStatusFilter }[] = [
  { label: 'Menunggu', value: 'pending' },
  { label: 'Aktif', value: 'active' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Kedaluwarsa', value: 'expired' },
  { label: 'Habis', value: 'depleted' },
  { label: 'Semua', value: 'all' },
]

const qs = route.query.status
const status = ref<SubscriptionStatusFilter>(
  qs === 'all' || (typeof qs === 'string' && (SUBSCRIPTION_STATUSES as readonly string[]).includes(qs))
    ? (qs as SubscriptionStatusFilter)
    : 'pending',
)
const initialPage = Math.max(1, Number(route.query.page) || 1)

const syncUrl = () => {
  const { page, status: st } = store.subscriptionsQuery
  void router.replace({
    query: { ...(page > 1 ? { page: String(page) } : {}), ...(st !== 'pending' ? { status: st } : {}) },
  })
}
const load = async (patch: Parameters<typeof store.fetchSubscriptions>[0] = {}) => {
  await store.fetchSubscriptions(patch)
  syncUrl()
}
watch(status, (v) => void load({ status: v, page: 1 }))
onMounted(() => void store.fetchSubscriptions({ page: initialPage, status: status.value }))

const schoolLabel = (s: SchoolSubscription) => s.school_name || 'Sekolah tidak diketahui'
const sourceLabel = (s: SchoolSubscription) => (s.claim_type === 'voucher' ? 'Voucher' : s.claim_type === 'purchase' ? 'Pembelian' : s.claim_type)

const actingId = ref<string | null>(null)
const decide = async (s: SchoolSubscription, next: 'active' | 'rejected') => {
  const approve = next === 'active'
  const pkg = s.package?.name ?? 'paket'
  await confirm({
    title: approve ? `Setujui langganan ${schoolLabel(s)}?` : `Tolak langganan ${schoolLabel(s)}?`,
    description: approve
      ? `Langganan ${pkg} (${formatNumber(s.total_quota)} siswa) menjadi aktif dan kuota dapat langsung dipakai sekolah.` +
        (s.amount_due ? ` Pastikan pembayaran ${formatRupiah(s.amount_due)} sudah diterima.` : '')
      : `Permintaan ${pkg} ditolak dan tidak dapat dipakai sekolah.`,
    confirmText: approve ? 'Setujui' : 'Tolak',
    tone: approve ? 'primary' : 'danger',
    onConfirm: async () => {
      actingId.value = s.id
      try {
        await store.setSubscriptionStatus(s.id, next)
        toast.success(approve ? `Langganan ${schoolLabel(s)} disetujui.` : `Langganan ${schoolLabel(s)} ditolak.`)
        void store.fetchStats()
        if (store.subscriptionsQuery.status !== 'all') void load()
      } catch (err) {
        toast.error({ title: approve ? 'Gagal menyetujui' : 'Gagal menolak', description: getErrorMessage(err) })
        throw err
      } finally {
        actingId.value = null
      }
    },
  })
}
</script>

<template>
  <div>
    <PageHeader
      title="Langganan Sekolah"
      description="Pantau kuota asesmen sekolah dan setujui atau tolak pembelian paket yang menunggu konfirmasi."
    />

    <DataTable
      :columns="columns"
      :rows="store.subscriptions"
      :row-key="(r) => r.id"
      :loading="store.subscriptionsLoading"
      caption="Daftar langganan sekolah"
    >
      <template #toolbar>
        <div class="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center dark:border-zinc-800">
          <div class="scrollbar-thin -mx-1 overflow-x-auto px-1">
            <SegmentedControl v-model="status" :options="statusOptions" label="Filter status langganan" />
          </div>
          <div class="flex items-center gap-2 sm:ml-auto">
            <span class="text-[13px] text-zinc-500 tabular-nums dark:text-zinc-400" aria-live="polite">{{ store.subscriptionsMeta.total }} langganan</span>
            <BaseButton variant="ghost" size="sm" icon-only :icon="RefreshCw" :loading="store.subscriptionsLoading" aria-label="Muat ulang" @click="load()" />
          </div>
        </div>
      </template>

      <template #cell-school="{ row }">
        <p class="font-medium text-zinc-900 dark:text-zinc-100">{{ schoolLabel(row) }}</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">Diajukan {{ formatDateTime(row.created_at) }}</p>
      </template>
      <template #cell-package="{ row }">
        <p class="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{{ row.package?.name ?? '—' }}</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ row.package?.code ?? '' }}</p>
      </template>
      <template #cell-claim="{ row }">
        <BaseBadge :tone="row.claim_type === 'voucher' ? 'brand' : 'neutral'">{{ sourceLabel(row) }}</BaseBadge>
        <p v-if="row.voucher?.code" class="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">{{ row.voucher.code }}</p>
      </template>
      <template #cell-quota="{ row }">
        <span class="tabular-nums">{{ formatNumber(row.used_quota) }} / {{ formatNumber(row.total_quota) }}</span>
        <p v-if="row.expires_at" class="text-xs text-zinc-500 dark:text-zinc-400">s.d. {{ formatDate(row.expires_at) }}</p>
      </template>
      <template #cell-amount_due="{ row }">
        <span class="tabular-nums">{{ row.amount_due != null ? (row.amount_due > 0 ? formatRupiah(row.amount_due) : 'Gratis') : '—' }}</span>
      </template>
      <template #cell-status="{ row }">
        <BaseBadge :tone="subscriptionStatusMeta(row.status).tone" dot>{{ subscriptionStatusMeta(row.status).label }}</BaseBadge>
      </template>
      <template #cell-actions="{ row }">
        <div v-if="row.status === 'pending'" class="flex items-center justify-end gap-1">
          <BaseButton variant="soft" size="sm" :icon="CircleCheck" :loading="actingId === row.id" @click="decide(row, 'active')">Setujui</BaseButton>
          <BaseButton
            variant="ghost-danger"
            size="sm"
            icon-only
            :icon="CircleX"
            :disabled="actingId === row.id"
            :aria-label="`Tolak langganan ${schoolLabel(row)}`"
            title="Tolak"
            @click="decide(row, 'rejected')"
          />
        </div>
        <span v-else class="text-xs text-zinc-400">—</span>
      </template>

      <template #mobile="{ row }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-medium text-zinc-900 dark:text-zinc-100">{{ schoolLabel(row) }}</p>
            <p class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {{ row.package?.name ?? '—' }} · {{ sourceLabel(row) }} · {{ formatNumber(row.used_quota) }}/{{ formatNumber(row.total_quota) }} siswa
            </p>
            <p v-if="row.amount_due" class="mt-1 text-sm font-medium tabular-nums">{{ formatRupiah(row.amount_due) }}</p>
          </div>
          <BaseBadge :tone="subscriptionStatusMeta(row.status).tone" dot>{{ subscriptionStatusMeta(row.status).label }}</BaseBadge>
        </div>
        <div v-if="row.status === 'pending'" class="mt-3 flex gap-2">
          <BaseButton variant="soft" size="sm" :icon="CircleCheck" :loading="actingId === row.id" @click="decide(row, 'active')">Setujui</BaseButton>
          <BaseButton variant="ghost-danger" size="sm" :icon="CircleX" :disabled="actingId === row.id" class="ml-auto" @click="decide(row, 'rejected')">
            Tolak
          </BaseButton>
        </div>
      </template>

      <template #empty>
        <EmptyState v-if="store.subscriptionsError" :icon="ServerCrash" tone="danger" title="Gagal memuat data" :description="store.subscriptionsError">
          <BaseButton variant="secondary" :icon="RefreshCw" @click="load()">Coba lagi</BaseButton>
        </EmptyState>
        <EmptyState
          v-else-if="status === 'pending'"
          :icon="CircleCheck"
          title="Tidak ada yang menunggu"
          description="Semua pembelian paket sudah diproses."
        >
          <BaseButton variant="secondary" @click="status = 'all'">Lihat semua langganan</BaseButton>
        </EmptyState>
        <EmptyState v-else-if="status !== 'all'" :icon="SearchX" title="Tidak ada hasil" description="Tidak ada langganan dengan status ini.">
          <BaseButton variant="secondary" @click="status = 'all'">Tampilkan semua</BaseButton>
        </EmptyState>
        <EmptyState v-else :icon="WalletCards" title="Belum ada langganan" description="Langganan muncul saat sekolah membeli paket atau mengklaim voucher." />
      </template>

      <template #footer>
        <div
          v-if="store.subscriptionsError && store.subscriptions.length > 0"
          class="border-t border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          {{ store.subscriptionsError }}
        </div>
        <TablePagination
          v-if="store.subscriptionsMeta.total > 0"
          :meta="store.subscriptionsMeta"
          :disabled="store.subscriptionsLoading"
          :limit-options="[20, 50, 100]"
          @update:page="(p) => load({ page: p })"
          @update:limit="(l) => load({ limit: l, page: 1 })"
        />
      </template>
    </DataTable>
  </div>
</template>
