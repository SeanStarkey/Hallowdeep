const http = require("http");
const crypto = require("crypto");
const { promises: fs } = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const SCORE_FILE = path.join(DATA_DIR, "high-scores.json");
const MAX_SCORES = 10;
const MAX_BODY = 16 * 1024;
const SCORE_WRITE_TOKEN = String(process.env.HALLOWDEEP_SCORE_TOKEN || "").trim();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function ensureScoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(SCORE_FILE);
  } catch {
    await fs.writeFile(SCORE_FILE, "[]\n", "utf8");
  }
}

async function readScores() {
  await ensureScoreFile();
  try {
    const data = JSON.parse(await fs.readFile(SCORE_FILE, "utf8"));
    return Array.isArray(data) ? data.slice(0, MAX_SCORES) : [];
  } catch {
    return [];
  }
}

async function writeScores(scores) {
  await ensureScoreFile();
  await fs.writeFile(SCORE_FILE, `${JSON.stringify(scores, null, 2)}\n`, "utf8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, message) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(message);
}

function scoreTokenFrom(req) {
  const headerToken = req.headers["x-hallowdeep-score-token"];
  if (Array.isArray(headerToken)) return headerToken[0] || "";
  if (headerToken) return headerToken;

  const auth = req.headers.authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

function tokenMatches(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function requireScoreWriteToken(req, res) {
  if (!SCORE_WRITE_TOKEN) {
    sendJson(res, 503, { error: "Score submissions are not configured" });
    return false;
  }

  if (!tokenMatches(scoreTokenFrom(req), SCORE_WRITE_TOKEN)) {
    sendJson(res, 403, { error: "Score write token required" });
    return false;
  }

  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function cleanName(name) {
  const cleaned = String(name || "").trim().replace(/\s+/g, " ").slice(0, 18);
  return cleaned || "Nameless";
}

function cleanScore(input) {
  const score = Number(input.score);
  const depth = Number(input.depth);
  const level = Number(input.level);
  const kills = Number(input.kills);
  const bossKills = Number(input.bossKills || 0);

  if (![score, depth, level, kills, bossKills].every(Number.isFinite)) return null;

  return {
    name: cleanName(input.name),
    score: Math.max(0, Math.floor(score)),
    depth: Math.max(1, Math.floor(depth)),
    level: Math.max(1, Math.floor(level)),
    kills: Math.max(0, Math.floor(kills)),
    bossKills: Math.max(0, Math.floor(bossKills)),
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
  };
}

async function handleScores(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { scores: await readScores() });
    return;
  }

  if (req.method === "POST") {
    if (!requireScoreWriteToken(req, res)) return;

    try {
      const score = cleanScore(JSON.parse(await readBody(req) || "{}"));
      if (!score) {
        sendJson(res, 400, { error: "Invalid score" });
        return;
      }
      const scores = [...await readScores(), score]
        .sort((a, b) => b.score - a.score || b.depth - a.depth || b.level - a.level)
        .slice(0, MAX_SCORES);
      await writeScores(scores);
      sendJson(res, 201, { scores });
    } catch {
      sendJson(res, 400, { error: "Invalid JSON" });
    }
    return;
  }

  if (req.method === "DELETE") {
    if (!requireScoreWriteToken(req, res)) return;

    await writeScores([]);
    sendJson(res, 200, { scores: [] });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function serveStatic(pathname, res) {
  let requested;
  try {
    requested = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  } catch {
    sendText(res, 400, "Bad request");
    return;
  }

  const filePath = path.resolve(ROOT, requested.replace(/^\/+/, ""));
  const relativePath = path.relative(ROOT, filePath);

  if (relativePath.startsWith("..") ||
      path.isAbsolute(relativePath) ||
      relativePath === "data" ||
      relativePath.startsWith(`data${path.sep}`)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const type = MIME[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer((req, res) => {
  const pathname = String(req.url || "").split(/[?#]/, 1)[0] || "/";
  if (!pathname.startsWith("/")) {
    sendText(res, 400, "Bad request");
    return;
  }

  if (pathname === "/api/scores") {
    handleScores(req, res);
    return;
  }
  serveStatic(pathname, res);
});

ensureScoreFile()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Hallowdeep running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
