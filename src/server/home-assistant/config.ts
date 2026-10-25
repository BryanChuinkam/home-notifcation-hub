import { isIP } from "node:net";
import type { HomeAssistantStatus } from "../../lib/home-assistant";
export interface HomeAssistantConfig { origin: URL; address: string; token: string }
export function approvedAddress(address: string) {
  const family = isIP(address);
  if (family === 4) {
    const [a,b,,last] = address.split(".").map(Number);
    return last > 0 && last < 255 && (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127);
  }
  // No link-local, multicast, IPv4-mapped IPv6, public destinations or scope IDs.
  return family === 6 && (address === "::1" || /^(fc|fd)[0-9a-f]{2}:/i.test(address));
}
export function homeAssistantConfiguration(env: Record<string, string | undefined> = process.env): { config: HomeAssistantConfig | null; status: HomeAssistantStatus } {
  const fail = (message: string) => ({ config: null, status: { configured: false, message } });
  const raw = env.HOME_ASSISTANT_URL?.trim(), token = env.HOME_ASSISTANT_TOKEN?.trim();
  if (env.CI) return fail("Live Home Assistant is disabled in CI.");
  if (!raw && !token && !env.HOME_ASSISTANT_ADDRESS) return fail("Configure HOME_ASSISTANT_URL, HOME_ASSISTANT_ADDRESS and HOME_ASSISTANT_TOKEN on the server, then restart the app.");
  if (!raw || !token || token.length > 4096 || /[\x00-\x20\x7f]/.test(token)) return fail("Set a valid server-only Home Assistant URL and token, then restart the app.");
  try {
    const origin = new URL(raw), hostname = origin.hostname.replace(/^\[|\]$/g, "");
    const port = Number(origin.port || (origin.protocol === "https:" ? 443 : 80));
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash || !(port === 8123 || (origin.protocol === "http:" && port === 80) || (origin.protocol === "https:" && port === 443))) return fail("Home Assistant requires an HTTP(S) origin without credentials/path/query, on port 8123, HTTP port 80 or HTTPS port 443.");
    const address = env.HOME_ASSISTANT_ADDRESS?.trim() || (isIP(hostname) ? hostname : "");
    if (!approvedAddress(address) || (isIP(hostname) && hostname !== address)) return fail("Pin HOME_ASSISTANT_ADDRESS to the same approved private/loopback IP used by the server. Public, link-local and mismatched literal addresses are rejected.");
    return { config: { origin, address, token }, status: { configured: true, message: "Server configuration is present. Discover targets to test Home Assistant API access; physical delivery is unverified." } };
  } catch { return fail("Home Assistant configuration is invalid. Check the server environment and restart the app."); }
}
