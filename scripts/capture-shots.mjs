// Manually-run screenshot capture for the live-client work cards.
// NOT part of `npm run build` — a build must never depend on three live
// third-party sites being reachable. Re-run when a client site changes
// materially, then commit the updated PNGs.
//
// Usage: npm run shots
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { siteConfig } from '../src/config/site.js';

const OUT_DIR = fileURLToPath(new URL('../src/assets/work/', import.meta.url));

// 1024 rather than 1440: the card preview slot is ~383x250 CSS px, and a
// 1440-wide capture downscales ~3.8x into it — body text lands around 4px.
// Verified 2026-07-28 against all three sites. See the design spec, section 4.
const VIEWPORT = { width: 1024, height: 640 };

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

for (const client of siteConfig.clients) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  try {
    // 'load', not 'networkidle' — embedded third-party widgets (Calendly,
    // Turnstile) hold connections open and networkidle never fires.
    await page.goto(client.url, { waitUntil: 'load', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    // Client sites use the same IntersectionObserver scroll-reveal as this
    // template, so anything below the fold is still opacity:0 on first paint
    // and captures as a blank band. Step through the page to fire every
    // reveal, then return to the top before shooting.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 250));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(OUT_DIR, `${client.slug}.png`),
      type: 'png',
    });
    console.log(`✓ ${client.slug}  ←  ${client.url}`);
  } catch (err) {
    failures++;
    console.error(`✗ ${client.slug}  ←  ${client.url}\n  ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} capture(s) failed — existing PNGs left untouched.`);
  process.exit(1);
}
console.log(`\nCaptured ${siteConfig.clients.length} screenshots to src/assets/work/`);
