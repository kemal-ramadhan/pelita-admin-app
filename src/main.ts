import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router/index.ts'
import App from './App.vue'
import './style.css'

import { registerAuthBridge } from '@/utils/api'
import { storeRegistryPlugin } from '@/stores/registry'
import { useAuthStore } from '@/stores/auth'

// Drop legacy keys from older builds (duplicate `token`, persisted user with base64 images).
try {
  localStorage.removeItem('token')
  localStorage.removeItem('auth')
} catch {
  /* ignore */
}

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
pinia.use(storeRegistryPlugin)

app.use(pinia)

const auth = useAuthStore(pinia)
registerAuthBridge({
  getAccessToken: () => auth.accessToken,
  getRefreshToken: () => auth.refreshToken,
  setTokens: (t) => auth.setTokens(t),
  onAuthFailure: () => {
    if (!auth.accessToken && !auth.user) return
    auth.clearSession()
    const current = router.currentRoute.value
    if (current.meta.requiresAuth) {
      void router.replace({ name: 'login', query: { redirect: current.fullPath, reason: 'expired' } })
    }
  },
})

app.use(router)
app.mount('#app')
