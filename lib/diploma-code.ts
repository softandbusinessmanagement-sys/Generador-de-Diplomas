import crypto from "node:crypto";

export function buildDiplomaCode() {
  const year = new Date().getFullYear();
  const short = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `UC-${year}-${short}`;
}

export function buildVerificationCode() {
  return crypto.randomBytes(24).toString("hex");
}
