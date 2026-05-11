import "server-only";

import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type DiplomaPdfPayload = {
  codigoDiploma: string;
  codigoVerificacion: string;
  verificationUrl: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  facultad?: string | null;
  escuelaProfesional?: string | null;
  tituloLogro: string;
  fechaEvento?: string | null;
  fechaEmision: string;
  institucionEmisora: string;
};

function formatEsDate(dateIso?: string | null) {
  if (!dateIso) {
    return "";
  }

  const parsed = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateIso;
  }

  return parsed.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function name(payload: DiplomaPdfPayload) {
  return [payload.nombres, payload.apellidoPaterno, payload.apellidoMaterno].filter(Boolean).join(" ");
}

export async function buildDiplomaPdf(payload: DiplomaPdfPayload) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const primary = rgb(0.09, 0.14, 0.25);
  const secondary = rgb(0.2, 0.24, 0.32);

  page.drawRectangle({
    x: 24,
    y: 24,
    width: 794,
    height: 547,
    borderColor: primary,
    borderWidth: 2
  });

  page.drawText(payload.institucionEmisora, { x: 48, y: 542, size: 14, font: bold, color: primary });
  page.drawText("CERTIFICADO", { x: 48, y: 504, size: 36, font: bold, color: primary });
  page.drawText("Otorgado a:", { x: 48, y: 470, size: 15, font, color: secondary });

  page.drawText(name(payload), { x: 48, y: 438, size: 24, font: bold, color: primary });

  page.drawText("Por haber participado con el tema:", { x: 48, y: 398, size: 13, font, color: secondary });
  page.drawText(payload.tituloLogro.slice(0, 85), { x: 48, y: 376, size: 13, font: bold, color: primary });

  page.drawText(`Facultad: ${payload.facultad ?? "-"}`, { x: 48, y: 342, size: 12, font, color: secondary });
  page.drawText(`Escuela profesional: ${payload.escuelaProfesional ?? "-"}`, {
    x: 48,
    y: 324,
    size: 12,
    font,
    color: secondary
  });
  page.drawText(`Fecha de evento: ${formatEsDate(payload.fechaEvento ?? payload.fechaEmision)}`, {
    x: 48,
    y: 306,
    size: 12,
    font,
    color: secondary
  });
  page.drawText(`Fecha de emisión: ${formatEsDate(payload.fechaEmision)}`, {
    x: 48,
    y: 288,
    size: 12,
    font,
    color: secondary
  });

  page.drawText(`Código diploma: ${payload.codigoDiploma}`, {
    x: 48,
    y: 92,
    size: 11,
    font: bold,
    color: primary
  });
  page.drawText(`Código verificación: ${payload.codigoVerificacion}`, {
    x: 48,
    y: 76,
    size: 10,
    font,
    color: secondary
  });

  const qrDataUrl = await QRCode.toDataURL(payload.verificationUrl, { margin: 1, width: 160 });
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1] ?? "", "base64");
  const qrImage = await pdf.embedPng(qrBytes);
  page.drawImage(qrImage, { x: 640, y: 120, width: 150, height: 150 });
  page.drawText("Escanear para verificar", { x: 653, y: 100, size: 10, font, color: secondary });

  return await pdf.save();
}
