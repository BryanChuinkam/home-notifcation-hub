-- Rebuild the three related tables together. New FKs reference the new tables
-- during copying, so dropping old devices cannot null historical recipient IDs.
CREATE TABLE devices_v3 (
 id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, room TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('speaker','tv','computer','phone')),
 adapter TEXT NOT NULL CHECK(adapter IN ('mock','home_assistant')),
 capabilities TEXT NOT NULL, enabled INTEGER NOT NULL CHECK(enabled IN (0,1)), last_test_at INTEGER,
 mock_behavior TEXT NOT NULL DEFAULT 'accept' CHECK(mock_behavior IN ('accept','dispatch_only','retry_once','reject','offline')),
 ha_target TEXT, ha_target_key TEXT
);
--> statement-breakpoint
INSERT INTO devices_v3(id,name,room,type,adapter,capabilities,enabled,last_test_at,mock_behavior)
 SELECT id,name,room,type,adapter,capabilities,enabled,last_test_at,mock_behavior FROM devices;
--> statement-breakpoint
CREATE TABLE deliveries_v3 (
 id TEXT PRIMARY KEY NOT NULL, message_id TEXT NOT NULL REFERENCES messages(id),
 device_id TEXT REFERENCES devices_v3(id) ON DELETE SET NULL, device_name TEXT NOT NULL, adapter TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('queued','processing','dispatched','accepted','failed')),
 attempt_count INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL, lease_token TEXT, lease_until INTEGER,
 created_at INTEGER NOT NULL, attempted_at INTEGER, completed_at INTEGER, error_code TEXT,
 simulated INTEGER NOT NULL DEFAULT 1 CHECK(simulated IN (0,1))
);
--> statement-breakpoint
INSERT INTO deliveries_v3 SELECT * FROM deliveries;
--> statement-breakpoint
CREATE TABLE delivery_attempts_v3 (
 id TEXT PRIMARY KEY NOT NULL, delivery_id TEXT NOT NULL REFERENCES deliveries_v3(id), number INTEGER NOT NULL,
 started_at INTEGER NOT NULL, completed_at INTEGER,
 state TEXT NOT NULL CHECK(state IN ('processing','interrupted','dispatched','accepted','failed')), error_code TEXT
);
--> statement-breakpoint
INSERT INTO delivery_attempts_v3 SELECT * FROM delivery_attempts;
--> statement-breakpoint
DROP TABLE delivery_attempts;
--> statement-breakpoint
DROP TABLE deliveries;
--> statement-breakpoint
DROP TABLE devices;
--> statement-breakpoint
ALTER TABLE devices_v3 RENAME TO devices;
--> statement-breakpoint
ALTER TABLE deliveries_v3 RENAME TO deliveries;
--> statement-breakpoint
ALTER TABLE delivery_attempts_v3 RENAME TO delivery_attempts;
--> statement-breakpoint
CREATE UNIQUE INDEX ha_target_unique ON devices(adapter,ha_target_key);
--> statement-breakpoint
CREATE UNIQUE INDEX delivery_recipient ON deliveries(message_id,device_id);
--> statement-breakpoint
CREATE INDEX delivery_queue ON deliveries(state,next_attempt_at);
--> statement-breakpoint
CREATE INDEX delivery_message ON deliveries(message_id);
--> statement-breakpoint
CREATE UNIQUE INDEX attempt_number ON delivery_attempts(delivery_id,number);
--> statement-breakpoint
CREATE TABLE delivery_confirmations (
 delivery_id TEXT PRIMARY KEY NOT NULL REFERENCES deliveries(id), admin_id INTEGER NOT NULL REFERENCES admins(id),
 observer TEXT NOT NULL, observation TEXT NOT NULL CHECK(observation IN ('displayed','spoken')), confirmed_at INTEGER NOT NULL
);
