# thalina-pedidos-web

Aplicación web para la **administración de pedidos y contabilización de egresos** de una tienda, construida con **Vue 3 + Vite + Naive UI** (tema oscuro) + Tailwind CSS.

## Funcionalidades

- **Empresas y marcas**: distingue *franquicias* (traen productos de varias marcas) de empresas *propias* (solo sus productos), con los días de la semana en que llegan (lunes a sábado).
- **Vendedores**: cada vendedor de una marca cubre una **línea** diferente de productos (alimentos, aseo, bebidas…), subcategorizando los pedidos de la misma empresa.
- **Productos**: catálogo con **SKU normalizado** para detectar el mismo producto pedido a varias marcas (evita repetir pedidos).
- **Pedidos**: creación por empresa → vendedor, con líneas, precios y **alerta de productos ya pedidos** en pedidos activos. Se preparan como **borrador** (estado temporal, sin vendedor aún) y luego se convierten en pedido. Estados: Borrador → Pendiente → Confirmado → En tránsito → Recibido / Cancelado.
- **Egresos**: contabilización de cada desembolso de pedido con forma de pago, totales del mes e histórico. Al crear un pedido se registra su egreso automáticamente.
- **Dashboard**: KPIs de egresos, pedidos activos, saldo por pagar, entregas próximas, stock crítico y repetidos detectados.
- **Usuarios y roles (login)**: acceso con **correo o username** y contraseña. Dos roles: **Administrador** (gestiona usuarios/roles y todo lo demás) y **Colaborador** (sin acceso a la gestión de usuarios).

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

Los datos persisten en Supabase (fuente de verdad) y el catálogo se sincroniza tras iniciar sesión.

## Autenticación y roles

1. Ejecuta las migraciones de `supabase/` en el SQL Editor (en orden):
   `schema.sql` → `0002_english_names.sql` → `0003_split_arrival_days.sql` → `0004_auth_roles.sql` → `0005_seed_superadmin.sql` → `0006_username.sql` → `0007_drafts_as_order_status.sql`.
2. En Supabase **Auth → Settings**:
   - **Confirm email**: OFF (el admin crea cuentas con contraseña temporal).
   - **Allow new users to sign up**: ON (lo usa el admin al crear usuarios).
3. El primer usuario debe insertarse a mano (o crearse y asignarse rol `admin` en `profiles`),
   porque el rol **Administrador** es el único que puede crear/editar usuarios en la sección **Usuarios**.
4. El login acepta **correo o username** (username opcional, único y sin distinguir mayúsculas). La resolución
   username→email la hace la función `public.email_por_username` (SECURITY DEFINER, funciona desde el login).
5. El control de acceso es **por vistas** (rutas y menú según rol), no por filas de datos.