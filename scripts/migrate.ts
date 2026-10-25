import nextEnv from "@next/env";
import { readConfig } from "../src/server/config";
import { openStore } from "../src/server/db/store";
nextEnv.loadEnvConfig(process.cwd());
const store = openStore(readConfig().databasePath);
console.log("Database migrations applied; integrity:", store.raw.pragma("integrity_check", { simple: true }));
store.close();
