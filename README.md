# Diplomas Web UC — Next.js + Supabase

Migración completa del proyecto a una arquitectura **serverless en Vercel** con:

- **Frontend y API** en Next.js (App Router + Route Handlers).
- **Autenticación y sesiones** con Supabase Auth.
- **Base de datos** PostgreSQL gestionada por Supabase con RLS.
- **Verificación pública** de diplomas por DNI o código de verificación.

## Stack principal

- Next.js 14 + TypeScript
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- PostgreSQL (Supabase)
- Validación de entradas con `zod`
- Procesamiento de Excel para carga masiva con `xlsx`
- Conversión de diplomas DOCX a PDF con LibreOffice (`soffice`)
- Generación de DOCX basado en plantilla institucional existente

## Estructura

```text
app/
  api/
    auth/logout
    diplomas
    diplomas/[id]
    diplomas/masivo
    stats
    verify
  dashboard/
  login/
  verificar/
database/
  initial_schema.sql
docs/
  requerimientos-sistema.md
  arquitectura.md
  seguridad.md
  diagramas/
    conceptual.mmd
    logico.mmd
    fisico.mmd
lib/
  auth.ts
  validation.ts
  rate-limit.ts
  supabase/
```

## Configuración local

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno:

```bash
cp .env.example .env.local
```

Variables importantes:
- `SUPABASE_STORAGE_DIPLOMAS_BUCKET`: bucket privado de archivos.
- `DOCX_TEMPLATE_PATH`: ruta del .docx base que se rellena.
- `SOFFICE_BINARY`: binario de LibreOffice para convertir DOCX->PDF (ej: `soffice`).

3. Crear el esquema inicial en Supabase SQL Editor:

```sql
-- pegar contenido de database/initial_schema.sql
```

4. Verificar bucket de Storage para PDFs:

- Bucket privado: `diplomas` (o el nombre de `SUPABASE_STORAGE_DIPLOMAS_BUCKET`)
- Políticas para usuarios autenticados administradores (incluidas en `database/initial_schema.sql`)

5. Plantilla DOCX:

- El sistema rellena marcadores con formato `[Campo]` dentro del archivo DOCX.
- Marcadores detectados en tu plantilla actual:
  - `[Nombres]`
  - `[Apellido paterno]`
  - `[Apellido Materno]`
  - `[Facultad]`
  - `[Escuela profesional]`
  - `[Tema]`
  - `[Fecha de evento]`
  - `[Fecha de emisión]`

5. Ejecutar la app:

```bash
npm run dev
```

## Despliegue en Vercel

1. Conectar repositorio a Vercel.
2. Configurar variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (URL de producción)
   - `SUPABASE_STORAGE_DIPLOMAS_BUCKET` (por defecto: `diplomas`)
3. Deploy.

## Seguridad aplicada

- RLS habilitado y políticas por rol (administrador activo / principal).
- Endpoint público de verificación sin acceso directo a tablas sensibles.
- Función SQL controlada (`verify_diploma`) para minimizar exposición de datos.
- Validación fuerte de payloads con Zod en endpoints internos.
- Rate limiting en verificación pública.
- Hardening HTTP headers + CSP.
- `productionBrowserSourceMaps: false` y minificación en producción para dificultar inspección del código distribuido.

## Archivos de diseño y base de datos

- Requerimientos: `docs/requerimientos-sistema.md`
- Arquitectura: `docs/arquitectura.md`
- Seguridad: `docs/seguridad.md`
- Diagramas: `docs/diagramas/*.mmd`
- Schema inicial: `database/initial_schema.sql`
