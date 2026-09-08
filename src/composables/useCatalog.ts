import { useEmpresaStore, useLineaStore, useVendedorStore, useMarcaStore, useProductoStore, usePedidoStore, useEgresoStore, useBorradorStore } from '@/data/stores'

/** Acceso centralizado a los repositorios por capa de presentación. */
export function useCatalog() {
  return {
    empresas: useEmpresaStore(),
    lineas: useLineaStore(),
    vendedores: useVendedorStore(),
    marcas: useMarcaStore(),
    productos: useProductoStore(),
    pedidos: usePedidoStore(),
    egresos: useEgresoStore(),
    borradores: useBorradorStore()
  }
}