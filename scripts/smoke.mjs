#!/usr/bin/env node
// Smoke test: starts `next start` on port 3939, waits for readiness,
// then issues GET requests to a small set of routes.

import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const PORT = 3939;
const HOST = "127.0.0.1";
const BASE = `http://${HOST}:${PORT}`;
const PATHS = ["/", "/success?_test=1", "/pack?data="];
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

function log(...args) {
  console.log("[smoke]", ...args);
}

async function waitForReady(signal) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (signal.aborted) throw new Error("server exited before becoming ready");
    try {
      const res = await fetch(BASE + "/", { redirect: "manual" });
      // Any HTTP response (including 3xx/4xx) means the server is up.
      if (res.status > 0) {
        log(`server ready after ${Date.now() - (deadline - READY_TIMEOUT_MS)}ms (status ${res.status})`);
        return;
      }
    } catch {
      // not ready yet
    }
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error(`server did not become ready within ${READY_TIMEOUT_MS}ms`);
}

async function main() {
  log(`starting next start on port ${PORT}...`);
  const child = spawn("npx", ["next", "start", "-p", String(PORT), "-H", HOST], {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PORT: String(PORT) },
  });

  const controller = new AbortController();
  const onExit = (code, signal) => {
    log(`next start exited (code=${code}, signal=${signal})`);
    controller.abort();
  };
  child.on("exit", onExit);

  let exitCode = 0;
  try {
    await waitForReady(controller.signal);

    for (const path of PATHS) {
      const url = BASE + path;
      const res = await fetch(url, { redirect: "manual" });
      log(`GET ${path} -> ${res.status}`);
      if (res.status >= 500) {
        throw new Error(`unexpected ${res.status} from ${url}`);
      }
    }

    log("all smoke checks passed");
  } catch (err) {
    console.error("[smoke] FAILED:", err?.message || err);
    exitCode = 1;
  } finally {
    child.off("exit", onExit);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      const killTimeout = setTimeout(() => child.kill("SIGKILL"), 5_000);
      await new Promise((resolve) => child.once("exit", resolve));
      clearTimeout(killTimeout);
    }
    process.exit(exitCode);
  }
}

main().catch((err) => {
  console.error("[smoke] fatal:", err);
  process.exit(1);
});
