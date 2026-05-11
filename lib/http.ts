import { NextResponse } from "next/server";
import { ApiRouteError } from "@/lib/auth";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return jsonError(error.status, error.message);
  }

  console.error("Unhandled route error", error);
  return jsonError(500, "No se pudo completar la solicitud.");
}
