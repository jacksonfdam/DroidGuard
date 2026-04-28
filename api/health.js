/**
 * GET /api/health
 *
 * Minimal serverless health endpoint. Works both as a Vercel
 * serverless function and as an Express handler mounted by ../server.js.
 */
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    service: "droidguard-quest",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString()
  });
};
