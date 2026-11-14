# Refills Shop — Catálogo profesional y Central One

## Acceso

Desde la V10 conectada: inicia sesión como ADM y abre **Administración → Juegos y ofertas**.

## Cómo crear juegos y ofertas

1. En **Crear juego**, introduce nombre, categoría e imagen opcional. El identificador se genera al escribir el nombre. Guarda el juego.
2. En **Conexiones**, entra con tu llave API de Central One con el permiso `catalog:read`. El backend la prueba con `GET /api/v1/ping` antes de guardar, y la almacena cifrada en **Supabase Vault**. El navegador nunca vuelve a recibir la llave. Si ya hay una llave en el portal pero no guardaste el valor, Central One solo la muestra una vez: crea otra desde tu cuenta. **No pegues llaves en el chat ni en GitHub**.
3. En **Juegos y ofertas**, busca por juego, región o SKU, elige la oferta real, selecciona tu juego y escribe tu ganancia en SM. El servidor toma el precio, UUID, familia, stock y requisitos del jugador desde el API del proveedor.
4. **Guardar oferta vinculada** guarda un borrador seguro en Supabase. Puede editarse la ganancia y archivarse sin eliminar el historial.

## Fórmulas retomadas del index.html anterior de GitHub

- Costo proveedor en USDT: `C` (4 decimales en la API).
- Tasa global de compra SM por USDT: `R` (configurable en ADM).
- Ganancia de la oferta en SM: `G` (configurable por oferta).
- Precio final normal SM: `round(C * R + G, 2)`.
- Precio final normal CUP: `round(precioSM * CUP_por_SM, 2)`.
- Precio final normal USDT: `round(precioSM / R, 2)`.
- Precio final de revendedor: `round(C * 1.02, 2)` USDT (costo más 2 %, ocultando el costo y el origen del porcentaje a los clientes).

Los precios se calculan en el servidor; el cliente solo ve importes finales. El backend obtiene de Central One `reseller_price`, `product_id`, `target_schema`, `in_stock`, `product_family_id` y `region`. El catálogo se almacena temporalmente en la memoria de cada instancia (15 minutos, según la documentación). `Sincronizar` vuelve a consultar precios y existencias de productos vinculados. **El importe definitivo al comprar siempre depende de la respuesta real del proveedor**, por lo que aún hay que integrar y verificar el flujo `POST /orders` con idempotencia.

## Estado seguro

El panel y las conexiones del catálogo están desplegados en el entorno de preproducción conectado a Cloudflare y Supabase. Los pedidos al proveedor y los cobros están bloqueados hasta completar la cadena de comprobantes, verificación manual de pago, idempotencia y conciliación. Un borrador no se muestra como oferta comprable. **No se debe retirar la página de mantenimiento para recibir pagos todavía.**