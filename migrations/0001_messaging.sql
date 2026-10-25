ALTER TABLE devices ADD COLUMN mock_behavior TEXT NOT NULL DEFAULT 'accept' CHECK (mock_behavior IN ('accept','dispatch_only','retry_once','reject','offline'));
--> statement-breakpoint
CREATE TABLE messages (
 id TEXT PRIMARY KEY NOT NULL, sender_id INTEGER NOT NULL REFERENCES admins(id), sender_name TEXT NOT NULL,
 title TEXT NOT NULL, body TEXT NOT NULL, mode TEXT NOT NULL CHECK(mode IN ('text','speech','overlay')),
 priority TEXT NOT NULL CHECK(priority IN ('low','normal','high')), kind TEXT NOT NULL CHECK(kind IN ('message','test')),
 resend_of TEXT, created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX messages_created ON messages(created_at);
--> statement-breakpoint
CREATE TABLE deliveries (
 id TEXT PRIMARY KEY NOT NULL, message_id TEXT NOT NULL REFERENCES messages(id),
 device_id TEXT REFERENCES devices(id) ON DELETE SET NULL, device_name TEXT NOT NULL, adapter TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('queued','processing','dispatched','accepted','failed')),
 attempt_count INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL, lease_token TEXT, lease_until INTEGER,
 created_at INTEGER NOT NULL, attempted_at INTEGER, completed_at INTEGER, error_code TEXT,
 simulated INTEGER NOT NULL DEFAULT 1 CHECK(simulated IN (0,1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX delivery_recipient ON deliveries(message_id,device_id);
--> statement-breakpoint
CREATE INDEX delivery_queue ON deliveries(state,next_attempt_at);
--> statement-breakpoint
CREATE INDEX delivery_message ON deliveries(message_id);
--> statement-breakpoint
CREATE TABLE delivery_attempts (
 id TEXT PRIMARY KEY NOT NULL, delivery_id TEXT NOT NULL REFERENCES deliveries(id), number INTEGER NOT NULL,
 started_at INTEGER NOT NULL, completed_at INTEGER,
 state TEXT NOT NULL CHECK(state IN ('processing','interrupted','dispatched','accepted','failed')), error_code TEXT
);
--> statement-breakpoint
CREATE UNIQUE INDEX attempt_number ON delivery_attempts(delivery_id,number);
