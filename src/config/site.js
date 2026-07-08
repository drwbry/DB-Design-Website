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
