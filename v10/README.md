# Refills Shop V10 — rama de despliegue

## Estado comprobado (14 nov 2026)
- Código Node.js V10 y cliente web ubicados en esta carpeta; Node >=22.
- Supabase REFILLSHOP: `kcgjlnymhmxylrjchcvl`, estado ACTIVE_HEALTHY.
- Migraciones v7, v10 y los índices de claves foráneas están aplicados.
- Bucket Storage `rs5-receipts`: existe, privado, máximo 3 MB, JPG/PNG/WEBP.
- Hay 6 juegos, 0 ofertas, 0 pedidos, 0 perfiles y 0 wallets. No hay ofertas ficticias.
- Función pública `rs7-storefront`: ACTIVE. El servidor Node sigue siendo necesario para ADM, pedidos, comprobantes y Central One.
- Rama de despliegue: `deploy/refills-v10-render`; `main` se mantiene intacta.

## Servidor
- Runtime: Node.js 22 o superior.
- Root directory del servicio: `v10`.
- Build command: `npm test && npm install`.
- Start command: `npm start`.
- HTTPS obligatorio en producción; configurar `COOKIE_SECURE=true`.
- No publicar `.env`. Usa variables privadas del host.

Variables:
- `SUPABASE_URL` = `https://kcgjlnymhmxylrjchcvl.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = clave publicable del proyecto (no es secreta).
- `SUPABASE_SECRET_KEY` = clave privada server-side; nunca en navegador/GitHub.
- `ADMIN_PASSWORD` = contraseña nueva, larga y única.
- `SESSION_SECRET` = secreto aleatorio de al menos 32 bytes.
- `COOKIE_SECURE=true` en HTTPS.
- `ENABLE_GOOGLE_LOGIN=false` hasta completar OAuth.
- `CENTRALONE_ORDER_ENABLED=false` hasta probar catálogo, pago manual y controles de idempotencia.

## Central One — permisos exactos
La API del proveedor exige scopes separados:
- `CENTRALONE_CATALOG_API_KEY`: permiso `catalog:read` (GET /catalog y validación opcional).
- `CENTRALONE_ORDER_API_KEY`: permiso `orders:write` (POST /orders; gasta saldo del proveedor).
- `CENTRALONE_STATUS_API_KEY`: permiso `orders:read` (GET /orders/{id} para conciliación).

El servidor permite `CENTRALONE_API_KEY` como fallback compartido, pero es preferible crear tres claves con permisos mínimos. Para activar compras hacen falta las tres. No añadir `codes:read`: la tienda no entrega códigos de gift card automáticamente.

Catálogo:
1. Configura primero solo `CENTRALONE_CATALOG_API_KEY`.
2. Entra a `/admin/offers` → Central One → Leer productos.
3. Importa un producto o familia disponible, vincúlalo a un juego y establece ganancia SM.
4. Usa Actualizar costos para sincronizar precio y stock.

Compras:
- El pago manual debe comprobarse fuera de la captura (saldo recibido / banco / procesador).
- Solo el ADM puede marcar el pago como verificado y enviar una única compra con Idempotency-Key.
- Si la respuesta del proveedor es incierta, el pedido queda en revisión; NO repetir la compra. Consultar estado con `orders:read`.
- No hay verificación bancaria automática implementada.

## Google OAuth
1. Crear OAuth Client tipo Web en Google Cloud.
2. Authorized redirect URI: `https://kcgjlnymhmxylrjchcvl.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → Providers → Google: pegar Client ID y Client Secret y activar.
4. Supabase → Authentication → URL Configuration: Site URL y Redirect URLs con el dominio HTTPS real.
5. Cuando la prueba de inicio y retorno funcione, poner `ENABLE_GOOGLE_LOGIN=true` en el host y reiniciar.

El Client Secret se guarda en Supabase Auth Provider, no en el JavaScript del cliente. El servidor solo utiliza la bandera ENABLE_GOOGLE_LOGIN.

## Pedidos y comprobantes
- Bucket privado `rs5-receipts` ya existe (3 MB, JPG/PNG/WEBP).
- El cliente sube comprobantes a través del backend; el ADM descarga mediante ruta autenticada.
- La captura no constituye confirmación automática del pago.
- Los estados de pedido y las compras a proveedor son operaciones separadas.

## Pruebas
Desde esta carpeta: `npm test` y `npm start`. Abrir `/admin` para el panel. Cambiar cualquier contraseña temporal antes de producción.

## Pendiente externo
- Claves Central One nuevas aún no están configuradas.
- Google OAuth necesita Client ID/Secret del propietario.
- No hay procesador bancario conectado para verificar pagos automáticamente.
- El hosting Node.js aún no está desplegado; GitHub Pages/Cloudflare Pages estático por sí solo no ejecuta este servidor Node.
