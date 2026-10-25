export interface HubConfig { origin: string; secureCookies: boolean; databasePath: string; setupSecret: string | undefined }
export function readConfig(env: Record<string, string | undefined> = process.env): HubConfig {
  const url = new URL(env.APP_ORIGIN ?? "http://127.0.0.1:3000");
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
      !(url.protocol === "https:" || (url.protocol === "http:" && loopback))) {
    throw new Error("APP_ORIGIN must be an HTTPS origin, or HTTP loopback for local development.");
  }
  if (env.CI && !env.DATABASE_PATH) throw new Error("CI requires an isolated DATABASE_PATH.");
  return { origin: url.origin, secureCookies: url.protocol === "https:", databasePath: env.DATABASE_PATH ?? "data/development/hub.sqlite", setupSecret: env.HUB_SETUP_SECRET };
}
