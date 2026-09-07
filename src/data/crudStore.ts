import { shallowRef, type Ref } from 'vue'
import { defineStore } from 'pinia'

export interface CrudStore<T> {
  items: Ref<T[]>
  add: (item: T) => void
  update: (id: string, patch: Partial<T>) => void
  remove: (id: string) => void
  replace: (items: T[]) => void
}

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function createCrudStore<T extends { id: string }>(key: string) {
  const storageKey = `thaliana:${key}`
  return defineStore(key, (): CrudStore<T> => {
    const items = shallowRef<T[]>(load<T>(storageKey))

    function persist() {
      localStorage.setItem(storageKey, JSON.stringify(items.value))
    }
    function add(item: T) {
      items.value = [...items.value, item]
      persist()
    }
    function update(id: string, patch: Partial<T>) {
      items.value = items.value.map((i) => (i.id === id ? { ...i, ...patch } : i))
      persist()
    }
    function remove(id: string) {
      items.value = items.value.filter((i) => i.id !== id)
      persist()
    }
    function replace(list: T[]) {
      items.value = [...list]
      persist()
    }

    return { items, add, update, remove, replace }
  })
}