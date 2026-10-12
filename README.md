# Diplomas Web UC

Sistema de gestión y verificación de diplomas construido con Next.js 16, TypeScript y Supabase.

## Estructura

- `app/`: páginas, dashboard y Route Handlers de la API.
- `lib/`: autenticación, acceso a Supabase, validación y generación de documentos.
- `database/`: esquema inicial y migraciones SQL incrementales.
- `templates/`: plantilla DOCX usada al generar diplomas.
- `public/templates/`: archivos descargables desde la aplicación, incluida la plantilla Excel.
- `docs/`: requerimientos, arquitectura, seguridad, diagramas y referencias técnicas.

## Inicio local

1. Instala Node.js compatible con la versión de Next.js del proyecto y ejecuta `npm install`.
2. Copia `.env.example` a `.env.local` y configura la URL y la clave pública de Supabase. No publiques `.env.local` ni agregues claves `service_role` al navegador.
3. En Supabase SQL Editor, ejecuta en este orden:
   - `database/initial_schema.sql` para una base nueva.
   - Las migraciones de `database/migrations/` en orden de fecha. En particular, la búsqueda paginada requiere `20261012_admin_diplomas_search_pagination.sql`.
4. En Supabase Auth, crea el usuario inicial. Luego agrega su perfil a `public.administradores`, usando el UUID del usuario Auth:

   ```sql
   INSERT INTO public.administradores (id, nombres, apellidos, correo, rol, activo)
   VALUES ('UUID_DEL_USUARIO_AUTH', 'Nombre', 'Apellido', 'admin@ejemplo.edu', 'principal', true);
   ```

5. Confirma que exista el bucket privado `diplomas` y sus políticas (incluidas en el esquema inicial). Si usas otro nombre, define `SUPABASE_STORAGE_DIPLOMAS_BUCKET`.
6. La plantilla DOCX está en `templates/diploma-template.docx`. Sustituye ese archivo para personalizar el diseño y conserva sus marcadores entre corchetes.
7. Inicia la aplicación con `npm run dev` y abre `http://localhost:3000`.

## Uso

1. Ingresa a `/login` con el usuario creado en Supabase Auth.
2. En `/dashboard`, registra diplomas individualmente o descarga `Descargar plantilla Excel`, completa la primera hoja y procesa el archivo `.xlsx`.
3. Revisa los errores de filas que se muestran al finalizar una carga parcial.
4. Busca por DNI, nombre, código o título; usa los controles de página para navegar por todos los resultados.
5. La verificación pública está en `/verificar`. La anulación está disponible desde el listado administrativo.

La plantilla Excel descargable incluye una fila de ejemplo. Las columnas obligatorias son `dni`, `nombres`, `apellido_paterno`, `tipo_diploma`, `titulo_o_logro` y `fecha_emision`. Usa fechas `AAAA-MM-DD` o fechas válidas de Excel; elimina o reemplaza la fila de ejemplo antes de importar.

## Variables de entorno

Consulta `.env.example`. Variables usadas por el servidor:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (base usada en enlaces QR)
- `SUPABASE_STORAGE_DIPLOMAS_BUCKET` (opcional; por defecto `diplomas`)

## Despliegue

Configura las mismas variables en el entorno de despliegue, agrega la plantilla DOCX al paquete y aplica todas las migraciones SQL antes de habilitar el dashboard. El bucket de archivos debe ser privado. Nunca uses una clave privilegiada de Supabase en variables `NEXT_PUBLIC_*`.

## Documentación

- Requerimientos: `docs/requerimientos-sistema.md`
- Arquitectura: `docs/arquitectura.md`
- Seguridad: `docs/seguridad.md`
- Diagramas: `docs/diagramas/`
- Documentación técnica de referencia: `docs/referencias/documentacion-tecnica.docx`
- Plan de acción: `docs/plan-accion.md`
# Generador-de-Diplomas
