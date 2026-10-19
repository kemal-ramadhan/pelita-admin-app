<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, KeyRound, Mail, MailCheck } from 'lucide-vue-next'
import AuthSplitLayout from '@/layouts/AuthSplitLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/errors'
import { email as emailRule, first, required } from '@/utils/validators'

const auth = useAuthStore()

const email = ref('')
const touched = ref(false)
const submitted = ref(false)
const loading = ref(false)
const sent = ref(false)
const serverError = ref('')

const emailError = computed(() => first(required(email.value, 'Email'), emailRule(email.value)))

const submit = async () => {
  submitted.value = true
  serverError.value = ''
  if (emailError.value) return
  loading.value = true
  try {
    await auth.forgotPassword(email.value)
    sent.value = true
  } catch (err) {
    serverError.value = getErrorMessage(err, 'Gagal mengirim tautan. Silakan coba lagi.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthSplitLayout
    :title="sent ? 'Periksa email Anda' : 'Lupa kata sandi'"
    :subtitle="sent ? undefined : 'Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi.'"
    hero-title="Data tetap aman"
    hero-text="Tautan reset bersifat sekali pakai dan otomatis mengakhiri semua sesi lama Anda."
    :hero-icon="KeyRound"
  >
    <div v-if="sent" class="space-y-5">
      <div class="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
        <MailCheck :size="22" aria-hidden="true" />
      </div>
      <p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300" role="status">
        Jika <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ email }}</span> terdaftar, tautan reset kata sandi
        telah dikirim. Periksa juga folder spam.
      </p>
      <BaseButton variant="secondary" block @click="sent = false">Gunakan email lain</BaseButton>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="submit">
      <InlineAlert v-if="serverError">{{ serverError }}</InlineAlert>
      <BaseInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="nama@pelitasekolah.id"
        autocomplete="email"
        :icon="Mail"
        size="lg"
        required
        autofocus
        :error="submitted || touched ? emailError : ''"
        @blur="touched = true"
      />
      <BaseButton type="submit" size="lg" block :loading="loading">Kirim tautan reset</BaseButton>
    </form>

    <RouterLink
      :to="{ name: 'login' }"
      class="mt-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      <ArrowLeft :size="15" aria-hidden="true" /> Kembali ke halaman masuk
    </RouterLink>
  </AuthSplitLayout>
</template>
