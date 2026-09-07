<template>
  <div class="hidden" aria-hidden="true">
    <n-button size="small">OK</n-button>
    <n-tag size="small">OK</n-tag>
    <n-input size="small" placeholder="OK" />
    <n-select size="small" :options="[{ label: 'OK', value: 'ok' }]" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeVars, useMessage } from 'naive-ui'
import { brand } from '@/app/theme'

const props = defineProps<{ esOscuro: boolean }>()
const emit = defineEmits<{ (e: 'estado', s: { ok: boolean; fallos: string[] }): void }>()

/**
 * Sonda del puente de tema: monta una muestra representativa de componentes
 * Naive UI y verifica que las variables de tema leídas con useThemeVars
 * dentro del n-config-provider son correctas, avisando si algo se desconfigura.
 */
const vars = useThemeVars()
const message = useMessage()

function verificar() {
  const fallos: string[] = []
  const esperadoBody = props.esOscuro ? '#111827' : '#F5F5DC'

  if (!vars.value.primaryColor) fallos.push('primaryColor ausente (provider sin tema)')
  else if (vars.value.primaryColor !== brand) fallos.push(`primaryColor inesperado: ${vars.value.primaryColor} (esperado ${brand})`)

  if (!vars.value.bodyColor) fallos.push('bodyColor ausente (provider sin tema)')
  else if (vars.value.bodyColor !== esperadoBody) fallos.push(`bodyColor desconfigurado: ${vars.value.bodyColor} (esperado ${esperadoBody})`)

  if (!vars.value.textColorBase) fallos.push('textColorBase ausente')
  if (!vars.value.borderRadius) fallos.push('borderRadius ausente')

  return fallos
}

onMounted(() => {
  const fallos = verificar()
  emit('estado', { ok: fallos.length === 0, fallos })
  if (fallos.length > 0) {
    message.warning(`[ThemeBridge] render de Naive UI desconfigurado: ${fallos.join('; ')}`)
    console.warn('[ThemeBridge] Sonda de tema detectó un fallo:', fallos)
  }
})
</script>