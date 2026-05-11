"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setLoading(false);
      setError("Credenciales inválidas o cuenta sin permisos.");
      return;
    }

    const redirectPath = nextPath || "/dashboard";
    router.replace(redirectPath);
    router.refresh();
  }

  return (
    <form className="grid" onSubmit={onSubmit}>
      <div>
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <button className="button primary" type="submit" disabled={loading}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
}
