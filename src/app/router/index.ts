import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/data/authStore'
import { initializeCatalogFromCloud } from '@/data/supabaseInit'

let authInicializado = false
let catalogoCargado = false

async function asegurarAuth() {
  const auth = useAuthStore()
  if (!authInicializado) {
    authInicializado = true
    await auth.init()
  }
  return auth
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { publico: true }
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('@/pages/dashboard/DashboardPage.vue') },
        { path: 'proveedores', name: 'proveedores', component: () => import('@/pages/proveedores/ProveedoresPage.vue') },
        { path: 'empresas', name: 'empresas', component: () => import('@/pages/empresas/EmpresasPage.vue') },
        { path: 'vendedores', name: 'vendedores', component: () => import('@/pages/vendedores/VendedoresPage.vue') },
        { path: 'productos', name: 'productos', component: () => import('@/pages/productos/ProductosPage.vue') },
        { path: 'pedidos', name: 'pedidos', component: () => import('@/pages/pedidos/PedidosPage.vue') },
        { path: 'pedidos/nuevo', name: 'pedido-nuevo', component: () => import('@/pages/pedidos/PedidoFormPage.vue') },
        { path: 'pedidos/:id/editar', name: 'pedido-editar', component: () => import('@/pages/pedidos/PedidoFormPage.vue'), props: true },
        { path: 'egresos', name: 'egresos', component: () => import('@/pages/egresos/EgresosPage.vue') },
        { path: 'usuarios', name: 'usuarios', component: () => import('@/pages/usuarios/UsuariosPage.vue'), meta: { roles: ['admin'] } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

router.beforeEach(async (to) => {
  const auth = await asegurarAuth()

  if (to.meta.publico) {
    if (auth.autenticado && to.name === 'login') return { name: 'dashboard' }
    return true
  }

  if (!auth.autenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const roles = to.meta.roles as string[] | undefined
  if (roles && auth.rol && !roles.includes(auth.rol)) {
    return { name: 'dashboard' }
  }

  if (!catalogoCargado) {
    catalogoCargado = true
    await initializeCatalogFromCloud()
  }

  return true
})

export default router