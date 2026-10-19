<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import CommandPalette from '@/components/layout/CommandPalette.vue'
import { useSidebar } from '@/composables/useSidebar'
import { useOverlay } from '@/composables/useOverlay'

const route = useRoute()
const { collapsed, mobileOpen, closeMobile } = useSidebar()

const drawer = ref<HTMLElement | null>(null)
useOverlay(mobileOpen, drawer, closeMobile)

watch(
  () => route.fullPath,
  () => closeMobile(),
)
</script>

<template>
  <div class="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
    <a
      href="#main"
      class="sr-only z-[70] rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Lewati ke konten
    </a>

    <!-- Desktop sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden border-r border-zinc-200/80 bg-white transition-[width] duration-200 ease-out lg:block dark:border-zinc-800 dark:bg-zinc-900"
      :class="collapsed ? 'w-[72px]' : 'w-64'"
      aria-label="Sidebar"
    >
      <AppSidebar />
    </aside>

    <!-- Mobile drawer -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div v-if="mobileOpen" class="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] lg:hidden" aria-hidden="true" @click="closeMobile" />
      </Transition>
      <Transition
        enter-active-class="transition-transform duration-200 ease-out"
        enter-from-class="-translate-x-full"
        leave-active-class="transition-transform duration-150 ease-in"
        leave-to-class="-translate-x-full"
      >
        <div
          v-if="mobileOpen"
          ref="drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          tabindex="-1"
          class="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-zinc-200 bg-white shadow-(--shadow-pop) outline-none lg:hidden dark:border-zinc-800 dark:bg-zinc-900"
        >
          <AppSidebar mobile />
        </div>
      </Transition>
    </Teleport>

    <div class="flex min-h-dvh flex-col transition-[padding] duration-200 ease-out" :class="collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'">
      <AppTopbar />
      <main id="main" class="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8" tabindex="-1">
        <div class="mx-auto w-full max-w-7xl">
          <RouterView v-slot="{ Component }">
            <Transition
              mode="out-in"
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              leave-active-class="transition duration-100 ease-in"
              leave-to-class="opacity-0"
            >
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>

    <CommandPalette />
  </div>
</template>
