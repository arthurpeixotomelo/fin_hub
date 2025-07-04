// @ts-check
import node from '@astrojs/node';
import react from '@astrojs/react';
import browserslist from 'browserslist';
import { defineConfig } from 'astro/config';
import { browserslistToTargets } from 'lightningcss';


// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
      css: {
          transformer: 'lightningcss',
          lightningcss: {
              targets: browserslistToTargets(browserslist('>= 1.5%')),
          }
      }
  },
  adapter: node({
    mode: 'standalone',
  }),
});