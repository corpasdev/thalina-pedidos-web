import { computed, ref } from 'vue'
import { darkTheme, lightTheme, type GlobalThemeOverrides } from 'naive-ui'
import { themeOverrides, themeOverridesLight } from '@/app/theme'

export type ModoTema = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'thaliana:themeMode'

/** Modo elegido por el usuario. Se persiste en localStorage (valores antiguos se tratan como 'dark'). */
const modo = ref<ModoTema>(localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark')

/** Tema concreto resuelto: dark/light. */
const tema = computed<typeof darkTheme | typeof lightTheme>(() => (modo.value === 'light' ? lightTheme : darkTheme))

const esOscuro = computed(() => tema.value === darkTheme)

/** Overrides coherentes con el modo activo para no desconfigurar componentes. */
const overrides = computed<GlobalThemeOverrides>(() => (esOscuro.value ? themeOverrides : themeOverridesLight))

function cambiarModo(m: ModoTema) {
  modo.value = m
  localStorage.setItem(THEME_STORAGE_KEY, m)
}

/**
 * Único punto de acceso a la configuración de tema de la app.
 * Módulo singleton: cualquier componente (ThemeBridge, AppLayout, páginas)
 * comparte el mismo estado reactivo.
 */
export function useTheme() {
  return { modo, tema, esOscuro, overrides, cambiarModo }
}