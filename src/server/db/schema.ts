import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey(), username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(), createdAt: integer("created_at").notNull(),
}, table => [check("single_admin", sql`${table.id} = 1`)]);
export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(), adminId: integer("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
}, table => [index("sessions_expiry").on(table.expiresAt)]);
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(), attempts: integer("attempts").notNull(), resetsAt: integer("resets_at").notNull(),
});
export type Capability = "text" | "speech" | "overlay" | "acknowledgment";
export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(), name: text("name").notNull(), room: text("room").notNull(),
  type: text("type", { enum: ["speaker", "tv", "computer"] }).notNull(),
  adapter: text("adapter", { enum: ["mock"] }).notNull(),
  capabilities: text("capabilities", { mode: "json" }).$type<Capability[]>().notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull(), lastTestAt: integer("last_test_at"),
});
