import { describe, expect, it } from "vitest";
import { startStack, stopStack, waitUntil, type StackOperations } from "../../scripts/stack/lifecycle";
import { serveControl, requestStop } from "../../scripts/stack/control";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
function fixture(initial = "stopped") {
  const events: string[] = []; let state = initial;
  const ops: StackOperations = {
    checkPort: async () => { events.push("port"); }, vmStatus: async () => state,
    startVm: async () => { events.push("start-vm"); state = "started"; },
    verifyAddress: async () => { events.push("address"); }, apiReady: async () => { events.push("ha-ready"); return true; },
    startHub: async () => { events.push("start-hub"); }, hubReady: async () => { events.push("hub-ready"); return true; },
    stopHub: async () => { events.push("stop-hub"); }, requestShutdown: async () => { events.push("request-shutdown"); state = "stopped"; },
    quitIfIdle: async () => { events.push("quit-if-idle"); },
  };
  return { ops, events, setState: (next: string) => { state = next; } };
}
const quick = { timeoutMs: 10, intervalMs: 1 };
describe("owned stack startup and graceful shutdown", () => {
  it("waits for VM identity/API before Hub startup and stops Hub before requesting guest shutdown", async () => {
    const { ops, events } = fixture(); await startStack(ops, new AbortController().signal, quick); await stopStack(ops, quick);
    expect(events).toEqual(["port", "start-vm", "address", "ha-ready", "start-hub", "hub-ready", "stop-hub", "request-shutdown", "quit-if-idle"]);
  });
  it("reuses an already started guest without starting a second VM", async () => {
    const { ops, events } = fixture("started"); await startStack(ops, new AbortController().signal, quick); expect(events).not.toContain("start-vm");
  });
  it("refuses an occupied Hub port before touching the guest", async () => {
    const { ops, events } = fixture(); ops.checkPort = async () => { throw new Error("port occupied"); };
    await expect(startStack(ops, new AbortController().signal, quick)).rejects.toThrow("occupied"); expect(events).toEqual([]);
  });
  it("refuses paused guests rather than forcing resume or poweroff", async () => {
    const { ops, events } = fixture("paused"); await expect(startStack(ops, new AbortController().signal, quick)).rejects.toThrow("paused"); expect(events).toEqual(["port"]);
    await expect(stopStack(ops, quick)).rejects.toThrow("current state"); expect(events).not.toContain("request-shutdown"); expect(events).not.toContain("quit-if-idle");
  });
  it("does not start the Hub when the configured address is absent from the selected VM", async () => {
    const { ops, events } = fixture(); ops.verifyAddress = async () => { throw new Error("IP changed"); };
    await expect(startStack(ops, new AbortController().signal, quick)).rejects.toThrow("address pinning"); expect(events).not.toContain("start-hub");
  });
  it("does not start the Hub if HA auth/readiness never succeeds", async () => {
    const { ops, events } = fixture(); ops.apiReady = async () => false;
    await expect(startStack(ops, new AbortController().signal, quick)).rejects.toThrow("API readiness"); expect(events).not.toContain("start-hub");
  });
  it("cancels startup while waiting for HA without launching the worker", async () => {
    const { ops, events } = fixture(); const abort = new AbortController();
    ops.apiReady = async () => { abort.abort(new Error("stop requested")); return false; };
    await expect(startStack(ops, abort.signal, quick)).rejects.toThrow("stop requested"); expect(events).not.toContain("start-hub");
    await stopStack(ops, quick); expect(events.slice(-3)).toEqual(["stop-hub", "request-shutdown", "quit-if-idle"]);
  });
  it("leaves HA running if the owned Hub cannot stop", async () => {
    const { ops, events } = fixture("started"); ops.stopHub = async () => { throw new Error("Hub still active"); };
    await expect(stopStack(ops, quick)).rejects.toThrow("still active"); expect(events).toEqual([]);
  });
  it("does not quit UTM if the guest ignores its graceful powerdown request", async () => {
    const { ops, events } = fixture("started"); ops.requestShutdown = async () => { events.push("request-shutdown"); };
    await expect(stopStack(ops, quick)).rejects.toThrow("graceful HA guest shutdown"); expect(events).toEqual(["stop-hub", "request-shutdown"]);
  });
  it("finishes a VM start transition before requesting graceful shutdown", async () => {
    const { ops, events } = fixture("started"); const original = ops.vmStatus; let reads = 0;
    ops.vmStatus = async () => ++reads === 1 ? "starting" : original();
    await stopStack(ops, quick); expect(events).toEqual(["stop-hub", "request-shutdown", "quit-if-idle"]);
  });
  it("does not resend powerdown for an already stopped or stopping guest", async () => {
    const { ops, events, setState } = fixture("stopped"); await stopStack(ops, quick); expect(events).toEqual(["stop-hub", "quit-if-idle"]);
    events.length = 0; setState("stopping"); let reads = 0; ops.vmStatus = async () => ++reads === 1 ? "stopping" : "stopped"; await stopStack(ops, quick); expect(events).not.toContain("request-shutdown");
  });
  it("aborts polling promptly rather than leaving a long timer", async () => {
    const abort = new AbortController(); const pending = waitUntil(async () => false, abort.signal, "test", { intervalMs: 60000 });
    await Promise.resolve(); abort.abort(new Error("cancel")); await expect(pending).rejects.toThrow("cancel");
  });
});

describe("private local stop controller", () => {
  async function withControl(test: (path: string, calls: () => number) => Promise<void>, stop?: () => Promise<void>) {
    const directory = await mkdtemp(join(tmpdir(), "hnh-ipc-")), path = join(directory, "c.sock"); let count = 0;
    const server = await serveControl(path, async () => { count++; await stop?.(); });
    try { await test(path, () => count); }
    finally { await new Promise<void>(resolve => server.close(() => resolve())); await rm(directory, { recursive: true, force: true }); }
  }
  it("waits for shutdown completion before confirming stop, with owner-only socket permission", async () => {
    let release!: () => void, entered!: () => void; const held = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
    await withControl(async (path, calls) => {
      expect((await stat(path)).mode & 0o777).toBe(0o600);
      let confirmed = false; const request = requestStop(path).then(() => { confirmed = true; });
      await started; expect(calls()).toBe(1); expect(confirmed).toBe(false);
      release(); await request; expect(confirmed).toBe(true);
    }, async () => { entered(); await held; });
  });
  it("does not replace another live controller", async () => {
    await withControl(async path => { await expect(serveControl(path, async () => {})).rejects.toMatchObject({ code: "EADDRINUSE" }); await requestStop(path); });
  });
  it("rejects oversized/unknown commands without executing shutdown", async () => {
    await withControl(async (path, calls) => {
      for (const command of ["delete-all\n", "x".repeat(64)]) {
        const result = await new Promise<string>((resolve, reject) => {
          const socket = createConnection(path); let text = "";
          socket.on("error", reject); socket.on("connect", () => socket.write(command)); socket.on("data", chunk => { text += chunk; }); socket.on("end", () => resolve(text));
        });
        expect(result).toContain("ERROR");
      }
      expect(calls()).toBe(0);
    });
  });
  it("reports shutdown failure and leaves the controller available for a retry", async () => {
    let attempt = 0;
    await withControl(async path => { await expect(requestStop(path)).rejects.toThrow("incomplete"); await requestStop(path); }, async () => { if (++attempt === 1) throw new Error("guest busy"); });
  });
  it("does not claim success when no managed controller exists", async () => {
    await expect(requestStop(join(tmpdir(), "hnh-no-such-controller.sock"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});

 it("blocks both live CLI commands in CI before loading household config or touching UTM", () => {
  for (const action of ["start", "stop"]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", resolve("scripts/stack.ts"), action], { encoding: "utf8", env: { ...process.env, CI: "true" } });
    expect(result.status).toBe(1); expect(result.stderr).toContain("only on macOS outside CI");
  }
 });
