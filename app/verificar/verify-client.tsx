"use client";

import { FormEvent, useEffect, useState } from "react";

type VerifyResult = {
  codigoDiploma: string;
  estado: string;
  fechaEmision: string;
  tipoDiploma: string;
  tituloLogro: string;
  carrera: string | null;
  modalidad: string | null;
  institucionEmisora: string;
  beneficiarioDni: string;
  beneficiarioNombre: string;
};

function readError(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    return String((payload as { error?: string }).error ?? "No se pudo verificar el diploma.");
  }
  return "No se pudo verificar el diploma.";
}

export function VerifyClient({ initialQuery }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verify(input: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(readError(payload));
      setLoading(false);
      return;
    }

    setResult(payload as VerifyResult);
    setLoading(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setError("Ingrese un DNI o código de verificación.");
      return;
    }
    void verify(query.trim());
  }

  useEffect(() => {
    if (initialQuery) {
      void verify(initialQuery);
    }
  }, [initialQuery]);

  return (
    <main className="container grid" style={{ gap: "1rem", maxWidth: 840 }}>
      <section className="card">
        <p className="eyebrow">Verificación pública</p>
        <h1>Validar diploma digital</h1>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Ingrese DNI o código de verificación para validar autenticidad en tiempo real.
        </p>
        <form className="row" onSubmit={onSubmit} style={{ marginTop: "0.8rem" }}>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="DNI o código de verificación"
            value={query}
          />
          <button className="button primary" disabled={loading} type="submit">
            {loading ? "Verificando..." : "Verificar"}
          </button>
        </form>
      </section>

      {result ? (
        <section className="card grid" style={{ gap: "0.75rem" }}>
          <h2>Diploma válido</h2>
          <p>
            <strong>Beneficiario:</strong> {result.beneficiarioNombre} ({result.beneficiarioDni})
          </p>
          <p>
            <strong>Código diploma:</strong> {result.codigoDiploma}
          </p>
          <p>
            <strong>Tipo / estado:</strong> {result.tipoDiploma} — {result.estado}
          </p>
          <p>
            <strong>Título o logro:</strong> {result.tituloLogro}
          </p>
          <p>
            <strong>Carrera / modalidad:</strong> {result.carrera ?? "—"} / {result.modalidad ?? "—"}
          </p>
          <p>
            <strong>Institución:</strong> {result.institucionEmisora}
          </p>
          <p>
            <strong>Fecha de emisión:</strong> {result.fechaEmision}
          </p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <p className="error-text">{error}</p>
        </section>
      ) : null}
    </main>
  );
}
