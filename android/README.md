# Refills Shop para Android

Aplicación Android instalable (no un acceso directo a la pantalla de inicio).
Carga de manera segura la tienda real en https://refillshop.github.io/REFILLSHOP/ a través de WebView.

## APK instalable
GitHub Actions compila un APK debug de prueba, disponible en **Actions > Refills Shop Android APK > Artifacts > Refills-Shop-Android-APK**.
Se requiere Internet para acceder a las ofertas y las operaciones de pago. Al compilar un APK de lanzamiento para distribución pública, genera y custodia una clave de firma release (no reutilices la firma de depuración).

## Desarrollo con Android Studio
Abre la carpeta android como proyecto. Instala Android SDK 35 y Java 17. Compila con:
gradle :app:assembleDebug

## Seguridad
No incluye claves privadas, contraseñas o tokens de servicio. Los pagos siguen verificándose en el backend de Supabase; el APK únicamente proporciona la interfaz nativa.
El selector de archivos permite adjuntar capturas de los comprobantes mediante el proveedor de documentos del teléfono.
