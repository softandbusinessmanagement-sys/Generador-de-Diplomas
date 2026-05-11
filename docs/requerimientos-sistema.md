# Requerimientos del sistema migrado

## 1. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-001 | Autenticación de administradores con Supabase Auth | Alta |
| RF-002 | Registro individual de diplomas con validación de datos | Alta |
| RF-003 | Carga masiva desde Excel (`.xlsx`, `.xls`) | Alta |
| RF-004 | Verificación pública por DNI o token de verificación | Alta |
| RF-005 | Panel administrativo con listado, búsqueda y anulación de diplomas | Alta |
| RF-006 | Estadísticas de diplomas por estado | Media |
| RF-007 | Gestión de roles administrativos (principal/secundario) | Media |
| RF-008 | API interna segura en Route Handlers de Next.js | Alta |

## 2. Requerimientos no funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RNF-001 | Despliegue serverless en Vercel | Alta |
| RNF-002 | Persistencia en Supabase PostgreSQL con RLS | Alta |
| RNF-003 | Seguridad OWASP base (validación, manejo de errores, controles de acceso) | Alta |
| RNF-004 | Tiempo de respuesta objetivo < 2s en consultas críticas | Alta |
| RNF-005 | Disponibilidad esperada basada en SLA Free Tier de Vercel/Supabase | Media |
| RNF-006 | Escalabilidad horizontal por arquitectura stateless | Media |
| RNF-007 | Trazabilidad de cambios con `created_at/updated_at` | Alta |

## 3. Requerimientos de base de datos

1. Tablas base: `personas`, `diplomas`, `administradores`.
2. Integración estricta con `auth.users` para identidad.
3. Índices por `dni`, `codigo_verificacion`, `fecha_emision` y `estado`.
4. Trigger para mantenimiento automático de `updated_at`.
5. RLS habilitado con políticas basadas en rol administrativo activo.
6. Función segura `verify_diploma` para exponer únicamente campos públicos de verificación.

## 4. Requerimientos de seguridad de información

1. Secretos exclusivamente en variables de entorno (no hardcode).
2. API con validación de entrada fuerte (Zod) y respuestas sin filtración técnica sensible.
3. Rate limiting en endpoint público de verificación.
4. Headers de seguridad (CSP, X-Frame-Options, Referrer-Policy, etc.).
5. Código cliente minificado en producción y source maps deshabilitados.
