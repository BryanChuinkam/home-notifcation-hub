import "server-only";
import { openStore } from "./db/store";
import { readConfig } from "./config";
import { createAuth } from "./auth/service";
import { createHandlers } from "./auth/http";
function createRuntime() {
  const config = readConfig();
  const store = openStore(config.databasePath);
  const auth = createAuth(store, config.setupSecret);
  return { auth, handlers: createHandlers(auth, config) };
}
const shared = globalThis as typeof globalThis & { hubRuntime?: ReturnType<typeof createRuntime> };
export function getRuntime() { return shared.hubRuntime ??= createRuntime(); }
