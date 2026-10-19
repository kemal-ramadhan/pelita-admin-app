import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getErrorStatus } from '@/utils/errors'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    title?: string
    breadcrumb?: string
  }
}

const APP_NAME = 'Pelita Sekolah Admin'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: { name: 'dashboard' } },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guestOnly: true, title: 'Masuk' },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { guestOnly: true, title: 'Lupa Kata Sandi' },
    },
    {
      // Reachable whether or not the user is signed in (link comes from email).
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { title: 'Atur Ulang Kata Sandi' },
    },
    {
      path: '/verify-otp',
      name: 'verify-otp',
      component: () => import('@/views/auth/VerifyOtpView.vue'),
      meta: { guestOnly: true, title: 'Verifikasi Email' },
    },
    {
      path: '/dashboard',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: { requiresAuth: true, title: 'Dasbor', breadcrumb: 'Dasbor' },
        },
        {
          path: 'schools',
          name: 'schools',
          component: () => import('@/views/dashboard/SchoolManagementView.vue'),
          meta: { requiresAuth: true, title: 'Manajemen Sekolah', breadcrumb: 'Manajemen Sekolah' },
        },
        {
          path: 'assessment-packages',
          name: 'assessment-packages',
          component: () => import('@/views/dashboard/AssessmentPackagesView.vue'),
          meta: { requiresAuth: true, title: 'Paket Asesmen', breadcrumb: 'Paket Asesmen' },
        },
        {
          path: 'assessment-vouchers',
          name: 'assessment-vouchers',
          component: () => import('@/views/dashboard/AssessmentVouchersView.vue'),
          meta: { requiresAuth: true, title: 'Voucher Asesmen', breadcrumb: 'Voucher Asesmen' },
        },
        {
          path: 'assessment-subscriptions',
          name: 'assessment-subscriptions',
          component: () => import('@/views/dashboard/AssessmentSubscriptionsView.vue'),
          meta: { requiresAuth: true, title: 'Langganan Sekolah', breadcrumb: 'Langganan Sekolah' },
        },
        {
          path: 'assessment-questions',
          name: 'assessment-questions',
          component: () => import('@/views/dashboard/AssessmentQuestionsView.vue'),
          meta: { requiresAuth: true, title: 'Bank Soal Asesmen', breadcrumb: 'Bank Soal Asesmen' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/profile/ProfileView.vue'),
          meta: { requiresAuth: true, title: 'Profil Saya', breadcrumb: 'Profil Saya' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'dashboard' } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Token present but user not loaded yet (fresh page load) → hydrate.
  if (auth.accessToken && !auth.user) {
    try {
      await auth.fetchMe()
    } catch (err) {
      const status = getErrorStatus(err)
      // 401 is handled by the interceptor (refresh or clear). Anything else: keep tokens, but we can't proceed.
      if (status === 401 || status === 403 || !auth.accessToken) {
        auth.clearSession()
        return to.meta.requiresAuth
          ? { name: 'login', query: { redirect: to.fullPath, reason: 'expired' } }
          : true
      }
      if (to.meta.requiresAuth) {
        return { name: 'login', query: { redirect: to.fullPath, reason: 'offline' } }
      }
      return true
    }
  }

  // Signed in with a non-admin role → sign out with a clear message (contract §2).
  if (auth.user && !auth.isAdmin) {
    auth.clearSession()
    return to.name === 'login' ? true : { name: 'login', query: { reason: 'forbidden' } }
  }

  const signedIn = auth.isAuthenticated && !!auth.user

  if (to.meta.requiresAuth && !signedIn) {
    return { name: 'login', query: to.fullPath !== '/dashboard' ? { redirect: to.fullPath } : {} }
  }
  if (to.meta.guestOnly && signedIn) {
    return { name: 'dashboard' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${APP_NAME}` : APP_NAME
})

export default router
