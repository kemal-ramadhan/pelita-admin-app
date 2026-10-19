import type { PiniaPluginContext, Store } from 'pinia'

/** Tracks every store instance so logout can reset all of them. */
const stores = new Set<Store>()

export function storeRegistryPlugin({ store }: PiniaPluginContext) {
  stores.add(store)
}

/** localStorage keys owned by this app's session (persisted state + legacy keys). */
export const SESSION_STORAGE_KEYS = ['admin-auth', 'auth', 'token', 'adminSchool']

export function resetAllStores() {
  stores.forEach((s) => s.$reset())
  try {
    SESSION_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
