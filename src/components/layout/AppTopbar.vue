<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, ChevronRight, LogOut, Menu, Monitor, Moon, Search, Sun, UserRound } from 'lucide-vue-next'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useSidebar } from '@/composables/useSidebar'
import { useLogout } from '@/composables/useLogout'

const route = useRoute()
const auth = useAuthStore()
const { mode, cycleMode } = useTheme()
const { openMobile, paletteOpen } = useSidebar()
const logout = useLogout()

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const crumb = computed(() => route.meta.breadcrumb ?? '')

const themeLabel = computed(
  () =>
    ({
      light: 'Tema: Terang (klik untuk Gelap)',
      dark: 'Tema: Gelap (klik untuk ikuti sistem)',
      system: 'Tema: Ikuti sistem (klik untuk Terang)',
    })[mode.value],
)

// Profile menu
const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)
const onDocClick = (e: MouseEvent) => {
  if (menuOpen.value && menuRoot.value && !menuRoot.value.contains(e.target as Node)) menuOpen.value = false
}
const onMenuKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false
    menuRoot.value?.querySelector<HTMLElement>('[data-menu-trigger]')?.focus()
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const doLogout = () => {
  menuOpen.value = false
  void logout()
}

const iconBtn =
  'grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200/70 bg-white/80 px-4 backdrop-blur-md sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/75"
  >
    <button type="button" :class="iconBtn" class="lg:hidden" aria-label="Buka menu navigasi" @click="openMobile">
      <Menu :size="20" aria-hidden="true" />
    </button>

    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="min-w-0 flex-1">
      <ol class="flex items-center gap-1.5 text-sm">
        <li class="hidden sm:block">
          <RouterLink
            :to="{ name: 'dashboard' }"
            class="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Admin
          </RouterLink>
        </li>
        <li class="hidden sm:block" aria-hidden="true"><ChevronRight :size="14" class="text-zinc-300 dark:text-zinc-600" /></li>
        <li class="truncate font-medium text-zinc-900 dark:text-zinc-100" aria-current="page">{{ crumb }}</li>
      </ol>
    </nav>

    <!-- Search / command palette trigger -->
    <button
      type="button"
      class="hidden h-9 w-64 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white md:flex dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700"
      aria-label="Buka pencarian perintah"
      @click="paletteOpen = true"
    >
      <Search :size="15" aria-hidden="true" />
      <span class="flex-1 text-left">Cari menu atau aksi…</span>
      <kbd
        class="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
      >
        {{ isMac ? '⌘' : 'Ctrl' }} K
      </kbd>
    </button>
    <button type="button" :class="iconBtn" class="md:hidden" aria-label="Cari" @click="paletteOpen = true">
      <Search :size="18" aria-hidden="true" />
    </button>

    <button type="button" :class="iconBtn" :aria-label="themeLabel" :title="themeLabel" @click="cycleMode">
      <Sun v-if="mode === 'light'" :size="18" aria-hidden="true" />
      <Moon v-else-if="mode === 'dark'" :size="18" aria-hidden="true" />
      <Monitor v-else :size="18" aria-hidden="true" />
    </button>

    <!-- Profile menu -->
    <div ref="menuRoot" class="relative" @keydown="onMenuKey">
      <button
        type="button"
        data-menu-trigger
        class="flex items-center gap-2.5 rounded-lg py-1 pr-1.5 pl-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        aria-label="Menu akun"
        @click.stop="menuOpen = !menuOpen"
      >
        <BaseAvatar :name="auth.displayName" :src="auth.user?.photo_profile" :size="32" />
        <span class="hidden text-left leading-tight sm:block">
          <span class="block max-w-[140px] truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
            {{ auth.displayName }}
          </span>
          <span class="block text-[11px] text-zinc-500 dark:text-zinc-400">{{ auth.roleLabel }}</span>
        </span>
        <ChevronDown
          :size="14"
          class="hidden text-zinc-400 transition-transform duration-150 sm:block"
          :class="menuOpen && 'rotate-180'"
          aria-hidden="true"
        />
      </button>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="menuOpen"
          role="menu"
          class="absolute top-full right-0 z-40 mt-2 w-60 origin-top-right rounded-xl border border-zinc-200 bg-white p-1.5 shadow-(--shadow-pop) dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div class="px-2.5 py-2">
            <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ auth.displayName }}</p>
            <p class="truncate text-xs text-zinc-500 dark:text-zinc-400">{{ auth.user?.email }}</p>
          </div>
          <div class="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          <RouterLink
            :to="{ name: 'profile' }"
            role="menuitem"
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            @click="menuOpen = false"
          >
            <UserRound :size="16" class="text-zinc-400" aria-hidden="true" /> Profil saya
          </RouterLink>
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            @click="doLogout"
          >
            <LogOut :size="16" aria-hidden="true" /> Keluar
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>
