import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAttachments, emailConversations } from "../db/schema.js";
import { canActOnConversation } from "../lib/permissions.js";
import { assertAttachmentAllowed, saveAttachment, readAttachment, sanitizeDisplayFilename, AttachmentRejectedError } from "../lib/attachments.js";
import { env, allowedAttachmentMimeTypes } from "../lib/env.js";

export const attachmentsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_ATTACHMENT_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // §10/§16 : rejeter tôt les types non autorisés (contrôle MIME, pas juste extension).
    cb(null, allowedAttachmentMimeTypes.has(file.mimetype));
  },
});

// §10 : upload d'une pièce jointe pour une réponse en cours de rédaction (avant envoi).
attachmentsRouter.post("/attachments", upload.single("file"), async (req, res) => {
  const agent = req.agent!;
  const conversationId = String(req.body?.conversationId ?? "");
  if (!req.file) return res.status(400).json({ error: "no_file_or_type_not_allowed" });
  if (!conversationId) return res.status(400).json({ error: "missing_conversation" });

  const [conversation] = await db.select().from(emailConversations).where(eq(emailConversations.id, conversationId)).limit(1);
  if (!conversation) return res.status(404).json({ error: "conversation_not_found" });
  if (!canActOnConversation(agent, conversation)) return res.status(403).json({ error: "forbidden" });

  try {
    assertAttachmentAllowed(req.file.mimetype, req.file.size);
    const { storedFilename, storagePath } = await saveAttachment(req.file.buffer, req.file.mimetype);

    const id = randomUUID();
    await db.insert(emailAttachments).values({
      id,
      messageId: null,
      conversationId,
      uploadedByUserId: agent.id,
      filename: sanitizeDisplayFilename(req.file.originalname),
      storedFilename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath,
    });

    res.json({ id, filename: sanitizeDisplayFilename(req.file.originalname), mimeType: req.file.mimetype, size: req.file.size });
  } catch (err) {
    if (err instanceof AttachmentRejectedError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

// §10/§16 : téléchargement — jamais d'exécution directe, toujours en pièce jointe avec
// le bon Content-Type, jamais le chemin disque exposé au client.
attachmentsRouter.get("/attachments/:id/download", async (req, res) => {
  const { id } = req.params;
  const [attachment] = await db.select().from(emailAttachments).where(eq(emailAttachments.id, id)).limit(1);
  if (!attachment) return res.status(404).json({ error: "not_found" });

  const buffer = await readAttachment(attachment.storedFilename);
  res.setHeader("Content-Type", attachment.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(buffer);
});
