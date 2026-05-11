import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { buildDiplomaCode, buildVerificationCode } from "@/lib/diploma-code";
import { requireAdminRoute } from "@/lib/auth";
import { asNullable, diplomaCreateSchema } from "@/lib/validation";
import { handleRouteError, jsonError } from "@/lib/http";
import { buildDocxFromTemplate, buildTemplateData } from "@/lib/docx-template";
import { convertDocxBytesToPdf } from "@/lib/docx-to-pdf";
import { buildDiplomaDocxPath, buildDiplomaPdfPath, getDiplomaBucket } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_INSTITUTION = "Universidad Continental";

function getRawCell(row: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) {
      return row[alias];
    }
  }
  return "";
}

function getCell(row: Record<string, unknown>, aliases: string[]) {
  const value = getRawCell(row, aliases);
  return String(value ?? "").trim();
}

function normalizeDate(value: unknown) {
  if (!value) {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const year = String(parsed.y).padStart(4, "0");
      const month = String(parsed.m).padStart(2, "0");
      const day = String(parsed.d).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const latamMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (latamMatch) {
    const [, day, month, year] = latamMatch;
    return `${year}-${month}-${day}`;
  }

  return str;
}

function getDateCell(row: Record<string, unknown>, aliases: string[]) {
  const value = getRawCell(row, aliases);
  return normalizeDate(value);
}

function normalizeRow(row: Record<string, unknown>) {
  return {
    dni: getCell(row, ["dni", "DNI"]),
    nombres: getCell(row, ["nombres", "nombre", "NOMBRES", "NOMBRE"]),
    apellidoPaterno: getCell(row, ["apellido_paterno", "apellidos", "APELLIDO_PATERNO", "APELLIDOS"]),
    apellidoMaterno: getCell(row, ["apellido_materno", "APELLIDO_MATERNO"]),
    correo: getCell(row, ["correo", "email", "CORREO", "EMAIL"]),
    telefono: getCell(row, ["telefono", "TELÉFONO", "TELEFONO"]),
    tipoDiploma: getCell(row, ["tipo_diploma", "tipo", "TIPO_DIPLOMA", "TIPO"]) || "TITULACION",
    categoria: getCell(row, ["categoria", "CATEGORIA"]),
    tituloLogro: getCell(row, ["titulo_o_logro", "titulo", "TITULO_O_LOGRO", "TITULO"]),
    descripcion: getCell(row, ["descripcion", "DESCRIPCION"]),
    facultad: getCell(row, ["facultad", "FACULTAD"]),
    escuelaProfesional: getCell(row, ["escuela_profesional", "ESCUELA_PROFESIONAL"]),
    carrera: getCell(row, ["carrera", "CARRERA"]),
    modalidad: getCell(row, ["modalidad", "MODALIDAD"]),
    tema: getCell(row, ["tema", "TEMA"]),
    fechaEmision: getDateCell(row, ["fecha_emision", "fecha", "FECHA_EMISION", "FECHA"]),
    fechaEvento: getDateCell(row, ["fecha_evento", "FECHA_EVENTO"]),
    numeroResolucion: getCell(row, ["numero_resolucion", "resolucion", "NUMERO_RESOLUCION", "RESOLUCION"]),
    observaciones: getCell(row, ["observaciones", "OBSERVACIONES"])
  };
}

function fullName(nombres: string, apellidoPaterno: string, apellidoMaterno?: string) {
  return [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAdminRoute();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError(400, "Debe enviar un archivo Excel.");
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return jsonError(400, "Formato inválido. Use .xlsx o .xls.");
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(bytes), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return jsonError(400, "El archivo no contiene hojas válidas.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (rows.length === 0) {
      return jsonError(400, "El archivo no contiene filas para procesar.");
    }

    let created = 0;
    let failed = 0;
    const warnings: string[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const bucket = getDiplomaBucket();

    for (let i = 0; i < rows.length; i += 1) {
      try {
        const normalized = normalizeRow(rows[i]);
        const parsed = diplomaCreateSchema.safeParse(normalized);

        if (!parsed.success) {
          failed += 1;
          warnings.push(`Fila ${i + 2}: ${parsed.error.issues[0]?.message ?? "datos inválidos"}`);
          continue;
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
          failed += 1;
          warnings.push(`Fila ${i + 2}: no se pudo registrar la persona.`);
          continue;
        }

        const diplomaCode = buildDiplomaCode();
        const verificationCode = buildVerificationCode();
        const qrUrl = `${appUrl}/verificar?token=${verificationCode}`;
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
            fechaEmision: payload.fechaEmision
          })
        );

        const { error: uploadDocxError } = await supabase.storage.from(bucket).upload(docxPath, docxBytes, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: false
        });

        if (uploadDocxError) {
          failed += 1;
          warnings.push(`Fila ${i + 2}: no se pudo generar DOCX desde la plantilla.`);
          continue;
        }

        let pdfBytes: Uint8Array;
        try {
          pdfBytes = await convertDocxBytesToPdf(docxBytes);
        } catch {
          await supabase.storage.from(bucket).remove([docxPath]);
          failed += 1;
          warnings.push(`Fila ${i + 2}: no se pudo convertir DOCX a PDF (instale LibreOffice).`);
          continue;
        }

        const { error: uploadPdfError } = await supabase.storage.from(bucket).upload(pdfPath, pdfBytes, {
          contentType: "application/pdf",
          upsert: false
        });

        if (uploadPdfError) {
          await supabase.storage.from(bucket).remove([docxPath]);
          failed += 1;
          warnings.push(`Fila ${i + 2}: no se pudo subir PDF convertido.`);
          continue;
        }

        const { error: diplomaError } = await supabase.from("diplomas").insert({
          persona_id: persona.id,
          registrado_por: user.id,
          codigo_diploma: diplomaCode,
          codigo_verificacion: verificationCode,
          tipo_diploma: payload.tipoDiploma,
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
        });

        if (diplomaError) {
          await supabase.storage.from(bucket).remove([pdfPath, docxPath]);
          failed += 1;
          warnings.push(`Fila ${i + 2}: no se pudo registrar el diploma.`);
          continue;
        }

        created += 1;
      } catch {
        failed += 1;
        warnings.push(`Fila ${i + 2}: error inesperado procesando el registro.`);
      }
    }

    return NextResponse.json({
      totalRows: rows.length,
      created,
      failed,
      warnings
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
