<template>
  <div class="max-w-xl flex flex-col gap-5">
    <PageHeader title="Mi perfil" />

    <div
      class="rounded-2xl border shadow-lg p-6 flex flex-col gap-6 transition-colors"
      :class="esOscuro ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-200 bg-white'"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <n-avatar
          :size="72"
          round
          :src="auth.usuario?.avatarUrl || undefined"
          color="#FFD700"
          class="text-slate-900 !text-2xl font-bold shrink-0"
        >
          <template v-if="!auth.usuario?.avatarUrl">{{ inicial }}</template>
          <template #fallback>{{ inicial }}</template>
        </n-avatar>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <n-button size="small" secondary :loading="subiendo" @click="abrirSelector">Subir foto</n-button>
            <n-button v-if="auth.usuario?.avatarUrl" size="small" quaternary type="error" :loading="quitando" @click="quitarFoto">
              Quitar foto
            </n-button>
          </div>
          <span class="text-xs transition-colors" :class="esOscuro ? 'text-white/50' : 'text-gray-400'">
            JPG o PNG, máximo 2 MB
          </span>
          <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onArchivo" />
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div>
          <span class="text-xs text-gray-400 block mb-1">Nombre completo</span>
          <n-input v-model:value="nombre" placeholder="Tu nombre" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Usuario (para iniciar sesión sin correo)</span>
          <n-input v-model:value="username" placeholder="Ej. ana-perez" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Correo electrónico</span>
          <n-input :value="auth.usuario?.email ?? ''" disabled />
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400">Rol</span>
          <n-tag :bordered="false" size="small" :type="auth.rol === 'admin' ? 'warning' : 'default'">
            {{ etiquetaRol(auth.rol ?? 'collaborator') }}
          </n-tag>
          <n-tag v-if="!auth.usuario?.activo" :bordered="false" size="small" type="error">Inactivo</n-tag>
        </div>
        <n-button type="primary" :loading="guardando" :disabled="sinCambios" @click="guardar">
          Guardar cambios
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMessage } from 'naive-ui'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/data/authStore'
import { useTheme } from '@/composables/useTheme'
import { etiquetaRol } from '@/domain/constants'

const message = useMessage()
const auth = useAuthStore()
const { esOscuro } = useTheme()

const nombre = ref(auth.usuario?.nombre ?? '')
const username = ref(auth.usuario?.username ?? '')
const guardando = ref(false)
const subiendo = ref(false)
const quitando = ref(false)

const inicial = computed(() => {
  const n = auth.usuario?.nombre?.trim()
  if (n) return n.charAt(0).toUpperCase()
  return (auth.usuario?.email || '?').charAt(0).toUpperCase()
})

const sinCambios = computed(() => {
  const u = auth.usuario
  if (!u) return true
  return nombre.value.trim() === u.nombre && username.value.trim() === (u.username ?? '')
})

function mostrarError(e: unknown) {
  message.error(e instanceof Error ? e.message : 'No se pudo completar la acción')
}

async function guardar() {
  guardando.value = true
  try {
    await auth.actualizarPerfil({ nombre: nombre.value, username: username.value })
    message.success('Perfil actualizado')
  } catch (e) {
    mostrarError(e)
  } finally {
    guardando.value = false
  }
}

const fileInputRef = ref<HTMLInputElement | null>(null)
function abrirSelector() {
  fileInputRef.value?.click()
}

async function onArchivo(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    message.error('Selecciona un archivo de imagen')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    message.error('La imagen supera los 2 MB')
    return
  }
  subiendo.value = true
  try {
    await auth.cambiarAvatar(file)
    message.success('Foto de perfil actualizada')
  } catch (e) {
    mostrarError(e)
  } finally {
    subiendo.value = false
  }
}

async function quitarFoto() {
  quitando.value = true
  try {
    await auth.quitarAvatar()
    message.success('Foto de perfil eliminada')
  } catch (e) {
    mostrarError(e)
  } finally {
    quitando.value = false
  }
}
</script>