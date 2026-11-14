# Refills Shop — USDT BEP-20 para el saldo de revendedores

Estado: interfaz ya publicada en el Worker activo; backend instalado, validación monetaria final y habilitación de fondos pendientes. **No habilitar envíos de dinero sin probar la integración de principio a fin.**

## Backend protegido
- Supabase proyecto `kcgjlnymhmxylrjchcvl`; función `rs11-wallet`.
- Clave de lectura blockchain almacenada cifrada en Supabase Vault como `refillshop_bscscan_readonly`; nunca debe aparecer en HTML, JS público ni GitHub.
- BNB Smart Chain mainnet: chain ID 56.
- Dirección de recepción configurada: `0x08c57e6ccEa68388Cc906d45C33e0A332b3ca59a`.
- Token: Binance-Peg USDT (BEP-20), contrato `0x55d398326f99059ff775485246999027b3197955`, 18 decimales. No admitir tokens del mismo nombre en otros contratos o cadenas.
- Rutas autenticadas: `GET/POST /api/wallet/deposit`, `GET /api/wallet/deposit/status?id=...` y `POST /api/wallet/deposit/verify`. El Worker de Cloudflare redirige estas rutas a `rs11-wallet`.
- Todas las solicitudes requieren sesión Supabase y plan revendedor activo.
- El cliente crea una intención de recarga, recibe una dirección y un importe único con hasta 6 decimales y debe pagar exactamente ese importe.
- Verificación en dos fases: (1) detector de transferencias BscScan/Etherscan API v2, cuando el plan API lo permite; (2) inspección de recibo real del nodo BNB RPC y del evento `Transfer` del contrato de token. Exige al menos 40 bloques de confirmación.
- Confirmación manual asistida: si el detector automático está indisponible, el cliente puede introducir el hash de la transacción. **No es verificación manual administrativa:** la blockchain confirma o rechaza la operación automáticamente.
- Una transacción nunca se contabiliza dos veces: `tx_hash` único, fila bloqueada y saldo + historial contabilizados en una misma función SQL transaccional `rs11_credit_wallet_deposit`.
- No se otorga saldo a cuentas sin membresía activa, pagos expirados, token equivocado, red equivocada, destinatario incorrecto o importe distinto.
- Las transferencias de ETECSA, Transfermóvil y MiTransfer siguen como solicitudes manuales, sin alterar el saldo USDT.

## Activación controlada
El parámetro de Base de Datos `rs5_settings.reseller_wallet_auto_enabled` permanece en **false** por seguridad. Solo activarlo después de:
1. Confirmar que la dirección pertenece al comerciante y tiene acceso a la clave privada (sin entregar esa clave a terceros).
2. Verificar legalidad, condiciones del proveedor y límites del plan API para BNB Smart Chain mainnet.
3. Comprobar con una cuenta de revendedor auténtica creación de intención y detección de un pago pequeño, sin repetición.
4. Verificar que la confirmación actualiza `rs5_wallets` y crea un solo apunte en `rs5_wallet_ledger`; repetir el mismo hash no debe abonar otra vez.
5. Probar contrato falso, importes mal redondeados, dirección incorrecta, red equivocada, período vencido, cuenta no revendedora y fallos de RPC/API.

Tras completar los controles, el administrador puede habilitar de forma explícita la función de base de datos:
`UPDATE public.rs5_settings SET reseller_wallet_auto_enabled=true WHERE id=1;`

**No habilitar mediante una captura de pago, una notificación sin firma o el balance total de la wallet.**

## Frontend
- `v10/app.js`: sólo revendedores activos ven el saldo y el módulo de recarga; validación de ID exige respuesta válida y nombre real del proveedor; se retiró el éxito ficticio de checkout.
- Ofertas de cada juego ordenadas por SM de menor a mayor.
- Carrito persistente por navegador, con añadir, quitar, vaciar y compra individual por artículo.
- Catálogo de Central One en administración con filtros Todos / Recargas / PIN-Códigos, Región, Categoría y Familia.
- Campo técnico `player_id` se presenta al cliente como `ID de jugador`.
- `v10/index.html`: balance oculto hasta que la sesión confirma el rol.
- Los iconos de Transfermóvil y MiTransfer se obtienen de páginas oficiales de ETECSA, con respaldos SVG locales para fallos de red.
- La página no muestra juegos ficticios si el catálogo real no responde.

## Entornos
- Producción Pages: `https://refillshop.pages.dev/` desplegada desde commit `c9fc6f5d56438f39dfed6f0b9d45fb2c708df80e`; comprobados `/health`, catálogo y rechazo 401 de la ruta de depósitos sin sesión.
- Dirección alternativa Cloudflare Workers: `https://refills-shop-v10-activo.refills-shop-preview.workers.dev/`; comparte la red Cloudflare y debe probarse desde ETECSA sin VPN.
- Preview Pages: `https://feature-revendedor-usdt-bep2.refillshop.pages.dev/`.
- **La acreditación de depósitos USDT permanece bloqueada** hasta la prueba monetaria controlada.
- Se intentó preparar un espejo estático gratuito en Render; el conector devolvió `need_payment_info`, por lo que no se creó ningún servicio ni se autorizó ningún cargo.
- `main` de GitHub conserva la página de mantenimiento actual; Pages se actualizó mediante despliegue directo y la PR sigue en borrador.
