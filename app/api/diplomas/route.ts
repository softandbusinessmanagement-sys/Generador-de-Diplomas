import { NextResponse } from "next/server";
import { buildDiplomaCode, buildVerificationCode } from "@/lib/diploma-code";
import { requireAdminRoute } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import {
  asNullable,
  diplomaCreateSchema,
  formatValidationError,
  normalizeDiplomaInput
} from "@/lib/validation";
import { buildDocxFromTemplate, buildTemplateData } from "@/lib/docx-template";
import { buildDiplomaPdf } from "@/lib/pdf-diploma";
import { buildDiplomaDocxPath, buildDiplomaPdfPath, getDiplomaBucket } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_INSTITUTION = "Universidad Continental";
type AdminDiplomaPageRow = {
  id: string;
  codigo_diploma: string;
  codigo_verificacion: string;
  tipo_diploma: string;
  titulo_o_logro: string;
  carrera: string | null;
  modalidad: string | null;
  fecha_emision: string;
  estado: "generado" | "verificado" | "anulado";
  created_at: string;
  archivo_pdf_url: string | null;
  archivo_docx_url: string | null;
  beneficiario_dni: string;
  beneficiario_nombre: string;
  total_count: number;
};

function fullName(nombres: string, apellidoPaterno: string, apellidoMaterno?: string) {
  return [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdminRoute();
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim().slice(0, 100);
    const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(requestedPage)
      ? Math.min(21_474_836, Math.max(1, requestedPage))
      : 1;
    const pageSize = 25;
    const { data, error } = await supabase.rpc("get_admin_diplomas_page", {
      p_query: query,
      p_limit: pageSize,
      p_offset: (page - 1) * pageSize
    });

    if (error) {
      return jsonError(500, "No se pudo listar diplomas. Aplique la migración de búsqueda y paginación.");
    }

    const rows = (data ?? []) as AdminDiplomaPageRow[];
    const items = rows.map((diploma) => ({
      id: diploma.id,
      codigoDiploma: diploma.codigo_diploma,
      codigoVerificacion: diploma.codigo_verificacion,
      tipoDiploma: diploma.tipo_diploma,
      tituloLogro: diploma.titulo_o_logro,
      carrera: diploma.carrera,
      modalidad: diploma.modalidad,
      fechaEmision: diploma.fecha_emision,
      estado: diploma.estado,
      createdAt: diploma.created_at,
      hasPdf: Boolean(diploma.archivo_pdf_url),
      hasDocx: Boolean(diploma.archivo_docx_url),
      beneficiarioDni: diploma.beneficiario_dni,
      beneficiarioNombre: diploma.beneficiario_nombre
    }));

    return NextResponse.json({ items, page, pageSize, total: Number(rows[0]?.total_count ?? 0) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAdminRoute();
    const body = await request.json();
    const normalizedBody = normalizeDiplomaInput(body);
    const parsed = diplomaCreateSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      return jsonError(422, formatValidationError(parsed.error));
    }

    const payload = parsed.data;
    const personaPayload = {
      dni: payload.dni,
      nombres: payload.nombres,
      apellido_paterno: payload.apellidoPaterno,
      apellido_materno: asNullable(payload.apellidoMaterno),
      nombre_completo: fullName(payload.nombres, payload.apellidoPaterno, payload.apellidoMaterno),
      correo: asNullable(payload.correo),
      telefono: asNullable(payload.telefono)
    };

    const { data: persona, error: personaError } = await supabase
      .from("personas")
      .upsert(personaPayload, { onConflict: "dni" })
      .select("id")
      .single();

    if (personaError || !persona) {
      return jsonError(500, "No se pudo registrar a la persona.");
    }

    const diplomaCode = buildDiplomaCode();
    const verificationCode = buildVerificationCode();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const qrUrl = `${appUrl}/verificar?token=${verificationCode}`;
    const bucket = getDiplomaBucket();
    const pdfPath = buildDiplomaPdfPath(diplomaCode, payload.dni);
    const docxPath = buildDiplomaDocxPath(diplomaCode, payload.dni);
    const docxBytes = await buildDocxFromTemplate(
      buildTemplateData({
        nombres: payload.nombres,
        apellidoPaterno: payload.apellidoPaterno,
        apellidoMaterno: asNullable(payload.apellidoMaterno),
        facultad: asNullable(payload.facultad),
        escuelaProfesional: asNullable(payload.escuelaProfesional),
        tituloLogro: payload.tituloLogro,
        fechaEvento: asNullable(payload.fechaEvento),
        fechaEmision: payload.fechaEmision,
        tipoDiploma: payload.tipoDiploma,
        rol: asNullable(payload.rol),
        codigoDiploma: diplomaCode
      })
    );

    const { error: uploadDocxError } = await supabase.storage.from(bucket).upload(docxPath, docxBytes, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: false
    });

    if (uploadDocxError) {
      return jsonError(
        500,
        "No se pudo generar DOCX desde la plantilla. Revise DOCX_TEMPLATE_PATH y el archivo base."
      );
    }

    const pdfBytes = await buildDiplomaPdf({
      codigoDiploma: diplomaCode,
      codigoVerificacion: verificationCode,
      verificationUrl: qrUrl,
      nombres: payload.nombres,
      apellidoPaterno: payload.apellidoPaterno,
      apellidoMaterno: asNullable(payload.apellidoMaterno),
      facultad: asNullable(payload.facultad),
      escuelaProfesional: asNullable(payload.escuelaProfesional),
      tituloLogro: payload.tituloLogro,
      fechaEvento: asNullable(payload.fechaEvento),
      fechaEmision: payload.fechaEmision,
      institucionEmisora: DEFAULT_INSTITUTION
    });

    const { error: uploadPdfError } = await supabase.storage.from(bucket).upload(pdfPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: false
    });

    if (uploadPdfError) {
      await supabase.storage.from(bucket).remove([docxPath]);
      return jsonError(
        500,
        "No se pudo subir el PDF convertido al storage."
      );
    }

    const { data: diploma, error: diplomaError } = await supabase
      .from("diplomas")
      .insert({
        persona_id: persona.id,
        registrado_por: user.id,
        codigo_diploma: diplomaCode,
        codigo_verificacion: verificationCode,
        tipo_diploma: payload.tipoDiploma,
        rol: asNullable(payload.rol),
        categoria: asNullable(payload.categoria),
        titulo_o_logro: payload.tituloLogro,
        descripcion: asNullable(payload.descripcion),
        institucion_emisora: DEFAULT_INSTITUTION,
        facultad: asNullable(payload.facultad),
        escuela_profesional: asNullable(payload.escuelaProfesional),
        carrera: asNullable(payload.carrera),
        modalidad: asNullable(payload.modalidad),
        tema: asNullable(payload.tema),
        fecha_emision: payload.fechaEmision,
        fecha_evento: asNullable(payload.fechaEvento),
        numero_resolucion: asNullable(payload.numeroResolucion),
        qr_url: qrUrl,
        archivo_docx_url: docxPath,
        archivo_pdf_url: pdfPath,
        estado: "generado",
        observaciones: asNullable(payload.observaciones)
      })
      .select("id, codigo_diploma, codigo_verificacion, qr_url, archivo_pdf_url, archivo_docx_url")
      .single();

    if (diplomaError || !diploma) {
      await supabase.storage.from(bucket).remove([pdfPath, docxPath]);
      return jsonError(500, "No se pudo registrar el diploma.");
    }

    return NextResponse.json(
      {
        message: "Diploma registrado correctamente.",
        item: {
          id: diploma.id,
          codigoDiploma: diploma.codigo_diploma,
          codigoVerificacion: diploma.codigo_verificacion,
          qrUrl: diploma.qr_url
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
