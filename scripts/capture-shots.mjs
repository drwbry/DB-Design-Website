// Manually-run screenshot capture for every work-card preview on the hub page.
// Two phases:
//   1. Live client sites   (siteConfig.clients)  → src/assets/work/
//   2. Concept demo pages  (siteConfig.showcase) → src/assets/concepts/
//
// NOT part of `npm run build` — a build must never depend on three live
// third-party sites being reachable. Re-run when a client site or a concept
// page changes materially, then commit the updated PNGs.
//
// Usage: npm run shots
//
// Phase 2 shoots our own pages, so it needs them served locally. The npm script
// runs `astro build` first and this script then spawns `astro preview` against
// that build, captures, and shuts the server down. Note the bootstrapping
// order: index.astro imports the concept PNGs, so `astro build` fails if
// src/assets/concepts/ is empty. The PNGs are committed, so that only bites a
// fork that deletes them — restore them from git rather than deleting.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { siteConfig } from '../src/config/site.js';

const WORK_DIR = fileURLToPath(new URL('../src/assets/work/', import.meta.url));
const CONCEPT_DIR = fileURLToPath(new URL('../src/assets/concepts/', import.meta.url));
const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));

// 1024 rather than 1440: the card preview slot is ~383x250 CSS px, and a
// 1440-wide capture downscales ~3.8x into it — body text lands around 4px.
// Verified 2026-07-28 against all three sites. See the design spec, section 4.
const VIEWPORT = { width: 1024, height: 640 };

// Not 4321: that is the `astro dev` default, and a dev server left running in
// another terminal would otherwise silently serve these captures instead.
const PREVIEW_PORT = 4331;
const PREVIEW_ORIGIN = `http://localhost:${PREVIEW_PORT}`;

await mkdir(WORK_DIR, { recursive: true });
await mkdir(CONCEPT_DIR, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

/** Shoot one URL into `outPath`. Returns true on success. */
async function capture({ url, outPath, label, beforeShot }) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  try {
    // 'load', not 'networkidle' — embedded third-party widgets (Calendly,
    // Turnstile) hold connections open and networkidle never fires.
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    if (beforeShot) await beforeShot(page);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`✓ ${label}  ←  ${url}`);
    return true;
  } catch (err) {
    failures++;
    console.error(`✗ ${label}  ←  ${url}\n  ${err.message}`);
    return false;
  } finally {
    await page.close();
  }
}

// Client sites use the same IntersectionObserver scroll-reveal as this template,
// so anything below the fold is still opacity:0 on first paint and captures as a
// blank band. Step through the page to fire every reveal, then return to the top.
async function fireScrollReveals(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
}

// ── Phase 1: live client sites ────────────────────────────────────────────────
for (const client of siteConfig.clients) {
  await capture({
    url: client.url,
    outPath: path.join(WORK_DIR, `${client.slug}.png`),
    label: client.slug,
    beforeShot: fireScrollReveals,
  });
}

// ── Phase 2: concept demo pages, off a local preview server ───────────────────
const concepts = Object.entries(siteConfig.showcase);
const server = spawn('npx', ['astro', 'preview', '--port', String(PREVIEW_PORT)], {
  cwd: PROJECT_ROOT,
  stdio: 'ignore',
});

try {
  await waitForServer(PREVIEW_ORIGIN, 30000);
  for (const [slug, demo] of concepts) {
    await capture({
      url: `${PREVIEW_ORIGIN}/showcase/${slug}/`,
      outPath: path.join(CONCEPT_DIR, `${slug}.png`),
      label: `${slug} (${demo.name})`,
      // The showcase heroes render at full opacity on first paint, so no
      // scroll-reveal pass is needed. The fixed "Back to concepts" pill is ours,
      // not the demo's — it would read as part of the site in a thumbnail.
      beforeShot: (page) =>
        page.addStyleTag({ content: '.back-btn { display: none !important; }' }),
    });
  }
} catch (err) {
  failures += concepts.length;
  console.error(`✗ concept captures skipped\n  ${err.message}`);
} finally {
  server.kill();
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} capture(s) failed — existing PNGs left untouched.`);
  process.exit(1);
}
console.log(
  `\nCaptured ${siteConfig.clients.length} client screenshots to src/assets/work/` +
    ` and ${concepts.length} concept screenshots to src/assets/concepts/`
);

async function waitForServer(origin, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(origin, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `astro preview did not answer on ${origin} within ${timeoutMs / 1000}s.` +
      ` Run \`npm run build\` first — preview needs a dist/ to serve.`
  );
}
