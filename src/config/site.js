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
        // TODO(dreux): Stripe TEST-mode Payment Link, "Peak Flow Plumbing — Invoice
        // Payment": customer chooses amount + custom text field "Invoice #".
        // Until this is set, the Pay Your Invoice section and its nav entry are omitted.
        stripePaymentLink: 'REPLACE_ME',
      },
    },
    salon: {
      siteId: 'demo-salon',
      name: 'Lumiere Salon & Spa',
      formSubjects: {
        contact: 'New Inquiry - Lumiere Salon & Spa',
      },
      integrations: {
        // TODO(dreux): Calendly scheduling URL. NOTE this is the single free-tier
        // event type, shared with MAB Properties (clients/mabassets-website).
        // Renaming the event is fine; changing its URL slug breaks MAB's /rentals.
        // Until this is set, the Calendly column is omitted and #book stays single-column.
        calendlyUrl: 'REPLACE_ME',
      },
    },
  },
};
