# Facebook Daily-Special Auto-Post Implementation Plan

> **SUPERSEDED (2026-07-10):** The spec this plan was built from was revised —
> the feature now also drives on-site display and runs on a Cron Trigger
> schedule instead of a manual publish-time checkbox. See
> `docs/superpowers/specs/2026-07-09-facebook-daily-special-autopost-design.md`
> for the current design. This plan describes the earlier, narrower version
> and should not be executed as-is; a new plan needs to be written from the
> revised spec before implementation resumes.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a client publishes a `dailySpecial` document in Sanity with `postToFacebook` checked, the shared Cloudflare Worker automatically posts it (text or photo) to that client's Facebook Page via the Graph API, resets the flag, and emails TWF on failure.

**Architecture:** A new Sanity document type (`dailySpecial`) is opted into a client's Studio schema. A second, per-client Sanity webhook (alongside the existing Coolify-rebuild one) POSTs a GROQ-projected payload to a new `/facebook-post?site_id=<slug>` route on the existing shared Worker (`worker/index.js`). The Worker looks up that site's Facebook + Sanity credentials from its existing KV entry, posts to the Graph API, patches the doc back via Sanity's HTTP mutate API, and emails TWF's inbox via Resend on any failure.

**Tech Stack:** Sanity Studio (TypeScript schema), Cloudflare Workers (plain JS, zero npm dependencies — matches existing `worker/index.js`), Meta Graph API, Sanity HTTP mutate API, Resend (existing integration).

## Global Constraints

- The Worker has **zero npm dependencies** — every external call is a raw `fetch`, no SDKs. Follow this exactly; do not add `@sanity/client` or a Facebook SDK to `worker/`.
- No client-supplied routing: `site_id` comes from the webhook URL query string (server-configured per client), never from the request body. Mirrors the existing form-relay's KV-lookup-only routing (never trust a client-supplied destination).
- Sanity dataset name is **always** `production` for every client project (per `web-foundry-onboarding` SKILL.md) — hardcode this as a constant in the Worker rather than storing it per-site in KV.
- Each client has their **own** Sanity project (not a shared project+dataset) — so `sanityProjectId` and a project-scoped `sanityWriteToken` must live in per-site KV, not as global Worker secrets.
- No new global Worker secrets/vars are needed for this feature — all Facebook/Sanity credentials are per-site KV fields, using the `WEB_FOUNDRY_SITES` namespace that already exists.
- The Worker has no automated test framework (no vitest/jest, no `worker/package.json`). Verification follows the codebase's existing convention: local `wrangler dev` + curl for control-flow checks, and a real production smoke test for the external-API paths (mirrors the mandatory "Post-deploy form smoke test" already documented in `CLAUDE.md`).
- Nothing about this feature is user-facing copy (no "free" language concerns) and it does **not** display anything on the client's own website — Facebook is the only output surface.

---

### Task 1: Sanity schema — `dailySpecial` document type

**Files:**
- Create: `studio/schemaTypes/dailySpecial.ts`
- Modify: `studio/schemaTypes/index.ts`

**Interfaces:**
- Produces: a Sanity document of `_type: "dailySpecial"` with fields `caption` (string, required), `image` (image, optional, hotspot enabled), `postToFacebook` (boolean, default `false`), `lastPostedAt` (datetime, read-only in the Studio UI). Later tasks (Worker) read `caption`, `postToFacebook`, and expect a GROQ projection field named `imageUrl` (resolved from `image.asset->url`, not the raw `image` field) plus `_id` and `_type`.

- [ ] **Step 1: Write the schema file**

```typescript
// studio/schemaTypes/dailySpecial.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'dailySpecial',
  title: 'Daily Special',
  type: 'document',
  fields: [
    defineField({
      name: 'caption',
      title: 'Caption',
      description: 'The text of your Facebook post — what today\'s special is, price, etc.',
      type: 'text',
      rows: 3,
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      description: 'Optional. If included, the post goes out as a photo post; otherwise it\'s a text-only post.',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'postToFacebook',
      title: 'Post to Facebook',
      description: 'Check this and Publish to send this special to Facebook right now. It automatically unchecks itself once posted, so re-publishing a later typo fix won\'t repost it.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'lastPostedAt',
      title: 'Last Posted At',
      description: 'Set automatically after a successful Facebook post. Not editable.',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {title: 'caption', media: 'image', posted: 'postToFacebook'},
    prepare({title, media, posted}) {
      return {
        title: title || 'Untitled special',
        subtitle: posted ? 'Queued to post to Facebook' : '',
        media,
      }
    },
  },
})
```

- [ ] **Step 2: Register the schema type**

```typescript
// studio/schemaTypes/index.ts
import bakeryMenu from './bakeryMenu'
import plumberPage from './plumberPage'
import salonPage from './salonPage'
import aboutPage from './aboutPage'
import dailySpecial from './dailySpecial'

export const schemaTypes = [bakeryMenu, plumberPage, salonPage, aboutPage, dailySpecial]
```

- [ ] **Step 3: Verify the Studio builds cleanly**

Run: `cd studio && npm run build`
Expected: build completes with no errors (this is the project's existing validation step for schema changes — there's no separate typecheck script).

- [ ] **Step 4: Manual Studio check**

Run: `cd studio && npm run dev`, open the local Studio URL, confirm a new **Daily Special** document type appears in the sidebar, and that creating one shows Caption, Photo, Post to Facebook, and a read-only Last Posted At field. Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add studio/schemaTypes/dailySpecial.ts studio/schemaTypes/index.ts
git commit -m "feat(studio): add dailySpecial schema for Facebook auto-post"
```

---

### Task 2: Worker — routing skeleton, payload gate, KV lookup

**Files:**
- Modify: `worker/index.js:1-2` (top of `fetch`, add routing before existing CORS logic)
- Modify: `worker/index.js` (end of file, add new handler function + helper)

**Interfaces:**
- Consumes: `env.WEB_FOUNDRY_SITES` (existing KV binding), the `json()` helper already defined at the bottom of `worker/index.js`.
- Produces: `handleFacebookPost(request, env, ctx)` — an async function returning a `Response`. Later tasks (3, 4, 5) extend the body of this function; they rely on it already having validated `doc._type`, `doc.postToFacebook`, and resolved `config` (the parsed KV JSON) before they run.

- [ ] **Step 1: Add routing at the top of the exported `fetch` handler**

In `worker/index.js`, change:

```js
export default {
  async fetch(request, env, ctx) {
    // ── CORS: validate origin ──────────────────────────────────
    const origin = request.headers.get('Origin') || '';
```

to:

```js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/facebook-post') {
      if (request.method !== 'POST') {
        return json({ success: false, message: 'Method not allowed' }, 405, '');
      }
      return handleFacebookPost(request, env, ctx);
    }

    // ── CORS: validate origin ──────────────────────────────────
    const origin = request.headers.get('Origin') || '';
```

This runs before any of the existing form-relay logic, so nothing below it changes. Sanity's webhook is server-to-server (no `Origin` header, no CORS/Turnstile relevance), which is why this new path skips all of that entirely.

- [ ] **Step 2: Add the handler and its constants at the end of `worker/index.js`**

Add this after the existing `escapeHtml` function:

```js
// Sanity dataset is always "production" for every client project — see
// web-foundry-onboarding SKILL.md. Not stored per-site; hardcoded here.
const SANITY_DATASET = 'production';

async function handleFacebookPost(request, env, ctx) {
  const url = new URL(request.url);
  const siteId = url.searchParams.get('site_id') || '';

  let doc;
  try {
    doc = await request.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON' }, 400, '');
  }

  if (doc._type !== 'dailySpecial' || doc.postToFacebook !== true) {
    return json({ success: true, skipped: true }, 200, '');
  }

  if (!siteId || !env.WEB_FOUNDRY_SITES) {
    return json({ success: true, skipped: true, reason: 'no site_id' }, 200, '');
  }

  const raw = await env.WEB_FOUNDRY_SITES.get(siteId);
  if (!raw) {
    return json({ success: true, skipped: true, reason: 'unknown site' }, 200, '');
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    return json({ success: true, skipped: true, reason: 'bad site config' }, 200, '');
  }

  const { facebookPageId, facebookPageToken, sanityProjectId, sanityWriteToken } = config;
  if (!facebookPageId || !facebookPageToken || !sanityProjectId || !sanityWriteToken) {
    return json({ success: true, skipped: true, reason: 'facebook not configured' }, 200, '');
  }

  console.log('Facebook post accepted for site:', siteId, 'doc:', doc._id);

  return json({ success: true }, 200, '');
}
```

Note: the actual posting call is deliberately not wired in yet — Task 3 adds it in place of the final `console.log`/`return`. This step only proves the gating logic end-to-end.

- [ ] **Step 3: Seed a local test KV entry**

```bash
cd worker
npx wrangler kv key put --binding WEB_FOUNDRY_SITES "fb-test-site" '{"toEmail":"test@example.com","businessName":"FB Test Site","facebookPageId":"999","facebookPageToken":"fake-token","sanityProjectId":"fake123","sanityWriteToken":"fake-write-token"}'
```

Expected: `Writing the value to the store...` / success message, no `--remote` flag (writes to the local persisted store `wrangler dev` reads from).

- [ ] **Step 4: Run the Worker locally**

```bash
npx wrangler dev
```

Expected: starts and prints a local URL, e.g. `http://localhost:8787`.

- [ ] **Step 5: Curl the skip paths**

In a second terminal:

```bash
curl -s -X POST http://localhost:8787/facebook-post \
  -H "Content-Type: application/json" \
  -d '{"_type":"otherType","postToFacebook":true}'
```
Expected: `{"success":true,"skipped":true}`

```bash
curl -s -X POST "http://localhost:8787/facebook-post?site_id=unknown-site" \
  -H "Content-Type: application/json" \
  -d '{"_type":"dailySpecial","postToFacebook":true}'
```
Expected: `{"success":true,"skipped":true,"reason":"unknown site"}`

- [ ] **Step 6: Curl the accepted path**

```bash
curl -s -X POST "http://localhost:8787/facebook-post?site_id=fb-test-site" \
  -H "Content-Type: application/json" \
  -d '{"_id":"abc123","_type":"dailySpecial","postToFacebook":true,"caption":"Test special"}'
```
Expected: `{"success":true}`, and the `wrangler dev` terminal logs `Facebook post accepted for site: fb-test-site doc: abc123`.

- [ ] **Step 7: Regression-check the existing form-relay path is untouched**

```bash
curl -s -X POST http://localhost:8787/ \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:4321" \
  -d '{"name":"Test","email":"test@example.com","message":"hi","site_id":"fb-test-site"}'
```
Expected: same behavior as before this change — either a success JSON response or a Resend-auth-related error (since local `.dev.vars` likely has no real `RESEND_API_KEY`), but **not** a 404 or routing error. This confirms the new routing branch didn't break the default path. Stop `wrangler dev` (Ctrl+C) once confirmed.

- [ ] **Step 8: Commit**

```bash
git add worker/index.js
git commit -m "feat(worker): add /facebook-post route with payload gating and KV lookup"
```

---

### Task 3: Worker — Graph API posting (text or photo)

**Files:**
- Modify: `worker/index.js` (replace the placeholder `console.log`/`return` at the end of `handleFacebookPost` from Task 2; add a new `postSpecialToFacebook` function)

**Interfaces:**
- Consumes: the `doc`, `siteId`, `facebookPageId`, `facebookPageToken` values already resolved inside `handleFacebookPost` (Task 2).
- Produces: `postSpecialToFacebook({ doc, siteId, facebookPageId, facebookPageToken, sanityProjectId, sanityWriteToken, env })` — an async function with no return value, used via `ctx.waitUntil` so the webhook response isn't held open. Task 4 extends this function's success branch; Task 5 extends its catch branch.

- [ ] **Step 1: Replace the end of `handleFacebookPost`**

In `worker/index.js`, change the last two lines of `handleFacebookPost` from:

```js
  console.log('Facebook post accepted for site:', siteId, 'doc:', doc._id);

  return json({ success: true }, 200, '');
}
```

to:

```js
  ctx.waitUntil(postSpecialToFacebook({
    doc, siteId, facebookPageId, facebookPageToken, sanityProjectId, sanityWriteToken, env,
  }));

  return json({ success: true }, 200, '');
}
```

- [ ] **Step 2: Add the posting function**

Add this after `handleFacebookPost`:

```js
// Meta deprecates Graph API versions roughly 2 years after release —
// bump this if Facebook posts start failing with an "unsupported version" error.
const GRAPH_API_VERSION = 'v21.0';

async function postSpecialToFacebook({ doc, siteId, facebookPageId, facebookPageToken, sanityProjectId, sanityWriteToken, env }) {
  try {
    const endpoint = doc.imageUrl
      ? `https://graph.facebook.com/${GRAPH_API_VERSION}/${facebookPageId}/photos`
      : `https://graph.facebook.com/${GRAPH_API_VERSION}/${facebookPageId}/feed`;

    const params = new URLSearchParams({ access_token: facebookPageToken });
    if (doc.imageUrl) {
      params.set('url', doc.imageUrl);
      params.set('caption', doc.caption || '');
    } else {
      params.set('message', doc.caption || '');
    }

    console.log('Posting to Facebook:', endpoint);
    const fbRes = await fetch(`${endpoint}?${params.toString()}`, { method: 'POST' });
    const fbBody = await fbRes.json();

    if (!fbRes.ok || fbBody.error) {
      throw new Error(fbBody.error?.message || `Facebook API error (status ${fbRes.status})`);
    }

    console.log('Facebook post succeeded:', fbBody.id || fbBody.post_id);
  } catch (err) {
    console.error('Facebook post failed:', err.message);
  }
}
```

(The logged `endpoint` is just the base Graph API URL with the page ID — the access token lives only in `params`, which is never logged, so `facebookPageToken` is never written to Worker logs.)

- [ ] **Step 3: Verify the request is well-formed against a fake token**

```bash
cd worker
npx wrangler dev
```

In another terminal:

```bash
curl -s -X POST "http://localhost:8787/facebook-post?site_id=fb-test-site" \
  -H "Content-Type: application/json" \
  -d '{"_id":"abc123","_type":"dailySpecial","postToFacebook":true,"caption":"Test special, no photo"}'
```

Expected: the `wrangler dev` terminal logs `Posting to Facebook: https://graph.facebook.com/v21.0/999/feed` followed by `Facebook post failed: Invalid OAuth access token...` (or similar Meta auth error — expected and correct, since `fb-test-site`'s token is the fake value seeded in Task 2). This confirms the endpoint URL and text-post branch are constructed correctly; **do not** treat the Meta auth failure itself as a bug at this step — Task 7 verifies the real success path with genuine credentials.

- [ ] **Step 4: Verify the photo-post branch**

```bash
curl -s -X POST "http://localhost:8787/facebook-post?site_id=fb-test-site" \
  -H "Content-Type: application/json" \
  -d '{"_id":"abc124","_type":"dailySpecial","postToFacebook":true,"caption":"Test special with photo","imageUrl":"https://cdn.sanity.io/images/fake/production/fake.jpg"}'
```

Expected: log line `Posting to Facebook: https://graph.facebook.com/v21.0/999/photos`, then a Meta auth error (same reasoning as Step 3). Stop `wrangler dev` (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add worker/index.js
git commit -m "feat(worker): post daily specials to the Facebook Graph API"
```

---

### Task 4: Worker — reset `postToFacebook` after a successful post

**Files:**
- Modify: `worker/index.js` (extend the success branch of `postSpecialToFacebook`; add `resetPostToFacebookFlag`)

**Interfaces:**
- Consumes: `SANITY_DATASET` constant (Task 2), `sanityProjectId`/`sanityWriteToken` (already threaded through from `handleFacebookPost`).
- Produces: `resetPostToFacebookFlag({ doc, sanityProjectId, sanityWriteToken })` — async, throws on failure (caught by the caller's existing try/catch in `postSpecialToFacebook`, which routes into Task 5's failure email).

- [ ] **Step 1: Call the reset after a successful post**

In `postSpecialToFacebook`, change:

```js
    console.log('Facebook post succeeded:', fbBody.id || fbBody.post_id);
  } catch (err) {
```

to:

```js
    console.log('Facebook post succeeded:', fbBody.id || fbBody.post_id);

    await resetPostToFacebookFlag({ doc, sanityProjectId, sanityWriteToken });
  } catch (err) {
```

- [ ] **Step 2: Add the reset function**

Add after `postSpecialToFacebook`:

```js
async function resetPostToFacebookFlag({ doc, sanityProjectId, sanityWriteToken }) {
  const mutateUrl = `https://${sanityProjectId}.api.sanity.io/v2024-01-01/data/mutate/${SANITY_DATASET}`;
  const res = await fetch(mutateUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sanityWriteToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mutations: [{
        patch: {
          id: doc._id,
          set: { postToFacebook: false, lastPostedAt: new Date().toISOString() },
        },
      }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sanity patch-back failed: ${errText}`);
  }

  console.log('Sanity postToFacebook flag reset for doc:', doc._id);
}
```

- [ ] **Step 3: Verify the mutate call shape against the showcase's own Sanity project**

This project's own Sanity project ID is `dll5zv5a` (see `studio/sanity.config.ts`). Create a temporary write-scoped token for it at [sanity.io/manage](https://sanity.io/manage) → this project → API → Tokens → Add API token (Editor permission), then:

```bash
cd worker
npx wrangler kv key put --binding WEB_FOUNDRY_SITES "fb-test-site" '{"toEmail":"test@example.com","businessName":"FB Test Site","facebookPageId":"999","facebookPageToken":"fake-token","sanityProjectId":"dll5zv5a","sanityWriteToken":"<paste-the-real-token>"}'
npx wrangler dev
```

In another terminal, create a real `dailySpecial` draft doc in the showcase Studio (`cd studio && npm run dev`, add a Daily Special with any caption, do **not** publish it — leave `_id` prefixed `drafts.`), copy its `_id`, then:

```bash
curl -s -X POST "http://localhost:8787/facebook-post?site_id=fb-test-site" \
  -H "Content-Type: application/json" \
  -d '{"_id":"<the-drafts-id-you-copied>","_type":"dailySpecial","postToFacebook":true,"caption":"Testing patch-back"}'
```

Expected: `wrangler dev` logs the Facebook auth failure (fake page token, same as Task 3) **and then still** logs `Sanity postToFacebook flag reset for doc: <id>` — confirming the reset call runs independently and correctly even when reached from a fresh code path. Then, separately, temporarily hardcode a `return;` right after the `console.log('Facebook post succeeded...')` line is reached in a manual test if you want to isolate the reset call from the (currently-failing) Facebook call — otherwise skip straight to Task 7, where a real Facebook token makes the success path genuinely reachable end-to-end.

- [ ] **Step 4: Commit**

```bash
git add worker/index.js
git commit -m "feat(worker): reset postToFacebook flag via Sanity mutate API after posting"
```

---

### Task 5: Worker — failure email to TWF admin

**Files:**
- Modify: `worker/index.js` (extend the catch branch of `postSpecialToFacebook`; add `sendFacebookFailureEmail`)

**Interfaces:**
- Consumes: `env.RESEND_API_KEY`, `env.TO_EMAIL` (existing Worker secrets/vars), the existing `escapeHtml` helper.
- Produces: `sendFacebookFailureEmail({ siteId, doc, error, env })` — async, best-effort (swallows its own errors so a Resend outage can't crash the Worker or mask the original error).

- [ ] **Step 1: Call the failure email from the catch branch**

In `postSpecialToFacebook`, change:

```js
  } catch (err) {
    console.error('Facebook post failed:', err.message);
  }
}
```

to:

```js
  } catch (err) {
    console.error('Facebook post failed:', err.message);
    await sendFacebookFailureEmail({ siteId, doc, error: err, env });
  }
}
```

- [ ] **Step 2: Add the failure email function**

Add after `resetPostToFacebookFlag`:

```js
async function sendFacebookFailureEmail({ siteId, doc, error, env }) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Web Foundry Forms <forms@cincinnatiwebfoundry.com>',
        to: [env.TO_EMAIL],
        subject: `Facebook post failed — ${siteId}`,
        html: `<p>Site: <strong>${escapeHtml(siteId)}</strong></p><p>Doc: ${escapeHtml(doc._id || '')}</p><p>Error: ${escapeHtml(error.message || String(error))}</p>`,
      }),
    });
  } catch (emailErr) {
    console.error('Facebook failure email itself failed to send:', emailErr.message);
  }
}
```

- [ ] **Step 3: Verify locally with a real Resend key**

Create `worker/.dev.vars` (gitignored — check `worker/.gitignore` covers `.dev.vars`; if not present, add it) with:

```
RESEND_API_KEY=<your real Resend API key>
TO_EMAIL=<your inbox for this test>
```

```bash
cd worker
npx wrangler dev
```

In another terminal, re-run the Task 3 Step 3 curl (fake Facebook token, so the post fails):

```bash
curl -s -X POST "http://localhost:8787/facebook-post?site_id=fb-test-site" \
  -H "Content-Type: application/json" \
  -d '{"_id":"abc123","_type":"dailySpecial","postToFacebook":true,"caption":"Test special"}'
```

Expected: within a few seconds, an email arrives at `TO_EMAIL` with subject `Facebook post failed — fb-test-site` and a body naming the doc and the Meta auth error. Stop `wrangler dev` (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add worker/index.js worker/.gitignore
git commit -m "feat(worker): email TWF admin on Facebook post failure"
```

---

### Task 6: Deploy the Worker

**Files:** none (deploy only — no new secrets or vars are needed; see Global Constraints).

- [ ] **Step 1: Deploy**

```bash
cd worker
npx wrangler deploy
```

Expected: deploy succeeds and prints the Worker's URL (`https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev`), matching the existing deploy command already documented in `CLAUDE.md`.

- [ ] **Step 2: Confirm the route is live**

```bash
curl -s -X POST "https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev/facebook-post?site_id=unknown-site" \
  -H "Content-Type: application/json" \
  -d '{"_type":"dailySpecial","postToFacebook":true}'
```

Expected: `{"success":true,"skipped":true,"reason":"unknown site"}` (proves the deployed Worker has the new route and reads real remote KV, not local).

- [ ] **Step 3: Seed the real test KV entry** (needed for Task 7)

```bash
npx wrangler kv key put --binding WEB_FOUNDRY_SITES --remote "fb-test-site" '{"toEmail":"<your-inbox>","businessName":"FB Test Site","facebookPageId":"<real-test-page-id>","facebookPageToken":"<real-long-lived-page-token>","sanityProjectId":"dll5zv5a","sanityWriteToken":"<real-write-token-from-task-4>"}'
```

(The real Page ID and token come from Task 7's Meta setup — do this step as part of Task 7 if you don't have them yet.)

---

### Task 7: End-to-end smoke test with real credentials

This is a manual verification task (no code changes), following the same pattern as the existing "Post-deploy form smoke test" in `CLAUDE.md`. No App Review is required for this step — Meta allows an app in Development Mode to post to any Facebook Page the developer's own account administers, without review. App Review is only needed later, to post to a real client's Page that TWF doesn't personally administer.

- [ ] **Step 1: Get a test Facebook Page and app**

If TWF doesn't already have one: create a Facebook Page (e.g. "The Web Foundry — Test") and a Meta App at [developers.facebook.com](https://developers.facebook.com) under the same Meta account that administers that Page.

- [ ] **Step 2: Generate a long-lived Page access token**

In the Meta App's Graph API Explorer: select the app, select the test Page, grant `pages_manage_posts` + `pages_read_engagement`, generate a User token, then exchange it for a long-lived Page token (Meta's documented long-lived token exchange). Note the Page's numeric ID (visible on the Page's About tab) and the resulting Page token.

- [ ] **Step 3: Seed the real KV entry**

Run Task 6 Step 3 with the real Page ID/token and the real `sanityWriteToken` created in Task 4 Step 3.

- [ ] **Step 4: Configure the second Sanity webhook**

In [sanity.io/manage](https://sanity.io/manage) → project `dll5zv5a` → API → Webhooks → Create webhook:
- URL: `https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev/facebook-post?site_id=fb-test-site`
- Dataset: `production`
- Trigger on: Create, Update
- Filter: `_type == "dailySpecial"`
- Projection:
```groq
{
  "_id": _id,
  "_type": _type,
  "caption": caption,
  "postToFacebook": postToFacebook,
  "imageUrl": image.asset->url
}
```

- [ ] **Step 5: Publish a real test special**

In the showcase Studio, create a Daily Special with a caption, check **Post to Facebook**, and Publish.

- [ ] **Step 6: Confirm the post appeared**

Check the test Facebook Page — the post should appear within a few seconds.

- [ ] **Step 7: Confirm the flag reset**

Refresh the document in Studio — `Post to Facebook` should be unchecked and `Last Posted At` should show a recent timestamp.

- [ ] **Step 8: Confirm the failure path**

In the KV entry, temporarily replace `facebookPageToken` with an invalid string (`npx wrangler kv key put --binding WEB_FOUNDRY_SITES --remote "fb-test-site" '{...same config but bad token...}'`), publish another test special with `postToFacebook` checked, and confirm the failure email arrives at `TO_EMAIL`. Restore the real token afterward.

- [ ] **Step 9: If anything fails, tail the Worker**

```bash
cd worker
npx wrangler tail --format pretty --sampling-rate 0.99
```

- [ ] **Step 10: Clean up the test KV entry** (optional)

```bash
npx wrangler kv key delete --binding WEB_FOUNDRY_SITES --remote "fb-test-site"
```

---

### Task 8: Documentation updates

**Files:**
- Modify: `docs/features.md` (add entry under Future Consideration)
- Modify: `~/.claude/skills/web-foundry-onboarding/SKILL.md` (add KV fields + per-client setup steps)

- [ ] **Step 1: Add the feature to `docs/features.md`**

Add this under the `## Future Consideration` heading (check the file for that heading and insert alongside similarly-formatted entries):

```markdown
### Social media auto-post — Facebook (Graph API)
- **What it does:** Client publishes a "Daily Special" doc in Sanity (caption +
  optional photo); the shared Worker automatically posts it to that client's
  Facebook Page via the Meta Graph API. No recurring per-client subscription —
  built directly on Meta's API, reused across all clients.
- **Limitations:** Facebook-only (no Instagram/X). Requires the client to grant
  Page access and TWF to hold a long-lived Page token per client. Posting to a
  Page TWF doesn't administer requires Meta App Review (one-time, ~1-3 weeks)
  before it can be offered broadly.
- **Cost:** $0 — one Meta App + the existing shared Worker serves every client.
- **Spec:** `docs/superpowers/specs/2026-07-09-facebook-daily-special-autopost-design.md`.
```

- [ ] **Step 2: Update the onboarding skill's KV config table**

In `~/.claude/skills/web-foundry-onboarding/SKILL.md`, find the "KV config fields" table (the one documenting `toEmail`, `businessName`, `brandColor`, `headerBg`, `siteUrl`, `enforceTurnstile`) and add four rows:

```markdown
| `facebookPageId` | Only if client wants Facebook auto-post | Numeric Facebook Page ID, from the Page's About tab |
| `facebookPageToken` | Only if client wants Facebook auto-post | Long-lived Page access token (see Facebook auto-post setup steps) |
| `sanityProjectId` | Only if client wants Facebook auto-post | That client's own Sanity project ID (same value used in their `.env`) |
| `sanityWriteToken` | Only if client wants Facebook auto-post | Editor-permission API token created in that client's own Sanity project (Manage → API → Tokens) — used only for resetting the `postToFacebook` flag after posting |
```

- [ ] **Step 3: Add a "Facebook auto-post setup" subsection**

Add a new subsection near the existing Sanity/webhook setup phases, covering: adding the `dailySpecial` schema to the client's forked repo (skip if they don't want it), generating a long-lived Page token (Graph API Explorer steps from Task 7), creating the client's Sanity write token, seeding their KV entry with the four new fields, and configuring their project's second Sanity webhook (URL/projection from Task 7 Step 4, with that client's own `site_id`).

- [ ] **Step 4: Commit**

```bash
git add docs/features.md
git commit -m "docs: document Facebook daily-special auto-post feature"
```

(The onboarding skill lives outside this repo at `~/.claude/skills/web-foundry-onboarding/SKILL.md` — it has no git repo tie-in here, so it's edited and saved directly, not committed via this repo's git.)
