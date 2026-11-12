# Refills Shop · despliegue de pruebas

Esta rama fue creada para desplegar la versión V10 sin tocar `main`.

## Estado (12 de noviembre de 2026)

- Se añadió `deploy-preview/server.js`, un servidor de diagnóstico que responde `GET /` y `GET /health`. No recibe pedidos ni pagos.
- Se probó crear `refills-shop-v10-staging` en Render con plan `free` y la API devolvió HTTP 402: *Payment information is required to complete this request*.
- **No se creó ningún servicio en Render. No se generó ningún cobro.**
- El backend V10 real no está aún alojado en esta rama. No sustituir la web de producción ni activar ventas a través de este servidor de diagnóstico.
- La versión V10 completa está preservada como `Refills_Shop_V10_Completo.zip` en la biblioteca de archivos del usuario.
- El proyecto Supabase `kcgjlnymhmxylrjchcvl` tiene bucket privado `rs5-receipts` (JPG/PNG/WEBP, 3 MB).
- Compras a Central One permanecerán desactivadas hasta configurar clave nueva en servidor HTTPS con pagos verificados; Google OAuth pendiente de credenciales del propietario.

## Verificación sin riesgos
```sh
node deploy-preview/server.js
curl http://localhost:10000/health
```
La respuesta debe indicar `payments:false` y `supplierPurchases:false`.

## Render
Repo: `https://github.com/REFILLSHOP/REFILLSHOP.git`  
Rama: `deploy/refills-v10-render`  
Runtime: Node; build `echo ok`; start `node deploy-preview/server.js`; plan `free`.

Si se completa la verificación de facturación de Render, cambiar el start command al backend V10 **solo después de subir el código real y sus assets a la rama**, configurar secretos privados y ejecutar pruebas de compras manuales.

No copiar claves ni archivos `.env` a GitHub.
