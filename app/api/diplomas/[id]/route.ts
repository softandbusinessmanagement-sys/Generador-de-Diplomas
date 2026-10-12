import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/auth";
import { asNullable, diplomaUpdateSchema } from "@/lib/validation";
import { handleRouteError, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

function fullName(nombres: string, apellidoPaterno: string, apellidoMaterno?: string | null) {
  return [nombres, apellidoPaterno, apellidoMaterno ?? undefined].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdminRoute();
    const body = await request.json();
    const parsed = diplomaUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, parsed.error.issues[0]?.message ?? "Datos inválidos.");
    }

    const payload = parsed.data;

    const { data: current, error: currentError } = await supabase
      .from("diplomas")
      .select("id, persona_id")
      .eq("id", id)
      .single();

    if (currentError || !current) {
      return jsonError(404, "Diploma no encontrado.");
    }

    const personaFields = [
      payload.dni,
      payload.nombres,
      payload.apellidoPaterno,
      payload.apellidoMaterno,
      payload.correo,
      payload.telefono
    ].some((field) => field !== undefined);

    if (personaFields) {
      const { data: currentPersona, error: personaError } = await supabase
        .from("personas")
        .select("nombres, apellido_paterno, apellido_materno")
        .eq("id", current.persona_id)
        .single();

      if (personaError || !currentPersona) {
        return jsonError(500, "No se pudo actualizar la persona.");
      }

      const nombres = payload.nombres ?? currentPersona.nombres;
      const apellidoPaterno = payload.apellidoPaterno ?? currentPersona.apellido_paterno;
      const apellidoMaterno = payload.apellidoMaterno ?? currentPersona.apellido_materno;

      const { error: updatePersonaError } = await supabase
        .from("personas")
        .update({
          dni: payload.dni,
          nombres,
          apellido_paterno: apellidoPaterno,
          apellido_materno: asNullable(apellidoMaterno ?? undefined),
          nombre_completo: fullName(nombres, apellidoPaterno, apellidoMaterno),
          correo: asNullable(payload.correo),
          telefono: asNullable(payload.telefono)
        })
        .eq("id", current.persona_id);

      if (updatePersonaError) {
        return jsonError(500, "No se pudo actualizar la persona.");
      }
    }

    const diplomaUpdate = {
      tipo_diploma: payload.tipoDiploma,
      rol: payload.rol !== undefined ? asNullable(payload.rol) : undefined,
      categoria: payload.categoria !== undefined ? asNullable(payload.categoria) : undefined,
      titulo_o_logro: payload.tituloLogro,
      descripcion: payload.descripcion !== undefined ? asNullable(payload.descripcion) : undefined,
      facultad: payload.facultad !== undefined ? asNullable(payload.facultad) : undefined,
      escuela_profesional:
        payload.escuelaProfesional !== undefined ? asNullable(payload.escuelaProfesional) : undefined,
      carrera: payload.carrera !== undefined ? asNullable(payload.carrera) : undefined,
      modalidad: payload.modalidad !== undefined ? asNullable(payload.modalidad) : undefined,
      tema: payload.tema !== undefined ? asNullable(payload.tema) : undefined,
      fecha_emision: payload.fechaEmision,
      fecha_evento: payload.fechaEvento !== undefined ? asNullable(payload.fechaEvento) : undefined,
      numero_resolucion: payload.numeroResolucion !== undefined ? asNullable(payload.numeroResolucion) : undefined,
      observaciones: payload.observaciones !== undefined ? asNullable(payload.observaciones) : undefined,
      estado: payload.estado
    };

    const filteredUpdate = Object.fromEntries(
      Object.entries(diplomaUpdate).filter(([, value]) => value !== undefined)
    );

    const { error: updateDiplomaError } = await supabase.from("diplomas").update(filteredUpdate).eq("id", id);

    if (updateDiplomaError) {
      return jsonError(500, "No se pudo actualizar el diploma.");
    }

    return NextResponse.json({ message: "Diploma actualizado correctamente." });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdminRoute();
    const { error } = await supabase.from("diplomas").update({ estado: "anulado" }).eq("id", id);

    if (error) {
      return jsonError(500, "No se pudo anular el diploma.");
    }

    return NextResponse.json({ message: "Diploma anulado correctamente." });
  } catch (error) {
    return handleRouteError(error);
  }
}
