/**
 * DroidGuard Quest — local server.
 *
 * Serves the production bundle from ./public exclusively. Source under
 * ./src is never reachable through this process — clients only see the
 * minified, obfuscated artifacts produced by `npm run build`.
 *
 * Vercel-compatible:
 *   - same security headers as vercel.json
 *   - files under ./api are auto-mounted at /api/<filename> and behave
 *     like Vercel serverless functions
 *
 * Bootstrap:
 *   npm install
 *   npm run build      (creates ./public)
 *   npm start          (serves ./public on http://localhost:3000)
 */

const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const API_DIR = path.join(ROOT, "api");
const PORT = parseInt(process.env.PORT, 10) || 3000;
const STATIC_MAX_AGE = process.env.NODE_ENV === "production" ? "1y" : 0;

if (!fs.existsSync(PUBLIC_DIR) || !fs.existsSync(path.join(PUBLIC_DIR, "index.html"))) {
  console.error("✗ ./public is missing or empty.");
  console.error("  Run `npm run build` before `npm start` so the server has a bundle to serve.");
  process.exit(1);
}

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
if (fs.existsSync(API_DIR)) {
  for (const file of fs.readdirSync(API_DIR)) {
    if (!file.endsWith(".js")) continue;
    const route = "/api/" + file.replace(/\.js$/, "");
    const handler = require(path.join(API_DIR, file));
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

/* ── Static bundle: ./public is the ONLY directory exposed ── */
app.use(express.static(PUBLIC_DIR, {
  maxAge: STATIC_MAX_AGE,
  etag: true,
  index: "index.html",
  fallthrough: true,
  dotfiles: "ignore"
}));

/* ── SPA fallback for client-side routes (non-API only) ── */
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

/* ── 404 for unmatched API ── */
app.use((req, res) => res.status(404).json({ error: "not_found", path: req.path }));

/* ── Listener ── */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🛡️  DroidGuard Quest`);
    console.log(`    serving ./public on http://localhost:${PORT}`);
  });
}

module.exports = app;
