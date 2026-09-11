<template>
  <motion.div
    class="flex items-center justify-between gap-4 mb-6"
    :initial="{ opacity: 0, y: -8 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.22, ease: 'easeOut' }"
  >
    <div v-if="title || back" class="flex items-center gap-3">
      <button v-if="back" @click="emit('back')" class="text-gray-400 hover:text-[#FFD700] text-lg px-2" aria-label="Volver">
        ←
      </button>
      <h1 v-if="title" class="text-2xl font-bold transition-colors" :class="esOscuro ? 'text-[#F5F5DC]' : 'text-slate-800'">{{ title }}</h1>
    </div>
    <div class="relative flex items-center gap-3">
      <slot />
    </div>
  </motion.div>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import { useTheme } from '@/composables/useTheme'

const { esOscuro } = useTheme()
defineProps<{ title?: string; back?: boolean }>()
const emit = defineEmits<{ (e: 'back'): void }>()
</script>