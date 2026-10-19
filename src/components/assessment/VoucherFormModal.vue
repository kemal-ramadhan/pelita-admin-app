<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { CalendarRange, Check, Dices, Hash, Package as PackageIcon, Ticket } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import InlineAlert from '@/components/ui/InlineAlert.vue'
import { useAssessmentAdminStore } from '@/stores/assessmentAdmin'
import { toast } from '@/composables/useToast'
import { getErrorCode, getErrorMessage, getErrorStatus } from '@/utils/errors'
import { hasErrors, required } from '@/utils/validators'
import { formatRupiah, formatThousands, onlyDigits, toLocalInput } from '@/utils/assessment'
import { DISCOUNT_TYPE_LABELS, type AssessmentVoucher, type DiscountType, type VoucherPayload } from '@/types/assessment'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; saved: [voucher: AssessmentVoucher | undefined] }>()

const store = useAssessmentAdminStore()

const discountOptions = (Object.keys(DISCOUNT_TYPE_LABELS) as DiscountType[]).map((value) => ({
  value,
  label: DISCOUNT_TYPE_LABELS[value],
}))

const randomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = 'ASM-'
  for (let i = 0; i < 6; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  return out
}

const blank = () => {
  const from = new Date()
  from.setSeconds(0, 0)
  const until = new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000)
  until.setHours(23, 59, 0, 0)
  return {
    code: randomCode(),
    name: '',
    discount_type: 'free_claim' as DiscountType,
    percentage: '100' as string | number,
    amount: '',
    max_usage: '50' as string | number,
    valid_from: toLocalInput(from),
    valid_until: toLocalInput(until),
    applicable_package_ids: [] as string[],
  }
}

const form = reactive(blank())
const submitted = ref(false)
const saving = ref(false)
const serverError = ref('')
const duplicate = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    submitted.value = false
    serverError.value = ''
    duplicate.value = ''
    Object.assign(form, blank())
    if (!store.packagesLoaded && !store.packagesLoading) void store.fetchPackages()
  },
  { immediate: true },
)

const codeModel = computed({
  get: () => form.code,
  set: (v: string | number | null | undefined) => {
    duplicate.value = ''
    form.code = String(v ?? '').toUpperCase().replace(/\s+/g, '')
  },
})
const discountModel = computed({
  get: () => form.discount_type as string,
  set: (v: string | null | undefined) => {
    form.discount_type = (v as DiscountType) || 'free_claim'
  },
})
const amountDisplay = computed({
  get: () => formatThousands(form.amount),
  set: (v: string | number | null | undefined) => {
    form.amount = onlyDigits(v).slice(0, 13)
  },
})

const togglePackage = (id: string) => {
  const i = form.applicable_package_ids.indexOf(id)
  if (i >= 0) form.applicable_package_ids.splice(i, 1)
  else form.applicable_package_ids.push(id)
}

const discountValue = computed(() => {
  if (form.discount_type === 'percentage') return Number(form.percentage)
  if (form.discount_type === 'fixed_amount') return Number(form.amount)
  return 0
})

const errors = computed(() => {
  const from = new Date(form.valid_from)
  const until = new Date(form.valid_until)
  const pct = Number(form.percentage)
  const max = Number(form.max_usage)
  return {
    code:
      required(form.code, 'Kode voucher') ||
      (!/^[A-Z0-9_-]{3,50}$/.test(form.code) ? 'Gunakan 3–50 karakter: huruf, angka, "-" atau "_".' : '') ||
      duplicate.value,
    name: required(form.name, 'Nama voucher'),
    percentage:
      form.discount_type === 'percentage' && (!Number.isInteger(pct) || pct < 1 || pct > 100)
        ? 'Persentase harus bilangan bulat 1–100.'
        : '',
    amount: form.discount_type === 'fixed_amount' && !(Number(form.amount) > 0) ? 'Nominal potongan harus lebih dari 0.' : '',
    max_usage: !Number.isInteger(max) || max <= 0 ? 'Batas pemakaian harus bilangan bulat lebih dari 0.' : '',
    valid_from: required(form.valid_from, 'Tanggal mulai') || (Number.isNaN(from.getTime()) ? 'Tanggal tidak valid.' : ''),
    valid_until:
      required(form.valid_until, 'Tanggal berakhir') ||
      (Number.isNaN(until.getTime()) ? 'Tanggal tidak valid.' : '') ||
      (until.getTime() <= from.getTime() ? 'Harus setelah tanggal mulai berlaku.' : ''),
  }
})
const err = (k: keyof typeof errors.value) => (submitted.value || (k === 'code' && duplicate.value) ? errors.value[k] : '')

const summary = computed(() => {
  if (form.discount_type === 'free_claim') return 'Sekolah langsung mendapat langganan aktif tanpa biaya.'
  if (form.discount_type === 'percentage') return `Potongan ${Number(form.percentage) || 0}% — langganan menunggu persetujuan admin.`
  return `Potongan ${formatRupiah(Number(form.amount) || 0)} — langganan menunggu persetujuan admin.`
})

const submit = async () => {
  submitted.value = true
  serverError.value = ''
  if (hasErrors(errors.value)) {
    toast.warning('Periksa kembali isian formulir.')
    return
  }
  const payload: VoucherPayload = {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    discount_type: form.discount_type,
    discount_value: discountValue.value,
    max_usage: Number(form.max_usage),
    valid_from: new Date(form.valid_from).toISOString(),
    valid_until: new Date(form.valid_until).toISOString(),
    applicable_package_ids: [...form.applicable_package_ids],
  }
  saving.value = true
  try {
    const saved = await store.createVoucher(payload)
    toast.success({ title: 'Voucher dibuat', description: payload.code })
    emit('saved', saved)
    emit('close')
  } catch (e) {
    const msg = getErrorMessage(e, 'Gagal membuat voucher.')
    if (getErrorStatus(e) === 409 || getErrorCode(e) === 'DUPLICATE_CODE') {
      duplicate.value = 'Kode voucher sudah digunakan.'
    } else {
      serverError.value = msg
    }
    toast.error({ title: 'Gagal menyimpan', description: duplicate.value || msg })
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
    title="Buat voucher asesmen"
    description="Kode klaim gratis atau potongan harga paket untuk sekolah."
    :persistent="saving"
    @close="emit('close')"
  >
    <form id="voucher-form" class="space-y-8" novalidate @submit.prevent="submit">
      <InlineAlert v-if="serverError">{{ serverError }}</InlineAlert>

      <fieldset class="space-y-4">
        <legend class="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Ticket :size="16" class="text-brand-500" aria-hidden="true" /> Identitas voucher
        </legend>
        <BaseInput
          v-model="codeModel"
          label="Kode voucher"
          :icon="Hash"
          placeholder="BKSUPER2026"
          required
          autocomplete="off"
          class="font-mono"
          hint="Otomatis huruf kapital, unik"
          :error="err('code')"
        >
          <template #label-right>
            <BaseButton variant="ghost" size="sm" :icon="Dices" @click="codeModel = randomCode()">Acak</BaseButton>
          </template>
        </BaseInput>
        <BaseInput v-model="form.name" label="Nama / keterangan" placeholder="Voucher Seminar BK 2026" required :error="err('name')" />
      </fieldset>

      <fieldset class="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <legend class="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Jenis potongan & pemakaian</legend>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseSelect v-model="discountModel" label="Tipe voucher" :options="discountOptions" required />
          <BaseInput
            v-if="form.discount_type === 'percentage'"
            v-model="form.percentage"
            label="Persentase potongan (%)"
            type="number"
            min="1"
            max="100"
            step="1"
            inputmode="numeric"
            required
            :error="err('percentage')"
          />
          <BaseInput
            v-else-if="form.discount_type === 'fixed_amount'"
            v-model="amountDisplay"
            label="Nominal potongan (Rp)"
            inputmode="numeric"
            placeholder="250.000"
            required
            :error="err('amount')"
          />
          <BaseInput
            v-model="form.max_usage"
            label="Batas pemakaian"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            required
            hint="Total klaim oleh seluruh sekolah"
            :error="err('max_usage')"
          />
        </div>
        <p class="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-400">
          {{ summary }}
        </p>
      </fieldset>

      <fieldset class="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <legend class="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <CalendarRange :size="16" class="text-brand-500" aria-hidden="true" /> Masa berlaku
        </legend>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseInput v-model="form.valid_from" label="Berlaku mulai" type="datetime-local" required :error="err('valid_from')" />
          <BaseInput v-model="form.valid_until" label="Berlaku sampai" type="datetime-local" required :error="err('valid_until')" />
        </div>
      </fieldset>

      <fieldset class="space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <legend class="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <PackageIcon :size="16" class="text-brand-500" aria-hidden="true" /> Paket yang berlaku
        </legend>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          {{ form.applicable_package_ids.length ? `${form.applicable_package_ids.length} paket dipilih.` : 'Tidak memilih = berlaku untuk semua paket.' }}
        </p>
        <div v-if="store.packagesLoading && !store.packages.length" class="space-y-2">
          <div v-for="i in 3" :key="i" class="skeleton h-12" />
        </div>
        <p v-else-if="store.packagesError" class="text-xs font-medium text-red-600 dark:text-red-400" role="alert">{{ store.packagesError }}</p>
        <p v-else-if="!store.packages.length" class="text-xs text-zinc-500 dark:text-zinc-400">Belum ada paket.</p>
        <div v-else class="grid grid-cols-1 gap-2" role="group" aria-label="Paket yang berlaku">
          <label
            v-for="p in store.packages"
            :key="p.id"
            class="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors"
            :class="
              form.applicable_package_ids.includes(p.id)
                ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-500/10'
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            "
          >
            <input type="checkbox" class="peer sr-only" :checked="form.applicable_package_ids.includes(p.id)" @change="togglePackage(p.id)" />
            <span
              class="grid size-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500"
              :class="
                form.applicable_package_ids.includes(p.id)
                  ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                  : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
              "
              aria-hidden="true"
            >
              <Check v-if="form.applicable_package_ids.includes(p.id)" :size="14" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ p.name }}</span>
              <span class="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                {{ p.code }} · {{ p.instrument_codes.join(', ') }} · {{ p.price > 0 ? formatRupiah(p.price) : 'Gratis' }}
              </span>
            </span>
            <BaseBadge v-if="!p.is_active" tone="neutral">Nonaktif</BaseBadge>
          </label>
        </div>
      </fieldset>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="saving" @click="emit('close')">Batal</BaseButton>
      <BaseButton type="submit" form="voucher-form" :loading="saving">Simpan voucher</BaseButton>
    </template>
  </BaseModal>
</template>
