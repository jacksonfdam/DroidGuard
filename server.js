/**
 * DroidGuard Quest — Local development server.
 *
 * Vercel-compatible Express app:
 *   - serves static SPA from project root (index.html, /css, /js, /assets)
 *   - mounts /api routes from ./api/* serverless-style handlers
 *   - applies the same security headers declared in vercel.json
 *
 * On Vercel, the static files are served by the platform and each file
 * inside /api/ is deployed as its own serverless function. This server
 * mirrors that behavior locally (`npm start`).
 */

const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT, 10) || 3000;
const STATIC_DIRS = ["css", "js", "assets"];
const STATIC_FILES = ["index.html", "favicon.ico", "robots.txt"];
const STATIC_MAX_AGE = process.env.NODE_ENV === "production" ? "1y" : 0;

const app = express();
app.disable("x-powered-by");
app.use(compression());

/* ── Security headers (mirror vercel.json) ── */
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "connect-src 'self'",
      "font-src 'self' data:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; ")
  );
  next();
});

/* ── Auto-mount serverless-style handlers from ./api ── */
const apiDir = path.join(ROOT, "api");
if (fs.existsSync(apiDir)) {
  for (const file of fs.readdirSync(apiDir)) {
    if (!file.endsWith(".js")) continue;
    const route = "/api/" + file.replace(/\.js$/, "");
    const handler = require(path.join(apiDir, file));
    app.all(route, (req, res) => {
      try {
        const fn = typeof handler === "function" ? handler : handler.default;
        return fn(req, res);
      } catch (err) {
        console.error(`[api] ${route} threw:`, err);
        res.status(500).json({ error: "internal_error" });
      }
    });
    console.log(`[api] mounted ${route}`);
  }
}

/* ── Static assets (explicit dirs, no source-tree leak) ── */
for (const dir of STATIC_DIRS) {
  const abs = path.join(ROOT, dir);
  if (fs.existsSync(abs)) {
    app.use("/" + dir, express.static(abs, { maxAge: STATIC_MAX_AGE, etag: true }));
  }
}

/* ── Static root files (index.html etc.) ── */
for (const file of STATIC_FILES) {
  const abs = path.join(ROOT, file);
  if (fs.existsSync(abs)) {
    app.get("/" + file, (req, res) => res.sendFile(abs));
  }
}

/* ── SPA root and fallback ── */
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(ROOT, "index.html"));
});

/* ── 404 for unmatched API ── */
app.use((req, res) => res.status(404).json({ error: "not_found", path: req.path }));

/* ── Local listener ── */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🛡️  DroidGuard Quest dev server`);
    console.log(`    http://localhost:${PORT}`);
  });
}

module.exports = app;
