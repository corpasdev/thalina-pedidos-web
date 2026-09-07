<template>
  <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="text-xs uppercase tracking-wide text-gray-400">{{ label }}</span>
      <span class="inline-grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br text-gray-300 to-transparent" :class="accentClass">
        <slot name="icon" />
      </span>
    </div>
    <div class="text-2xl font-bold text-[#F5F5DC] truncate">{{ value }}</div>
    <div v-if="hint" class="text-xs text-gray-500">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ label: string; value: string; hint?: string; accent?: 'green' | 'sky' | 'amber' | 'rose' | 'violet' }>(), { accent: 'green' })

const ACCENTS: Record<string, string> = {
  green: 'from-[#00A86B]/30 text-[#2ED5A0]',
  sky: 'from-sky-500/20 text-sky-400',
  amber: 'from-amber-500/20 text-amber-400',
  rose: 'from-rose-500/20 text-rose-400',
  violet: 'from-violet-500/20 text-violet-400'
}

const accentClass = computed(() => ACCENTS[props.accent] ?? ACCENTS.green)
</script>