import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { PROFILES_COL } from '@/lib/supabaseSchema'
import type { Rol, Usuario } from '@/domain/models'
import { useUsuarioStore } from './stores'

const restablecerSesion = async (session: { access_token: string; refresh_token: string } | null) => {
  if (!session) return
  await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)
  const cargando = ref(true)

  const autenticado = computed(() => !!usuario.value && usuario.value.activo)
  const rol = computed<Rol | null>(() => (usuario.value ? usuario.value.rol : null))
  const esAdmin = computed(() => autenticado.value && rol.value === 'admin')

  async function cargarPerfil(id: string) {
    const { data, error } = await supabase.from(PROFILES_COL.table).select('*').eq('id', id).maybeSingle()
    if (error || !data) {
      usuario.value = null
      return
    }
    usuario.value = PROFILES_COL.fromRow(data as Record<string, unknown>)
  }

  async function init() {
    cargando.value = true
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      await cargarPerfil(data.session.user.id)
    } else {
      usuario.value = null
    }
    cargando.value = false

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        cargarPerfil(session.user.id)
      } else {
        usuario.value = null
      }
    })
  }

  /**
   * Inicia sesión con correo O username (si el texto no tiene @ se resuelve
   * el email desde profiles vía función pública email_por_username).
   */
  async function login(identificador: string, password: string) {
    const id = identificador.trim()
    let email = id
    if (!id.includes('@')) {
      const { data, error } = await supabase.rpc('email_por_username', { p_username: id })
      if (error || typeof data !== 'string' || !data) {
        throw new Error('Credenciales incorrectas')
      }
      email = data
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) await cargarPerfil(data.user.id)

    if (!usuario.value) {
      await supabase.auth.signOut()
      throw new Error('Tu cuenta no tiene perfil asignado. Contacta al administrador.')
    }
    if (!usuario.value.activo) {
      await supabase.auth.signOut()
      throw new Error('Tu cuenta está desactivada. Contacta al administrador.')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    usuario.value = null
  }

  /**
   * Crea un usuario (admin). Protege la sesión actual: guarda la sesión del
   * admin, hace signUp (que autologuera al nuevo usuario), restaura la sesión
   * del admin e inserta el perfil. Si "Confirm email" está ON no autologuera;
   * se devuelve `requiereConfirmacion` para informar al admin.
   * Devuelve true si el proyecto tiene "Confirm email" ON.
   */
  async function crearUsuario(nombre: string, email: string, rolUsuario: Rol, password: string, username?: string) {
    const { data: prevData } = await supabase.auth.getSession()
    const prev = prevData.session

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: nombre.trim(), rol: rolUsuario } }
    })

    if (error || !data.user) {
      await restablecerSesion(prev)
      if (error?.status === 500) {
        throw new Error(
          'Supabase respondió 500 al crear el usuario. Causa más común: "Confirm email" está ON ' +
            'en Supabase → Authentication y no hay SMTP configurado. Ve a Supabase Dashboard → ' +
            'Authentication → Providers: desactiva "Confirm email", o configura SMTP. ' +
            `Detalle: ${error.message}`
        )
      }
      throw error ?? new Error('No se pudo crear el usuario')
    }

    const requiereConfirmacion = data.session === null

    // Restaurar sesión del admin antes de insertar (RLS exige rol admin)
    await restablecerSesion(prev)

    const usuarioNuevo: Usuario = {
      id: data.user.id,
      email: email.trim(),
      username: username?.trim() || undefined,
      nombre: nombre.trim(),
      rol: rolUsuario,
      activo: true,
      creadoEn: new Date().toISOString()
    }
    const { error: perfilError } = await supabase.from(PROFILES_COL.table).insert(PROFILES_COL.toRow(usuarioNuevo))
    if (perfilError) throw perfilError

    useUsuarioStore().add(usuarioNuevo)
    return requiereConfirmacion
  }

  return { usuario, cargando, autenticado, rol, esAdmin, init, login, logout, crearUsuario }
})