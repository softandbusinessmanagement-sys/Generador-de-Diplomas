import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { requireAdminPage } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await requireAdminPage();

  return (
    <main className="container grid" style={{ gap: "1rem" }}>
      <section className="card">
        <p className="eyebrow">Panel administrativo</p>
        <h1>Gestión de diplomas</h1>
        <p className="muted">
          Administrador: {session.user.email} — Rol: <strong>{session.admin.rol}</strong>
        </p>
      </section>
      <DashboardClient />
    </main>
  );
}
