<script setup lang="ts">
import { useRoute } from 'vue-router'
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-vue-next'
import BrandMark from './BrandMark.vue'
import { NAV_GROUPS, type NavItem } from '@/config/navigation'
import { useSidebar } from '@/composables/useSidebar'
import { useLogout } from '@/composables/useLogout'

const props = defineProps<{ mobile?: boolean }>()

const route = useRoute()
const { collapsed, toggleCollapsed, closeMobile } = useSidebar()
const logout = useLogout()

const isCollapsed = () => !props.mobile && collapsed.value
const isActive = (item: NavItem) => route.name === item.name

const onNavigate = () => {
  if (props.mobile) closeMobile()
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Brand -->
    <div class="flex h-16 shrink-0 items-center gap-2 px-4" :class="isCollapsed() ? 'justify-center' : 'justify-between'">
      <RouterLink
        v-if="!isCollapsed()"
        :to="{ name: 'dashboard' }"
        class="min-w-0 rounded-lg"
        aria-label="Pelita Sekolah — ke dasbor"
        @click="onNavigate"
      >
        <BrandMark />
      </RouterLink>
      <button
        v-if="!mobile"
        type="button"
        class="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        :aria-label="collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'"
        :aria-expanded="!collapsed"
        @click="toggleCollapsed"
      >
        <PanelLeftOpen v-if="collapsed" :size="18" aria-hidden="true" />
        <PanelLeftClose v-else :size="18" aria-hidden="true" />
      </button>
      <button
        v-else
        type="button"
        class="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label="Tutup menu"
        @click="closeMobile"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="scrollbar-thin flex-1 overflow-y-auto px-3 pt-2 pb-4" aria-label="Navigasi utama">
      <div v-for="group in NAV_GROUPS" :key="group.label" class="mb-5 last:mb-0">
        <p
          v-if="!isCollapsed()"
          class="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500"
        >
          {{ group.label }}
        </p>
        <div v-else class="mx-auto mb-2 h-px w-6 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.name">
            <RouterLink
              :to="{ name: item.name }"
              :title="isCollapsed() ? item.label : undefined"
              :aria-label="isCollapsed() ? item.label : undefined"
              :aria-current="isActive(item) ? 'page' : undefined"
              class="group relative flex h-9 items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150"
              :class="[
                isCollapsed() ? 'justify-center' : 'px-3',
                isActive(item)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100',
              ]"
              @click="onNavigate"
            >
              <span
                v-if="isActive(item)"
                class="absolute top-1.5 bottom-1.5 -left-3 w-1 rounded-r-full bg-brand-600 dark:bg-brand-400"
                aria-hidden="true"
              />
              <component
                :is="item.icon"
                :size="18"
                aria-hidden="true"
                class="shrink-0"
                :class="isActive(item) ? 'text-brand-600 dark:text-brand-300' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'"
              />
              <span v-if="!isCollapsed()" class="truncate">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Footer -->
    <div class="shrink-0 border-t border-zinc-100 p-3 dark:border-zinc-800">
      <button
        type="button"
        class="flex h-9 w-full items-center gap-3 rounded-lg text-sm font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
        :class="isCollapsed() ? 'justify-center' : 'px-3'"
        :title="isCollapsed() ? 'Keluar' : undefined"
        :aria-label="isCollapsed() ? 'Keluar' : undefined"
        @click="logout"
      >
        <LogOut :size="18" aria-hidden="true" class="shrink-0" />
        <span v-if="!isCollapsed()">Keluar</span>
      </button>
    </div>
  </div>
</template>
