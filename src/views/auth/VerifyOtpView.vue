<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, MailCheck } from 'lucide-vue-next'
import AuthSplitLayout from '@/layouts/AuthSplitLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import OtpInput from '@/components/ui/OtpInput.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import { AccessDeniedError, useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/errors'
import { safeRedirect } from '@/utils/redirect'
import { toast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const otp = ref('')
const loading = ref(false)
const resending = ref(false)
const error = ref('')
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const startCooldown = (s = 60) => {
  cooldown.value = s
  clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value = Math.max(0, cooldown.value - 1)
    if (cooldown.value === 0) clearInterval(timer)
  }, 1000)
}

onMounted(() => {
  if (!email.value) void router.replace({ name: 'login' })
  else startCooldown(30)
})
onBeforeUnmount(() => clearInterval(timer))

const verify = async () => {
  error.value = ''
  if (otp.value.length !== 6) {
    error.value = 'Masukkan 6 digit kode OTP.'
    return
  }
  loading.value = true
  try {
    await auth.verifyOtp(email.value, otp.value)
    toast.success('Email berhasil diverifikasi.')
    await router.replace(safeRedirect(route.query.redirect))
  } catch (err) {
    error.value = err instanceof AccessDeniedError ? err.message : getErrorMessage(err, 'Kode OTP tidak valid atau sudah kedaluwarsa.')
    otp.value = ''
  } finally {
    loading.value = false
  }
}

const resend = async () => {
  if (cooldown.value > 0) return
  resending.value = true
  error.value = ''
  try {
    await auth.resendOtp(email.value)
    toast.success('Kode OTP baru telah dikirim.')
    startCooldown()
  } catch (err) {
    toast.error(getErrorMessage(err, 'Gagal mengirim ulang kode OTP.'))
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <AuthSplitLayout
    title="Verifikasi email"
    hero-title="Keamanan adalah prioritas"
    hero-text="Langkah verifikasi memastikan hanya staf berwenang yang dapat mengakses pusat data platform."
    :hero-icon="MailCheck"
  >
    <template #subtitle>
      Masukkan 6 digit kode yang kami kirim ke
      <span class="font-medium text-zinc-800 dark:text-zinc-200">{{ email }}</span>.
    </template>

    <form class="space-y-5" novalidate @submit.prevent="verify">
      <InlineAlert v-if="error">{{ error }}</InlineAlert>
      <OtpInput v-model="otp" :disabled="loading" :invalid="!!error" @complete="verify" />
      <BaseButton type="submit" size="lg" block :loading="loading" :disabled="otp.length !== 6">Verifikasi</BaseButton>
    </form>

    <div class="mt-6 flex items-center justify-between text-sm">
      <RouterLink
        :to="{ name: 'login' }"
        class="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft :size="15" aria-hidden="true" /> Kembali
      </RouterLink>
      <button
        type="button"
        class="font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-brand-300 dark:disabled:text-zinc-500"
        :disabled="cooldown > 0 || resending"
        @click="resend"
      >
        {{ resending ? 'Mengirim…' : cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode' }}
      </button>
    </div>
  </AuthSplitLayout>
</template>
