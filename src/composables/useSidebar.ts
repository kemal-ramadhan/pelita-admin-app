import { ref, watch } from 'vue'

const KEY = 'sidebar-collapsed'

function read() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const collapsed = ref(read())
const mobileOpen = ref(false)
const paletteOpen = ref(false)

watch(collapsed, (v) => {
  try {
    localStorage.setItem(KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
})

export function useSidebar() {
  return {
    collapsed,
    mobileOpen,
    paletteOpen,
    toggleCollapsed: () => (collapsed.value = !collapsed.value),
    openMobile: () => (mobileOpen.value = true),
    closeMobile: () => (mobileOpen.value = false),
  }
}
