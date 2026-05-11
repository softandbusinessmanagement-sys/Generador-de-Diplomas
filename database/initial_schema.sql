-- =====================================================
-- Diplomas Web UC - Initial Schema (Supabase PostgreSQL)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================
-- TABLA: personas
-- ======================
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni VARCHAR(8) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellido_paterno VARCHAR(100) NOT NULL,
  apellido_materno VARCHAR(100),
  nombre_completo VARCHAR(255) NOT NULL,
  correo VARCHAR(150),
  telefono VARCHAR(20),
  fecha_nacimiento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================
-- TABLA: administradores
-- ======================
CREATE TABLE IF NOT EXISTS public.administradores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('principal', 'secundario')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================
-- TABLA: diplomas
-- ======================
CREATE TABLE IF NOT EXISTS public.diplomas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE RESTRICT,
  registrado_por UUID NOT NULL REFERENCES public.administradores(id) ON DELETE RESTRICT,
  codigo_diploma VARCHAR(50) NOT NULL UNIQUE,
  codigo_verificacion VARCHAR(100) NOT NULL UNIQUE,
  tipo_diploma VARCHAR(50) NOT NULL,
  categoria VARCHAR(50),
  titulo_o_logro VARCHAR(255) NOT NULL,
  descripcion TEXT,
  institucion_emisora VARCHAR(255) NOT NULL DEFAULT 'Universidad Continental',
  facultad VARCHAR(150),
  escuela_profesional VARCHAR(150),
  carrera VARCHAR(150),
  modalidad VARCHAR(100),
  tema VARCHAR(255),
  fecha_emision DATE NOT NULL,
  fecha_evento DATE,
  numero_resolucion VARCHAR(100),
  qr_url TEXT,
  archivo_docx_url TEXT,
  archivo_pdf_url TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'generado'
    CHECK (estado IN ('generado', 'verificado', 'anulado')),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================
-- ÍNDICES
-- ======================
CREATE INDEX IF NOT EXISTS idx_personas_dni ON public.personas (dni);
CREATE INDEX IF NOT EXISTS idx_personas_nombre_completo ON public.personas (nombre_completo);
CREATE INDEX IF NOT EXISTS idx_diplomas_persona_id ON public.diplomas (persona_id);
CREATE INDEX IF NOT EXISTS idx_diplomas_registrado_por ON public.diplomas (registrado_por);
CREATE INDEX IF NOT EXISTS idx_diplomas_codigo_verificacion ON public.diplomas (codigo_verificacion);
CREATE INDEX IF NOT EXISTS idx_diplomas_estado ON public.diplomas (estado);
CREATE INDEX IF NOT EXISTS idx_diplomas_fecha_emision ON public.diplomas (fecha_emision);

-- ======================
-- updated_at trigger
-- ======================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_personas_updated_at ON public.personas;
CREATE TRIGGER trg_personas_updated_at
BEFORE UPDATE ON public.personas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_administradores_updated_at ON public.administradores;
CREATE TRIGGER trg_administradores_updated_at
BEFORE UPDATE ON public.administradores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_diplomas_updated_at ON public.diplomas;
CREATE TRIGGER trg_diplomas_updated_at
BEFORE UPDATE ON public.diplomas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ======================
-- Funciones de autorización
-- ======================
CREATE OR REPLACE FUNCTION public.is_active_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administradores a
    WHERE a.id = uid
      AND a.activo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_principal_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administradores a
    WHERE a.id = uid
      AND a.activo = true
      AND a.rol = 'principal'
  );
$$;

-- ======================
-- RLS
-- ======================
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diplomas ENABLE ROW LEVEL SECURITY;

-- personas: solo admins activos
DROP POLICY IF EXISTS personas_admin_all ON public.personas;
CREATE POLICY personas_admin_all
ON public.personas
FOR ALL
USING (public.is_active_admin(auth.uid()))
WITH CHECK (public.is_active_admin(auth.uid()));

-- administradores: lectura propia + gestión principal
DROP POLICY IF EXISTS administradores_self_read ON public.administradores;
CREATE POLICY administradores_self_read
ON public.administradores
FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS administradores_principal_all ON public.administradores;
CREATE POLICY administradores_principal_all
ON public.administradores
FOR ALL
USING (public.is_principal_admin(auth.uid()))
WITH CHECK (public.is_principal_admin(auth.uid()));

-- diplomas: solo admins activos
DROP POLICY IF EXISTS diplomas_admin_all ON public.diplomas;
CREATE POLICY diplomas_admin_all
ON public.diplomas
FOR ALL
USING (public.is_active_admin(auth.uid()))
WITH CHECK (public.is_active_admin(auth.uid()));

-- ======================
-- Verificación pública segura
-- ======================
CREATE OR REPLACE FUNCTION public.verify_diploma(p_input TEXT)
RETURNS TABLE (
  diploma_id UUID,
  codigo_diploma VARCHAR,
  codigo_verificacion VARCHAR,
  estado VARCHAR,
  fecha_emision DATE,
  tipo_diploma VARCHAR,
  titulo_o_logro VARCHAR,
  carrera VARCHAR,
  modalidad VARCHAR,
  institucion_emisora VARCHAR,
  beneficiario_dni VARCHAR,
  beneficiario_nombre_completo VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.codigo_diploma,
    d.codigo_verificacion,
    d.estado,
    d.fecha_emision,
    d.tipo_diploma,
    d.titulo_o_logro,
    d.carrera,
    d.modalidad,
    d.institucion_emisora,
    p.dni,
    p.nombre_completo
  FROM public.diplomas d
  JOIN public.personas p ON p.id = d.persona_id
  WHERE p_input = p.dni
     OR p_input = d.codigo_verificacion
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_diploma(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_diploma(TEXT) TO anon, authenticated;

-- ======================
-- Supabase Storage (PDF)
-- ======================
INSERT INTO storage.buckets (id, name, public)
VALUES ('diplomas', 'diplomas', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_diplomas_admin_select ON storage.objects;
CREATE POLICY storage_diplomas_admin_select
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'diplomas'
  AND EXISTS (
    SELECT 1
    FROM public.administradores a
    WHERE a.id = auth.uid()
      AND a.activo = true
  )
);

DROP POLICY IF EXISTS storage_diplomas_admin_insert ON storage.objects;
CREATE POLICY storage_diplomas_admin_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'diplomas'
  AND EXISTS (
    SELECT 1
    FROM public.administradores a
    WHERE a.id = auth.uid()
      AND a.activo = true
  )
);

DROP POLICY IF EXISTS storage_diplomas_admin_delete ON storage.objects;
CREATE POLICY storage_diplomas_admin_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'diplomas'
  AND EXISTS (
    SELECT 1
    FROM public.administradores a
    WHERE a.id = auth.uid()
      AND a.activo = true
  )
);
