"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DiplomaItem = {
  id: string;
  codigoDiploma: string;
  codigoVerificacion: string;
  tipoDiploma: string;
  tituloLogro: string;
  carrera: string | null;
  modalidad: string | null;
  fechaEmision: string;
  estado: "generado" | "verificado" | "anulado";
  createdAt: string;
  hasPdf: boolean;
  hasDocx: boolean;
  beneficiarioDni: string;
  beneficiarioNombre: string;
};

type Stats = {
  total: number;
  generado: number;
  verificado: number;
  anulado: number;
};

const EMPTY_STATS: Stats = {
  total: 0,
  generado: 0,
  verificado: 0,
  anulado: 0
};

function readMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const maybeError = (payload as { error?: string; message?: string }).error;
  if (maybeError) {
    return maybeError;
  }
  const maybeMessage = (payload as { message?: string }).message;
  return maybeMessage ?? fallback;
}

export function DashboardClient() {
  const router = useRouter();
  const [items, setItems] = useState<DiplomaItem[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const visibleItems = useMemo(() => {
    if (!search.trim()) {
      return items;
    }
    const q = search.toLowerCase();
    return items.filter((item) =>
      [item.codigoDiploma, item.codigoVerificacion, item.beneficiarioDni, item.beneficiarioNombre, item.tituloLogro]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [items, search]);

  async function refreshAll() {
    setError(null);
    const [itemsRes, statsRes] = await Promise.all([fetch("/api/diplomas"), fetch("/api/stats")]);
    const itemsPayload = await itemsRes.json().catch(() => null);
    const statsPayload = await statsRes.json().catch(() => null);

    if (!itemsRes.ok) {
      setError(readMessage(itemsPayload, "No se pudo cargar la lista de diplomas."));
      return;
    }

    if (!statsRes.ok) {
      setError(readMessage(statsPayload, "No se pudo cargar estadísticas."));
      return;
    }

    setItems((itemsPayload?.items as DiplomaItem[]) ?? []);
    setStats((statsPayload as Stats) ?? EMPTY_STATS);
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setError(null);
    setFeedback(null);
    const formData = new FormData(form);

    const payload = {
      dni: String(formData.get("dni") ?? ""),
      nombres: String(formData.get("nombres") ?? ""),
      apellidoPaterno: String(formData.get("apellidoPaterno") ?? ""),
      apellidoMaterno: String(formData.get("apellidoMaterno") ?? ""),
      correo: String(formData.get("correo") ?? ""),
      telefono: String(formData.get("telefono") ?? ""),
      tipoDiploma: String(formData.get("tipoDiploma") ?? ""),
      rol: String(formData.get("rol") ?? ""),
      categoria: String(formData.get("categoria") ?? ""),
      tituloLogro: String(formData.get("tituloLogro") ?? ""),
      descripcion: String(formData.get("descripcion") ?? ""),
      facultad: String(formData.get("facultad") ?? ""),
      escuelaProfesional: String(formData.get("escuelaProfesional") ?? ""),
      carrera: String(formData.get("carrera") ?? ""),
      modalidad: String(formData.get("modalidad") ?? ""),
      tema: String(formData.get("tema") ?? ""),
      fechaEmision: String(formData.get("fechaEmision") ?? ""),
      fechaEvento: String(formData.get("fechaEvento") ?? ""),
      numeroResolucion: String(formData.get("numeroResolucion") ?? ""),
      observaciones: String(formData.get("observaciones") ?? "")
    };

    const response = await fetch("/api/diplomas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(readMessage(data, "No se pudo registrar el diploma."));
      setLoading(false);
      return;
    }

    setFeedback(readMessage(data, "Diploma registrado correctamente."));
    form.reset();
    setLoading(false);
    await refreshAll();
  }

  async function handleCancel(id: string) {
    const confirmed = window.confirm("¿Seguro que desea anular este diploma?");
    if (!confirmed) {
      return;
    }

    setError(null);
    const response = await fetch(`/api/diplomas/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(readMessage(data, "No se pudo anular el diploma."));
      return;
    }

    setFeedback(readMessage(data, "Diploma anulado correctamente."));
    await refreshAll();
  }

  function handleDownloadDocx(item: DiplomaItem) {
    window.open(`/api/diplomas/${item.id}/docx`, "_blank", "noopener,noreferrer");
  }

  async function handleBulkUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBulkLoading(true);
    setBulkMessage(null);
    setError(null);

    const formData = new FormData(form);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setBulkLoading(false);
      setBulkMessage("Seleccione un archivo Excel válido.");
      return;
    }

    const response = await fetch("/api/diplomas/masivo", {
      method: "POST",
      body: formData
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setBulkLoading(false);
      setBulkMessage(readMessage(data, "No se pudo procesar la carga masiva."));
      return;
    }

    const totalRows = Number((data as { totalRows?: number }).totalRows ?? 0);
    const created = Number((data as { created?: number }).created ?? 0);
    const failed = Number((data as { failed?: number }).failed ?? 0);
    setBulkMessage(`Carga completada: ${created}/${totalRows} registros creados. Fallidos: ${failed}.`);
    setBulkLoading(false);
    form.reset();
    await refreshAll();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <section className="grid" style={{ gap: "1rem" }}>
      <div className="row">
        <button className="button secondary" onClick={() => void refreshAll()} type="button">
          Actualizar datos
        </button>
        <button className="button secondary" onClick={handleLogout} type="button">
          Cerrar sesión
        </button>
      </div>

      <section className="card grid grid-2">
        <div>
          <p className="muted">Total diplomas</p>
          <h2>{stats.total}</h2>
        </div>
        <div>
          <p className="muted">Estados</p>
          <div className="row">
            <span className="badge ok">Generados: {stats.generado}</span>
            <span className="badge warn">Verificados: {stats.verificado}</span>
            <span className="badge danger">Anulados: {stats.anulado}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Registrar diploma individual</h2>
        <form className="grid" onSubmit={handleCreate} style={{ marginTop: "0.8rem" }}>
          <div className="grid grid-2">
            <div>
              <label htmlFor="dni">DNI *</label>
              <input id="dni" name="dni" required maxLength={8} />
            </div>
            <div>
              <label htmlFor="tipoDiploma">Tipo diploma *</label>
              <input id="tipoDiploma" name="tipoDiploma" required defaultValue="TITULACION" />
            </div>
            <div>
              <label htmlFor="rol">Rol o participación</label>
              <input id="rol" name="rol" placeholder="Ponente, participante, organizador…" />
            </div>
            <div>
              <label htmlFor="nombres">Nombres *</label>
              <input id="nombres" name="nombres" required />
            </div>
            <div>
              <label htmlFor="apellidoPaterno">Apellido paterno *</label>
              <input id="apellidoPaterno" name="apellidoPaterno" required />
            </div>
            <div>
              <label htmlFor="apellidoMaterno">Apellido materno</label>
              <input id="apellidoMaterno" name="apellidoMaterno" />
            </div>
            <div>
              <label htmlFor="fechaEmision">Fecha de emisión *</label>
              <input id="fechaEmision" name="fechaEmision" type="date" required />
            </div>
            <div>
              <label htmlFor="carrera">Carrera</label>
              <input id="carrera" name="carrera" />
            </div>
            <div>
              <label htmlFor="modalidad">Modalidad</label>
              <input id="modalidad" name="modalidad" />
            </div>
            <div>
              <label htmlFor="categoria">Categoría</label>
              <input id="categoria" name="categoria" />
            </div>
            <div>
              <label htmlFor="facultad">Facultad</label>
              <input id="facultad" name="facultad" />
            </div>
            <div>
              <label htmlFor="escuelaProfesional">Escuela profesional</label>
              <input id="escuelaProfesional" name="escuelaProfesional" />
            </div>
            <div>
              <label htmlFor="numeroResolucion">Número resolución</label>
              <input id="numeroResolucion" name="numeroResolucion" />
            </div>
            <div>
              <label htmlFor="correo">Correo</label>
              <input id="correo" name="correo" type="email" />
            </div>
            <div>
              <label htmlFor="telefono">Teléfono</label>
              <input id="telefono" name="telefono" />
            </div>
            <div>
              <label htmlFor="fechaEvento">Fecha de evento</label>
              <input id="fechaEvento" name="fechaEvento" type="date" />
            </div>
            <div>
              <label htmlFor="tema">Tema</label>
              <input id="tema" name="tema" />
            </div>
          </div>
          <div>
            <label htmlFor="tituloLogro">Título o logro *</label>
            <input id="tituloLogro" name="tituloLogro" required />
          </div>
          <div>
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" name="descripcion" />
          </div>
          <div>
            <label htmlFor="observaciones">Observaciones</label>
            <textarea id="observaciones" name="observaciones" />
          </div>
          <button className="button primary" disabled={loading} type="submit">
            {loading ? "Registrando..." : "Registrar diploma"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Carga masiva desde Excel</h2>
        <p className="muted" style={{ marginTop: "0.3rem" }}>
          El archivo debe contener columnas como mínimo: dni, nombres, apellido_paterno, tipo_diploma,
          titulo_o_logro y fecha_emision.
        </p>
        <form className="row" style={{ marginTop: "0.8rem" }} onSubmit={handleBulkUpload}>
          <input type="file" name="file" accept=".xlsx,.xls" required />
          <button className="button secondary" disabled={bulkLoading} type="submit">
            {bulkLoading ? "Procesando..." : "Procesar archivo"}
          </button>
        </form>
        {bulkMessage ? <p className="muted">{bulkMessage}</p> : null}
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>Listado de diplomas</h2>
          <input
            aria-label="Buscar diplomas"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por DNI, código o nombre"
            style={{ maxWidth: 340 }}
            value={search}
          />
        </div>
        <div style={{ overflowX: "auto", marginTop: "0.7rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Beneficiario</th>
                <th>Código</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Sin registros.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.beneficiarioNombre}</strong>
                      <div className="muted">{item.beneficiarioDni}</div>
                    </td>
                    <td>
                      <div>{item.codigoDiploma}</div>
                      <div className="muted">{item.codigoVerificacion}</div>
                    </td>
                    <td>
                      <div>{item.tipoDiploma}</div>
                      <div className="muted">{item.carrera ?? "—"}</div>
                    </td>
                    <td>{item.fechaEmision}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.estado === "anulado" ? "danger" : item.estado === "verificado" ? "warn" : "ok"
                        }`}
                      >
                        {item.estado}
                      </span>
                    </td>
                    <td>
                      <div className="row">
                        <button
                          className="button secondary"
                          disabled={!item.hasDocx}
                          onClick={() => void handleDownloadDocx(item)}
                          type="button"
                        >
                          DOCX
                        </button>
                        <button className="button danger" onClick={() => void handleCancel(item.id)} type="button">
                          Anular
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {feedback ? <p className="success-text">{feedback}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
