import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

let lockCount = 0
/** Stack of open overlays — only the topmost one handles keyboard events. */
const stack: symbol[] = []
let previousOverflow = ''

function lockScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount++
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) document.body.style.overflow = previousOverflow
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Overlay behaviour for modals / drawers / palettes:
 * scroll lock, focus trap (Tab / Shift+Tab), Escape to close, focus restore.
 */
export function useOverlay(
  open: Ref<boolean>,
  container: Ref<HTMLElement | null>,
  onClose: () => void,
  opts: { closeOnEsc?: () => boolean } = {},
) {
  let restoreTo: HTMLElement | null = null
  let locked = false
  const token = Symbol('overlay')

  const onKeydown = (e: KeyboardEvent) => {
    if (!open.value || !container.value || stack[stack.length - 1] !== token) return
    if (e.key === 'Escape') {
      if (opts.closeOnEsc && !opts.closeOnEsc()) return
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const nodes = Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
    if (nodes.length === 0) {
      e.preventDefault()
      container.value.focus()
      return
    }
    const firstEl = nodes[0]!
    const lastEl = nodes[nodes.length - 1]!
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault()
      lastEl.focus()
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault()
      firstEl.focus()
    } else if (!container.value.contains(document.activeElement)) {
      e.preventDefault()
      firstEl.focus()
    }
  }

  const activate = async () => {
    restoreTo = document.activeElement as HTMLElement | null
    if (!locked) {
      lockScroll()
      locked = true
    }
    if (!stack.includes(token)) stack.push(token)
    document.addEventListener('keydown', onKeydown, true)
    await nextTick()
    const el = container.value
    if (!el) return
    const auto = el.querySelector<HTMLElement>('[autofocus], [data-autofocus]')
    const target = auto ?? el.querySelector<HTMLElement>(FOCUSABLE) ?? el
    target.focus({ preventScroll: true })
  }

  const deactivate = () => {
    document.removeEventListener('keydown', onKeydown, true)
    const idx = stack.indexOf(token)
    if (idx >= 0) stack.splice(idx, 1)
    if (locked) {
      unlockScroll()
      locked = false
    }
    if (restoreTo && document.contains(restoreTo)) restoreTo.focus({ preventScroll: true })
    restoreTo = null
  }

  watch(
    open,
    (v) => {
      if (v) void activate()
      else deactivate()
    },
    { immediate: true },
  )

  onBeforeUnmount(deactivate)
}
