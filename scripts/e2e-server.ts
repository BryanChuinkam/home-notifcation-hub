import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
const port = Number(process.argv[2]);
if (![3217, 3218].includes(port)) throw new Error("E2E server requires its reserved port");
const directory = mkdtempSync(join(tmpdir(), "hnh-e2e-"));
const server = spawn(process.execPath, [resolve("scripts/run-app.mjs"), "start", "--port", String(port)], {
  stdio: "inherit", env: { ...process.env, DATABASE_PATH: join(directory, "hub.sqlite"), APP_ORIGIN: `http://127.0.0.1:${port}`, HUB_SETUP_SECRET: "e2e-fixture-only-secret-not-for-live-use-123456" },
});
for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => server.kill(signal));
server.on("exit", code => { rmSync(directory, { recursive: true, force: true }); process.exit(code ?? 0); });
