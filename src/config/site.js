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
      // TODO(dreux): after the itadata.com cutover completes, swap `domain` and
      // `url` to itadata.com and re-run `npm run shots`. Do NOT swap early —
      // .com still serves the client's old, pre-Foundry site.
      slug: 'itadata',
      name: 'ITA Data Solutions',
      industry: 'SAP Consulting',
      domain: 'itadata.site',
      url: 'https://itadata.site',
      blurb: 'Enterprise B2B site with gated white papers and a discovery-call funnel.',
      chips: ['White Paper Library', 'Sanity CMS', 'Lead Capture'],
    },
  ],
  showcase: {
    bakery: {
      siteId: 'demo-bakery',
      name: 'Sweet Crumb Bakery',
      formSubject: 'New Inquiry - Sweet Crumb Bakery',
    },
    plumber: {
      siteId: 'demo-plumber',
      name: 'Peak Flow Plumbing',
      formSubject: 'New Inquiry - Peak Flow Plumbing',
    },
    salon: {
      siteId: 'demo-salon',
      name: 'Lumiere Salon & Spa',
      formSubject: 'New Inquiry - Lumiere Salon & Spa',
    },
  },
};
