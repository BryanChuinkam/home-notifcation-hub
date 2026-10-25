import { homeAssistantConfiguration } from "./config";
import { createHomeAssistantClient } from "./client";
import { homeAssistantAdapter } from "./adapter";
import { mockAdapter } from "../notifications/mock";
export function integrationRegistry() {
  const { config, status } = homeAssistantConfiguration();
  const client = config ? createHomeAssistantClient(config) : null;
  return { status, client, adapters: client ? [mockAdapter, homeAssistantAdapter(client)] : [mockAdapter] };
}
