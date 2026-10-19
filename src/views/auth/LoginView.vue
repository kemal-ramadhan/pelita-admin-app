<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, Mail } from 'lucide-vue-next'
import AuthSplitLayout from '@/layouts/AuthSplitLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import { AccessDeniedError, useAuthStore } from '@/stores/auth'
import { getErrorCode, getErrorMessage, getErrorStatus } from '@/utils/errors'
import { email as emailRule, first, hasErrors, required } from '@/utils/validators'
import { safeRedirect } from '@/utils/redirect'
import { toast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const submitted = ref(false)
const loading = ref(false)
const serverError = ref('')

const errors = computed(() => ({
  email: first(required(form.email, 'Email'), emailRule(form.email)),
  password: required(form.password, 'Kata sandi'),
}))
const show = (k: 'email' | 'password') => (submitted.value || touched[k] ? errors.value[k] : '')

const reasonNotice = computed(() => {
  switch (route.query.reason) {
    case 'forbidden':
      return { tone: 'error' as const, text: 'Akses ditolak. Aplikasi ini hanya untuk akun Admin / Super Admin platform.' }
    case 'expired':
      return { tone: 'info' as const, text: 'Sesi Anda telah berakhir. Silakan masuk kembali.' }
    case 'offline':
      return { tone: 'error' as const, text: 'Tidak dapat memverifikasi sesi. Periksa koneksi lalu masuk kembali.' }
    case 'reset':
      return { tone: 'success' as const, text: 'Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.' }
    default:
      return null
  }
})

const submit = async () => {
  submitted.value = true
  serverError.value = ''
  if (hasErrors(errors.value)) return

  loading.value = true
  try {
    await auth.login(form.email, form.password)
    toast.success(`Selamat datang, ${auth.displayName}!`)
    await router.replace(safeRedirect(route.query.redirect))
  } catch (err) {
    if (err instanceof AccessDeniedError) {
      serverError.value = err.message
    } else if (getErrorStatus(err) === 403 && getErrorCode(err) === 'EMAIL_NOT_VERIFIED') {
      try {
        await auth.resendOtp(form.email)
      } catch {
        /* resend is best-effort; user can resend from the OTP screen */
      }
      toast.info({ title: 'Email belum terverifikasi', description: 'Kode OTP telah dikirim ke email Anda.' })
      await router.push({ name: 'verify-otp', query: { email: form.email.trim(), redirect: route.query.redirect } })
    } else {
      serverError.value = getErrorMessage(err, 'Gagal masuk. Periksa kembali email dan kata sandi Anda.')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthSplitLayout title="Masuk ke Admin" subtitle="Gunakan akun admin platform Anda untuk melanjutkan.">
    <div class="space-y-4">
      <InlineAlert v-if="reasonNotice && !serverError" :tone="reasonNotice.tone">{{ reasonNotice.text }}</InlineAlert>
      <InlineAlert v-if="serverError">{{ serverError }}</InlineAlert>

      <form class="space-y-4" novalidate @submit.prevent="submit">
        <BaseInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="nama@pelitasekolah.id"
          autocomplete="username"
          :icon="Mail"
          size="lg"
          required
          autofocus
          :error="show('email')"
          @blur="touched.email = true"
        />
        <BaseInput
          v-model="form.password"
          label="Kata sandi"
          type="password"
          placeholder="Masukkan kata sandi"
          autocomplete="current-password"
          :icon="Lock"
          size="lg"
          required
          :error="show('password')"
          @blur="touched.password = true"
        >
          <template #label-right>
            <RouterLink
              :to="{ name: 'forgot-password' }"
              class="text-[13px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
            >
              Lupa kata sandi?
            </RouterLink>
          </template>
        </BaseInput>

        <BaseButton type="submit" size="lg" block :loading="loading" class="mt-2">
          {{ loading ? 'Memproses…' : 'Masuk' }}
        </BaseButton>
      </form>
    </div>
  </AuthSplitLayout>
</template>
