import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash, verify, type Options } from "@node-rs/argon2";
import { and, eq, gt, lte } from "drizzle-orm";
import { z } from "zod";
import type { Store } from "../db/store";
import { admins, devices, rateLimits, sessions } from "../db/schema";

export class AuthError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
const credentials = z.object({ username: z.string().min(3).max(32).refine(value => !/[^a-zA-Z0-9_.-]/.test(value)), password: z.string().min(12).max(128) }).strict();
const loginCredentials = credentials.extend({ password: z.string().min(1).max(128) });
const setupCredentials = credentials.extend({ secret: z.string().min(32).max(256) });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
// The package exposes an ambient const enum; numeric 2 is its Argon2id value.
const passwordOptions = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 } satisfies Options;
export const SESSION_LIFETIME = 8 * 60 * 60 * 1000;

export function createAuth(store: Store, secret: string | undefined, clock = Date.now) {
  const { db } = store;
  const admin = () => db.select().from(admins).get();
  const isSetup = () => !!admin();
  function consumeLimit(key: string, max: number) {
    const now = clock();
    db.transaction(tx => {
      const prior = tx.select().from(rateLimits).where(eq(rateLimits.key, key)).get();
      if (prior && prior.resetsAt > now && prior.attempts >= max) {
        throw new AuthError(429, "Too many attempts. Please try again later.", Math.ceil((prior.resetsAt - now) / 1000));
      }
      tx.insert(rateLimits).values({ key, attempts: 1, resetsAt: now + 15 * 60 * 1000 }).onConflictDoUpdate({
        target: rateLimits.key,
        set: { attempts: prior && prior.resetsAt > now ? prior.attempts + 1 : 1, resetsAt: prior && prior.resetsAt > now ? prior.resetsAt : now + 15 * 60 * 1000 },
      }).run();
    }, { behavior: "immediate" });
  }
  async function setup(input: unknown) {
    if (isSetup()) throw new AuthError(409, "Administrator setup is already complete.");
    if (!secret || secret.length < 32 || secret.length > 256) throw new AuthError(503, "Setup is unavailable. Configure HUB_SETUP_SECRET on the server.");
    consumeLimit("setup", 5);
    const parsed = setupCredentials.safeParse(input);
    if (!parsed.success) throw new AuthError(400, "Use a 3–32 character username, a 12–128 character password, and the server setup secret.");
    const data = parsed.data;
    if (!timingSafeEqual(Buffer.from(digest(data.secret)), Buffer.from(digest(secret)))) throw new AuthError(403, "The setup secret is incorrect.");
    const passwordHash = await hash(data.password, passwordOptions);
    // Hashing is outside the write lock. Recheck inside an immediate transaction.
    db.transaction(tx => {
      if (tx.select().from(admins).get()) throw new AuthError(409, "Administrator setup is already complete.");
      tx.insert(admins).values({ id: 1, username: data.username, passwordHash, createdAt: clock() }).run();
      tx.insert(devices).values([
        { id: "mock-speaker", name: "Living room speaker", room: "Living room", type: "speaker", adapter: "mock", capabilities: ["speech"], enabled: true, lastTestAt: null },
        { id: "mock-tv", name: "Family TV", room: "Living room", type: "tv", adapter: "mock", capabilities: ["text", "overlay"], enabled: true, lastTestAt: null },
        { id: "mock-computer", name: "Study computer", room: "Study", type: "computer", adapter: "mock", capabilities: ["text"], enabled: true, lastTestAt: null },
      ]).run();
    }, { behavior: "immediate" });
  }
  async function login(input: unknown) {
    consumeLimit("login", 10); // Global single-admin budget; never trusts forwarded IP headers.
    const parsed = loginCredentials.safeParse(input);
    if (!parsed.success) throw new AuthError(400, "Enter a valid username and password.");
    const record = admin();
    // Spend a password-hashing operation even when no administrator exists.
    const valid = record ? await verify(record.passwordHash, parsed.data.password) : (await hash(parsed.data.password, passwordOptions), false);
    if (!record || !valid || record.username !== parsed.data.username) throw new AuthError(401, "Username or password is incorrect.");
    const token = randomBytes(32).toString("base64url");
    db.transaction(tx => {
      tx.delete(sessions).where(lte(sessions.expiresAt, clock())).run();
      tx.insert(sessions).values({ tokenHash: digest(token), adminId: record.id, expiresAt: clock() + SESSION_LIFETIME }).run();
    });
    return token;
  }
  function session(token: string | undefined) {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    return db.select({ id: admins.id, username: admins.username }).from(sessions)
      .innerJoin(admins, eq(sessions.adminId, admins.id))
      .where(and(eq(sessions.tokenHash, digest(token)), gt(sessions.expiresAt, clock()))).get() ?? null;
  }
  function logout(token: string | undefined) {
    if (!session(token)) throw new AuthError(401, "Please sign in to continue.");
    db.delete(sessions).where(eq(sessions.tokenHash, digest(token!))).run();
  }
  function listDevices(token: string | undefined) {
    if (!session(token)) throw new AuthError(401, "Please sign in to continue.");
    return db.select().from(devices).all();
  }
  return { setup, login, logout, session, isSetup, listDevices, setupReady: !!secret && secret.length >= 32 && secret.length <= 256 };
}
export type Auth = ReturnType<typeof createAuth>;
