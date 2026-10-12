-- Server-side search and pagination for the admin dashboard.
-- Run this after the initial schema and existing migrations.
CREATE OR REPLACE FUNCTION public.get_admin_diplomas_page(
  p_query TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  persona_id UUID,
  codigo_diploma VARCHAR,
  codigo_verificacion VARCHAR,
  tipo_diploma VARCHAR,
  titulo_o_logro VARCHAR,
  carrera VARCHAR,
  modalidad VARCHAR,
  fecha_emision DATE,
  estado VARCHAR,
  created_at TIMESTAMPTZ,
  archivo_pdf_url TEXT,
  archivo_docx_url TEXT,
  beneficiario_dni VARCHAR,
  beneficiario_nombre VARCHAR,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.persona_id,
    d.codigo_diploma,
    d.codigo_verificacion,
    d.tipo_diploma,
    d.titulo_o_logro,
    d.carrera,
    d.modalidad,
    d.fecha_emision,
    d.estado,
    d.created_at,
    d.archivo_pdf_url,
    d.archivo_docx_url,
    p.dni AS beneficiario_dni,
    p.nombre_completo AS beneficiario_nombre,
    count(*) OVER() AS total_count
  FROM public.diplomas AS d
  JOIN public.personas AS p ON p.id = d.persona_id
  WHERE
    COALESCE(p_query, '') = ''
    OR d.codigo_diploma ILIKE '%' || p_query || '%'
    OR d.codigo_verificacion ILIKE '%' || p_query || '%'
    OR d.titulo_o_logro ILIKE '%' || p_query || '%'
    OR p.dni ILIKE '%' || p_query || '%'
    OR p.nombre_completo ILIKE '%' || p_query || '%'
  ORDER BY d.created_at DESC, d.id DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100)
  OFFSET GREATEST(p_offset, 0);
$$;

REVOKE ALL ON FUNCTION public.get_admin_diplomas_page(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_diplomas_page(TEXT, INTEGER, INTEGER) TO authenticated;
