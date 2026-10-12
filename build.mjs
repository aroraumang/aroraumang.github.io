#!/usr/bin/env node
// Builds the site into the repo root, which GitHub Pages serves as-is.
//
//   node build.mjs
//
// - Every _src/**/*.html fragment becomes <same path>/index.html wrapped in the
//   shared layout below (_src/index.html -> index.html, _src/404.html -> 404.html).
//   GitHub Pages skips folders starting with _, so the fragments aren't published.
// - paisolog/privacy/index.html is rendered from PaisoLog's
//   constants/legal/privacyPolicy.json, the same file the app shows. Set
//   PAISOLOG_DIR if the PaisoLog repo isn't next to this one.
// - sitemap.xml lists every page except 404.
//
// No dependencies. The only client-side JavaScript is a page's own `script:`
// file (dog.js on the home page), allowed by that page's CSP and nothing else.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://umangarora.com";
const SUPPORT_EMAIL = "paisolog@umangarora.com";
// Changes whenever the file does, so browsers never keep a stale copy.
const fileVersion = (name) =>
  crypto
    .createHash("sha1")
    .update(fs.readFileSync(path.join(root, name)))
    .digest("hex")
    .slice(0, 8);
const cssVersion = fileVersion("style.css");
const paisologDir = path.resolve(
  process.env.PAISOLOG_DIR ?? path.join(root, "..", "PaisoLog")
);

const escapeHtml = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Cloudflare's Email Obfuscation would otherwise swap addresses for a script,
// which these pages don't allow.
const emailLink = (email) =>
  `<!--email_off--><a href="mailto:${email}">${email}</a><!--/email_off-->`;

const fill = (html) =>
  html
    .replace(/\{\{SUPPORT_EMAIL_LINK\}\}/g, emailLink(SUPPORT_EMAIL))
    .replace(/\{\{SUPPORT_EMAIL\}\}/g, SUPPORT_EMAIL);

const MAIN_NAV = [
  ["/apps/", "Apps"],
  ["https://github.com/aroraumang", "GitHub"],
  ["https://www.linkedin.com/in/meumangarora", "LinkedIn"],
];

const PAISOLOG_NAV = [
  ["/paisolog/", "Overview"],
  ["/paisolog/privacy/", "Privacy"],
  ["/paisolog/support/", "Support"],
];

// Pages under /paisolog/ wear the app's own theme; everything else uses the
// site theme.
const THEMES = {
  site: { light: "#f3f0e9", dark: "#0e0c0a", icon: "/favicon.svg" },
  paisolog: { light: "#FBF8F3", dark: "#17110D", icon: "/assets/paisolog-icon.png" },
};

const navLinks = (items, urlPath, { sections = false } = {}) =>
  items
    .map(([href, label]) => {
      const external = href.startsWith("http");
      const current =
        href === urlPath
          ? ' aria-current="page"'
          : sections && !external && urlPath.startsWith(href)
            ? ' aria-current="true"'
            : "";
      return `<a href="${href}"${current}${external ? ' class="external"' : ""}>${label}</a>`;
    })
    .join("");

function layout({ title, description, urlPath, body, width, script }) {
  const isPaisolog = urlPath.startsWith("/paisolog/");
  const theme = THEMES[isPaisolog ? "paisolog" : "site"];
  // PaisoLog pages count as part of Apps in the main nav.
  const navPath = isPaisolog ? "/apps/paisolog" : urlPath;
  const appBar = isPaisolog
    ? `<div class="app-bar">
<div class="wrap">
<a class="app-brand" href="/paisolog/"><img src="/assets/paisolog-icon.png" width="28" height="28" alt="">PaisoLog</a>
<nav class="subnav" aria-label="PaisoLog">${navLinks(PAISOLOG_NAV, urlPath)}</nav>
</div>
</div>
`
    : "";
  const mainClass =
    width === "full" ? "full" : width === "wide" ? "wrap" : "wrap prose";
  const fullTitle = title === "Umang Arora" ? title : `${title} | Umang Arora`;
  return `<!doctype html>
<html lang="en" class="theme-${isPaisolog ? "paisolog" : "site"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self'; media-src 'self';${script ? " script-src 'self';" : ""} base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="${theme.light}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${theme.dark}" media="(prefers-color-scheme: dark)">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
${urlPath === "/404" ? "" : `<link rel="canonical" href="${SITE_URL}${urlPath}">\n`}<link rel="icon" href="${theme.icon}">
<link rel="stylesheet" href="/style.css?v=${cssVersion}">
${script ? `<script src="/${script}?v=${fileVersion(script)}" defer></script>\n` : ""}</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<div class="top">
<header class="site-header">
<div class="wrap">
<a class="logo" href="/" aria-label="Umang Arora, home"><span class="logo-mark" aria-hidden="true">UA</span><span class="logo-name">Umang Arora</span></a>
<nav class="mainnav" aria-label="Main">${navLinks(MAIN_NAV, navPath, { sections: true })}</nav>
</div>
</header>
${appBar}</div>
<main id="content" class="${mainClass}">
${body.trim()}
</main>
<footer class="site-footer">
<div class="wrap">
<div class="footer-brand">
<a class="logo" href="/"><span class="logo-mark" aria-hidden="true">UA</span><span>Umang Arora</span></a>
<p>No cookies, analytics or trackers.</p>
</div>
<nav class="footer-cols" aria-label="Footer">
<div>
<p>Apps</p>
<a href="/apps/">All apps</a>
<a href="/paisolog/">PaisoLog</a>
<a href="/paisolog/privacy/">PaisoLog privacy</a>
<a href="/paisolog/support/">PaisoLog support</a>
</div>
<div>
<p>Elsewhere</p>
<a href="https://github.com/aroraumang">GitHub</a>
<a href="https://www.linkedin.com/in/meumangarora">LinkedIn</a>
</div>
</nav>
<p class="copyright">&copy; ${new Date().getFullYear()} Umang Arora</p>
</div>
</footer>
</body>
</html>
`;
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// A fragment starts with an HTML comment of "key: value" lines.
function readFragment(file) {
  const src = fs.readFileSync(file, "utf8");
  const match = src.match(/^<!--\n([\s\S]*?)\n-->\n/);
  if (!match) throw new Error(`${file}: missing front matter comment`);
  const meta = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const i = line.indexOf(":");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
  );
  return { ...meta, body: src.slice(match[0].length) };
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

function privacyPage() {
  const file = path.join(paisologDir, "constants/legal/privacyPolicy.json");
  const policy = JSON.parse(fs.readFileSync(file, "utf8"));
  // Paragraphs are plain text; only the support email becomes a link.
  const para = (text) =>
    `<p>${escapeHtml(text).replace(/\{\{SUPPORT_EMAIL\}\}/g, emailLink(SUPPORT_EMAIL))}</p>`;
  const body = [
    `<p class="eyebrow">Effective ${formatDate(policy.effectiveDate)}</p>`,
    `<h1>${escapeHtml(policy.title)}</h1>`,
    `<p class="lead">${escapeHtml(policy.intro)}</p>`,
    `<nav class="toc" aria-label="On this page"><p>On this page</p><ul>`,
    ...policy.sections.map(
      (s) => `<li><a href="#${slugify(s.heading)}">${escapeHtml(s.heading)}</a></li>`
    ),
    `</ul></nav>`,
    ...policy.sections.flatMap((s) => [
      `<h2 id="${slugify(s.heading)}">${escapeHtml(s.heading)}</h2>`,
      ...s.body.map(para),
    ]),
  ].join("\n");
  return {
    title: "PaisoLog privacy policy",
    description:
      "How PaisoLog handles your information: your data stays on your phone.",
    urlPath: "/paisolog/privacy/",
    body,
  };
}

const pages = walk(path.join(root, "_src"))
  .filter((f) => f.endsWith(".html"))
  .map((file) => {
    const rel = path.relative(path.join(root, "_src"), file).split(path.sep);
    const name = rel.pop().replace(/\.html$/, "");
    const parts = name === "index" ? rel : [...rel, name];
    const urlPath =
      name === "404" ? "/404" : "/" + parts.map((p) => `${p}/`).join("");
    const { title, description, width, script, body } = readFragment(file);
    return { title, description, width, script, urlPath, body: fill(body) };
  });
pages.push(privacyPage());

for (const page of pages) {
  const out =
    page.urlPath === "/404"
      ? path.join(root, "404.html")
      : path.join(root, page.urlPath, "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, layout(page));
}

const urls = pages
  .filter((p) => p.urlPath !== "/404")
  .map((p) => p.urlPath)
  .sort()
  .map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`)
  .join("\n");
fs.writeFileSync(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
);

console.log(`Built ${pages.length} pages: ${pages.map((p) => p.urlPath).join(" ")}`);
