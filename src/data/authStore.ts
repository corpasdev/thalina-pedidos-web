import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { PROFILES_COL } from '@/lib/supabaseSchema'
import type { Rol, Usuario } from '@/domain/models'
import { useUsuarioStore } from './stores'

const AVATAR_BUCKET = 'avatars'

const restablecerSesion = async (session: { access_token: string; refresh_token: string } | null) => {
  if (!session) return
  await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
}

/** Extrae la ruta dentro del bucket a partir de una URL pública de avatar. */
function rutaDeUrlAvatar(urlGuardada: string): string | null {
  try {
    const u = new URL(urlGuardada)
    const parts = u.pathname.split('/')
    const idx = parts.indexOf(AVATAR_BUCKET)
    if (idx < 0) return null
    const objeto = parts.slice(idx + 1).filter(Boolean).join('/')
    return objeto || null
  } catch {
    return null
  }
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

  /** Actualiza datos básicos del perfil del usuario logueado y refresca el estado local. */
  async function actualizarPerfil(patch: Partial<Pick<Usuario, 'nombre' | 'username' | 'avatarUrl'>>) {
    const id = usuario.value?.id
    if (!id) throw new Error('No hay usuario autenticado')
    const row: Record<string, unknown> = {}
    if (patch.nombre !== undefined) row.full_name = patch.nombre.trim()
    if (patch.username !== undefined) row.username = patch.username.trim() || null
    if ('avatarUrl' in patch) row.avatar_url = patch.avatarUrl || null
    if (Object.keys(row).length === 0) return

    const { error } = await supabase.from(PROFILES_COL.table).update(row).eq('id', id)
    if (error) throw error
    await cargarPerfil(id)

    const store = useUsuarioStore()
    const actual = store.items.find((u) => u.id === id)
    if (actual) await store.update(id, patch, { throwOnError: false })
  }

  async function subirAvatar(file: File): Promise<string> {
    const id = usuario.value?.id
    if (!id) throw new Error('No hay usuario autenticado')
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = `${id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type
    })
    if (error) throw error
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  /** Sube la foto, elimina la anterior (si era del bucket) y actualiza el perfil. */
  async function cambiarAvatar(file: File) {
    const anterior = usuario.value?.avatarUrl
    const url = await subirAvatar(file)
    await actualizarPerfil({ avatarUrl: url })
    if (anterior) {
      const objeto = rutaDeUrlAvatar(anterior)
      if (objeto) await supabase.storage.from(AVATAR_BUCKET).remove([objeto])
    }
  }

  /** Quita la foto del perfil y elimina el archivo del bucket. */
  async function quitarAvatar() {
    const anterior = usuario.value?.avatarUrl
    await actualizarPerfil({ avatarUrl: undefined })
    if (anterior) {
      const objeto = rutaDeUrlAvatar(anterior)
      if (objeto) await supabase.storage.from(AVATAR_BUCKET).remove([objeto])
    }
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

  return {
    usuario,
    cargando,
    autenticado,
    rol,
    esAdmin,
    init,
    login,
    logout,
    crearUsuario,
    actualizarPerfil,
    subirAvatar,
    cambiarAvatar,
    quitarAvatar
  }
})