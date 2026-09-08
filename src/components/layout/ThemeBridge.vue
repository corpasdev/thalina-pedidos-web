<template>
  <n-config-provider
    :theme="tema"
    :theme-overrides="overrides"
    :locale="esES"
    :date-locale="dateEsES"
  >
    <n-global-style />
    <n-message-provider placement="bottom-right">
      <n-dialog-provider>
        <SondaTema :es-oscuro="esOscuro" @estado="sondaAt" />
        <slot />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { esES, dateEsES } from 'naive-ui'
import { useTheme, type ModoTema } from '@/composables/useTheme'
import SondaTema from './SondaTema.vue'

export type { ModoTema }
export interface EstadoSonda {
  ok: boolean
  fallos: string[]
}

const { tema, esOscuro, overrides, cambiarModo } = useTheme()

/** Resultado de la última verificación de la sonda de tema. */
const estadoSonda = ref<EstadoSonda | null>(null)
const sondaAt = (s: EstadoSonda) => (estadoSonda.value = s)

defineExpose({ tema, esOscuro, overrides, estadoSonda, cambiarModo })
</script>