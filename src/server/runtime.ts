import "server-only";
import { openStore } from "./db/store";
import { readConfig } from "./config";
import { createAuth } from "./auth/service";
import { createHandlers } from "./auth/http";
import { createMessaging } from "./notifications/service";
import { createMessagingHandlers } from "./notifications/http";
function createRuntime() {
  const config = readConfig();
  const store = openStore(config.databasePath);
  const auth = createAuth(store, config.setupSecret);
  const messaging = createMessaging(store);
  return { auth, messaging, handlers: createHandlers(auth, config), messagingHandlers: createMessagingHandlers(auth, messaging, config.origin) };
}
const shared = globalThis as typeof globalThis & { hubMessagingRuntime?: ReturnType<typeof createRuntime> };
export function getRuntime() { return shared.hubMessagingRuntime ??= createRuntime(); }
