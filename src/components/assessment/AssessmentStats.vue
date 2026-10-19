<script setup lang="ts">
import { onMounted } from 'vue'
import { BrainCircuit, ClipboardCheck, Package, RefreshCw, ServerCrash, Ticket, WalletCards } from 'lucide-vue-next'
import StatCard from '@/components/ui/StatCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAssessmentAdminStore } from '@/stores/assessmentAdmin'
import { formatNumber } from '@/utils/assessment'

/** Ringkasan `GET /assessment/admin/stats` (API_CONTRACT §13.3). */
const store = useAssessmentAdminStore()
onMounted(() => void store.fetchStats())

defineExpose({ reload: () => store.fetchStats() })
</script>

<template>
  <div v-if="store.statsError && !store.statsLoading" class="card mb-6">
    <EmptyState :icon="ServerCrash" tone="danger" title="Statistik asesmen tidak dapat dimuat" :description="store.statsError">
      <BaseButton variant="secondary" :icon="RefreshCw" @click="store.fetchStats()">Coba lagi</BaseButton>
    </EmptyState>
  </div>
  <section v-else aria-label="Statistik asesmen" class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
    <StatCard
      label="Paket aktif"
      :value="store.stats?.active_packages"
      :icon="Package"
      tone="brand"
      :loading="store.statsLoading && !store.stats"
      :hint="store.stats ? `dari ${formatNumber(store.stats.total_packages)} paket` : ''"
    />
    <StatCard
      label="Voucher aktif"
      :value="store.stats?.active_vouchers"
      :icon="Ticket"
      tone="info"
      :loading="store.statsLoading && !store.stats"
      :hint="store.stats ? `${formatNumber(store.stats.total_claims)} klaim · ${formatNumber(store.stats.total_vouchers)} voucher` : ''"
    />
    <StatCard
      label="Langganan sekolah"
      :value="store.stats?.total_subscriptions"
      :icon="WalletCards"
      :tone="store.stats?.pending_subscriptions ? 'danger' : 'success'"
      :loading="store.statsLoading && !store.stats"
      :hint="store.stats ? `${formatNumber(store.stats.pending_subscriptions)} menunggu persetujuan` : ''"
    />
    <StatCard
      label="Hasil asesmen"
      :value="store.stats?.completed_results"
      :icon="ClipboardCheck"
      tone="success"
      :loading="store.statsLoading && !store.stats"
      :hint="store.stats ? `${formatNumber(store.stats.total_attempts)} pengerjaan` : ''"
    />
    <StatCard
      label="Butir bank soal"
      :value="store.stats?.total_questions"
      :icon="BrainCircuit"
      tone="brand"
      :loading="store.statsLoading && !store.stats"
      hint="TMB · RIA · PMK · ADN"
    />
  </section>
</template>
