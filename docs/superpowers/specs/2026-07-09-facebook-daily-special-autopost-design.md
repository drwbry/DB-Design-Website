# Facebook daily-special auto-post — design

**Date:** 2026-07-09
**Status:** Proposed

## Problem

TWF's customer prospecting document promises: "Want your daily specials to
auto-post to Facebook? We can do that too." This capability doesn't exist yet.
It needs to be built as a **generic, reusable factory feature** — no specific
client is waiting on it, but it should be cheap to turn on for whichever future
clients want it (est. ~half of clients will use Facebook at all).

## Rejected alternatives

- **Zapier/Make as the Facebook connector** — faster to stand up per client
  (their Meta App Review is already done), but adds a recurring per-client
  subscription cost. Doesn't fit TWF's low-cost, custom-build positioning.
- **Third-party social schedulers (Buffer/Hootsuite)** — same recurring-cost
  tradeoff as Zapier, plus another vendor dependency.

**Decision:** build directly on the Meta Graph API, reused across all clients
via the existing shared Cloudflare Worker + KV pattern.

## Data model (Sanity)

New reusable document type `dailySpecial`. Only added to a client's Studio
schema at fork time if they've connected a Facebook Page — not every client
gets this type.

| Field | Type | Notes |
|---|---|---|
| `caption` | text | required — the post copy |
| `image` | image | optional — if present, posts as a photo; if absent, posts as plain text |
| `postToFacebook` | boolean | default `false` — explicit "fire this" checkbox, see below |
| `lastPostedAt` | datetime | set by the Worker on success, read-only in Studio UI |

### Why an explicit checkbox instead of "every publish posts"

The existing Sanity webhook fires on every publish, including trivial edits
(typo fixes). Without a gate, re-saving the same special would spam the Page
with duplicate posts. `postToFacebook` is the gate: the Worker only posts when
it publishes as `true`, and flips it back to `false` after a successful post
(see Worker flow, step 4) so the next plain edit doesn't refire it.

## Trigger & Worker flow

- Each opted-in client gets a **second** Sanity webhook (alongside the existing
  Coolify-rebuild one) pointed at a new Worker endpoint:
  `POST /facebook-post?site_id=<slug>`. `site_id` is baked into the per-client
  webhook URL, so the Worker always knows which KV entry to use — no
  client-supplied `site_id` in the payload body (same spoofing-avoidance
  principle as the contact-form routing).
- Worker logic on that endpoint:
  1. Verify payload is `_type == "dailySpecial"` and `postToFacebook == true`.
     Otherwise no-op (2xx, no action).
  2. Look up `facebookPageId` + `facebookPageToken` from that site's existing
     KV entry in `WEB_FOUNDRY_SITES` (extended with these two optional
     fields). If either is missing, no-op silently and log only — this means
     the client isn't configured for the feature, not an error condition, so
     it does **not** trigger the failure email below.
  3. If `image` is set: `POST /{page-id}/photos` (multipart, with `caption`)
     using the Sanity-hosted image URL. Otherwise: `POST /{page-id}/feed` with
     `message: caption`.
  4. On success: patch the Sanity doc via the Content API
     (`postToFacebook: false`, `lastPostedAt: <now>`) using a write-scoped
     Sanity token.
  5. On failure (Graph API error, expired token, etc.): send a failure email
     to the TWF internal inbox via the existing Resend integration, including
     client name and error detail. The client sees nothing wrong — their
     Sanity publish already succeeded independently of this side effect.

## Credential storage

`facebookPageId` and `facebookPageToken` are added as **optional** fields on
each site's existing entry in the `WEB_FOUNDRY_SITES` KV namespace (the same
namespace already used for email routing config) — no new KV namespace.
Reasoning: only roughly half of clients are expected to use this, so most KV
entries simply omit these fields, and the Worker already has a per-site KV
lookup path to extend rather than a second one to maintain.

## Meta setup

### One-time (TWF-side, not per client)

Create a single Meta App under TWF's Meta Business account. Submit for App
Review requesting `pages_manage_posts` + `pages_read_engagement`, with
Business Verification. Typically 1–3 weeks turnaround and requires a short
screencast demonstrating the posting flow. This is the long pole — worth
starting independently of any specific client signing up for the feature.

### Per-client (repeatable, cheap)

Client (or TWF acting as Page admin on their behalf) adds the TWF Meta App to
their Facebook Page via Business Manager, generates a long-lived Page access
token, and TWF stores `facebookPageId` + `facebookPageToken` in that site's KV
entry. No re-review needed per client — only a Page-level access grant.

## Testing

Mirrors the existing "post-deploy form smoke test" pattern in `CLAUDE.md`:

1. Publish a test `dailySpecial` with `postToFacebook: true` against a real
   TWF-owned test Facebook Page.
2. Confirm the post appears on the Page.
3. Confirm `postToFacebook` flips back to `false` and `lastPostedAt` is set in
   Studio.
4. Temporarily invalidate the stored token and confirm the failure-email path
   fires correctly, then restore the valid token.

## Documentation follow-up

- Add this capability to `docs/features.md` under **Future Consideration** now
  (not yet built/proven). Promote to **Integrated** once built and smoke-tested
  against one real client's Facebook Page.
- Update `~/.claude/skills/web-foundry-onboarding/SKILL.md` with the new
  per-client setup steps (KV fields, second Sanity webhook, Page token
  generation) once built, per the "Keeping the Onboarding Skill Current"
  instruction in `CLAUDE.md`.

## Out of scope (explicitly)

- No display of the special on the client's own website — Facebook-only
  output for this feature.
- No daily cron/scheduled posting — publish-triggered only.
- No support for posting to Instagram, X, or other platforms.
- No per-post scheduling (post-for-later) — publishing the doc *is* the send
  action.
