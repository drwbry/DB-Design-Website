# Site post auto-publish (Facebook + on-site display) — design

**Date:** 2026-07-09 (revised 2026-07-10)
**Status:** Proposed

## Revision note

Originally scoped as "publish in Sanity → post to Facebook" only. That version
was rejected mid-design: with no on-site benefit and a manual trigger either
way, there was no real reason for a business to use Sanity instead of just
posting to Facebook directly. Revised to also drive an on-site display section
from the same entry (single source of truth) and to run on a schedule instead
of a manual per-publish checkbox (genuine "set it and forget it" automation).
See the brainstorming discussion for the full reasoning.

## Problem

TWF's customer prospecting document promises: "Want your daily specials to
auto-post to Facebook? We can do that too." This capability doesn't exist yet.
It needs to be built as a **generic, reusable factory feature** — no specific
client is waiting on it, but it should be cheap to turn on for whichever future
clients want it.

The content isn't always a "daily special" — it could be a weekly special, a
one-off announcement, holiday hours, anything a client wants to push out on a
schedule. The client controls the title per post; nothing is hardcoded.

## Rejected alternatives

- **Zapier/Make as the Facebook connector** — faster to stand up per client
  (their Meta App Review is already done), but adds a recurring per-client
  subscription cost. Doesn't fit TWF's low-cost, custom-build positioning.
- **Third-party social schedulers (Buffer/Hootsuite)** — same recurring-cost
  tradeoff as Zapier, plus another vendor dependency.
- **Facebook-only, publish-triggered (original design)** — rejected because it
  added a step (learn Sanity's post UI) without removing one (still a manual
  action, still only reaches one channel) — see Revision note above.

**Decision:** build directly on the Meta Graph API, reused across all clients
via the existing shared Cloudflare Worker + KV pattern. Drive both an on-site
display section and the optional Facebook post from one client-entered post,
on a date the client schedules in advance.

## Data model (Sanity)

New reusable document type `sitePost`. Added to a client's Studio schema at
fork time if they want on-site "current post" display, Facebook auto-post, or
both — not every client gets this type.

| Field | Type | Notes |
|---|---|---|
| `title` | string | required — client-controlled label, e.g. "Today's Special", "Weekly Special", "Holiday Hours", "Announcement". Never hardcoded in the template. |
| `caption` | text | required — the body copy |
| `image` | image | optional — if present, the Facebook post goes out as a photo; if absent, plain text |
| `showOnDate` | date | required — the date this post becomes active |
| `processedAt` | datetime | read-only, set by the Worker once this post has been handled (site rebuild triggered, and Facebook post sent if configured) |

There is no manual "post now" checkbox in this design — scheduling *is* the
trigger. A client who wants something live today just sets `showOnDate` to
today; it goes out at that site's next configured check (see below), same day.

## Unified trigger (Cron Trigger on the shared Worker)

A single mechanism drives both outputs together, so a client only has to think
about one thing: "what date does this go live."

- **New Cloudflare Cron Trigger**, added to the existing shared Worker,
  firing **hourly** (`wrangler.toml` `[triggers] crons`, plus a `scheduled()`
  handler in `worker/index.js` alongside the existing `fetch()` handler).
- On each hourly tick, for every site in `WEB_FOUNDRY_SITES` KV that has the
  base fields configured (see Credential storage) **and** whose
  `sitePostCheckHour` matches the current hour (Eastern time — see
  Assumptions):
  1. GROQ-query that site's own Sanity project:
     `*[_type == "sitePost" && showOnDate <= now() && !defined(processedAt)] | order(showOnDate desc)[0]`
  2. If nothing matches: no-op for that site this tick. This is what keeps a
     client who only schedules one post a week down to roughly one
     rebuild/post a week, not a forced daily action — the trigger is "is
     something newly due," not "has a day passed."
  3. If a post matches:
     - Always call that site's `coolifyRebuildWebhookUrl` (the same webhook
       URL Sanity's existing publish-triggered rebuild already uses) so the
       on-site display picks it up on the next build.
     - If `facebookPageId` + `facebookPageToken` are present in that site's
       KV entry, also post to Facebook (Graph API — photo endpoint if `image`
       is set, feed endpoint otherwise; message text is `${title}\n\n${caption}`).
     - On success: patch `processedAt` back onto the Sanity doc via the HTTP
       mutate API (write-scoped token).
     - On Facebook-post failure specifically: email TWF's internal inbox via
       the existing Resend integration with client name + error detail. The
       rebuild and `processedAt` patch still happen independent of whether the
       Facebook leg succeeded, so a bad Facebook token doesn't block the site
       display from updating.

## On-site display

At Astro build time (same pattern already used for the bakery menu PDF,
plumber hours, and salon gallery — `src/lib/sanityClient.ts`, `useCdn: false`,
no new runtime/CORS pattern introduced), the client's page queries:

```groq
*[_type == "sitePost" && showOnDate <= now()] | order(showOnDate desc)[0]
```

and renders a section using that post's own `title` as the heading, plus
`caption` and `image` if present. Nothing renders if no post is currently due.
This is independent of whether Facebook is configured for that site — roughly
half of TWF's clients don't use Facebook at all but can still use on-site
display alone (the cron still triggers rebuilds on newly-due posts; it just
skips the Graph API call if Facebook fields aren't in that site's KV).

## Credential storage

All fields are **optional** additions to each site's existing entry in the
`WEB_FOUNDRY_SITES` KV namespace — no new namespace, consistent with how
`toEmail`/`brandColor`/etc. already work.

**Base (required for any site using scheduling and/or on-site display):**

| Field | Notes |
|---|---|
| `sanityProjectId` | That client's own Sanity project ID (each client has an isolated project — see `web-foundry-onboarding` SKILL.md) |
| `sanityWriteToken` | Editor-permission API token created in that client's own Sanity project, used to patch `processedAt` back |
| `coolifyRebuildWebhookUrl` | The same rebuild-webhook URL already configured for that client's existing Sanity-publish trigger |
| `sitePostCheckHour` | Integer 0–23 (Eastern time) — the hour this site's cron check runs |

**Add-on (only if the client also wants Facebook posting):**

| Field | Notes |
|---|---|
| `facebookPageId` | Numeric Facebook Page ID |
| `facebookPageToken` | Long-lived Page access token |

## Meta setup

### One-time (TWF-side, not per client)

Create a single Meta App under TWF's Meta Business account. Submit for App
Review requesting `pages_manage_posts` + `pages_read_engagement`, with
Business Verification. Typically 1–3 weeks turnaround and requires a short
screencast demonstrating the posting flow. Not required to test against a
Page TWF itself administers (Development Mode covers that) — only required
before posting to a real client's Page that TWF doesn't personally admin.
Worth starting independently of any specific client signing up.

### Per-client (repeatable, cheap)

Client (or TWF acting as Page admin on their behalf) adds the TWF Meta App to
their Facebook Page via Business Manager, generates a long-lived Page access
token, and TWF stores `facebookPageId` + `facebookPageToken` in that site's KV
entry. No re-review needed per client — only a Page-level access grant.

## Assumptions / limitations

- **Timezone is hardcoded to Eastern (America/New_York)** for the cron-hour
  comparison. Fine for Cincinnati and the planned Brown County, IN expansion
  (both Eastern); would need a per-site timezone field if TWF expands to
  another timezone later.
- **No manual "post now" override** — setting `showOnDate` to today and
  waiting for that site's next hourly check (same day) is the only path.
  Simpler than maintaining two trigger mechanisms; revisit if a client
  specifically needs sub-hour urgency.
- **Facebook-post failures don't block the on-site rebuild** — a client with
  both features enabled still gets their site updated even if their Facebook
  token has expired; only the Facebook leg fails and alerts TWF.

## Testing

Mirrors the existing "post-deploy form smoke test" pattern in `CLAUDE.md`:

1. Seed a test site's KV entry with real `sanityProjectId`, `sanityWriteToken`,
   `coolifyRebuildWebhookUrl`, and a `sitePostCheckHour` set to the next
   upcoming hour.
2. Publish a test `sitePost` with `showOnDate` set to today, no Facebook
   fields configured yet.
3. At the configured hour, confirm the Coolify rebuild fires and the site
   shows the new post's `title`/`caption`/`image`, and `processedAt` gets set.
4. Add `facebookPageId` + `facebookPageToken` (real, TWF-owned test Page),
   publish a second test post, confirm it posts to Facebook at the configured
   hour.
5. Temporarily invalidate the Facebook token, publish a third test post,
   confirm the failure email fires **and** the site still rebuilds correctly
   (proving the two legs are decoupled).

## Documentation follow-up

- Add this capability to `docs/features.md` under **Future Consideration** now
  (not yet built/proven). Promote to **Integrated** once built and smoke-tested
  against one real client.
- Update `~/.claude/skills/web-foundry-onboarding/SKILL.md` with the new
  per-client setup steps (KV fields, Cron Trigger behavior, Page token
  generation, on-site display section) once built, per the "Keeping the
  Onboarding Skill Current" instruction in `CLAUDE.md`.

## Out of scope (explicitly)

- No support for posting to Instagram, X, or other platforms — Facebook only.
- No manual "post now" override (see Assumptions).
- No per-site timezone configuration (see Assumptions) — Eastern only for now.
- No display customization beyond title/caption/image — no rich text, no
  multiple simultaneous posts shown at once (always exactly the single latest
  due post).
