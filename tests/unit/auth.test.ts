import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, statSync, cpSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { verify } from "@node-rs/argon2";
import { openStore, type Store } from "../../src/server/db/store";
import { createAuth, SESSION_LIFETIME } from "../../src/server/auth/service";
import { createHandlers, sessionCookie } from "../../src/server/auth/http";
import { readConfig } from "../../src/server/config";

const secret = "test-only-secret-not-a-live-credential-123456";
const credentials = { username: "household", password: "test-only-password-123" };
const origin = "http://127.0.0.1:3000";
const fixtures: { directory: string; stores: Store[] }[] = [];
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "hnh-unit-"));
  const path = join(directory, "test.sqlite");
  const store = openStore(path);
  const resource = { directory, stores: [store] }; fixtures.push(resource);
  let now = 1000000;
  const auth = createAuth(store, secret, () => now);
  const handlers = createHandlers(auth, { origin, secureCookies: false });
  return { directory, path, store, auth, handlers, resource, advance: (ms: number) => { now += ms; } };
}
afterEach(() => {
  for (const { directory, stores } of fixtures.splice(0)) {
    for (const store of stores) if (store.raw.open) store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
function request(operation: string, input: unknown = credentials, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/auth/${operation}`, { method: "POST", headers: { origin, "content-type": "application/json", ...headers }, body: JSON.stringify(input) });
}

describe("persistent authentication", () => {
  it("migrates once, hashes passwords with Argon2id and persists sessions/devices across reopening", async () => {
    const f = fixture();
    await f.auth.setup({ ...credentials, secret });
    const stored = f.store.raw.prepare("SELECT * FROM admins").get() as { password_hash: string };
    expect(stored.password_hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(await verify(stored.password_hash, credentials.password)).toBe(true);
    expect(await verify(stored.password_hash, "wrong-password")).toBe(false);
    const token = await f.auth.login(credentials);
    const session = f.store.raw.prepare("SELECT token_hash FROM sessions").get() as { token_hash: string };
    expect(session.token_hash).not.toBe(token);
    expect(session.token_hash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(statSync(f.path).mode & 0o777).toBe(0o600);
    expect(f.store.raw.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(f.store.raw.pragma("foreign_keys", { simple: true })).toBe(1);
    f.store.close();
    const reopened = openStore(f.path); f.resource.stores.push(reopened);
    const auth = createAuth(reopened, undefined, () => 1000000);
    expect(auth.session(token)).toEqual({ id: 1, username: credentials.username });
    expect(auth.listDevices(token)).toHaveLength(3);
    expect(auth.listDevices(token).every(device => device.adapter === "mock" && device.lastTestAt === null)).toBe(true);
    expect(reopened.raw.prepare("SELECT count(*) AS count FROM __drizzle_migrations").get()).toEqual({ count: 2 });
    expect(reopened.raw.pragma("integrity_check", { simple: true })).toBe("ok");
  });
  it("runs the documented migration CLI repeatedly against isolated storage", () => {
    const f = fixture();
    for (let i = 0; i < 2; i++) {
      const output = execFileSync(process.execPath, ["--import", "tsx", "scripts/migrate.ts"], {
        encoding: "utf8", env: { ...process.env, DATABASE_PATH: f.path, APP_ORIGIN: origin },
      });
      expect(output).toContain("integrity: ok");
    }
  });
  it("rejects changed applied migrations", async () => {
    const f = fixture(); await f.auth.setup({ ...credentials, secret }); f.store.close();
    const migrations = join(f.directory, "migrations"); cpSync("migrations", migrations, { recursive: true });
    appendFileSync(join(migrations, "0000_foundation.sql"), "\n-- forbidden edit\n");
    expect(() => openStore(f.path, migrations)).toThrow("applied migration");
  });
  it("creates exactly one administrator under concurrent setup through separate connections", async () => {
    const f = fixture(); const second = openStore(f.path); f.resource.stores.push(second);
    const other = createAuth(second, secret);
    const results = await Promise.allSettled([f.auth.setup({ ...credentials, secret }), other.setup({ ...credentials, username: "another", secret })]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(f.store.raw.prepare("SELECT count(*) AS count FROM admins").get()).toEqual({ count: 1 });
    expect(f.store.raw.prepare("SELECT count(*) AS count FROM devices").get()).toEqual({ count: 3 });
  });
  it("requires a configured secret, validates setup and permanently closes setup after success", async () => {
    const f = fixture();
    await expect(createAuth(f.store, undefined).setup({ ...credentials, secret })).rejects.toMatchObject({ status: 503 });
    await expect(f.auth.setup({ ...credentials, secret: "wrong-secret-that-is-at-least-32-chars" })).rejects.toMatchObject({ status: 403 });
    await expect(f.auth.setup({ ...credentials, password: "short", secret })).rejects.toMatchObject({ status: 400 });
    await expect(f.auth.setup({ ...credentials, username: "bad user", secret })).rejects.toMatchObject({ status: 400 });
    await expect(f.auth.setup({ ...credentials, username: "household\n", secret })).rejects.toMatchObject({ status: 400 });
    await f.auth.setup({ ...credentials, secret });
    await expect(f.auth.setup({ ...credentials, secret })).rejects.toMatchObject({ status: 409 });
  });
  it("rejects wrong passwords and usernames with identical errors", async () => {
    const f = fixture(); await f.auth.setup({ ...credentials, secret });
    await expect(f.auth.login({ ...credentials, password: "wrong" })).rejects.toMatchObject({ status: 401, message: "Username or password is incorrect." });
    await expect(f.auth.login({ ...credentials, username: "different" })).rejects.toMatchObject({ status: 401, message: "Username or password is incorrect." });
    expect(f.store.raw.prepare("SELECT count(*) AS count FROM sessions").get()).toEqual({ count: 0 });
  });
  it("enforces expiration, token integrity, rotation and logout", async () => {
    const f = fixture(); await f.auth.setup({ ...credentials, secret });
    const first = await f.auth.login(credentials); const second = await f.auth.login(credentials);
    expect(first).not.toBe(second);
    expect(f.auth.session("forged")).toBeNull();
    expect(f.auth.session("x".repeat(43))).toBeNull();
    expect(() => f.auth.listDevices(undefined)).toThrow("sign in");
    expect(() => f.auth.logout(undefined)).toThrow("sign in");
    f.auth.logout(first); expect(f.auth.session(first)).toBeNull(); expect(f.auth.session(second)).not.toBeNull();
    f.advance(SESSION_LIFETIME); expect(f.auth.session(second)).toBeNull();
  });
  it("persists the single-admin login throttle across connections and resets after its window", async () => {
    const f = fixture();
    for (let i = 0; i < 10; i++) await expect(f.auth.login({})).rejects.toMatchObject({ status: 400 });
    const second = openStore(f.path); f.resource.stores.push(second);
    await expect(createAuth(second, secret, () => 1000000).login(credentials)).rejects.toMatchObject({ status: 429, retryAfter: 900 });
    f.advance(15 * 60 * 1000); await expect(f.auth.login({})).rejects.toMatchObject({ status: 400 });
  });
  it("throttles invalid setup secrets before running password hashing", async () => {
    const f = fixture();
    for (let i = 0; i < 5; i++) await expect(f.auth.setup({ ...credentials, secret: "x".repeat(32) })).rejects.toMatchObject({ status: 403 });
    await expect(f.auth.setup({ ...credentials, secret })).rejects.toMatchObject({ status: 429 });
  });
});

describe("HTTP security boundary", () => {
  it.each([undefined, "https://attacker.example", "null"])("rejects mutation origin %s", async supplied => {
    const f = fixture(); const req = request("setup", { ...credentials, secret });
    if (supplied) req.headers.set("origin", supplied); else req.headers.delete("origin");
    expect((await f.handlers.mutate(req, "setup")).status).toBe(403);
    expect(f.auth.isSetup()).toBe(false);
  });
  it("rejects cross-site fetch, oversized streamed input, malformed JSON and wrong media type", async () => {
    const f = fixture();
    expect((await f.handlers.mutate(request("setup", {}, { "sec-fetch-site": "cross-site" }), "setup")).status).toBe(403);
    expect((await f.handlers.mutate(request("setup", { large: "a".repeat(5000) }), "setup")).status).toBe(413);
    const bad = new Request(`${origin}/api/auth/setup`, { method: "POST", headers: { origin, "content-type": "application/json" }, body: "{" });
    expect((await f.handlers.mutate(bad, "setup")).status).toBe(400);
    expect((await f.handlers.mutate(request("setup", {}, { "content-type": "text/plain" }), "setup")).status).toBe(415);
  });
  it("protects devices, sets private cookies, avoids credential exposure and revokes logout", async () => {
    const f = fixture();
    expect(f.handlers.getDevices(new Request(`${origin}/api/devices`)).status).toBe(401);
    expect(f.handlers.getDevices(new Request(`${origin}/api/devices`, { headers: { cookie: "hnh_session=forged" } })).status).toBe(401);
    expect((await f.handlers.mutate(request("setup", { ...credentials, secret }), "setup")).status).toBe(201);
    const login = await f.handlers.mutate(request("login"), "login");
    const cookie = login.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=Strict"); expect(cookie).toContain("Max-Age=28800");
    expect(sessionCookie("x", true)).toContain("; Secure");
    expect(await login.json()).toEqual({ ok: true });
    const get = new Request(`${origin}/api/devices`, { headers: { cookie: cookie.split(";")[0] } });
    const response = f.handlers.getDevices(get); expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("no-store");
    const text = await response.text(); expect(text).not.toContain(secret); expect(text).not.toContain("password"); expect(text).not.toContain("token");
    const logout = request("logout", {}, { cookie: cookie.split(";")[0] });
    const result = await f.handlers.mutate(logout, "logout"); expect(result.status).toBe(204); expect(result.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(f.handlers.getDevices(get).status).toBe(401);
  });
  it("emits Retry-After for exhausted throttles", async () => {
    const f = fixture(); for (let i = 0; i < 10; i++) await f.handlers.mutate(request("login", {}), "login");
    const result = await f.handlers.mutate(request("login"), "login"); expect(result.status).toBe(429); expect(result.headers.get("retry-after")).toBe("900");
  });
  it("does not trust forwarded host or IP to override origin or throttle", async () => {
    const f = fixture();
    const result = await f.handlers.mutate(request("login", credentials, { origin: "https://forged.example", "x-forwarded-host": "127.0.0.1:3000", "x-forwarded-for": "127.0.0.1" }), "login");
    expect(result.status).toBe(403);
  });
});

describe("runtime configuration", () => {
  it("allows HTTP only on loopback and requires explicit CI storage", () => {
    expect(readConfig({ APP_ORIGIN: "https://hub.home" }).secureCookies).toBe(true);
    expect(readConfig({ APP_ORIGIN: origin }).secureCookies).toBe(false);
    for (const value of ["http://192.168.1.3", "ftp://localhost", "https://user:pass@hub.home", "https://hub.home/path", "https://hub.home?x=1"]) expect(() => readConfig({ APP_ORIGIN: value })).toThrow();
    expect(() => readConfig({ CI: "true" })).toThrow("isolated DATABASE_PATH");
  });
});
