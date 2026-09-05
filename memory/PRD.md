# INFLOW MKT — Product Requirements Document

## Original Problem Statement
Marketplace minimalista estilo Shopify con **sistema de saldo interno** para la empresa **INFLOW MKT**. Registro con email/contraseña, cada usuario tiene saldo, puede cargarlo (pasarela simulada), y al comprar se descuenta automáticamente. Si el saldo es insuficiente, se impide la compra con mensaje claro. Panel admin para cargar productos (con imagen). Estética neón/futurista sobre fondo oscuro. Testimonios en carrusel animado.

## User Choices
- Auth: Email + contraseña (JWT)
- Cargar saldo: pasarela de pago **simulada** (acredita al instante — MOCKED, sin dinero real)
- Admin: usuario admin fijo
- Imágenes de producto: subida de archivos (Emergent Object Storage)
- Logo: usa el logo adjunto (INFLOW)

## Architecture
- **Backend**: FastAPI + MongoDB (motor). JWT Bearer auth, bcrypt hashing. Emergent Object Storage para imágenes.
- **Frontend**: React 19 + Tailwind + shadcn/ui + framer-motion + react-fast-marquee. Auth via localStorage token (`inflow_token`).
- **Theme**: Electric & Neon dark (Outfit + Manrope fonts, verde neón/cian/magenta/azul).

## User Personas
- **Comprador**: se registra, carga saldo, compra productos en 1–2 clics.
- **Admin** (admin@inflowmkt.com): gestiona el catálogo (crear/eliminar productos con imágenes).

## Core Requirements (static)
1. Registro/login email+contraseña.
2. Saldo interno por usuario; carga simulada (tarjeta/QR/transferencia).
3. Compra descuenta saldo; bloquea si insuficiente.
4. Catálogo con imagen/nombre/descripción/precio/Comprar.
5. Panel admin con subida de imagen.
6. Panel de usuario: saldo, historial, cargar saldo.
7. Carrusel de 15 testimonios (auto, pausa al hover).
8. Responsive, estética neón.

## Implemented (2026-06)
- [x] JWT auth (register/login/me) + admin seeding — 2026-06
- [x] Product catalog (public list) + admin CRUD + image upload (Object Storage) — 2026-06
- [x] Wallet: topup (simulado), purchase con deducción + validación saldo insuficiente, transacciones — 2026-06
- [x] Páginas: Home (hero + destacados), Productos, Mi Cuenta, Cargar Saldo, Admin — 2026-06
- [x] 15 testimonios en carrusel animado (react-fast-marquee) — 2026-06
- [x] Diseño neón responsive con logo — 2026-06
- [x] Verificado por testing agent: backend 100%, frontend 100% — 2026-06

## Backlog (prioritized)
- P1: Detalle de producto / categorías y búsqueda
- P1: Editar productos existentes en el panel admin
- P2: Pago real (Stripe) para cargar saldo
- P2: Login social con Google
- P2: Comprobantes / recibos descargables de compra

## Next Tasks
- Recoger feedback del usuario sobre el diseño y flujo.
