#!/usr/bin/env node
/**
 * scripts/smoke.mjs
 *
 * Boots the production build on a random free port, curls three routes,
 * verifies a known string appears in each response body, checks the OG image
 * route returns an image content type, then shuts down.
 * Exits non-zero on the first miss or on any start-up failure.
 *
 * Usage:
 *   npm run build && npm run smoke
 */

import { createServer } from "net";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const GAME_MAIN_CHECKOUT_URL =
  "https://byismael.lemonsqueezy.com/checkout/buy/game-main";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Fixture: a valid portal data object, base64-encoded the same way the app
// encodes it (Buffer.from(JSON.stringify(data)).toString("base64")).
// ---------------------------------------------------------------------------
const FIXTURE_DATA = {
  childName: "Alex",
  age: "7",
  partyDate: "2030-06-15",
  partyTime: "15:00",
  location: "The Moon Base",
  parentContact: "+1234567890",
  favoriteThing: "rockets",
  funFact1: "loves space",
  funFact2: "has a telescope",
  funFact3: "knows all planets",
  timezone: "Asia/Dubai",
};
const FIXTURE = Buffer.from(JSON.stringify(FIXTURE_DATA), "utf-8").toString("base64");

// ---------------------------------------------------------------------------
// Routes to check: [path, expected substring in the HTML response]
// ---------------------------------------------------------------------------
const CHECKS = [
  ["/", "Birthday Star Portal"],
  ["/success?_test=1", "PREPARING YOUR PORTAL"],
  [`/pack?data=${encodeURIComponent(FIXTURE)}`, "MISSION ACCESS GRANTED"],
];

const OG_CHECK = `/pack/og?data=${encodeURIComponent(FIXTURE)}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find a free TCP port by briefly binding to port 0. */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

/** GET a URL and return the response body as a string. */
async function httpGet(url, timeoutMs = 5_000) {
  const response = await httpGetResponse(url, timeoutMs);
  return response.body;
}

/** GET a URL and return body plus headers. */
async function httpGetResponse(url, timeoutMs = 5_000) {
  const { default: lib } = await import(url.startsWith("https") ? "https" : "http");
  return new Promise((resolve, reject) => {
    const req = lib.get(url, (res) => {
      const { statusCode = 0 } = res;

      if (statusCode < 200 || statusCode >= 300) {
        res.resume();
        reject(new Error(`GET ${url} failed with status ${statusCode}`));
        return;
      }

      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ body, headers: res.headers }));
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`GET ${url} timed out after ${timeoutMs}ms`));
    });

    req.on("error", reject);
  });
}

/**
 * Poll a URL until it returns 200 (or until timeout).
 * Returns the response body on success, throws on timeout.
 */
async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const body = await httpGet(url);
      return body;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const port = await getFreePort();
  const base = `http://127.0.0.1:${port}`;

  console.log(`smoke: starting next start on port ${port} …`);

  const nextCli = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const server = spawn(
    process.execPath,
    [nextCli, "start", "--port", String(port)],
    {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PORT: String(port),
        NEXT_PUBLIC_BASE_URL: base,
        NEXT_PUBLIC_CHECKOUT_URL: GAME_MAIN_CHECKOUT_URL,
      },
    }
  );

  if (process.env.NODE_ENV === "production" && GAME_MAIN_CHECKOUT_URL === "#") {
    throw new Error("smoke: NEXT_PUBLIC_CHECKOUT_URL cannot be '#'.");
  }

  let serverOutput = "";
  server.stdout.on("data", (d) => { serverOutput += d; });
  server.stderr.on("data", (d) => { serverOutput += d; });

  server.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error("smoke: server exited unexpectedly:\n" + serverOutput);
    }
  });

  let exitCode = 0;

  try {
    // Wait for the server to be ready
    await waitForServer(base + "/");
    console.log(`smoke: server ready at ${base}`);

    for (const [route, needle] of CHECKS) {
      const url = base + route;
      let body;
      try {
        body = await httpGet(url);
      } catch (err) {
        console.error(`smoke: FAIL  GET ${route}  —  fetch error: ${err.message}`);
        exitCode = 1;
        continue;
      }
      if (body.includes(needle)) {
        console.log(`smoke: OK    GET ${route}  (found: ${JSON.stringify(needle)})`);
      } else {
        console.error(`smoke: FAIL  GET ${route}  —  missing: ${JSON.stringify(needle)}`);
        exitCode = 1;
      }
    }

    try {
      const response = await httpGetResponse(base + OG_CHECK, 20_000);
      const contentType = String(response.headers["content-type"] ?? "");
      if (contentType.startsWith("image/")) {
        console.log(`smoke: OK    GET ${OG_CHECK}  (content-type: ${contentType})`);
      } else {
        console.error(`smoke: FAIL  GET ${OG_CHECK}  —  expected image content-type, got: ${contentType || "missing"}`);
        exitCode = 1;
      }
    } catch (err) {
      console.error(`smoke: FAIL  GET ${OG_CHECK}  —  fetch error: ${err.message}`);
      exitCode = 1;
    }
  } catch (err) {
    console.error("smoke: " + err.message);
    exitCode = 1;
  } finally {
    // Graceful shutdown: SIGTERM, then hard-kill after 5 s if still running.
    const killed = new Promise((resolve) => server.once("exit", resolve));
    server.kill(process.platform === "win32" ? undefined : "SIGTERM");
    const timer = setTimeout(() => server.kill(), 5_000);
    await killed;
    clearTimeout(timer);
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error("smoke: fatal:", err);
  process.exit(1);
});
