# Seguridad y protección de datos

## 1. Controles implementados en aplicación

1. **Autenticación y sesión:** Supabase Auth.
2. **Autorización por rol:** validación de `administradores` activos (principal/secundario).
3. **Validación de entradas:** Zod en todos los endpoints sensibles.
4. **Errores controlados:** respuestas genéricas para no filtrar detalles internos.
5. **Rate limiting:** aplicado en endpoint público `/api/verify`.
6. **Hardening HTTP:** CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

## 2. Controles implementados en base de datos

1. **RLS habilitado** en `personas`, `diplomas`, `administradores`.
2. **Políticas restrictivas** para operaciones solo por administradores activos.
3. **Función SQL de verificación pública** con datos mínimos y `SECURITY DEFINER`.
4. **Índices y constraints** para integridad y rendimiento.

## 3. Estrategia de “ofuscación” para despliegue Vercel

No existe ofuscación absoluta en aplicaciones web (el cliente siempre recibe JS). Se aplicó la estrategia correcta en producción:

1. Minificación de bundles de frontend (pipeline de Next.js).
2. `productionBrowserSourceMaps: false` para evitar exposición de código fuente legible.
3. Lógica crítica de negocio mantenida server-side en Route Handlers.
4. Secretos fuera del cliente y fuera del repositorio.

## 4. Recomendaciones adicionales para producción

1. Activar MFA para administradores principales.
2. Definir backups y retención en Supabase.
3. Integrar monitoreo/alertas (Sentry u observabilidad equivalente).
4. Activar auditoría de acciones críticas (crear/editar/anular/carga masiva).
