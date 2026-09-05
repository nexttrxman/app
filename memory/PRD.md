# INFLOW MKT — Product Requirements Document

## Original Problem Statement
Marketplace minimalista con **sistema de saldo interno** para **INFLOW MKT / INFLOW SOCIAL AGENCY**. Registro con email/contraseña, cada usuario tiene saldo, puede cargarlo (pasarela simulada), y al comprar se descuenta automáticamente. Si el saldo es insuficiente, se impide la compra con mensaje claro. Panel admin para cargar productos (con imagen subida). Catálogo de paquetes de crecimiento social (Instagram, TikTok, YouTube, Combos) con búsqueda y filtros por categoría. Testimonios en carrusel animado. Estética neón acorde al logo.

## User Choices
- Auth: Email + contraseña (JWT)
- Cargar saldo: pasarela **SIMULADA** (acredita al instante — MOCKED, sin dinero real)
- Admin: usuario admin fijo
- Imágenes de producto: subida de archivos (Emergent Object Storage)
- Catálogo: mantener los 6 paquetes sociales
- Hero: **foto REAL de stock de una mujer** (influencer sonriente / retrato con luz neón). No imágenes generadas por IA.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). JWT Bearer, bcrypt. Emergent Object Storage para imágenes (`/api/upload`, `/api/files/{path}`).
- **Frontend**: React 19 + Tailwind + shadcn/ui + framer-motion + react-fast-marquee. Token en localStorage (`inflow_token`).
- Endpoints: `/api/auth/*`, `/api/products` (CRUD admin), `/api/categories`, `/api/upload`, `/api/wallet/topup`, `/api/wallet/purchase/{id}`, `/api/wallet/transactions`.

## Design System (rebuild 2026-06, iteración 3)
- Fondo `#07030f`, superficie `#110a1e`; acentos fucsia `#ff3dbe`, cian `#2ee6ff`, violeta `#9b5cff`.
- Tipografía: **Unbounded** (display) + **Outfit** (body).
- Utilidades en `index.css`: `.panel`, `.glass`, `.grain`, `.aurora-*`, `.hairline-grid`, `.text-shine`, `.eyebrow`, `fade-up`, `floaty`, `pulse-ring`.
- Hero split asimétrico: copy a la izquierda + foto real de mujer (Unsplash) en marco redondeado con badges flotantes (likes / seguidores / views / tendencia) y tarjeta "live" de compra reciente.

## Implemented
- [x] JWT auth (register/login/me) + admin seeding — 2026-06
- [x] Catálogo público + CRUD admin + subida de imágenes (Object Storage) — 2026-06
- [x] Billetera: topup simulado, compra con deducción, bloqueo por saldo insuficiente, historial — 2026-06
- [x] Páginas: Home, Productos, Mi Cuenta, Cargar Saldo, Admin — 2026-06
- [x] 15 testimonios en carrusel (react-fast-marquee) — 2026-06
- [x] Categorías + búsqueda + chips de filtro — 2026-06
- [x] **Rebuild visual completo con hero de foto real de mujer** (Unbounded/Outfit, auroras, glass, grain, framer-motion) — 2026-06
- [x] Home ampliada: strip de plataformas, sección "Cómo funciona" (3 pasos), footer de 4 columnas — 2026-06
- [x] Mi Cuenta con mini-stats (compras / total cargado) e historial en lista dividida — 2026-06
- [x] Verificado por testing agent iteración 3: backend 17/17, frontend 100%, sin overflow en móvil — 2026-06

## Backlog (prioritized)
- P1: Editar productos existentes en el panel admin + selector (dropdown) de categorías existentes
- P1: Página de detalle de producto con SEO/compartir
- P2: Pago real (Stripe) para cargar saldo
- P2: Comprobantes/recibos descargables
- P2: Self-hostear la imagen del hero (hoy es URL de Unsplash)
- P3: Guardia condicional de saldo en la compra (evitar carrera por doble click)

## Next Tasks
- Recoger feedback del usuario sobre el nuevo diseño y la foto principal.
