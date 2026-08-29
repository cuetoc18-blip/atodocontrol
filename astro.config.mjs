import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://atodocontrol.co',
  output: 'server',
  adapter: netlify(),
  trailingSlash: 'never'
});
