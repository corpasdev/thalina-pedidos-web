import { createSupabaseCrudStore } from './supabaseCrudStore'
import {
  EMPRESAS_COL,
  LINEAS_COL,
  VENDEDORES_COL,
  MARCAS_COL,
  PRODUCTOS_COL,
  PEDIDOS_COL,
  EGRESOS_COL,
  DUPLICADOS_COL,
  PROFILES_COL
} from '@/lib/supabaseSchema'
import type { Empresa, Linea, Vendedor, Marca, Producto, Pedido, Egreso, Duplicado, Usuario } from '@/domain/models'

export const useEmpresaStore = createSupabaseCrudStore<Empresa>('empresas', EMPRESAS_COL)
export const useLineaStore = createSupabaseCrudStore<Linea>('lineas', LINEAS_COL)
export const useVendedorStore = createSupabaseCrudStore<Vendedor>('vendedores', VENDEDORES_COL)
export const useMarcaStore = createSupabaseCrudStore<Marca>('marcas', MARCAS_COL)
export const useProductoStore = createSupabaseCrudStore<Producto>('productos', PRODUCTOS_COL)
export const usePedidoStore = createSupabaseCrudStore<Pedido>('pedidos', PEDIDOS_COL)
export const useEgresoStore = createSupabaseCrudStore<Egreso>('egresos', EGRESOS_COL)
export const useDuplicadoStore = createSupabaseCrudStore<Duplicado>('duplicados', DUPLICADOS_COL)
export const useUsuarioStore = createSupabaseCrudStore<Usuario>('usuarios', PROFILES_COL)