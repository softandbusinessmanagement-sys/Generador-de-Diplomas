const DEFAULT_DIPLOMA_BUCKET = "diplomas";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function getDiplomaBucket() {
  const bucket = process.env.SUPABASE_STORAGE_DIPLOMAS_BUCKET?.trim();
  return bucket && bucket.length > 0 ? bucket : DEFAULT_DIPLOMA_BUCKET;
}

export function buildDiplomaPdfPath(codigoDiploma: string, dni: string) {
  const safeCode = slugify(codigoDiploma);
  const safeDni = slugify(dni);
  return `pdf/${safeCode}-${safeDni}.pdf`;
}

export function buildDiplomaDocxPath(codigoDiploma: string, dni: string) {
  const safeCode = slugify(codigoDiploma);
  const safeDni = slugify(dni);
  return `docx/${safeCode}-${safeDni}.docx`;
}
