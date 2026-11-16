import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://atodocontrol.co',
  output: 'server',
  adapter: netlify(),
  integrations: [svelte()],
  trailingSlash: 'never'
});
