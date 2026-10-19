<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Camera, ImagePlus, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import ImageUploadModal from '@/components/ui/ImageUploadModal.vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import { getErrorMessage } from '@/utils/errors'
import { hasErrors, phone as phoneRule, required } from '@/utils/validators'
import type { UpdateProfilePayload } from '@/types/api'

const auth = useAuthStore()

const photoOpen = ref(false)
const coverOpen = ref(false)

const uploadPhoto = async (file: File, onProgress: (p: number) => void) => {
  try {
    await auth.uploadPhotoProfile(file, onProgress)
    toast.success('Foto profil diperbarui.')
  } catch (err) {
    toast.error({ title: 'Gagal mengunggah foto', description: getErrorMessage(err) })
    throw err
  }
}
const uploadCover = async (file: File, onProgress: (p: number) => void) => {
  try {
    await auth.uploadCover(file, onProgress)
    toast.success('Gambar sampul diperbarui.')
  } catch (err) {
    toast.error({ title: 'Gagal mengunggah sampul', description: getErrorMessage(err) })
    throw err
  }
}

// --- Profile form ---
const GENDERS = [
  { label: 'Laki-laki', value: '1' },
  { label: 'Perempuan', value: '2' },
]

const form = reactive({ full_name: '', phone: '', birth_place: '', birth_date: '', gender: '' })
const submitted = ref(false)
const saving = ref(false)

const fillForm = () => {
  const u = auth.user
  const c = u?.customer
  const g = String(c?.gender ?? '')
  Object.assign(form, {
    full_name: c?.full_name ?? '',
    phone: u?.phone ?? '',
    birth_place: c?.birth_place ?? '',
    birth_date: (c?.birth_date ?? '').slice(0, 10),
    gender: g === '1' || g === '2' ? g : '',
  })
}
watch(() => auth.user, fillForm, { immediate: true })

const errors = computed(() => ({
  full_name: required(form.full_name, 'Nama lengkap'),
  phone: phoneRule(form.phone),
  birth_date: form.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date) ? 'Format tanggal YYYY-MM-DD.' : '',
}))

const save = async () => {
  submitted.value = true
  if (hasErrors(errors.value)) return
  saving.value = true
  try {
    const payload: UpdateProfilePayload = { full_name: form.full_name.trim() }
    if (form.phone.trim()) payload.phone = form.phone.trim()
    if (form.birth_place.trim()) payload.birth_place = form.birth_place.trim()
    if (form.birth_date) payload.birth_date = form.birth_date
    if (form.gender === '1' || form.gender === '2') payload.gender = Number(form.gender) as 1 | 2
    await auth.updateProfile(payload)
    submitted.value = false
    toast.success('Profil berhasil disimpan.')
  } catch (err) {
    toast.error({ title: 'Gagal menyimpan profil', description: getErrorMessage(err) })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="Profil Saya" description="Kelola identitas dan tampilan akun admin Anda." />

    <section class="card mb-6 overflow-hidden" aria-label="Ringkasan profil">
      <div class="group relative h-36 bg-gradient-to-br from-brand-400 via-brand-600 to-brand-900 sm:h-48">
        <img v-if="auth.user?.cover" :src="auth.user.cover" alt="" class="size-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />
        <BaseButton
          variant="secondary"
          size="sm"
          :icon="ImagePlus"
          class="absolute top-3 right-3 bg-white/90 backdrop-blur dark:bg-zinc-900/80"
          @click="coverOpen = true"
        >
          Ubah sampul
        </BaseButton>
      </div>
      <div class="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-6">
        <div class="relative -mt-12 w-fit">
          <BaseAvatar :name="auth.displayName" :src="auth.user?.photo_profile" :size="96" ring class="shadow-lg ring-4!" />
          <button
            type="button"
            class="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow-md transition-colors hover:bg-brand-700 dark:border-zinc-900"
            aria-label="Ubah foto profil"
            @click="photoOpen = true"
          >
            <Camera :size="15" aria-hidden="true" />
          </button>
        </div>
        <div class="min-w-0 flex-1 sm:pb-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{{ auth.displayName }}</h2>
            <BaseBadge tone="brand"><ShieldCheck :size="12" aria-hidden="true" /> {{ auth.roleLabel }}</BaseBadge>
          </div>
          <div class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <span class="inline-flex items-center gap-1.5"><Mail :size="14" aria-hidden="true" /> {{ auth.user?.email }}</span>
            <span v-if="auth.user?.phone" class="inline-flex items-center gap-1.5"><Phone :size="14" aria-hidden="true" /> {{ auth.user.phone }}</span>
            <span v-if="auth.user?.customer?.birth_place" class="inline-flex items-center gap-1.5">
              <MapPin :size="14" aria-hidden="true" /> {{ auth.user.customer.birth_place }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="card p-5 sm:p-6" aria-labelledby="profile-form-title">
      <div class="mb-5">
        <h2 id="profile-form-title" class="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <UserRound :size="16" class="text-brand-500" aria-hidden="true" /> Data diri
        </h2>
        <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Email tidak dapat diubah dari halaman ini.</p>
      </div>
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="save">
        <BaseInput v-model="form.full_name" label="Nama lengkap" required :error="submitted ? errors.full_name : ''" />
        <BaseInput :model-value="auth.user?.email ?? ''" label="Email" disabled />
        <BaseInput v-model="form.phone" label="No. telepon" type="tel" :error="submitted ? errors.phone : ''" />
        <BaseSelect v-model="form.gender" label="Jenis kelamin" :options="GENDERS" placeholder="Pilih" />
        <BaseInput v-model="form.birth_place" label="Tempat lahir" />
        <BaseInput v-model="form.birth_date" label="Tanggal lahir" type="date" :error="submitted ? errors.birth_date : ''" />
        <div class="flex justify-end gap-2 sm:col-span-2">
          <BaseButton variant="secondary" :disabled="saving" @click="fillForm">Batalkan</BaseButton>
          <BaseButton type="submit" :loading="saving">Simpan profil</BaseButton>
        </div>
      </form>
    </section>

    <ImageUploadModal
      :open="photoOpen"
      title="Foto profil"
      description="Gunakan foto persegi agar tampil optimal."
      shape="circle"
      :upload="uploadPhoto"
      @close="photoOpen = false"
    />
    <ImageUploadModal
      :open="coverOpen"
      title="Gambar sampul"
      description="Rasio lebar disarankan (mis. 1500×500)."
      shape="cover"
      :upload="uploadCover"
      @close="coverOpen = false"
    />
  </div>
</template>
