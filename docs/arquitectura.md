# Arquitectura objetivo (Next.js + Supabase + Vercel)

## 1. Principios

- **Serverless-first:** lógica backend en Route Handlers de Next.js.
- **Security by default:** RLS, RBAC y validación robusta en todos los endpoints.
- **Datos sensibles en servidor:** sin exponer llaves privadas ni consultas directas privilegiadas en frontend.
- **Separación de responsabilidades:** UI, capa API, capa de acceso a datos y políticas SQL.

## 2. Componentes

1. **Frontend (Next.js App Router)**
   - Landing pública
   - Login administrativo
   - Dashboard administrativo
   - Verificación pública

2. **API (Route Handlers)**
   - `/api/diplomas` (CRUD operativo)
   - `/api/diplomas/masivo` (carga por lote)
   - `/api/stats` (métricas)
   - `/api/verify` (consulta pública segura)
   - `/api/auth/logout` (sesión)

3. **Supabase**
   - Auth (identidad y sesiones)
   - PostgreSQL (datos de negocio)
   - RLS + políticas por rol

4. **Vercel**
   - Hosting frontend + serverless functions
   - Variables de entorno por ambiente
   - TLS y edge delivery

## 3. Flujo principal

1. Admin inicia sesión con Supabase Auth.
2. Dashboard usa rutas internas de Next.js.
3. API valida payload con Zod.
4. Operaciones SQL pasan por políticas RLS.
5. Verificación pública usa función SQL acotada (`verify_diploma`) para evitar exposición masiva.

## 4. Estrategia de migración aplicada

1. Eliminación de backend Python/FastAPI y frontend estático legado.
2. Consolidación en monorepo Next.js.
3. Definición de schema SQL inicial y políticas RLS.
4. Incorporación de controles de seguridad de aplicación y despliegue.
