# Registro con móvil cubano (sin SMS) — Refills Shop V10

**Estado:** implementado en rama de pruebas; requiere servicio Node.js desplegado con claves privadas y pruebas de integración reales antes de abrir registros al público.

## Flujo de acceso
- Cliente introduce nombre, móvil cubano de 8 dígitos que comience por 5 y contraseña de 10–72 caracteres con letras y números.
- El servidor valida y aplica límite de hasta cinco intentos de alta por IP y hora, además de un campo trampa básico.
- Se crea una identidad Supabase Auth con identificador de correo técnico (`cu53XXXXXXXX@refillshop.pages.dev`) y contraseña. Ese correo NO es real ni sirve para recuperación.
- Supabase Auth gestiona los hashes y tokens; el servidor nunca almacena la contraseña en tablas propias ni la devuelve.
- Se crea `rs5_profiles` con nombre y teléfono. Un índice UNIQUE impide que dos perfiles usen el mismo número.
- El cliente inicia sesión utilizando su teléfono, convertido internamente al identificador técnico.
- Google OAuth se conserva como opción **solo cuando esté habilitado**.

## Advertencias importantes
- **SIN SMS = número NO verificado**. En user_metadata `phone_verification` figura `unverified`. Nunca tratar ese número como prueba de identidad ni autorizar reembolsos, saldos o recuperaciones por este único dato.
- Quien se registre primero con un número podría impedir que su verdadero dueño lo registre: añadir verificación SMS o identidad antes del lanzamiento público es altamente recomendable.
- Recuperación de contraseña por SMS/Email no funciona para estas cuentas. Se requiere proceso de soporte con comprobaciones independientes o añadir verificación más adelante.
- No permitir cambiar el teléfono de acceso desde el perfil. Para corregirlo, el administrador debe disponer de una migración controlada de identidad.
- El rate limit en memoria funciona para **una instancia**; si se escala, sustituir por protección centralizada (Turnstile + rate limiting distribuido) antes de abrir alta pública.
- La web estática de Cloudflare Pages/GitHub Pages NO puede atender `POST /api/auth/phone-register`. Es obligatorio desplegar el backend `server.js` con HTTPS.
- En producción, mantener las claves `SUPABASE_SECRET_KEY` y otras credenciales solo en el servidor. Jamás en HTML, repositorio o navegador.

## Despliegue
- Aplicada migración `rs5_profiles_phone_unique` al proyecto Supabase `kcgjlnymhmxylrjchcvl` (14 nov 2026).
- Configurar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` y `COOKIE_SECURE=true` en alojamiento Node.js 22+.
- El origen del teléfono está preparado para `refillshop.pages.dev`. Si cambia el dominio público, mantener la convención de identificadores y no cambiarla para cuentas existentes.
- Validar en staging: registro, acceso posterior, salida y reingreso, duplicado, perfil, pedido y comprobante. No realizar compras reales durante esta prueba.