import { createConnection, createServer, type Server } from "node:net";
import { chmod } from "node:fs/promises";
export async function serveControl(path: string, stop: () => Promise<void>): Promise<Server> {
  const server = createServer(socket => {
    socket.setTimeout(360000, () => socket.destroy());
    let data = "", handled = false;
    socket.on("error", () => {});
    socket.on("data", chunk => {
      if (handled) return;
      data += chunk.toString();
      if (data.length > 32) { handled = true; socket.end("ERROR invalid request\n"); return; }
      if (!data.includes("\n")) return;
      handled = true;
      if (data !== "stop\n") { socket.end("ERROR invalid request\n"); return; }
      void stop().then(() => socket.end("OK\n"), () => socket.end("ERROR Shutdown incomplete; check the start:all terminal and daily guide.\n"));
    });
  });
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(path, () => { server.removeListener("error", reject); resolve(); }); });
  try { await chmod(path, 0o600); } catch (error) { server.close(); throw error; }
  return server;
}
export async function requestStop(path: string) {
  return new Promise<void>((resolve, reject) => {
    const socket = createConnection(path);
    let data = "";
    socket.setTimeout(360000, () => socket.destroy(new Error("Stack stop timed out; inspect the start:all terminal.")));
    socket.on("connect", () => socket.write("stop\n"));
    socket.on("data", chunk => { data += chunk.toString(); if (data.length > 1024) socket.destroy(new Error("Invalid stack response")); });
    socket.on("error", reject);
    socket.on("end", () => { if (data === "OK\n") resolve(); else reject(new Error(data.trim() || "Controller closed without confirming shutdown.")); });
  });
}
