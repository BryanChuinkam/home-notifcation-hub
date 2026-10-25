import nextEnv from "@next/env";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
const mode = process.argv[2];
if (!["dev", "start"].includes(mode)) throw new Error("Choose dev or start");
process.env.NODE_ENV = mode === "dev" ? "development" : "production";
nextEnv.loadEnvConfig(process.cwd(), mode === "dev");
const env = { ...process.env };
// Apply migrations before either process starts, avoiding first-start races.
const migrated = spawnSync(process.execPath, ["--import", "tsx", "scripts/migrate.ts"], { env, stdio: "inherit" });
if (migrated.status !== 0) process.exit(migrated.status ?? 1);
const children = [
  spawn(process.execPath, ["--import", "tsx", "scripts/worker.ts"], { env, stdio: "inherit" }),
  spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), mode, "--hostname", "127.0.0.1", ...process.argv.slice(3)], { env, stdio: "inherit" }),
];
let stopping = false, remaining = children.length, exitCode = 0;
function shutdown(code) {
  if (stopping) return;
  stopping = true; exitCode = code;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => { for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); }, 12000).unref();
}
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => shutdown(0));
for (const child of children) {
  child.on("error", () => shutdown(1));
  child.on("close", code => { if (!stopping) shutdown(code || 1); if (--remaining === 0) process.exit(exitCode); });
}
