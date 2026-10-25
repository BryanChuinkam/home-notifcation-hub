import { integrationRegistry } from "./home-assistant/registry";
import { homeAssistantHandlers } from "./home-assistant/http";
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
  const integrations = integrationRegistry();
  const messaging = createMessaging(store, { adapters: integrations.adapters });
  return { auth, messaging, integrationStatus: integrations.status, homeAssistantHandlers: homeAssistantHandlers(auth, messaging, integrations.client, integrations.status, config.origin), handlers: createHandlers(auth, config), messagingHandlers: createMessagingHandlers(auth, messaging, config.origin) };
}
const shared = globalThis as typeof globalThis & { hubHomeAssistantRuntime?: ReturnType<typeof createRuntime> };
export function getRuntime() { return shared.hubHomeAssistantRuntime ??= createRuntime(); }
