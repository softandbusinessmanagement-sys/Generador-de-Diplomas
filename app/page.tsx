export default function Home() {
  return (
    <main className="container">
      <section className="card hero">
        <p className="eyebrow">Universidad Continental</p>
        <h1>Diplomas Web UC</h1>
        <p className="muted">
          Plataforma migrada a Next.js + Supabase para operar en Vercel con autenticación segura,
          administración de diplomas y verificación pública.
        </p>
        <div className="row">
          <a className="button primary" href="/login">
            Iniciar sesión administrativo
          </a>
          <a className="button secondary" href="/verificar">
            Verificar diploma
          </a>
        </div>
      </section>
    </main>
  );
}
