import node from '@astrojs/node';
import react from '@astrojs/react';
import browserslist from 'browserslist';
import { defineConfig } from 'astro/config';
import { browserslistToTargets } from 'lightningcss';

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: 'standalone',
    experimentalStaticHeaders: true
  }),
  build: {
    cssMinify: 'lightningcss',
  },
  // experimental: {
  //   csp: true
  // },
  integrations: [react()],
  vite: {
      css: {
          transformer: 'lightningcss',
          lightningcss: {
              targets: browserslistToTargets(browserslist('>= 1.5%')),
          }
      },
  },
});