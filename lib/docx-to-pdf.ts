import "server-only";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

function runCommand(binary: string, args: string[]) {
  return new Promise<{ code: number; stderr: string }>((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stderr });
    });
  });
}

export async function convertDocxBytesToPdf(docxBytes: Uint8Array) {
  const base = randomUUID();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "diploma-"));
  const inputPath = path.join(tempDir, `${base}.docx`);
  const outputPath = path.join(tempDir, `${base}.pdf`);
  const soffice = process.env.SOFFICE_BINARY?.trim() || "soffice";

  try {
    await fs.writeFile(inputPath, Buffer.from(docxBytes));
    const { code, stderr } = await runCommand(soffice, [
      "--headless",
      "--nologo",
      "--nolockcheck",
      "--convert-to",
      "pdf:writer_pdf_Export",
      "--outdir",
      tempDir,
      inputPath
    ]);

    if (code !== 0) {
      throw new Error(stderr || "Conversión DOCX->PDF falló.");
    }

    const pdfBuffer = await fs.readFile(outputPath);
    return new Uint8Array(pdfBuffer);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
