import { z } from "zod";

const dniSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos.");

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD.");

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const optionalText = (maxLength: number) =>
  z.preprocess(emptyToUndefined, z.string().max(maxLength).optional());

const optionalIsoDateSchema = z.preprocess(emptyToUndefined, isoDateSchema.optional());

export const diplomaCreateSchema = z.object({
  dni: dniSchema,
  nombres: z.string().trim().min(2).max(100),
  apellidoPaterno: z.string().trim().min(2).max(100),
  apellidoMaterno: optionalText(100),
  correo: optionalText(150),
  telefono: optionalText(20),
  tipoDiploma: z.string().trim().min(1).max(50),
  categoria: optionalText(50),
  tituloLogro: z.string().trim().min(1).max(255),
  descripcion: optionalText(3000),
  facultad: optionalText(150),
  escuelaProfesional: optionalText(150),
  carrera: optionalText(150),
  modalidad: optionalText(100),
  tema: optionalText(255),
  fechaEmision: isoDateSchema,
  fechaEvento: optionalIsoDateSchema,
  numeroResolucion: optionalText(100),
  observaciones: optionalText(1500)
});

export const diplomaUpdateSchema = diplomaCreateSchema
  .partial()
  .extend({
    estado: z.enum(["generado", "verificado", "anulado"]).optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "No hay campos para actualizar."
  });

export const verifyInputSchema = z.object({
  query: z.string().trim().min(6).max(100)
});

function toTrimmedString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

export function normalizeDiplomaInput(payload: unknown) {
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

  return {
    dni: toTrimmedString(data.dni),
    nombres: toTrimmedString(data.nombres),
    apellidoPaterno: toTrimmedString(data.apellidoPaterno),
    apellidoMaterno: toTrimmedString(data.apellidoMaterno),
    correo: toTrimmedString(data.correo),
    telefono: toTrimmedString(data.telefono),
    tipoDiploma: toTrimmedString(data.tipoDiploma),
    categoria: toTrimmedString(data.categoria),
    tituloLogro: toTrimmedString(data.tituloLogro),
    descripcion: toTrimmedString(data.descripcion),
    facultad: toTrimmedString(data.facultad),
    escuelaProfesional: toTrimmedString(data.escuelaProfesional),
    carrera: toTrimmedString(data.carrera),
    modalidad: toTrimmedString(data.modalidad),
    tema: toTrimmedString(data.tema),
    fechaEmision: toTrimmedString(data.fechaEmision),
    fechaEvento: toTrimmedString(data.fechaEvento),
    numeroResolucion: toTrimmedString(data.numeroResolucion),
    observaciones: toTrimmedString(data.observaciones)
  };
}

export function formatValidationError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) {
    return "Datos inválidos.";
  }
  const field = issue.path?.[0];
  return field ? `${String(field)}: ${issue.message}` : issue.message;
}

export function asNullable(value?: string) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
