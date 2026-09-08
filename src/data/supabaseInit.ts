import { useEmpresaStore, useLineaStore, useVendedorStore, useMarcaStore, useProductoStore, usePedidoStore, useEgresoStore, useDuplicadoStore, useBorradorStore } from './stores'

/** Carga todas las colecciones desde Supabase antes de montar la app. */
export async function initializeCatalogFromCloud() {
  const loads = [
    useEmpresaStore().load(),
    useLineaStore().load(),
    useVendedorStore().load(),
    useMarcaStore().load(),
    useProductoStore().load(),
    usePedidoStore().load(),
    useEgresoStore().load(),
    useDuplicadoStore().load(),
    useBorradorStore().load()
  ]
  await Promise.all(loads)
}