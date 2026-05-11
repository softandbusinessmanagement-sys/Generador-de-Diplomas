import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { enforceRateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/http";
import { verifyInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = enforceRateLimit(`verify:${ip}`, 20, 60_000);

  if (!rate.allowed) {
    return jsonError(429, "Demasiadas consultas. Intente nuevamente en un minuto.");
  }

  try {
    const body = await request.json();
    const parsed = verifyInputSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "Ingrese un DNI o código de verificación válido.");
    }

    const { url, anonKey } = getSupabaseEnv();
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false
      }
    });

    const { data, error } = await supabase.rpc("verify_diploma", {
      p_input: parsed.data.query
    });

    if (error) {
      return jsonError(500, "No se pudo completar la verificación.");
    }

    const record = data?.[0];
    if (!record) {
      return jsonError(404, "Diploma no encontrado.");
    }

    return NextResponse.json({
      diplomaId: record.diploma_id,
      codigoDiploma: record.codigo_diploma,
      estado: record.estado,
      fechaEmision: record.fecha_emision,
      tipoDiploma: record.tipo_diploma,
      tituloLogro: record.titulo_o_logro,
      carrera: record.carrera,
      modalidad: record.modalidad,
      institucionEmisora: record.institucion_emisora,
      beneficiarioDni: record.beneficiario_dni,
      beneficiarioNombre: record.beneficiario_nombre_completo
    });
  } catch {
    return jsonError(400, "Solicitud inválida.");
  }
}
