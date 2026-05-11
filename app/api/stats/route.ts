import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { supabase } = await requireAdminRoute();

    const [totalRes, generatedRes, verifiedRes, canceledRes] = await Promise.all([
      supabase.from("diplomas").select("*", { head: true, count: "exact" }),
      supabase.from("diplomas").select("*", { head: true, count: "exact" }).eq("estado", "generado"),
      supabase.from("diplomas").select("*", { head: true, count: "exact" }).eq("estado", "verificado"),
      supabase.from("diplomas").select("*", { head: true, count: "exact" }).eq("estado", "anulado")
    ]);

    if (totalRes.error || generatedRes.error || verifiedRes.error || canceledRes.error) {
      return jsonError(500, "No se pudieron cargar las estadísticas.");
    }

    return NextResponse.json({
      total: totalRes.count ?? 0,
      generado: generatedRes.count ?? 0,
      verificado: verifiedRes.count ?? 0,
      anulado: canceledRes.count ?? 0
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
