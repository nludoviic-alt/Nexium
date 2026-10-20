#!/usr/bin/env node
import * as ftp from "basic-ftp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const localEnv = {
  ...loadEnvFile(path.join(projectRoot, ".env")),
  ...loadEnvFile(path.join(projectRoot, ".env.local")),
};

const host = localEnv.FTP_HOST || process.env.FTP_HOST;
const user = localEnv.FTP_USERNAME || process.env.FTP_USERNAME;
const password = localEnv.FTP_PASSWORD || process.env.FTP_PASSWORD;
const port = Number(localEnv.FTP_PORT || process.env.FTP_PORT || 21);
const serverDir = localEnv.FTP_SERVER_DIR || process.env.FTP_SERVER_DIR || "www";
const secure = localEnv.FTP_SECURE === "true" || localEnv.FTP_SECURE === "1";

console.log("\n🚀 [Nexium Deploy] Démarrage du déploiement direct vers OVH...");

if (!host || !user || !password) {
  console.error(`
❌ ERREUR : Identifiants FTP OVH manquants dans .env.local

Veuillez ajouter ces 3 lignes dans votre fichier .env.local :

  FTP_HOST=ftp.votre-cluster.hosting.ovh.net
  FTP_USERNAME=votre-identifiant-ftp
  FTP_PASSWORD=votre-mot-de-passe-ftp
  # Optionnels :
  # FTP_PORT=21
  # FTP_SERVER_DIR=www
  # FTP_SECURE=false

(Ces informations se trouvent dans votre Espace Client OVH > Hébergement > FTP - SSH)
`);
  process.exit(1);
}

const distDir = path.join(projectRoot, "dist");
if (!fs.existsSync(distDir) || fs.readdirSync(distDir).length === 0) {
  console.error(`
❌ ERREUR : Le dossier 'dist/' est vide ou inexistant.
Veuillez d'abord exécuter : npm run build
`);
  process.exit(1);
}

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.ftp.timeout = 60000;

  try {
    console.log(`📡 Connexion à l'hôte FTP OVH : ${host}:${port} (Utilisateur: ${user})...`);
    await client.access({
      host,
      user,
      password,
      port,
      secure,
      secureOptions: { rejectUnauthorized: false },
    });

    console.log(`📁 Répertoire cible sur OVH : /${serverDir}`);
    await client.ensureDir(serverDir);

    console.log(`📤 Téléversement des fichiers compilés depuis dist/ vers OVH /${serverDir}...`);
    const startTime = Date.now();
    await client.uploadFromDir(distDir, serverDir);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ SUCCÈS : Déploiement terminé en ${duration}s !`);
    console.log(`🌐 Votre site Nexium Markets est à jour sur OVH.\n`);
  } catch (err) {
    console.error(`\n❌ Échec du transfert FTP vers OVH :`, err.message || err);
    console.error(`\n💡 Vérifiez que :
1. Vos identifiants FTP OVH dans .env.local sont corrects.
2. Si la connexion bloque, essayez d'ajouter FTP_SECURE=false dans .env.local.\n`);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
