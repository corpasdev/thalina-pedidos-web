import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('@/pages/dashboard/DashboardPage.vue') },
        { path: 'proveedores', name: 'proveedores', component: () => import('@/pages/proveedores/ProveedoresPage.vue') },
        { path: 'empresas', name: 'empresas', component: () => import('@/pages/empresas/EmpresasPage.vue') },
{ path: 'vendedores', name: 'vendedores', component: () => import('@/pages/vendedores/VendedoresPage.vue') },
        { path: 'productos', name: 'productos', component: () => import('@/pages/productos/ProductosPage.vue') },
        { path: 'pedidos', name: 'pedidos', component: () => import('@/pages/pedidos/PedidosPage.vue') },
        { path: 'pedidos/nuevo', name: 'pedido-nuevo', component: () => import('@/pages/pedidos/PedidoFormPage.vue') },
        { path: 'pedidos/:id/editar', name: 'pedido-editar', component: () => import('@/pages/pedidos/PedidoFormPage.vue'), props: true },
        { path: 'egresos', name: 'egresos', component: () => import('@/pages/egresos/EgresosPage.vue') }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})