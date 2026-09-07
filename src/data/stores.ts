import { createCrudStore } from './crudStore'
import type { Empresa, Linea, Vendedor, Marca, Producto, Pedido, Egreso, Duplicado } from '@/domain/models'

export const useEmpresaStore = createCrudStore<Empresa>('empresas')
export const useLineaStore = createCrudStore<Linea>('lineas')
export const useVendedorStore = createCrudStore<Vendedor>('vendedores')
export const useMarcaStore = createCrudStore<Marca>('marcas')
export const useProductoStore = createCrudStore<Producto>('productos')
export const usePedidoStore = createCrudStore<Pedido>('pedidos')
export const useEgresoStore = createCrudStore<Egreso>('egresos')
export const useDuplicadoStore = createCrudStore<Duplicado>('duplicados')