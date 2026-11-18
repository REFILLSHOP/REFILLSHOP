# Refills Shop — Cloudflare Worker + Supabase Edge (sin Render)

## Estado de implementación comprobado

- Frontend en `refills-shop-v10-activo.refills-shop-preview.workers.dev`, Worker `refills-shop-v10-activo`.
- API real en Supabase Edge Function `rs10-api`, project `kcgjlnymhmxylrjchcvl`.
- GET `/api/health`, `/api/bootstrap`, `/api/storefront`, `/api/client-config` habilitados.
- POST `/api/auth/phone-register`, GET `/api/profile`, GET `/api/orders` habilitados.
- Registro + inicio de sesión con una cuenta temporal de prueba verificados usando navegador, después cuenta temporal eliminada.
- Supabase migrations: `rs10_signup_rate_limit_service_only`; tabla `rs10_signup_rate_limits` y RPC restringida a service_role.
- Otros endpoints de escritura (compras, pagos, wallet, pedidos nuevos, admin) devuelven HTTP 503 expresamente.
- El Worker actual hace fetch de recursos estáticos del commit fijado de GitHub. Esto es solo una etapa de integración. Para producción, hay que publicar los assets estáticos en Cloudflare Pages o Workers Static Assets con versionado dentro de Cloudflare; no depender de GitHub raw.

## Instrucciones importantes de seguridad

**No cambiar a producción antes de completar:**
1. Importar ofertas verificadas desde Central One (0 ofertas al verificar).
2. Configurar credenciales privadas de Central One en Secrets (no en GitHub, frontend, logs ni chat).
3. Crear y probar sistema de administración real con control de roles.
4. Proteger el registro sin SMS contra registros automatizados (Turnstile + rate limiting). El número se considera `unverified` y no acredita titularidad ni concede saldo.
5. Implementar y probar POST pedidos con comprobante privado, validación del precio en servidor, idempotencia, y aprobación manual del pago.
6. Verificar por separado, tras aprobación manual, compras y consultas al proveedor; confirmar registro en DB e idempotencia ante reintentos.
7. Revisar pagos internacionales, precios, devoluciones y cumplimiento aplicable.
8. Ejecutar pruebas E2E (PC/móvil) con cuentas de pruebas; no usar la tarjeta o dinero del cliente.

## Arquitectura

`Navegador` → `Cloudflare Worker (/api proxy)` → `Supabase Edge Function rs10-api` → `Supabase Auth / PostgREST`.

`/health` y `/api/health` indican expresamente `payments:false`.

La web principal `refillshop.pages.dev` sigue en mantenimiento y no debe sustituirse por esta preproducción.