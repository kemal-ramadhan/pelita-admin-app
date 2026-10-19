import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  tone?: 'danger' | 'primary'
  /**
   * Optional async action. The dialog stays open with a loading button until it settles.
   * Resolves `true` on success, `false` if it throws (the action should surface its own toast).
   */
  onConfirm?: () => Promise<unknown>
}

interface ConfirmState {
  open: boolean
  loading: boolean
  options: ConfirmOptions
  resolve: ((v: boolean) => void) | null
}

export const confirmState = reactive<ConfirmState>({
  open: false,
  loading: false,
  options: { title: '' },
  resolve: null,
})

function settle(value: boolean) {
  confirmState.resolve?.(value)
  confirmState.resolve = null
  confirmState.open = false
  confirmState.loading = false
}

export async function acceptConfirm() {
  const action = confirmState.options.onConfirm
  if (!action) return settle(true)
  confirmState.loading = true
  try {
    await action()
    settle(true)
  } catch {
    settle(false)
  }
}

export function cancelConfirm() {
  if (confirmState.loading) return
  settle(false)
}

/** Opens the global ConfirmDialog. Resolves `true` when confirmed. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (confirmState.resolve) settle(false)
  confirmState.options = options
  confirmState.open = true
  return new Promise<boolean>((resolve) => {
    confirmState.resolve = resolve
  })
}

export function useConfirm() {
  return confirm
}
