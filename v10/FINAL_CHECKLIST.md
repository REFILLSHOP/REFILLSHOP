# Refills Shop V10 — cierre parcial comprobado (14/11/2026)

## Implementado y verificado
- Registro internacional con teléfono E.164 y contraseña, sin SMS obligatorio.
- Selector de país sin campo de prefijo manual; opciones legibles en Windows/Chromium.
- Bandeja ADM de registros nuevos, contactados y confirmados manualmente.
- Aviso de registro nuevo en el ADM (actualización automática mientras el panel esté abierto, cada 45 s).
- Botones WhatsApp y SMS: abren el borrador en el dispositivo del administrador. No se envían mensajes solos ni se marca contacto como enviado.
- Revisiones guardadas en Supabase en tabla solo accesible por backend con RLS; trigger inserta fila pendiente cuando se crea un perfil.
- Botón de panel ADM de demostración en preview. No accede a datos reales.
- Código de tests Node actualizado; sin ejecutar compras reales.

## No puede considerarse tienda lista para pagos aún
- La preview de Cloudflare es intencionalmente read-only; backend Node no está desplegado. Los botones de registrar, pedidos, wallet, admin y pagos necesitan un host de Node o adaptar el backend a Cloudflare Workers.
- Render solicitó facturación (HTTP 402), bloqueó creación de servicio gratuito.
- Faltan claves privadas de Central One y Supabase en un host backend seguro; no colocarlas en frontend, GitHub ni chat.
- No hay ofertas publicadas aún (rs5_offers = 0); no existe venta funcional sin ellas.
- No está comprobado un ciclo de pago/comprobante/entrega real; no activar pedidos y compras hasta probarlo.
- Google OAuth sigue pendiente; teléfono no verificado no permite recuperar contraseña automáticamente.
- Manualmente confirmar el registro **no** verifica la titularidad del número ni debe habilitar operaciones sensibles de Wallet.
- Para publicar internacionalmente medios de pago internacionales se deben configurar y probar primero.