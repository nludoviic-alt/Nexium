import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./client.js";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[db] Migrations appliquées.");
}

main().catch((err) => {
  console.error("[db] Échec des migrations :", err);
  process.exit(1);
});
