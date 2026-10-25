import Database from "better-sqlite3";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import * as schema from "./schema";

export function openStore(path: string, migrationsFolder = resolve("migrations")) {
  if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true, mode: 0o700 });
  const raw = new Database(path);
  try {
    if (path !== ":memory:") chmodSync(path, 0o600);
    raw.pragma("foreign_keys = ON");
    raw.pragma("busy_timeout = 5000");
    raw.pragma("journal_mode = WAL");
    const db = drizzle(raw, { schema });
    if (raw.prepare("SELECT name FROM sqlite_master WHERE name = '__drizzle_migrations'").get()) {
      const applied = raw.prepare("SELECT hash, created_at FROM __drizzle_migrations").all() as { hash: string; created_at: number }[];
      const files = readMigrationFiles({ migrationsFolder });
      for (const migration of applied) {
        if (!files.some(file => file.folderMillis === migration.created_at && file.hash === migration.hash)) {
          throw new Error("An applied migration is missing or changed. Restore immutable migration files.");
        }
      }
    }
    migrate(db, { migrationsFolder });
    return { db, raw, close: () => raw.close() };
  } catch (error) { raw.close(); throw error; }
}
export type Store = ReturnType<typeof openStore>;
