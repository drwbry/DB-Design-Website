export const siteConfig = {
  siteId: 'web-foundry-hub',
  name: 'The Web Foundry',
  localeLabel: 'Cincinnati, OH',
  domain: 'https://cincinnatiwebfoundry.com',
  contactEmail: 'hello@cincinnatiwebfoundry.com',
  formWorkerUrl: 'https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev',
  turnstileSiteKey: '0x4AAAAAACxVhhG9sxrzihaS',
  formSubjects: {
    hub: 'New Website Inquiry - The Web Foundry',
  },
  // Real client sites, live in production. Rendered as the #work section on the
  // hub homepage. HUB-ONLY — a client fork inherits this and should delete it,
  // same as the `showcase` block below.
  clients: [
    {
      slug: 'mabassets',
      name: 'MAB Properties',
      industry: 'Property Management',
      domain: 'mabassets.com',
      url: 'https://mabassets.com',
      blurb: 'Rental listings the owner updates herself, plus maintenance tickets and showing scheduling.',
      chips: ['Sanity CMS', 'Service Tickets', 'Showing Scheduler'],
    },
    {
      slug: 'terrys-lawncare',
      name: "Terry's Lawncare",
      industry: 'Lawn & Landscaping',
      domain: 'terryslawncare.us',
      url: 'https://terryslawncare.us',
      blurb: 'Group mowing schedule, service pricing, and reviews — all client-editable.',
      chips: ['Mowing Schedule', 'Sanity CMS', 'Estimate Form'],
    },
    {
      slug: 'itadata',
      name: 'ITA Data Solutions',
      industry: 'SAP Consulting',
      domain: 'itadata.com',
      url: 'https://itadata.com',
      blurb: 'Enterprise B2B site with gated white papers and a discovery-call funnel.',
      chips: ['White Paper Library', 'Sanity CMS', 'Lead Capture'],
    },
  ],
  // Concept/demo builds for invented businesses. HUB-ONLY — a client fork inherits
  // this and should delete it, same as the `clients` block above.
  //
  // These deliberately have NO entry in the WEB_FOUNDRY_SITES KV namespace. The
  // Worker's fallback path then brands demo confirmation emails as The Web Foundry
  // and appends the Foundry CTA block, which is what we want: a prospect who tests
  // a demo form gets a Foundry sales touch. Do not "fix" this by adding KV entries.
  //
  // Forking a demo into a client site: lift that demo's `integrations` block up to
  // a top-level `siteConfig.integrations`, the flat shape the client sites use.
  showcase: {
    bakery: {
      siteId: 'demo-bakery',
      name: 'Sweet Crumb Bakery',
      formSubjects: {
        contact: 'New Inquiry - Sweet Crumb Bakery',
        preorder: 'Pre-Order - Sweet Crumb Bakery',
      },
      // No integrations: the pre-order form runs on our own Worker pipeline, with
      // no third-party dependency. See docs/features.md for the ordering ladder.
    },
    plumber: {
      siteId: 'demo-plumber',
      name: 'Peak Flow Plumbing',
      formSubjects: {
        contact: 'New Inquiry - Peak Flow Plumbing',
      },
      integrations: {
        // Stripe SANDBOX (test-mode) Payment Link on the Foundry Solutions LLC
        // account: "Peak Flow Plumbing — Invoice Payment [DEMO ONLY]", customer
        // chooses the amount, with an "Invoice #" custom text field.
        // The `test_` segment in the URL is what makes this safe to expose — no
        // real card is ever charged. A real client's link lives in THEIR Stripe
        // account so money flows to them; never point a live site at this one.
        stripePaymentLink: 'https://buy.stripe.com/test_4gM00i74gfm1a5v6UP5J600',
      },
    },
    salon: {
      siteId: 'demo-salon',
      name: 'Lumiere Salon & Spa',
      formSubjects: {
        contact: 'New Inquiry - Lumiere Salon & Spa',
      },
      integrations: {
        // NOTE this is the single free-tier event type, shared with MAB Properties
        // (clients/mabassets-website/src/config/site.js). Renamed to the neutral
        // "Book Appointment" 2026-08-01 so it reads correctly on both a salon demo
        // and a property-showing page. The `/30min` slug is deliberately unchanged —
        // changing it breaks MAB's /rentals. Free tier shows the account owner's
        // name ("Dreux Brys") as host; removing that needs a paid seat.
        calendlyUrl: 'https://calendly.com/foundrysolutionsllc/30min',
      },
    },
  },
};
