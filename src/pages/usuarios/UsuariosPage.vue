<template>
  <div class="flex flex-col gap-5">
    <PageHeader>
      <n-button type="primary" :disabled="!auth.esAdmin" @click="abrirNuevo">+ Nuevo usuario</n-button>
    </PageHeader>

    <n-data-table :columns="columnas" :data="usuarios.items" :pagination="{ pageSize: 10 }" :loading="cargando" />

    <n-modal
      v-model:show="modal"
      preset="dialog"
      :title="editId ? 'Editar usuario' : 'Nuevo usuario'"
      positive-text="Guardar"
      negative-text="Cancelar"
      @positive-click="guardar"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div>
          <span class="text-xs text-gray-400 block mb-1">Nombre completo</span>
          <n-input v-model:value="nombre" placeholder="Ej. Ana Pérez" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Correo electrónico</span>
          <n-input v-model:value="email" placeholder="usuario@thaliana.com" :disabled="!!editId" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Usuario (opcional, para ingresar sin correo)</span>
          <n-input v-model:value="username" placeholder="Ej. ana-perez" />
        </div>
        <div v-if="!editId">
          <span class="text-xs text-gray-400 block mb-1">Contraseña temporal</span>
          <n-input v-model:value="password" type="password" show-password-on="click" placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <span class="text-xs text-gray-400 block mb-1">Rol</span>
          <n-select v-model:value="rol" :options="rolOptions" />
        </div>
        <div v-if="editId">
          <n-switch v-model:value="activo">
            <template #checked>Activo</template>
            <template #unchecked>Inactivo</template>
          </n-switch>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NText, NTag, NSpace, NButton, NIcon, useMessage } from 'naive-ui'
import { CreateOutline, TrashOutline } from '@vicons/ionicons5'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAuthStore } from '@/data/authStore'
import { useUsuarioStore } from '@/data/stores'
import { ROLES, etiquetaRol } from '@/domain/constants'
import type { Rol, Usuario } from '@/domain/models'

const message = useMessage()
const auth = useAuthStore()
const usuarios = useUsuarioStore()

const rolOptions = ROLES.map((r) => ({ label: r.etiqueta, value: r.nombre }))

const cargando = ref(false)
const modal = ref(false)
const editId = ref<string | null>(null)
const nombre = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const rol = ref<Rol>('collaborator')
const activo = ref(true)

async function cargarUsuarios() {
  cargando.value = true
  try {
    await usuarios.load()
  } finally {
    cargando.value = false
  }
}

cargarUsuarios()

function abrirNuevo() {
  editId.value = null
  nombre.value = ''
  email.value = ''
  username.value = ''
  password.value = ''
  rol.value = 'collaborator'
  activo.value = true
  modal.value = true
}

function abrirEditar(u: Usuario) {
  editId.value = u.id
  nombre.value = u.nombre
  email.value = u.email
  username.value = u.username ?? ''
  rol.value = u.rol
  activo.value = u.activo
  password.value = ''
  modal.value = true
}

function mostrarError(e: unknown, accion: string) {
  const msg = e instanceof Error ? e.message : `No se pudo ${accion} el usuario`
  const conPista = msg.includes('username')
    ? `${msg}. ¿Ejecutaste la migración supabase/0006_username.sql en el SQL Editor? Sin esa columna Supabase rechaza el guardado.`
    : msg
  message.error(conPista)
}

async function guardar() {
  if (editId.value) {
    try {
      await usuarios.update(
        editId.value,
        {
          nombre: nombre.value.trim(),
          username: username.value.trim() || undefined,
          rol: rol.value,
          activo: activo.value
        },
        { throwOnError: true }
      )
      message.success('Usuario actualizado')
    } catch (e) {
      mostrarError(e, 'actualizar')
      return
    }
  } else {
    if (!password.value || password.value.length < 6) {
      message.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    try {
      const requiereConfirmacion = await auth.crearUsuario(nombre.value, email.value, rol.value, password.value, username.value)
      message.success(
        requiereConfirmacion
          ? 'Usuario creado. Deberá confirmar su email antes de poder iniciar sesión.'
          : 'Usuario creado'
      )
    } catch (e) {
      mostrarError(e, 'crear')
      return
    }
  }
  modal.value = false
}

function eliminar(u: Usuario) {
  if (u.id === auth.usuario?.id) {
    message.error('No puedes eliminar tu propia cuenta')
    return
  }
  usuarios.remove(u.id)
  message.success('Usuario eliminado')
}

const columnas = computed(() => [
  { title: 'Nombre', key: 'nombre', minWidth: 180, render: (row: Usuario) => h(NText, { strong: true }, { default: () => row.nombre || '—' }) },
  { title: 'Correo', key: 'email', minWidth: 220, render: (row: Usuario) => h(NText, { depth: 2 }, { default: () => row.email }) },
  { title: 'Usuario', key: 'username', minWidth: 130, render: (row: Usuario) => h(NText, { depth: 2 }, { default: () => row.username || '—' }) },
  {
    title: 'Rol',
    key: 'rol',
    width: 140,
    render: (row: Usuario) =>
      h(NTag, { size: 'small', type: row.rol === 'admin' ? 'warning' : 'default', bordered: false }, { default: () => etiquetaRol(row.rol) })
  },
  {
    title: 'Estado',
    key: 'activo',
    width: 110,
    render: (row: Usuario) =>
      h(NTag, { size: 'small', type: row.activo ? 'success' : 'error', bordered: false }, { default: () => (row.activo ? 'Activo' : 'Inactivo') })
  },
  {
    title: 'Acciones',
    key: 'acciones',
    width: 150,
    render: (row: Usuario) =>
      h(NSpace, null, {
        default: () => [
          h(
            NButton,
            { size: 'tiny', onClick: () => abrirEditar(row) },
            { default: () => h(NIcon, { component: CreateOutline }) }
          ),
          h(
            NButton,
            {
              size: 'tiny',
              type: 'error',
              secondary: true,
              disabled: row.id === auth.usuario?.id,
              onClick: () => eliminar(row)
            },
            { default: () => h(NIcon, { component: TrashOutline }) }
          )
        ]
      })
  }
])
</script>