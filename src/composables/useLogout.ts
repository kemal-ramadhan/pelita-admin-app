import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { confirm } from './useConfirm'
import { toast } from './useToast'

export function useLogout() {
  const router = useRouter()
  const auth = useAuthStore()

  return async () => {
    const ok = await confirm({
      title: 'Keluar dari aplikasi?',
      description: 'Semua sesi Anda akan diakhiri. Anda perlu masuk kembali untuk mengakses dasbor.',
      confirmText: 'Ya, keluar',
      tone: 'danger',
      onConfirm: () => auth.logout(),
    })
    if (!ok) return
    await router.replace({ name: 'login' })
    toast.success('Anda telah keluar.')
  }
}
