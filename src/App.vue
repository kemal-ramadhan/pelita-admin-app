<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

useTheme().initTheme()
</script>

<template>
  <RouterView />
  <ToastContainer />
  <ConfirmDialog />
</template>
