<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Building2, Hash, KeyRound, Lock, Mail, Phone, UserRound } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import { useAdminSchoolStore } from '@/stores/adminSchool'
import { toast } from '@/composables/useToast'
import { getErrorMessage } from '@/utils/errors'
import { email as emailRule, first, hasErrors, minLength, orNull, phone as phoneRule, required } from '@/utils/validators'
import { SCHOOL_LEVELS, SCHOOL_STATUSES, type CreateSchoolPayload, type School, type SchoolLevel, type SchoolRequest } from '@/types/school'

const props = defineProps<{ open: boolean; school?: School | null }>()
const emit = defineEmits<{ close: []; saved: [school: School | undefined] }>()

const store = useAdminSchoolStore()
const isEdit = computed(() => !!props.school)

const blank = () => ({
  name: '',
  code: '',
  school_level: '' as SchoolLevel | '',
  school_status: '',
  npsn: '',
  email: '',
  phone: '',
  address: '',
})
const blankAccount = () => ({ full_name: '', email: '', password: '', phone: '' })

const form = reactive(blank())
const account = reactive(blankAccount())
const withAccount = ref(true)
const submitted = ref(false)
const saving = ref(false)
const serverError = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    submitted.value = false
    serverError.value = ''
    Object.assign(account, blankAccount())
    withAccount.value = !props.school
    const s = props.school
    Object.assign(
      form,
      s
        ? {
            name: s.name ?? '',
            code: s.code ?? '',
            school_level: (SCHOOL_LEVELS as readonly string[]).includes(s.school_level) ? (s.school_level as SchoolLevel) : '',
            school_status: s.school_status ?? '',
            npsn: s.npsn ?? '',
            email: s.email ?? '',
            phone: s.phone ?? '',
            address: s.address ?? '',
          }
        : blank(),
    )
  },
  { immediate: true },
)

const errors = computed(() => ({
  name: required(form.name, 'Nama sekolah'),
  code: required(form.code, 'Kode sekolah'),
  school_level: required(form.school_level, 'Jenjang'),
  email: emailRule(form.email),
  phone: phoneRule(form.phone),
  npsn: form.npsn && !/^\d{8}$/.test(form.npsn.trim()) ? 'NPSN terdiri dari 8 digit angka.' : '',
}))
const accountErrors = computed(() =>
  withAccount.value && !isEdit.value
    ? {
        full_name: required(account.full_name, 'Nama lengkap'),
        email: first(required(account.email, 'Email login'), emailRule(account.email)),
        password: first(required(account.password, 'Kata sandi'), minLength(account.password, 8, 'Kata sandi')),
        phone: phoneRule(account.phone),
      }
    : { full_name: '', email: '', password: '', phone: '' },
)
const err = (k: keyof typeof errors.value) => (submitted.value ? errors.value[k] : '')
const accErr = (k: keyof typeof accountErrors.value) => (submitted.value ? accountErrors.value[k] : '')

const buildRequest = (): SchoolRequest => {
  const s = props.school
  return {
    // Preserve fields this form doesn't edit so PUT doesn't wipe them.
    nss: s?.nss ?? null,
    website: s?.website ?? null,
    province_id: s?.province_id ?? null,
    city_id: s?.city_id ?? null,
    district_id: s?.district_id ?? null,
    postal_code: s?.postal_code ?? null,
    timezone: s?.timezone || 'Asia/Jakarta',
    code: form.code.trim(),
    name: form.name.trim(),
    school_level: form.school_level as SchoolLevel,
    school_status: form.school_status || undefined,
    npsn: orNull(form.npsn),
    email: orNull(form.email),
    phone: orNull(form.phone),
    address: orNull(form.address),
  }
}

const submit = async () => {
  submitted.value = true
  serverError.value = ''
  if (hasErrors(errors.value) || hasErrors(accountErrors.value)) {
    toast.warning('Periksa kembali isian formulir.')
    return
  }
  saving.value = true
  try {
    let saved: School | undefined
    if (props.school) {
      saved = await store.updateSchool(props.school.id, buildRequest())
      toast.success({ title: 'Sekolah diperbarui', description: form.name.trim() })
    } else {
      const payload: CreateSchoolPayload = { ...buildRequest() }
      if (withAccount.value) {
        payload.account = {
          full_name: account.full_name.trim(),
          email: account.email.trim(),
          password: account.password,
          ...(account.phone.trim() ? { phone: account.phone.trim() } : {}),
        }
      }
      saved = await store.createSchool(payload)
      toast.success({
        title: 'Sekolah berhasil didaftarkan',
        description: withAccount.value ? `Akun ${account.email.trim()} dapat langsung digunakan.` : form.name.trim(),
      })
    }
    emit('saved', saved)
    emit('close')
  } catch (e) {
    serverError.value = getErrorMessage(e, 'Gagal menyimpan data sekolah.')
    toast.error({ title: 'Gagal menyimpan', description: serverError.value })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    placement="right"
    size="lg"
    :title="isEdit ? 'Ubah data sekolah' : 'Daftarkan sekolah baru'"
    :description="isEdit ? 'Perbarui profil tenant sekolah.' : 'Buat tenant sekolah beserta akun institusinya sekaligus.'"
    :persistent="saving"
    @close="emit('close')"
  >
    <form id="school-form" class="space-y-8" novalidate @submit.prevent="submit">
      <InlineAlert v-if="serverError">{{ serverError }}</InlineAlert>

      <fieldset class="space-y-4">
        <legend class="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Building2 :size="16" class="text-brand-500" aria-hidden="true" /> Profil sekolah
        </legend>
        <BaseInput v-model="form.name" label="Nama sekolah" placeholder="SMA Negeri 1 Contoh" required :error="err('name')" data-autofocus />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseInput v-model="form.code" label="Kode sekolah" placeholder="SMAN1-CTH" :icon="Hash" required :error="err('code')" hint="Unik di seluruh platform" />
          <BaseSelect v-model="form.school_level" label="Jenjang" :options="SCHOOL_LEVELS" placeholder="Pilih jenjang" required :error="err('school_level')" />
          <BaseSelect v-model="form.school_status" label="Status sekolah" :options="SCHOOL_STATUSES" placeholder="Pilih status" />
          <BaseInput v-model="form.npsn" label="NPSN" placeholder="8 digit" inputmode="numeric" maxlength="8" :error="err('npsn')" />
          <BaseInput v-model="form.email" label="Email sekolah" type="email" placeholder="info@sekolah.sch.id" :icon="Mail" :error="err('email')" />
          <BaseInput v-model="form.phone" label="Telepon sekolah" type="tel" placeholder="021xxxxxxx" :icon="Phone" :error="err('phone')" />
        </div>
        <BaseTextarea v-model="form.address" label="Alamat" placeholder="Jalan, kelurahan, kecamatan, kota" :rows="2" />
      </fieldset>

      <fieldset v-if="!isEdit" class="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <legend class="sr-only">Akun institusi</legend>
        <label class="flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span class="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <KeyRound :size="16" class="text-brand-500" aria-hidden="true" /> Buat akun institusi
            </span>
            <span class="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
              Akun login untuk operator sekolah (peran <i>institution</i>). Bisa ditautkan nanti.
            </span>
          </span>
          <span class="relative mt-0.5 inline-flex shrink-0">
            <input v-model="withAccount" type="checkbox" role="switch" class="peer sr-only" :aria-checked="withAccount" />
            <span
              class="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 dark:bg-zinc-700 dark:peer-checked:bg-brand-500"
            />
            <span class="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-150 peer-checked:translate-x-5" />
          </span>
        </label>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          leave-active-class="transition duration-100 ease-in"
          leave-to-class="opacity-0"
        >
          <div v-if="withAccount" class="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800/30">
            <BaseInput v-model="account.full_name" label="Nama lengkap" :icon="UserRound" required :error="accErr('full_name')" class="sm:col-span-2" />
            <BaseInput v-model="account.email" label="Email login" type="email" :icon="Mail" autocomplete="off" required :error="accErr('email')" />
            <BaseInput v-model="account.phone" label="No. telepon" type="tel" :icon="Phone" :error="accErr('phone')" />
            <BaseInput
              v-model="account.password"
              label="Kata sandi awal"
              type="password"
              :icon="Lock"
              autocomplete="new-password"
              required
              hint="Minimal 8 karakter"
              :error="accErr('password')"
              class="sm:col-span-2"
            />
          </div>
        </Transition>
      </fieldset>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="saving" @click="emit('close')">Batal</BaseButton>
      <BaseButton type="submit" form="school-form" :loading="saving">
        {{ isEdit ? 'Simpan perubahan' : 'Daftarkan sekolah' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
