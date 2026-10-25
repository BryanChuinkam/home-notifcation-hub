import nextEnv from "@next/env";
import { setTimeout as pause } from "node:timers/promises";
import { readConfig } from "../src/server/config";
import { openStore } from "../src/server/db/store";
import { createMessaging } from "../src/server/notifications/service";
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV === "development");
const store = openStore(readConfig().databasePath);
const queue = createMessaging(store);
const stop = new AbortController();
for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => stop.abort());
try {
  do {
    try { await queue.processDue(); }
    catch { console.error("Queue processing is unavailable; retrying shortly."); if (process.argv.includes("--once")) { process.exitCode = 1; break; } }
    if (process.argv.includes("--once") || stop.signal.aborted) break;
    await pause(500, undefined, { signal: stop.signal }).catch(() => {});
  } while (!stop.signal.aborted);
} finally { store.close(); }
