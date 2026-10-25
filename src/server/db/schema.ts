import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

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
  mockBehavior: text("mock_behavior", { enum: ["accept", "dispatch_only", "retry_once", "reject", "offline"] }).notNull().default("accept"),
  enabled: integer("enabled", { mode: "boolean" }).notNull(), lastTestAt: integer("last_test_at"),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(), senderId: integer("sender_id").notNull().references(() => admins.id),
  senderName: text("sender_name").notNull(), title: text("title").notNull(), body: text("body").notNull(),
  mode: text("mode", { enum: ["text", "speech", "overlay"] }).notNull(),
  priority: text("priority", { enum: ["low", "normal", "high"] }).notNull(),
  kind: text("kind", { enum: ["message", "test"] }).notNull(),
  resendOf: text("resend_of"), createdAt: integer("created_at").notNull(),
}, table => [index("messages_created").on(table.createdAt)]);
export const deliveries = sqliteTable("deliveries", {
  id: text("id").primaryKey(), messageId: text("message_id").notNull().references(() => messages.id),
  deviceId: text("device_id").references(() => devices.id, { onDelete: "set null" }),
  deviceName: text("device_name").notNull(), adapter: text("adapter").notNull(),
  state: text("state", { enum: ["queued", "processing", "dispatched", "accepted", "failed"] }).notNull(),
  attemptCount: integer("attempt_count").notNull().default(0), nextAttemptAt: integer("next_attempt_at").notNull(),
  leaseToken: text("lease_token"), leaseUntil: integer("lease_until"),
  createdAt: integer("created_at").notNull(), attemptedAt: integer("attempted_at"), completedAt: integer("completed_at"),
  errorCode: text("error_code"), simulated: integer("simulated", { mode: "boolean" }).notNull().default(true),
}, table => [uniqueIndex("delivery_recipient").on(table.messageId, table.deviceId), index("delivery_queue").on(table.state, table.nextAttemptAt), index("delivery_message").on(table.messageId)]);
export const deliveryAttempts = sqliteTable("delivery_attempts", {
  id: text("id").primaryKey(), deliveryId: text("delivery_id").notNull().references(() => deliveries.id),
  number: integer("number").notNull(), startedAt: integer("started_at").notNull(), completedAt: integer("completed_at"),
  state: text("state", { enum: ["processing", "interrupted", "dispatched", "accepted", "failed"] }).notNull(), errorCode: text("error_code"),
}, table => [uniqueIndex("attempt_number").on(table.deliveryId, table.number)]);
