<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { CornerDownLeft, LogOut, Monitor, Moon, Plus, Search, Sun } from 'lucide-vue-next'
import { NAV_ITEMS } from '@/config/navigation'
import { useSidebar } from '@/composables/useSidebar'
import { useTheme } from '@/composables/useTheme'
import { useLogout } from '@/composables/useLogout'
import { useOverlay } from '@/composables/useOverlay'

interface Command {
  id: string
  label: string
  hint?: string
  group: 'Navigasi' | 'Aksi'
  icon: Component
  keywords?: string[]
  run: () => void
}

const router = useRouter()
const { paletteOpen } = useSidebar()
const { setMode } = useTheme()
const logout = useLogout()

const query = ref('')
const active = ref(0)
const panel = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)

const close = () => (paletteOpen.value = false)
useOverlay(paletteOpen, panel, close)

const commands = computed<Command[]>(() => [
  ...NAV_ITEMS.map<Command>((n) => ({
    id: `nav-${n.name}`,
    label: n.label,
    hint: n.description,
    group: 'Navigasi',
    icon: n.icon,
    keywords: n.keywords,
    run: () => void router.push({ name: n.name }),
  })),
  {
    id: 'new-school',
    label: 'Tambah sekolah baru',
    group: 'Aksi',
    icon: Plus,
    keywords: ['buat', 'create', 'sekolah'],
    run: () => void router.push({ name: 'schools', query: { new: '1' } }),
  },
  { id: 'theme-light', label: 'Tema terang', group: 'Aksi', icon: Sun, keywords: ['light', 'mode'], run: () => setMode('light') },
  { id: 'theme-dark', label: 'Tema gelap', group: 'Aksi', icon: Moon, keywords: ['dark', 'mode'], run: () => setMode('dark') },
  {
    id: 'theme-system',
    label: 'Tema ikuti sistem',
    group: 'Aksi',
    icon: Monitor,
    keywords: ['system', 'auto'],
    run: () => setMode('system'),
  },
  { id: 'logout', label: 'Keluar', group: 'Aksi', icon: LogOut, keywords: ['logout', 'sign out'], run: () => void logout() },
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return commands.value
  return commands.value.filter((c) =>
    [c.label, c.hint ?? '', ...(c.keywords ?? [])].some((s) => s.toLowerCase().includes(q)),
  )
})

const groups = computed(() => {
  const out: { name: string; items: { cmd: Command; index: number }[] }[] = []
  filtered.value.forEach((cmd, index) => {
    let g = out.find((x) => x.name === cmd.group)
    if (!g) out.push((g = { name: cmd.group, items: [] }))
    g.items.push({ cmd, index })
  })
  return out
})

watch(query, () => (active.value = 0))
watch(paletteOpen, (v) => {
  if (v) {
    query.value = ''
    active.value = 0
  }
})

const runAt = (i: number) => {
  const cmd = filtered.value[i]
  if (!cmd) return
  close()
  // Let the palette close (and restore focus) before running, so dialogs opened by the command get focus.
  void nextTick(() => cmd.run())
}

const scrollActive = () =>
  nextTick(() => list.value?.querySelector<HTMLElement>(`[data-index="${active.value}"]`)?.scrollIntoView({ block: 'nearest' }))

const onKeydown = (e: KeyboardEvent) => {
  const n = filtered.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (n) active.value = (active.value + 1) % n
    void scrollActive()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (n) active.value = (active.value - 1 + n) % n
    void scrollActive()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    runAt(active.value)
  }
}

const onGlobalKey = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div v-if="paletteOpen" class="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] dark:bg-black/60" aria-hidden="true" @click="close" />
    </Transition>
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-[0.98] -translate-y-1"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 scale-[0.98]"
    >
      <div v-if="paletteOpen" class="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          aria-label="Palet perintah"
          class="pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-(--shadow-pop) dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div class="flex items-center gap-3 border-b border-zinc-100 px-4 dark:border-zinc-800">
            <Search :size="18" class="shrink-0 text-zinc-400" aria-hidden="true" />
            <input
              v-model="query"
              data-autofocus
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="cmdk-list"
              :aria-activedescendant="filtered.length ? `cmdk-${active}` : undefined"
              aria-autocomplete="list"
              placeholder="Ketik perintah atau cari halaman…"
              class="h-12 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:outline-none dark:text-zinc-100"
              @keydown="onKeydown"
            />
            <kbd class="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-400 dark:border-zinc-700">Esc</kbd>
          </div>

          <div id="cmdk-list" ref="list" role="listbox" class="scrollbar-thin max-h-80 overflow-y-auto p-2">
            <p v-if="filtered.length === 0" class="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Tidak ada hasil untuk “{{ query }}”.
            </p>
            <div v-for="g in groups" :key="g.name" class="mb-1 last:mb-0" role="group" :aria-label="g.name">
              <p class="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">{{ g.name }}</p>
              <div
                v-for="{ cmd, index } in g.items"
                :id="`cmdk-${index}`"
                :key="cmd.id"
                role="option"
                :aria-selected="index === active"
                :data-index="index"
                class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                :class="
                  index === active
                    ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-100'
                    : 'text-zinc-700 dark:text-zinc-300'
                "
                @mousemove="active = index"
                @click="runAt(index)"
              >
                <component :is="cmd.icon" :size="16" aria-hidden="true" class="shrink-0 opacity-70" />
                <span class="flex-1 truncate">{{ cmd.label }}</span>
                <span v-if="cmd.hint" class="hidden truncate text-xs text-zinc-400 sm:block">{{ cmd.hint }}</span>
                <CornerDownLeft v-if="index === active" :size="14" aria-hidden="true" class="shrink-0 opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
