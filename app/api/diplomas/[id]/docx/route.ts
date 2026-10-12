import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";
import { getDiplomaBucket } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdminRoute();

    const { data: diploma, error } = await supabase
      .from("diplomas")
      .select("id, codigo_diploma, archivo_docx_url")
      .eq("id", id)
      .single();

    if (error || !diploma) {
      return jsonError(404, "Diploma no encontrado.");
    }

    if (!diploma.archivo_docx_url) {
      return jsonError(404, "Este diploma no tiene DOCX generado.");
    }

    const bucket = getDiplomaBucket();
    const { data: file, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(diploma.archivo_docx_url);

    if (downloadError || !file) {
      return jsonError(500, "No se pudo descargar el DOCX.");
    }

    const bytes = await file.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${diploma.codigo_diploma}.docx"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
