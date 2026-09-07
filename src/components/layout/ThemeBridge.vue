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
        <SondaTema :es-oscuro="esOscuro" @estado="(s) => (estadoSonda = s)" />
        <slot />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, ref, type Ref, type ComputedRef } from 'vue'
import { darkTheme, lightTheme, useOsTheme, esES, dateEsES, type GlobalThemeOverrides } from 'naive-ui'
import { themeOverrides, themeOverridesLight } from '@/app/theme'
import SondaTema from './SondaTema.vue'

export type ModoTema = 'dark' | 'light' | 'system'
export interface EstadoSonda {
  ok: boolean
  fallos: string[]
}

const STORAGE_KEY = 'thaliana:themeMode'

/** Tema declarado por el sistema operativo (useOsTheme). */
const osTheme = useOsTheme()

/** Modo elegido ('system' sigue al SO). Se persiste en localStorage. */
const modo = ref<ModoTema>((localStorage.getItem(STORAGE_KEY) as ModoTema) || 'dark')

/** Tema concreto resuelto: dark/light según modo + SO. */
const tema: ComputedRef<typeof darkTheme | typeof lightTheme> = computed(() => {
  if (modo.value === 'system') return osTheme.value === 'dark' ? darkTheme : lightTheme
  return modo.value === 'light' ? lightTheme : darkTheme
})

const esOscuro = computed(() => tema.value === darkTheme)

/** Overrides coherentes con el modo activo para no desconfigurar componentes. */
const overrides: ComputedRef<GlobalThemeOverrides> = computed(() =>
  esOscuro.value ? themeOverrides : themeOverridesLight
)

/** Resultado de la última verificación de la sonda. */
const estadoSonda = ref<EstadoSonda | null>(null)

function cambiarModo(m: ModoTema) {
  modo.value = m
  localStorage.setItem(STORAGE_KEY, m)
}

const estadoRef: Ref<EstadoSonda | null> = estadoSonda

defineExpose({ modo, tema, esOscuro, overrides, estadoRef, cambiarModo })
</script>