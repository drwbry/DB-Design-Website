// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './src/config/site.js';

export default defineConfig({
  output: 'static',
  site: siteConfig.domain,
  integrations: [sitemap()],
});
