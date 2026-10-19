<script setup lang="ts">
import type { Component } from 'vue'
import { Monitor, Moon, ShieldCheck, Sun } from 'lucide-vue-next'
import BrandMark from '@/components/layout/BrandMark.vue'
import { useTheme } from '@/composables/useTheme'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    heroTitle?: string
    heroText?: string
    heroIcon?: Component
  }>(),
  {
    heroTitle: 'Pusat kendali platform sekolah',
    heroText: 'Kelola tenant sekolah, akun institusi, dan pantau kesehatan platform dari satu dasbor yang aman.',
    heroIcon: () => ShieldCheck,
  },
)

const { mode, cycleMode } = useTheme()
const year = new Date().getFullYear()
</script>

<template>
  <div class="flex min-h-dvh w-full bg-white dark:bg-zinc-950">
    <!-- Form column -->
    <div class="flex w-full flex-col px-5 py-6 sm:px-10 lg:w-[46%] lg:px-14 xl:px-20">
      <div class="flex items-center justify-between">
        <BrandMark />
        <button
          type="button"
          class="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          :aria-label="`Ganti tema (saat ini: ${mode === 'system' ? 'sistem' : mode === 'dark' ? 'gelap' : 'terang'})`"
          @click="cycleMode"
        >
          <Sun v-if="mode === 'light'" :size="18" aria-hidden="true" />
          <Moon v-else-if="mode === 'dark'" :size="18" aria-hidden="true" />
          <Monitor v-else :size="18" aria-hidden="true" />
        </button>
      </div>

      <main class="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
        <div class="mb-8">
          <h1 class="text-[28px] leading-tight font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{{ title }}</h1>
          <p v-if="subtitle || $slots.subtitle" class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            <slot name="subtitle">{{ subtitle }}</slot>
          </p>
        </div>
        <slot />
      </main>

      <footer class="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500">
        <p>&copy; {{ year }} Pelita Sekolah</p>
        <p>Khusus admin platform</p>
      </footer>
    </div>

    <!-- Visual column -->
    <aside class="relative hidden flex-1 p-3 lg:block" aria-hidden="true">
      <div
        class="relative flex h-full flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-950 p-12 text-white"
      >
        <!-- Decorative grid + glow -->
        <div
          class="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        />
        <div class="absolute -top-24 -right-24 size-96 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div class="absolute bottom-1/3 -left-20 size-72 rounded-full bg-indigo-400/25 blur-3xl" />

        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]">
          <div class="grid size-44 place-items-center rounded-[2.5rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
            <component :is="heroIcon" :size="72" :stroke-width="1.25" class="text-white/90" />
          </div>
          <div class="absolute -top-6 -left-36 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 shadow-xl backdrop-blur-md">
            <p class="text-[11px] font-medium tracking-wide text-white/70 uppercase">Tenant aktif</p>
            <p class="text-lg font-semibold">Terkelola</p>
          </div>
          <div class="absolute -right-32 -bottom-4 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 shadow-xl backdrop-blur-md">
            <p class="text-[11px] font-medium tracking-wide text-white/70 uppercase">Akses</p>
            <p class="text-lg font-semibold">Berbasis peran</p>
          </div>
        </div>

        <div class="relative max-w-md">
          <h2 class="text-3xl leading-tight font-semibold tracking-tight">{{ heroTitle }}</h2>
          <p class="mt-3 text-sm leading-relaxed text-white/80">{{ heroText }}</p>
        </div>
      </div>
    </aside>
  </div>
</template>
