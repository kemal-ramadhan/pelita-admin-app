<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-vue-next'
import AuthSplitLayout from '@/layouts/AuthSplitLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/errors'
import { first, hasErrors, minLength, required } from '@/utils/validators'
import { toast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const form = reactive({ password: '', confirm: '' })
const submitted = ref(false)
const loading = ref(false)
const serverError = ref('')

const errors = computed(() => ({
  password: first(required(form.password, 'Kata sandi'), minLength(form.password, 8, 'Kata sandi')),
  confirm: first(
    required(form.confirm, 'Konfirmasi'),
    form.confirm && form.confirm !== form.password ? 'Konfirmasi kata sandi tidak sama.' : '',
  ),
}))

const strength = computed(() => {
  const p = form.password
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++
  return s
})
const strengthLabel = computed(() => ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][strength.value])

const submit = async () => {
  submitted.value = true
  serverError.value = ''
  if (!token.value) {
    serverError.value = 'Tautan reset tidak valid. Silakan ulangi proses lupa kata sandi.'
    return
  }
  if (hasErrors(errors.value)) return
  loading.value = true
  try {
    await auth.resetPassword(token.value, form.password)
    // Password reset revokes every session — clear any local one too.
    if (auth.isAuthenticated) auth.clearSession()
    toast.success('Kata sandi berhasil diubah.')
    await router.replace({ name: 'login', query: { reason: 'reset' } })
  } catch (err) {
    serverError.value = getErrorMessage(err, 'Gagal mengatur ulang kata sandi. Tautan mungkin sudah kedaluwarsa.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthSplitLayout
    title="Buat kata sandi baru"
    subtitle="Gunakan minimal 8 karakter. Semua sesi aktif akan diakhiri setelah kata sandi diubah."
    hero-title="Satu langkah lagi"
    hero-text="Kata sandi yang kuat menjaga data seluruh sekolah di platform tetap aman."
    :hero-icon="ShieldCheck"
  >
    <InlineAlert v-if="!token" class="mb-4">
      Tautan reset tidak valid atau tidak lengkap. Minta tautan baru dari halaman lupa kata sandi.
    </InlineAlert>

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <InlineAlert v-if="serverError">{{ serverError }}</InlineAlert>
      <div>
        <BaseInput
          v-model="form.password"
          label="Kata sandi baru"
          type="password"
          autocomplete="new-password"
          placeholder="Minimal 8 karakter"
          :icon="Lock"
          size="lg"
          required
          :error="submitted ? errors.password : ''"
        />
        <div v-if="form.password" class="mt-2 flex items-center gap-2" aria-live="polite">
          <div class="flex flex-1 gap-1">
            <span
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-full transition-colors"
              :class="
                i <= strength
                  ? strength <= 1
                    ? 'bg-red-500'
                    : strength === 2
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  : 'bg-zinc-200 dark:bg-zinc-800'
              "
            />
          </div>
          <span class="w-20 text-right text-xs text-zinc-500 dark:text-zinc-400">{{ strengthLabel }}</span>
        </div>
      </div>
      <BaseInput
        v-model="form.confirm"
        label="Konfirmasi kata sandi"
        type="password"
        autocomplete="new-password"
        placeholder="Ulangi kata sandi"
        :icon="Lock"
        size="lg"
        required
        :error="submitted || form.confirm.length >= form.password.length ? errors.confirm : ''"
      />
      <BaseButton type="submit" size="lg" block :loading="loading" :disabled="!token">Simpan kata sandi</BaseButton>
    </form>

    <RouterLink
      :to="{ name: 'login' }"
      class="mt-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      <ArrowLeft :size="15" aria-hidden="true" /> Kembali ke halaman masuk
    </RouterLink>
  </AuthSplitLayout>
</template>
