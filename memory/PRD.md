# INFLOW MKT — Product Requirements Document

## Original Problem Statement
Marketplace minimalista con **sistema de saldo interno** para **INFLOW MKT / INFLOW SOCIAL AGENCY**. Registro con email/contraseña, cada usuario tiene saldo, puede cargarlo (pasarela simulada), y al comprar se descuenta automáticamente. Si el saldo es insuficiente, se impide la compra con mensaje claro. Panel admin para cargar productos (con imagen subida). Catálogo de paquetes de crecimiento social (Instagram, TikTok, YouTube, Combos) con búsqueda y filtros por categoría. Testimonios en carrusel animado. Estética neón acorde al logo.

## User Choices
- Auth: Email + contraseña (JWT)
- Cargar saldo: pasarela **SIMULADA** (acredita al instante — MOCKED, sin dinero real)
- Admin: usuario admin fijo
- Imágenes de producto: subida de archivos (Emergent Object Storage)
- Catálogo: mantener los 6 paquetes sociales
- Hero: **foto REAL de stock de una mujer** (influencer sonriente con luz neón). No imágenes IA.
- Cupones: se aplican **en el diálogo de confirmación de compra** y también **al cargar saldo** (bono de saldo extra). Controles: **porcentaje** + **un uso por usuario** (+ alcance compras/cargas/ambas y activar/pausar).
- Referidos: **bono de bienvenida** para el invitado ($5) + **comisión %** continua para quien invita (10% de cada compra). Se comparte con **código + link + botones WhatsApp/X/Instagram**.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). JWT Bearer, bcrypt. Emergent Object Storage (`/api/upload`, `/api/files/{path}`).
- **Frontend**: React 19 + Tailwind + shadcn/ui + framer-motion + react-fast-marquee. Token en localStorage (`inflow_token`); código de referido pendiente en `inflow_ref`.
- Endpoints: `/api/auth/*`, `/api/products`, `/api/categories`, `/api/upload`, `/api/wallet/topup`, `/api/wallet/purchase/{id}`, `/api/wallet/transactions`, `/api/coupons/validate`, `/api/admin/coupons` (CRUD), `/api/referrals/me`.
- Colecciones: users (con `referral_code`, `referred_by`), products, transactions (topup/purchase/bonus/referral), files, coupons, coupon_redemptions, referral_events.
- Constantes de negocio: `REFERRAL_WELCOME_BONUS = 5.0`, `REFERRAL_COMMISSION_PERCENT = 10.0`. Cupones seed: `INFLOW20` (20%, compras), `BIENVENIDA10` (10%, cargas).

## Design System (rebuild 2026-06)
- Fondo `#07030f`, superficie `#110a1e`; acentos fucsia `#ff3dbe`, cian `#2ee6ff`, violeta `#9b5cff`.
- Tipografía: **Unbounded** (display) + **Outfit** (body).
- Utilidades en `index.css`: `.panel`, `.glass`, `.grain`, `.aurora-*`, `.hairline-grid`, `.text-shine`, `.eyebrow`, `fade-up`, `floaty`, `pulse-ring`.
- Hero split asimétrico con foto real de mujer + badges flotantes (likes/seguidores/views) y tarjeta "compra reciente".

## Implemented
- [x] JWT auth (register/login/me) + admin seeding — 2026-06
- [x] Catálogo público + CRUD admin + subida de imágenes (Object Storage) — 2026-06
- [x] Billetera: topup simulado, compra con deducción, bloqueo por saldo insuficiente, historial — 2026-06
- [x] Categorías + búsqueda + chips de filtro — 2026-06
- [x] 15 testimonios en carrusel (react-fast-marquee) — 2026-06
- [x] Rebuild visual completo con hero de foto real de mujer — 2026-06 (testing agent iter. 3: backend 17/17, frontend 100%)
- [x] **Cupones de descuento**: diálogo de confirmación de compra con cupón, bono al cargar saldo, un uso por usuario, panel admin (crear/pausar/eliminar, contador de usos) — 2026-06
- [x] **Panel de referidos** (`/referidos`): código + link `?ref=`, copiar, compartir WhatsApp/X/Instagram, invitados y ganancias, bono de bienvenida y comisión 10% automática; campo de código en el registro autocompletado desde el link — 2026-06
- [x] Verificado por testing agent iteración 4: **backend 32/32, frontend 100%** — 2026-06

## Backlog (prioritized)
- P1: Editar productos existentes en el admin + selector de categorías existentes
- P1: Página de detalle de producto
- P2: Cupones con límite de usos totales y fecha de vencimiento
- P2: Ranking / niveles de referidos y retiro de comisiones
- P2: Pago real (Stripe) para cargar saldo
- P2: Comprobantes/recibos descargables o compartibles
- P3: Dividir `server.py` en routers y `Admin.js` en componentes; transacciones Mongo para compra + redención de cupón

## Next Tasks
- Recoger feedback del usuario sobre cupones y referidos.
