import type { Component } from 'vue'
import { LayoutDashboard, School, UserRound, Package, Ticket, BrainCircuit, WalletCards } from 'lucide-vue-next'

export interface NavItem {
  label: string
  name: string // route name
  icon: Component
  description?: string
  keywords?: string[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/** Only real, routable pages are listed (no dead links). */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      {
        label: 'Dasbor',
        name: 'dashboard',
        icon: LayoutDashboard,
        description: 'Ringkasan platform',
        keywords: ['home', 'beranda', 'statistik'],
      },
    ],
  },
  {
    label: 'Manajemen Platform',
    items: [
      {
        label: 'Manajemen Sekolah',
        name: 'schools',
        icon: School,
        description: 'Kelola tenant sekolah & akun',
        keywords: ['sekolah', 'tenant', 'institusi', 'akun'],
      },
    ],
  },
  {
    label: 'Asesmen Psikologi',
    items: [
      {
        label: 'Paket Asesmen',
        name: 'assessment-packages',
        icon: Package,
        description: 'Kelola produk paket & kuota',
        keywords: ['paket', 'asesmen', 'riasec', 'kuota', 'harga'],
      },
      {
        label: 'Voucher Asesmen',
        name: 'assessment-vouchers',
        icon: Ticket,
        description: 'Kelola kode kupon & klaim',
        keywords: ['voucher', 'klaim', 'diskon', 'gratis'],
      },
      {
        label: 'Langganan Sekolah',
        name: 'assessment-subscriptions',
        icon: WalletCards,
        description: 'Setujui pembelian & pantau kuota sekolah',
        keywords: ['langganan', 'subscription', 'pembelian', 'persetujuan', 'kuota', 'sekolah'],
      },
      {
        label: 'Bank Soal Asesmen',
        name: 'assessment-questions',
        icon: BrainCircuit,
        description: 'Kelola butir soal psikologi & kunci',
        keywords: ['soal', 'bank', 'butir', 'tmb', 'riasec', 'pmk', 'adn', 'kunci'],
      },
    ],
  },
  {
    label: 'Akun',
    items: [
      {
        label: 'Profil Saya',
        name: 'profile',
        icon: UserRound,
        description: 'Foto, sampul & data diri',
        keywords: ['profil', 'akun', 'foto'],
      },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)
