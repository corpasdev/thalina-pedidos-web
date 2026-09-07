<template>
  <ThemeBridge ref="bridgeRef">
    <router-view />
  </ThemeBridge>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ThemeBridge from '@/components/layout/ThemeBridge.vue'
</script>