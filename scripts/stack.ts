import nextEnv from "@next/env";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:net";
import { mkdir, chmod, lstat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homeAssistantConfiguration } from "../src/server/home-assistant/config";
import { createHomeAssistantClient } from "../src/server/home-assistant/client";
import { requestStop, serveControl } from "./stack/control";
import { startStack, stopStack, type StackOperations } from "./stack/lifecycle";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtime = join(root, ".verification", "local-stack");
const socketPath = join(runtime, "control.sock");
const execute = promisify(execFile);

async function main() {
  if (process.platform !== "darwin" || process.env.CI) throw new Error("Stack VM controls run only on macOS outside CI. Tests use isolated fake operations.");
  const action = process.argv[2];
  if (!["start", "stop"].includes(action)) throw new Error("Use npm run start:all or npm run stop:all.");
  if (Buffer.byteLength(socketPath) > 103) throw new Error("Project path is too long for a macOS control socket. Move the project to a shorter path.");
  if (action === "stop") {
    try { await requestStop(socketPath); console.log("Managed Hub, worker and HA guest stopped."); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") { console.log("No start:all controller is running. Manually started services are unchanged; see the daily guide."); return; }
      throw new Error("Could not confirm stack shutdown. Check the start:all terminal; for a stale socket use the daily guide.");
    }
    return;
  }
  nextEnv.loadEnvConfig(root, true);
  if (process.env.CI) throw new Error("Live stack controls are disabled in CI.");
  const { config } = homeAssistantConfiguration();
  if (!config) throw new Error("Configure the server Home Assistant URL, pinned address and token before start:all. For initial setup use the manual daily guide.");
  const origin = new URL(process.env.APP_ORIGIN ?? "http://127.0.0.1:3000");
  if (origin.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(origin.hostname) || origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password) throw new Error("start:all requires an HTTP loopback APP_ORIGIN. Use the manual launcher for other deployment modes.");
  const port = Number(origin.port || 80);
  const vmId = process.env.HUB_UTM_VM_ID?.trim() || "ACA2A5F2-7F28-45D4-B50E-EBDF76329289";
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(vmId)) throw new Error("HUB_UTM_VM_ID must identify the existing Home Assistant UTM VM by UUID.");
  await mkdir(runtime, { recursive: true, mode: 0o700 });
  const info = await lstat(runtime);
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== process.getuid?.()) throw new Error("The stack runtime directory must be owned by this user and must not be a symlink.");
  await chmod(runtime, 0o700);
  const utm = async (operation: string) => {
    try { return (await execute("/usr/bin/osascript", [join(root, "scripts/stack/utm.applescript"), operation, vmId], { timeout: 35000, maxBuffer: 65536 })).stdout.trim(); }
    catch { throw new Error("UTM did not complete the requested operation. Check Automation permission, VM identity/state and the daily guide."); }
  };
  let child: ReturnType<typeof spawn> | undefined;
  let childClosed = false;
  let hubExit: Promise<void> = Promise.resolve();
  const ops: StackOperations = {
    async checkPort() {
      const probe = createServer();
      await new Promise<void>((resolve, reject) => {
        probe.once("error", () => reject(new Error("Hub port is occupied. Stop the existing manual launcher with Ctrl+C before start:all; unrelated processes will not be killed.")));
        probe.listen(port, "127.0.0.1", () => probe.close(error => error ? reject(error) : resolve()));
      });
    },
    vmStatus: () => utm("status"), startVm: async () => { console.log("Starting Home Assistant VM…"); await utm("start"); },
    verifyAddress: async () => { const addresses = (await utm("addresses")).split(/\s+/); if (!addresses.includes(config.address)) throw new Error("Configured address does not belong to the selected VM."); },
    apiReady: async signal => { try { await createHomeAssistantClient(config).discover(signal); return true; } catch { return false; } },
    startHub: async () => {
      console.log("Home Assistant API ready. Starting Hub and worker…");
      child = spawn(process.execPath, [join(root, "scripts/run-app.mjs"), "dev", "--port", String(port)], { cwd: root, env: { ...process.env }, stdio: "inherit" });
      hubExit = new Promise<void>(resolve => { child!.once("error", () => { childClosed = true; resolve(); }); child!.once("close", () => { childClosed = true; resolve(); }); });
    },
    hubReady: async signal => {
      if (childClosed) throw new Error("Hub launcher exited during startup; inspect its terminal output.");
      try { return (await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]), redirect: "error" })).ok; } catch { return false; }
    },
    stopHub: async () => {
      if (!child || childClosed) return;
      console.log("Stopping owned Hub and worker…"); child.kill("SIGTERM");
      let timer: ReturnType<typeof setTimeout> | undefined;
      try { await Promise.race([hubExit, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Hub did not stop. HA was left running; inspect the launcher before retrying stop:all.")), 20000); })]); }
      finally { if (timer) clearTimeout(timer); }
    },
    requestShutdown: async () => { console.log("Requesting graceful HA guest OS shutdown…"); await utm("shutdown"); },
    quitIfIdle: async () => { console.log(await utm("quit-idle")); },
  };
  const abort = new AbortController();
  let startup: Promise<void> = Promise.resolve(), stopping: Promise<void> | undefined;
  let finish!: () => void;
  const done = new Promise<void>(resolve => { finish = resolve; });
  let server: Awaited<ReturnType<typeof serveControl>>;
  const stop = () => {
    if (stopping) return stopping;
    abort.abort(new Error("Startup canceled for shutdown."));
    stopping = (async () => {
      await startup.catch(() => {});
      await stopStack(ops);
      console.log("Stack stopped."); server.close(); finish();
    })().catch(error => { stopping = undefined; console.error(error instanceof Error ? error.message : "Shutdown failed."); throw error; });
    return stopping;
  };
  try { server = await serveControl(socketPath, stop); }
  catch { throw new Error("A controller or stale socket already owns this project. Use stop:all or the daily-guide recovery procedure; nothing was stopped."); }
  const onSignal = () => { void stop().catch(() => { console.error("Shutdown incomplete. Retry stop:all after resolving the problem; the controller is still available."); }); };
  process.on("SIGINT", onSignal); process.on("SIGTERM", onSignal);
  try {
    startup = startStack(ops, abort.signal);
    try { await startup; }
    catch (error) {
      if (!abort.signal.aborted) throw error;
      // A stop received during boot must complete, not abandon the VM.
      await done; return;
    }
    console.log(`Stack ready at ${origin.origin}. Keep this terminal open. Ctrl+C or npm run stop:all stops the managed stack.`);
    await Promise.race([done, hubExit.then(async () => { if (stopping) return done; throw new Error("Hub/worker exited unexpectedly. HA is left running; use the manual daily guide."); })]);
  } catch (error) {
    await ops.stopHub();
    throw error;
  } finally {
    process.removeListener("SIGINT", onSignal); process.removeListener("SIGTERM", onSignal);
    server.close();
  }
}
void main().catch(error => { console.error(error instanceof Error ? error.message : "Stack operation failed."); process.exitCode = 1; });
