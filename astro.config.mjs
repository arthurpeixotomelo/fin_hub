// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import browserslist from 'browserslist';
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
});
