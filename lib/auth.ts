import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/types";

type AdminProfile = {
  id: string;
  rol: AdminRole;
  activo: boolean;
};

export class ApiRouteError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getAdminSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: admin, error: adminError } = await supabase
    .from("administradores")
    .select("id, rol, activo")
    .eq("id", user.id)
    .single<AdminProfile>();

  if (adminError || !admin || !admin.activo) {
    return null;
  }

  return { supabase, user, admin };
}

export async function requireAdminPage(principalOnly = false) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  if (principalOnly && session.admin.rol !== "principal") {
    redirect("/dashboard?error=sin_permisos");
  }

  return session;
}

export async function requireAdminRoute(principalOnly = false) {
  const session = await getAdminSession();
  if (!session) {
    throw new ApiRouteError(401, "No autorizado.");
  }

  if (principalOnly && session.admin.rol !== "principal") {
    throw new ApiRouteError(403, "Permisos insuficientes.");
  }

  return session;
}
