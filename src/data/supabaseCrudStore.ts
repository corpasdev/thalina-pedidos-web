import { shallowRef, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import type { DbCollection } from '@/lib/supabaseSchema'

export interface SupabaseCrudStore<T> {
  items: Ref<T[]>
  /** Aplica el cambio local de inmediato (optimista) y sincroniza a Supabase. */
  add: (item: T, opts?: { throwOnError?: boolean }) => Promise<void>
  update: (id: string, patch: Partial<T>, opts?: { throwOnError?: boolean }) => Promise<void>
  remove: (id: string, opts?: { throwOnError?: boolean }) => Promise<void>
  /** Reemplaza el estado local y hace upsert de todo el lote en la nube. */
  replace: (items: T[]) => Promise<void>
  /** Carga todas las filas de la tabla. */
  load: () => Promise<void>
}

function logError(table: string, op: string, error: unknown) {
  console.error(`[supabase:${table}] ${op}`, error)
}

const aError = (table: string, op: string, error: unknown) =>
  error instanceof Error ? error : new Error(`[supabase:${table}] ${op} falló: ${String(error ?? 'error desconocido')}`)

export function createSupabaseCrudStore<T extends { id: string }>(key: string, config: DbCollection<T>) {
  return defineStore(`sb_${key}`, (): SupabaseCrudStore<T> => {
    const items = shallowRef<T[]>([])

    async function load() {
      const { data, error } = await supabase.from(config.table).select('*')
      if (error) {
        logError(config.table, 'load', error)
        return
      }
      items.value = (data ?? []).map((r: Record<string, unknown>) => config.fromRow(r))
    }

    async function add(item: T, opts?: { throwOnError?: boolean }) {
      items.value = [...items.value, item]
      const { error } = await supabase.from(config.table).upsert(config.toRow(item))
      if (error) {
        logError(config.table, `add ${item.id}`, error)
        if (opts?.throwOnError) throw aError(config.table, `add ${item.id}`, error)
      }
    }

    async function update(id: string, patch: Partial<T>, opts?: { throwOnError?: boolean }) {
      const merged = items.value.map((i) => (i.id === id ? { ...i, ...patch } : i))
      const target = merged.find((i) => i.id === id)
      items.value = merged
      if (target) {
        const { error } = await supabase.from(config.table).upsert(config.toRow(target))
        if (error) {
          logError(config.table, `update ${id}`, error)
          if (opts?.throwOnError) throw aError(config.table, `update ${id}`, error)
        }
      } else {
        logError(config.table, `update ${id}`, 'id no encontrado localmente')
        if (opts?.throwOnError) throw new Error(`No se pudo actualizar: no se encontró el registro (${id})`)
      }
    }

    async function remove(id: string, opts?: { throwOnError?: boolean }) {
      items.value = items.value.filter((i) => i.id !== id)
      const { error } = await supabase.from(config.table).delete().eq('id', id)
      if (error) {
        logError(config.table, `remove ${id}`, error)
        if (opts?.throwOnError) throw aError(config.table, `remove ${id}`, error)
      }
    }

    async function replace(list: T[]) {
      items.value = [...list]
      if (list.length === 0) return
      const { error } = await supabase.from(config.table).upsert(list.map((i) => config.toRow(i)), { onConflict: 'id' })
      if (error) logError(config.table, `replace (${list.length})`, error)
    }

    return { items, add, update, remove, replace, load }
  })
}