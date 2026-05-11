import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

function formatDateForDiploma(dateIso?: string | null) {
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

export function buildTemplateData(payload: {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  facultad?: string | null;
  escuelaProfesional?: string | null;
  tituloLogro: string;
  fechaEvento?: string | null;
  fechaEmision: string;
}) {
  return {
    Nombres: payload.nombres,
    "Apellido paterno": payload.apellidoPaterno,
    "Apellido Materno": payload.apellidoMaterno ?? "",
    Facultad: payload.facultad ?? "",
    "Escuela profesional": payload.escuelaProfesional ?? "",
    Tema: payload.tituloLogro,
    "Fecha de evento": formatDateForDiploma(payload.fechaEvento ?? payload.fechaEmision),
    "Fecha de emisión": formatDateForDiploma(payload.fechaEmision)
  };
}

function getTemplatePath() {
  const customPath = process.env.DOCX_TEMPLATE_PATH?.trim();
  if (customPath) {
    return path.isAbsolute(customPath)
      ? customPath
      : path.join(process.cwd(), customPath);
  }

  return path.join(process.cwd(), "PONENCIA PRESENCIA - JAIRO VARGAS (2).docx");
}

export async function buildDocxFromTemplate(templateData: Record<string, string>) {
  const templatePath = getTemplatePath();
  const fileBuffer = await fs.readFile(templatePath);
  const zip = new PizZip(fileBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: {
      start: "[",
      end: "]"
    },
    parser(tag) {
      return {
        get(scope) {
          if (Object.prototype.hasOwnProperty.call(scope, tag)) {
            return scope[tag];
          }
          return "";
        }
      };
    }
  });

  doc.render(templateData);
  return doc.getZip().generate({
    type: "uint8array",
    compression: "DEFLATE"
  });
}
