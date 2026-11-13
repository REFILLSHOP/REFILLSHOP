# Refills Shop V10 · vista previa recibida

Esta rama contiene el HTML que suministró el usuario el 13 de noviembre de 2026, optimizado únicamente al extraer 19 imágenes base64 a `/v10/media/` y sustituirlas por rutas absolutas. `window.RS_PREVIEW=true` permanece activo: esto es una **vista previa**, no un backend operativo.

El archivo principal de producción (`main/index.html`) permanece en mantenimiento hasta que el servidor real, autenticación, pagos y comprobantes estén verificados. No activar compras Central One ni simular confirmación bancaria como real.

Los archivos externos deben servirse bajo la raíz del mismo dominio; sin backend real las operaciones administrativas y compras no funcionan.
