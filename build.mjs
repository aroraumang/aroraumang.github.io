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
// No dependencies, no client-side JavaScript.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://umangarora.com";
const SUPPORT_EMAIL = "paisolog@umangarora.com";
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

const SECTIONS = {
  paisolog: [
    ["/paisolog/", "PaisoLog"],
    ["/paisolog/privacy/", "Privacy"],
    ["/paisolog/support/", "Support"],
  ],
};

function layout({ title, description, urlPath, body }) {
  const section = SECTIONS[urlPath.split("/")[1]];
  const subnav = section
    ? `<nav class="subnav" aria-label="PaisoLog">${section
        .map(
          ([href, label]) =>
            `<a href="${href}"${href === urlPath ? ' aria-current="page"' : ""}>${label}</a>`
        )
        .join("")}</nav>`
    : "";
  const fullTitle = title === "Umang Arora" ? title : `${title} | Umang Arora`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
${urlPath === "/404" ? "" : `<link rel="canonical" href="${SITE_URL}${urlPath}">\n`}<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="site-header">
<a class="site-name" href="/">Umang Arora</a>
${subnav}
</header>
<main>
${body.trim()}
</main>
<footer class="site-footer">
<p>&copy; ${new Date().getFullYear()} Umang Arora. This site has no cookies, analytics or trackers.</p>
</footer>
</body>
</html>
`;
}

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
    `<h1>${escapeHtml(policy.title)}</h1>`,
    `<p class="meta">Effective ${formatDate(policy.effectiveDate)}</p>`,
    `<p class="lead">${escapeHtml(policy.intro)}</p>`,
    ...policy.sections.flatMap((s) => [
      `<h2>${escapeHtml(s.heading)}</h2>`,
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
    const { title, description, body } = readFragment(file);
    return { title, description, urlPath, body: fill(body) };
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
