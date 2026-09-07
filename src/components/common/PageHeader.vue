<template>
  <div class="flex items-center justify-between gap-4 mb-6">
    <div class="flex items-center gap-3">
      <button v-if="back" @click="emit('back')" class="text-gray-400 hover:text-[#FFD700] text-lg px-2" aria-label="Volver">
        ←
      </button>
      <h1 class="text-2xl font-bold text-[#F5F5DC]">{{ title }}</h1>
    </div>
    <div class="flex items-center gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; back?: boolean }>()
const emit = defineEmits<{ (e: 'back'): void }>()
</script>