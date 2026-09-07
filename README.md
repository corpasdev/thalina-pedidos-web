# thalina-pedidos-web

Aplicación web para la **administración de pedidos y contabilización de egresos** de una tienda, construida con **Vue 3 + Vite + Naive UI** (tema oscuro) + Tailwind CSS.

## Funcionalidades

- **Empresas y marcas**: distingue *franquicias* (traen productos de varias marcas) de empresas *propias* (solo sus productos), con los días de la semana en que llegan (lunes a sábado).
- **Vendedores**: cada vendedor de una marca cubre una **línea** diferente de productos (alimentos, aseo, bebidas…), subcategorizando los pedidos de la misma empresa.
- **Productos**: catálogo con **SKU normalizado** para detectar el mismo producto pedido a varias marcas (evita repetir pedidos).
- **Pedidos**: creación por empresa → vendedor, con líneas, precios y **alerta de productos ya pedidos** en pedidos activos (tanto en borrador como guardados). Estados: Pendiente → Confirmado → En tránsito → Recibido / Cancelado.
- **Egresos**: contabilización de cada desembolso de pedido con forma de pago, totales del mes e histórico. Al crear un pedido se registra su egreso automáticamente.
- **Dashboard**: KPIs de egresos, pedidos activos, saldo por pagar, entregas próximas, stock crítico y repetidos detectados.

## Arquitectura (por capas)

```
src/
├── app/          Composición raíz: tema oscuro, providers y enrutador
├── components/   Componentes de UI y layout
├── composables/  Acceso centralizado a los repositorios
├── data/         Repositorios (Pinia + persistencia en localStorage)
├── domain/       Modelos de dominio, constantes de negocio y utilidades
├── pages/        Vistas (dashboard, empresas, vendedores, marcas, líneas, productos, pedidos, egresos)
├── services/     Reglas de negocio (duplicados, totales, KPI, egresos)
└── styles/       Tailwind CSS
```

## Desarrollo

```bash
npm install
npm run dev        # entorno local
npm run build      # compilación de producción
npm run typecheck  # verificación de tipos (vue-tsc)
npm run preview
```

Los datos persisten en `localStorage` del navegador.