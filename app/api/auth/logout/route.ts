import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return jsonError(500, "No se pudo cerrar sesión.");
    }

    return NextResponse.json({ message: "Sesión cerrada correctamente." });
  } catch {
    return jsonError(500, "No se pudo cerrar sesión.");
  }
}
