# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on http://localhost:3000
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test runner is configured. Lighthouse and axe-core are available as devDependencies for manual audits.

## Architecture

React 18 + Vite 7 + Tailwind CSS + Supabase (PostgreSQL, Auth, Storage, Realtime).

### Routing

React Router DOM v7 (BrowserRouter) in `src/AppRouter.jsx`. Main routes:
- `/` → Landing Page (`LandingPage.jsx`)
- `/catalogo` → public catalog (`App.jsx`)
- `/admin/*` → admin panel (lazy-loaded, multiple sub-routes)
- `/registro` → public registration by invite token

Admin access gated by Supabase Auth session + RBAC via `PermissionsContext` (reads role from `profiles` table). `VITE_ADMIN_EMAILS` is a secondary allowlist. `vercel.json` includes the SPA rewrite so all routes resolve to `index.html`.

### Data flow

- **Products**: Fetched from Supabase `productos` table via `useProductos` hook with Realtime subscriptions (INSERT/UPDATE/DELETE). No polling.
- **Cart**: Client-side only, persisted in localStorage via `useCarrito` hook.
- **Orders**: Submitted to Supabase `pedidos` table, then a WhatsApp message is generated with order details via `src/utils/whatsapp.js`.
- **Wholesale pricing**: `precios_mayoreo` JSONB column on productos, calculated by `src/utils/precios.js` → `obtenerPrecioAplicable()`.

### Supabase

Client singleton in `src/lib/supabase.js`. Admin operations in `src/lib/productosAdmin.js` and `src/lib/configAdmin.js`. Security relies on Row-Level Security policies (schema in `supabase_setup.sql`). The `admins` table controls write access.

### Business config

Store name, WhatsApp number, address, hours — all from `VITE_*` env vars. See `.env.example`. The `src/data/productos.js` file has dynamic category/brand/size registries populated at runtime from DB data.

### PWA

Service Worker at `public/sw.js` with Network First for navigation/scripts, Cache First for images (LRU, max 150). Manifest at `public/manifest.json`. Install prompt logic in `src/hooks/usePWA.js`.

### Code splitting

Vite manual chunks: `vendor` (React), `icons` (lucide-react), `supabase`. Admin panel is `React.lazy()` loaded.

## Conventions

- Language: UI text is in Spanish (Mexican market). Code (variables, comments) mixes Spanish and English.
- Styling: Tailwind utility classes. Custom theme in `tailwind.config.js` with `ink`, `cream`, `gold`, `fiesta` color palettes.
- State: React hooks only — no state management library. Supabase for server state, localStorage for cart.
- Components: Flat structure in `src/components/`, reusable UI pieces in `src/components/ui/`.
- Phone validation: Mexico-specific format in `src/utils/validarTelefono.js`.
