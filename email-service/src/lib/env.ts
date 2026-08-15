import "dotenv/config";
import { z } from "zod";

// Toutes les variables sensibles (mot de passe OVH, secret API) ne vivent que dans ce
// process Node côté serveur. Rien ici n'est jamais envoyé au frontend (§12 du cahier des
// charges) : ce fichier n'est importé que par du code qui tourne exclusivement ici.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4100),
  DATABASE_URL: z.string().default("file:./data/email.db"),

  // Le frontend (admin statique) doit présenter ce secret pour appeler l'API. Ce n'est
  // PAS de l'authentification utilisateur — juste une barrière service-à-service.
  // TODO(auth réelle) : remplacer par une vraie vérification de session/JWT signé une
  // fois l'authentification centrale du projet construite.
  API_SHARED_SECRET: z.string().min(16, "API_SHARED_SECRET doit faire au moins 16 caractères"),
  CORS_ORIGIN: z.string().default("*"),

  // Boîte OVH — laissés vides tant que la configuration OVH n'a pas été faite.
  // Le service démarre quand même mais la synchro IMAP / l'envoi SMTP no-opent
  // proprement avec un avertissement clair plutôt que de planter.
  EMAIL_ADDRESS: z.string().email().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  IMAP_HOST: z.string().optional(),
  IMAP_PORT: z.coerce.number().int().positive().default(993),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SENDER_DISPLAY_NAME: z.string().default("Nexium Markets"),

  SYNC_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),

  ATTACHMENTS_DIR: z.string().default("./storage/attachments"),
  MAX_ATTACHMENT_SIZE_MB: z.coerce.number().positive().default(15),
  ALLOWED_ATTACHMENT_MIME_TYPES: z
    .string()
    .default("application/pdf,image/png,image/jpeg,image/gif,image/webp,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Configuration invalide :", parsed.error.flatten().fieldErrors);
  throw new Error("Variables d'environnement invalides — voir .env.example");
}

export const env = parsed.data;

export const isOvhConfigured = Boolean(env.EMAIL_ADDRESS && env.EMAIL_PASSWORD && env.IMAP_HOST && env.SMTP_HOST);

export const allowedAttachmentMimeTypes = new Set(
  env.ALLOWED_ATTACHMENT_MIME_TYPES.split(",").map((t) => t.trim()).filter(Boolean)
);
