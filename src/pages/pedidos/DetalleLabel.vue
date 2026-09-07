<template>
  <div>
    <div class="text-xs text-gray-500">{{ label }}</div>
    <div class="text-slate-100">{{ value }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string }>()
</script>