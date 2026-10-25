export interface StackOperations {
  checkPort(): Promise<void>;
  vmStatus(): Promise<string>;
  startVm(): Promise<void>;
  verifyAddress(): Promise<void>;
  apiReady(signal: AbortSignal): Promise<boolean>;
  startHub(): Promise<void>;
  hubReady(signal: AbortSignal): Promise<boolean>;
  stopHub(): Promise<void>;
  requestShutdown(): Promise<void>;
  quitIfIdle(): Promise<void>;
}
export interface WaitOptions { timeoutMs?: number; intervalMs?: number }
export async function waitUntil(check: () => Promise<boolean>, signal: AbortSignal, description: string, { timeoutMs = 300000, intervalMs = 1000 }: WaitOptions = {}) {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    signal.throwIfAborted();
    if (await check()) { signal.throwIfAborted(); return; }
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${description}. Use the daily operations guide; no VM was force-stopped.`);
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); reject(signal.reason); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, intervalMs);
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    });
  }
}
export async function startStack(ops: StackOperations, signal: AbortSignal, wait: WaitOptions = {}) {
  await ops.checkPort(); signal.throwIfAborted();
  const status = await ops.vmStatus(); signal.throwIfAborted();
  if (status === "stopped") await ops.startVm();
  else if (!["started", "starting", "resuming"].includes(status)) throw new Error("The HA VM is paused or changing state. Resolve its state in UTM before starting the stack.");
  await waitUntil(async () => await ops.vmStatus() === "started", signal, "HA VM startup", wait);
  await waitUntil(async () => { try { await ops.verifyAddress(); return true; } catch { return false; } }, signal, "the configured HA address on this VM (check address pinning)", wait);
  await waitUntil(() => ops.apiReady(signal), signal, "authenticated Home Assistant API readiness", wait);
  signal.throwIfAborted();
  await ops.startHub();
  await waitUntil(() => ops.hubReady(signal), signal, "Hub web readiness", wait);
}
export async function stopStack(ops: StackOperations, wait: WaitOptions = {}) {
  // Never power down HA while our Hub/worker might still be sending.
  await ops.stopHub();
  let status = await ops.vmStatus();
  if (["starting", "resuming"].includes(status)) {
    await waitUntil(async () => ["started", "stopped"].includes(await ops.vmStatus()), new AbortController().signal, "HA boot before shutdown", { timeoutMs: 120000, ...wait });
    status = await ops.vmStatus();
  }
  if (status !== "stopped") {
    if (status !== "started" && status !== "stopping") throw new Error("The HA VM cannot be shut down safely in its current state. Use UTM/HA manually.");
    if (status === "started") await ops.requestShutdown();
    await waitUntil(async () => await ops.vmStatus() === "stopped", new AbortController().signal, "graceful HA guest shutdown", { timeoutMs: 120000, ...wait });
  }
  await ops.quitIfIdle();
}
