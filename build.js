/**
 * DroidGuard Quest — production build pipeline.
 *
 * Reads source from ./src and writes a minified + obfuscated static
 * bundle to ./public, which is the only directory the local server
 * (and Vercel) will ever serve.
 *
 *   - JS         : terser minify  -> javascript-obfuscator (heavy on data.js)
 *   - HTML       : html-minifier-terser, aggressive options
 *   - CSS        : csso (with restructure)
 *   - assets     : copied verbatim from src/assets
 *   - api/       : copied verbatim (Vercel serverless functions)
 *   - vercel.json: copied to public/ root
 *
 * Run with:  npm run build
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { minify: terserMinify } = require("terser");
const JsObfuscator = require("javascript-obfuscator");
const { minify: htmlMinify } = require("html-minifier-terser");
const csso = require("csso");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "public");

const JS_FILES = [
  "js/anti-tamper.js",
  "js/data.js",
  "js/integrity.js",
  "js/state.js",
  "js/quiz.js",
  "js/map.js",
  "js/app.js"
];
const COPY_DIRS = [
  { src: path.join(SRC, "assets"), dst: path.join(OUT, "assets") },
  { src: path.join(ROOT, "api"),   dst: path.join(OUT, "api") }
];

const SKIP_NAMES = new Set([".DS_Store", "Thumbs.db"]);

/** Heavy obfuscation profile — used for files that hold answer keys. */
const OBF_HEAVY = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.6,
  deadCodeInjection: false,
  numbersToExpressions: true,
  simplify: true,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.85,
  splitStrings: true,
  splitStringsChunkLength: 8,
  identifierNamesGenerator: "mangled-shuffled",
  selfDefending: true,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

/** Light obfuscation for the rest — keeps things small and fast. */
const OBF_LIGHT = {
  compact: true,
  simplify: true,
  stringArray: true,
  stringArrayEncoding: ["none"],
  stringArrayThreshold: 0.6,
  identifierNamesGenerator: "mangled",
  unicodeEscapeSequence: false
};

const HEAVY_TARGETS = new Set(["js/data.js", "js/integrity.js", "js/state.js", "js/quiz.js"]);

/* ── filesystem helpers ──────────────────────────────────────────── */
function rmrf(p) {
  if (!fs.existsSync(p)) return;
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, entry.name);
    if (entry.isDirectory()) rmrf(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(p);
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  ensureDir(dst);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_NAMES.has(entry.name) || entry.name.startsWith(".")) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

/* ── stage builders ──────────────────────────────────────────────── */
async function buildJs(rel) {
  const src = fs.readFileSync(path.join(SRC, rel), "utf8");
  const minified = await terserMinify(src, {
    compress: { passes: 2, drop_console: true, drop_debugger: false /* anti-tamper relies on it */ },
    mangle: true,
    format: { comments: false }
  });
  const code = minified.code || src;

  const profile = HEAVY_TARGETS.has(rel) ? OBF_HEAVY : OBF_LIGHT;
  let obf = JsObfuscator.obfuscate(code, profile).getObfuscatedCode();
  // The obfuscator emits short top-level helper identifiers (e.g. var T=…)
  // that collide across files when each script is loaded as its own <script>
  // tag. Wrapping in an IIFE scopes these locals to the file. Globals like
  // window.DG_* are still attached because the inner code is unchanged.
  obf = ";(function(){" + obf + "}());\n";

  const outPath = path.join(OUT, rel);
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, obf);
  return { rel, srcSize: Buffer.byteLength(src), outSize: Buffer.byteLength(obf) };
}

async function buildHtml() {
  const src = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
  const min = await htmlMinify(src, {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    conservativeCollapse: false,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeEmptyAttributes: true,
    removeOptionalTags: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true,
    minifyURLs: true,
    decodeEntities: true,
    sortAttributes: true,
    sortClassName: true,
    continueOnParseError: true
  });
  const out = path.join(OUT, "index.html");
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, min);
  return { rel: "index.html", srcSize: Buffer.byteLength(src), outSize: Buffer.byteLength(min) };
}

function buildCss() {
  const src = fs.readFileSync(path.join(SRC, "css/styles.css"), "utf8");
  const out = csso.minify(src, { restructure: true }).css;
  const outPath = path.join(OUT, "css/styles.css");
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, out);
  return { rel: "css/styles.css", srcSize: Buffer.byteLength(src), outSize: Buffer.byteLength(out) };
}

async function main() {
  const t0 = Date.now();
  console.log("🛡️  DroidGuard Quest — building public/");
  rmrf(OUT);
  ensureDir(OUT);

  const reports = [];
  for (const f of JS_FILES) reports.push(await buildJs(f));
  reports.push(buildCss());
  reports.push(await buildHtml());

  for (const { src, dst } of COPY_DIRS) copyDir(src, dst);
  // vercel.json hooks at the root, not inside public/, so we don't copy it.

  let srcSum = 0, outSum = 0;
  for (const r of reports) { srcSum += r.srcSize; outSum += r.outSize; }
  console.log("");
  console.log("file".padEnd(28) + "src".padStart(12) + "out".padStart(12) + " ratio");
  console.log("-".repeat(64));
  reports.forEach(r => {
    const ratio = r.srcSize ? Math.round((r.outSize / r.srcSize) * 100) + "%" : "-";
    console.log(r.rel.padEnd(28) + fmtSize(r.srcSize).padStart(12) + fmtSize(r.outSize).padStart(12) + " " + ratio.padStart(5));
  });
  console.log("-".repeat(64));
  console.log("total".padEnd(28) + fmtSize(srcSum).padStart(12) + fmtSize(outSum).padStart(12) +
    " " + Math.round((outSum / srcSum) * 100) + "%");
  console.log("");
  console.log("✓ done in " + (Date.now() - t0) + "ms — output: " + path.relative(ROOT, OUT) + "/");
}

main().catch(err => {
  console.error("✗ build failed:", err);
  process.exit(1);
});
