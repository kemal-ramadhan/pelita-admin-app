<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Link2, RefreshCw, Unlink, Users } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import { useAdminSchoolStore } from '@/stores/adminSchool'
import { toast } from '@/composables/useToast'
import { confirm } from '@/composables/useConfirm'
import { getErrorMessage } from '@/utils/errors'
import type { InstitutionAccount, School } from '@/types/school'

const props = defineProps<{ open: boolean; school: School | null }>()
const emit = defineEmits<{ close: []; changed: [] }>()

const store = useAdminSchoolStore()
const accounts = ref<InstitutionAccount[]>([])
const loading = ref(false)
const loadError = ref('')
const userId = ref('')
const linkError = ref('')
const linking = ref(false)

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const fmt = (d?: string) => (d ? dateFmt.format(new Date(d)) : '—')

const load = async () => {
  if (!props.school) return
  loading.value = true
  loadError.value = ''
  try {
    accounts.value = await store.getLinkedAccounts(props.school.id)
  } catch (err) {
    loadError.value = getErrorMessage(err, 'Gagal memuat akun tertaut.')
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.school?.id] as const,
  ([open]) => {
    userId.value = ''
    linkError.value = ''
    if (open) void load()
    else accounts.value = []
  },
  { immediate: true },
)

const parsedId = computed(() => Number(userId.value))

const link = async () => {
  linkError.value = ''
  if (!props.school) return
  if (!userId.value.trim() || !Number.isInteger(parsedId.value) || parsedId.value <= 0) {
    linkError.value = 'Masukkan ID pengguna berupa angka lebih dari 0.'
    return
  }
  linking.value = true
  try {
    await store.linkAccount(props.school.id, parsedId.value)
    toast.success(`Pengguna #${parsedId.value} berhasil ditautkan.`)
    userId.value = ''
    emit('changed')
    await load()
  } catch (err) {
    linkError.value = getErrorMessage(err, 'Gagal menautkan akun.')
    toast.error({ title: 'Gagal menautkan akun', description: linkError.value })
  } finally {
    linking.value = false
  }
}

const unlink = async (acc: InstitutionAccount) => {
  const school = props.school
  if (!school) return
  await confirm({
    title: `Lepas tautan pengguna #${acc.user_id}?`,
    description: `Pengguna ini tidak akan bisa lagi mengakses dasbor ${school.name}.`,
    confirmText: 'Lepas tautan',
    tone: 'danger',
    onConfirm: async () => {
      try {
        await store.unlinkAccount(school.id, acc.user_id)
        toast.success(`Tautan pengguna #${acc.user_id} dilepas.`)
        accounts.value = accounts.value.filter((a) => a.user_id !== acc.user_id)
        emit('changed')
      } catch (err) {
        toast.error({ title: 'Gagal melepas tautan', description: getErrorMessage(err) })
        throw err
      }
    },
  })
}
</script>

<template>
  <BaseModal
    :open="open"
    placement="right"
    size="md"
    title="Akun institusi"
    :description="school ? `Akun yang dapat mengelola ${school.name}.` : undefined"
    @close="emit('close')"
  >
    <form class="mb-6" novalidate @submit.prevent="link">
      <div class="flex items-start gap-2">
        <BaseInput
          v-model="userId"
          label="Tautkan pengguna yang sudah ada"
          type="number"
          inputmode="numeric"
          min="1"
          placeholder="ID pengguna, mis. 42"
          :error="linkError"
          hint="Gunakan ID pengguna dari layanan autentikasi."
          class="flex-1"
        />
        <BaseButton type="submit" :icon="Link2" :loading="linking" class="mt-[26px]">Tautkan</BaseButton>
      </div>
    </form>

    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Akun tertaut <span v-if="!loading" class="font-normal text-zinc-400">({{ accounts.length }})</span>
      </h3>
      <BaseButton variant="ghost" size="sm" icon-only :icon="RefreshCw" :loading="loading" aria-label="Muat ulang akun" @click="load" />
    </div>

    <ul v-if="loading && accounts.length === 0" class="space-y-2" aria-busy="true">
      <li v-for="i in 3" :key="i" class="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
        <div class="skeleton size-9 rounded-full" />
        <div class="flex-1 space-y-1.5"><div class="skeleton h-3.5 w-24" /><div class="skeleton h-3 w-32" /></div>
      </li>
    </ul>
    <InlineAlert v-else-if="loadError">
      {{ loadError }}
      <button type="button" class="ml-1 font-medium underline" @click="load">Coba lagi</button>
    </InlineAlert>
    <div v-else-if="accounts.length === 0" class="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <EmptyState :icon="Users" title="Belum ada akun tertaut" description="Tautkan akun agar operator sekolah dapat masuk ke dasbor sekolah." />
    </div>
    <TransitionGroup
      v-else
      tag="ul"
      class="space-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-x-2"
    >
      <li
        v-for="acc in accounts"
        :key="acc.id"
        class="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <BaseAvatar :name="`User ${acc.user_id}`" :size="36" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Pengguna #{{ acc.user_id }}</p>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Ditautkan {{ fmt(acc.created_at) }}</p>
        </div>
        <BaseButton variant="ghost-danger" size="sm" :icon="Unlink" @click="unlink(acc)">
          Lepas
        </BaseButton>
      </li>
    </TransitionGroup>
  </BaseModal>
</template>
