CREATE TABLE admins (
 id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
 username TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX sessions_expiry ON sessions(expires_at);
--> statement-breakpoint
CREATE TABLE rate_limits (
 key TEXT PRIMARY KEY NOT NULL,
 attempts INTEGER NOT NULL,
 resets_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE devices (
 id TEXT PRIMARY KEY NOT NULL,
 name TEXT NOT NULL,
 room TEXT NOT NULL,
 type TEXT NOT NULL CHECK (type IN ('speaker', 'tv', 'computer')),
 adapter TEXT NOT NULL CHECK (adapter = 'mock'),
 capabilities TEXT NOT NULL,
 enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
 last_test_at INTEGER
);
