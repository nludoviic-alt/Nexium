import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { env, allowedAttachmentMimeTypes } from "./env.js";

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const attachmentsRoot = path.resolve(env.ATTACHMENTS_DIR);

export class AttachmentRejectedError extends Error {}

// Nom d'origine affiché à l'utilisateur : on retire tout séparateur de chemin et on
// tronque, mais on ne s'en sert JAMAIS pour construire un chemin disque (§10/§16 —
// protection contre les chemins malveillants).
export function sanitizeDisplayFilename(original: string): string {
  const base = original.replace(/[/\\]/g, "_").replace(/\0/g, "").trim();
  return base.slice(-180) || "fichier";
}

export function assertAttachmentAllowed(mimeType: string, sizeBytes: number) {
  if (!allowedAttachmentMimeTypes.has(mimeType)) {
    throw new AttachmentRejectedError(`Type de fichier non autorisé : ${mimeType}`);
  }
  const maxBytes = env.MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    throw new AttachmentRejectedError(`Fichier trop volumineux (max ${env.MAX_ATTACHMENT_SIZE_MB} Mo)`);
  }
}

export async function ensureAttachmentsDir() {
  await fs.mkdir(attachmentsRoot, { recursive: true });
}

// Le nom stocké sur disque est TOUJOURS généré par nous (UUID + extension dérivée du
// MIME type validé) — jamais dérivé du nom fourni par le client ou l'e-mail entrant.
export async function saveAttachment(buffer: Buffer, mimeType: string): Promise<{ storedFilename: string; storagePath: string }> {
  assertAttachmentAllowed(mimeType, buffer.byteLength);
  await ensureAttachmentsDir();

  const ext = MIME_TO_EXT[mimeType] ?? "bin";
  const storedFilename = `${randomUUID()}.${ext}`;
  const fullPath = path.join(attachmentsRoot, storedFilename);

  // Vérification défensive : le chemin résolu doit rester dans le dossier autorisé.
  if (!fullPath.startsWith(attachmentsRoot + path.sep)) {
    throw new AttachmentRejectedError("Chemin de stockage invalide");
  }

  await fs.writeFile(fullPath, buffer, { mode: 0o600 });
  return { storedFilename, storagePath: fullPath };
}

export async function readAttachment(storedFilename: string): Promise<Buffer> {
  // storedFilename vient toujours de notre base (jamais saisi librement par un client),
  // mais on revalide quand même qu'il ne contient aucun séparateur de chemin.
  if (storedFilename.includes("/") || storedFilename.includes("\\") || storedFilename.includes("..")) {
    throw new AttachmentRejectedError("Nom de fichier stocké invalide");
  }
  const fullPath = path.join(attachmentsRoot, storedFilename);
  if (!fullPath.startsWith(attachmentsRoot + path.sep)) {
    throw new AttachmentRejectedError("Chemin de stockage invalide");
  }
  return fs.readFile(fullPath);
}
