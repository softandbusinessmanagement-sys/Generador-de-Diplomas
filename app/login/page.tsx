import { LoginForm } from "@/app/login/login-form";

export default function LoginPage({
  searchParams
}: {
  searchParams?: {
    next?: string;
  };
}) {
  const nextPath = searchParams?.next;

  return (
    <main className="container">
      <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="grid" style={{ gap: "0.4rem", marginBottom: "1rem" }}>
          <p className="eyebrow">Acceso administrativo</p>
          <h1>Iniciar sesión</h1>
          <p className="muted">
            Ingrese sus credenciales de Supabase Auth para administrar diplomas y operar el panel interno.
          </p>
        </div>
        <LoginForm nextPath={nextPath} />
      </section>
    </main>
  );
}
