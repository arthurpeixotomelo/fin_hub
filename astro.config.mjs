import node from '@astrojs/node';
import react from '@astrojs/react';
import browserslist from 'browserslist';
// import oxlintPlugin from 'vite-plugin-oxlint';
import { browserslistToTargets } from 'lightningcss';
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: 'standalone',
    // experimentalStaticHeaders: true
  }),
  // build: {
  //   cssMinify: 'lightningcss',
  // },
  // experimental: {
  //   csp: true
  // },
  // plugins: [
  //   oxlintPlugin()
  // ],
  integrations: [react()],
  vite: {
      css: {
          transformer: 'lightningcss',
          lightningcss: {
              targets: browserslistToTargets(browserslist('>= 1.5%')),
          }
      },
      build: {
        cssMinify: 'lightningcss',
      }
  },
  env: {
    schema: {
      DATABRICKS_HOST: envField.string({
        context: 'server', access: 'public', url: true
      }),
      DATABRICKS_TOKEN: envField.string({
        context: 'server', access: 'secret'
      }),
      DATABRICKS_CLUSTER_ID: envField.string({
        context: 'server', access: 'secret'
      }),
    }
  }
});