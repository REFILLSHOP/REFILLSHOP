# Despliegue V10

Esta carpeta es la raíz del backend Node.js y del sitio. Requiere Node 22+ y HTTPS.

## Render
- Repository: REFILLSHOP/REFILLSHOP
- Branch: deploy/refills-v10-render
- Root Directory: v10
- Build Command: npm test && npm install
- Start Command: npm start
- Environment: cargar las variables de `.env.example` como variables privadas del servicio.
- COOKIE_SECURE=true.
- No habilitar CENTRALONE_ORDER_ENABLED hasta cargar claves catalog:read, orders:write y orders:read, y probar el flujo de verificación manual del pago.

El servicio debe permanecer activo y tener HTTPS estable para manejar pedidos y cookies. El plan gratuito puede suspenderse por inactividad; no es recomendable para operar recargas en producción.
