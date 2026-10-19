import { computed, ref, watchEffect } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch {
    return 'system'
  }
}

// Global (singleton) state shared by every caller.
const mode = ref<ThemeMode>(readMode())
const systemDark = ref(media?.matches ?? false)
const isDark = computed(() => mode.value === 'dark' || (mode.value === 'system' && systemDark.value))

let initialized = false

export function useTheme() {
  const initTheme = () => {
    if (initialized) return
    initialized = true
    media?.addEventListener('change', (e) => {
      systemDark.value = e.matches
    })
    watchEffect(() => {
      document.documentElement.classList.toggle('dark', isDark.value)
      try {
        localStorage.setItem(STORAGE_KEY, mode.value)
      } catch {
        /* storage unavailable */
      }
    })
  }

  const setMode = (m: ThemeMode) => {
    mode.value = m
  }

  /** Cycles light → dark → system. */
  const cycleMode = () => {
    mode.value = mode.value === 'light' ? 'dark' : mode.value === 'dark' ? 'system' : 'light'
  }

  const toggleDarkMode = () => {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return { mode, isDark, initTheme, setMode, cycleMode, toggleDarkMode }
}
