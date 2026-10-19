<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, CircleCheck, CircleOff, GraduationCap, Plus, RefreshCw, School as SchoolIcon, ServerCrash } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useAdminSchoolStore } from '@/stores/adminSchool'
import { getErrorMessage } from '@/utils/errors'
import type { School } from '@/types/school'

const auth = useAuthStore()
const store = useAdminSchoolStore()

const recent = ref<School[]>([])
const recentLoading = ref(false)
const recentError = ref('')

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
})

const activePct = computed(() => {
  const s = store.stats
  if (!s || !s.total_schools) return 0
  return Math.round((s.active_schools / s.total_schools) * 100)
})

const loadRecent = async () => {
  recentLoading.value = true
  recentError.value = ''
  try {
    recent.value = (await store.fetchPreview(5)).items
  } catch (err) {
    recentError.value = getErrorMessage(err, 'Gagal memuat daftar sekolah.')
  } finally {
    recentLoading.value = false
  }
}

const reload = () => Promise.all([store.fetchStats(), loadRecent()])
onMounted(reload)
</script>

<template>
  <div>
    <PageHeader :title="`${greeting}, ${auth.displayName.split(' ')[0]}`" description="Ringkasan kondisi platform Pelita Sekolah hari ini.">
      <template #actions>
        <BaseButton
          variant="secondary"
          :icon="RefreshCw"
          :loading="store.statsLoading || recentLoading"
          aria-label="Muat ulang data"
          @click="reload"
        >
          Muat ulang
        </BaseButton>
        <RouterLink :to="{ name: 'schools', query: { new: '1' } }" custom v-slot="{ navigate }">
          <BaseButton :icon="Plus" @click="navigate">Tambah sekolah</BaseButton>
        </RouterLink>
      </template>
    </PageHeader>

    <!-- Stats -->
    <div v-if="store.statsError && !store.statsLoading" class="card mb-6">
      <EmptyState :icon="ServerCrash" tone="danger" title="Statistik tidak dapat dimuat" :description="store.statsError">
        <BaseButton variant="secondary" :icon="RefreshCw" @click="store.fetchStats()">Coba lagi</BaseButton>
      </EmptyState>
    </div>
    <section v-else aria-label="Statistik platform" class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total sekolah"
        :value="store.stats?.total_schools"
        :icon="SchoolIcon"
        tone="brand"
        :loading="store.statsLoading && !store.stats"
        hint="Seluruh tenant terdaftar"
      />
      <StatCard
        label="Sekolah aktif"
        :value="store.stats?.active_schools"
        :icon="CircleCheck"
        tone="success"
        :loading="store.statsLoading && !store.stats"
        :hint="store.stats ? `${activePct}% dari total` : ''"
      />
      <StatCard
        label="Sekolah nonaktif"
        :value="store.stats?.inactive_schools"
        :icon="CircleOff"
        tone="danger"
        :loading="store.statsLoading && !store.stats"
        hint="Ditangguhkan / belum aktif"
      />
      <StatCard
        label="Total guru"
        :value="store.stats?.total_teachers"
        :icon="GraduationCap"
        tone="info"
        :loading="store.statsLoading && !store.stats"
        hint="Di semua sekolah"
      />
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Recent schools -->
      <section class="card overflow-hidden lg:col-span-2" aria-labelledby="recent-title">
        <header class="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 id="recent-title" class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sekolah terdaftar</h2>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">Beberapa tenant di platform</p>
          </div>
          <RouterLink
            :to="{ name: 'schools' }"
            class="inline-flex items-center gap-1 rounded-md text-[13px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
          >
            Lihat semua <ArrowRight :size="14" aria-hidden="true" />
          </RouterLink>
        </header>

        <ul v-if="recentLoading && recent.length === 0" class="divide-y divide-zinc-100 dark:divide-zinc-800" aria-busy="true">
          <li v-for="i in 5" :key="i" class="flex items-center gap-3 px-5 py-3.5">
            <div class="skeleton size-9 rounded-xl" />
            <div class="flex-1 space-y-1.5">
              <div class="skeleton h-3.5 w-1/2" />
              <div class="skeleton h-3 w-1/4" />
            </div>
          </li>
        </ul>
        <EmptyState v-else-if="recentError" :icon="ServerCrash" tone="danger" title="Gagal memuat" :description="recentError">
          <BaseButton variant="secondary" size="sm" :icon="RefreshCw" @click="loadRecent">Coba lagi</BaseButton>
        </EmptyState>
        <EmptyState
          v-else-if="recent.length === 0"
          :icon="SchoolIcon"
          title="Belum ada sekolah"
          description="Daftarkan sekolah pertama untuk mulai menggunakan platform."
        >
          <RouterLink :to="{ name: 'schools', query: { new: '1' } }" custom v-slot="{ navigate }">
            <BaseButton size="sm" :icon="Plus" @click="navigate">Tambah sekolah</BaseButton>
          </RouterLink>
        </EmptyState>
        <ul v-else class="divide-y divide-zinc-100 dark:divide-zinc-800">
          <li v-for="s in recent" :key="s.id" class="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
            <div class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
              {{ s.school_level?.slice(0, 3) || '—' }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ s.name }}</p>
              <p class="truncate text-xs text-zinc-500 dark:text-zinc-400">{{ s.code }}<template v-if="s.npsn"> · NPSN {{ s.npsn }}</template></p>
            </div>
            <BaseBadge :tone="s.is_active ? 'success' : 'danger'" dot>{{ s.is_active ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
          </li>
        </ul>
      </section>

      <!-- Health -->
      <section class="card p-5" aria-labelledby="health-title">
        <h2 id="health-title" class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status tenant</h2>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">Proporsi sekolah aktif</p>

        <div v-if="store.statsLoading && !store.stats" class="mt-6 space-y-3">
          <div class="skeleton h-10 w-24" />
          <div class="skeleton h-2.5 w-full" />
        </div>
        <template v-else-if="store.stats">
          <p class="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">{{ activePct }}%</p>
          <div
            class="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            role="meter"
            :aria-valuenow="activePct"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Persentase sekolah aktif"
          >
            <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-[width] duration-500" :style="{ width: `${activePct}%` }" />
          </div>
          <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
              <dt class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span class="size-2 rounded-full bg-emerald-500" aria-hidden="true" /> Aktif
              </dt>
              <dd class="mt-1 font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{{ store.stats.active_schools }}</dd>
            </div>
            <div class="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
              <dt class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span class="size-2 rounded-full bg-red-500" aria-hidden="true" /> Nonaktif
              </dt>
              <dd class="mt-1 font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">{{ store.stats.inactive_schools }}</dd>
            </div>
          </dl>
        </template>
        <p v-else class="mt-6 text-sm text-zinc-500 dark:text-zinc-400">Data belum tersedia.</p>
      </section>
    </div>
  </div>
</template>
