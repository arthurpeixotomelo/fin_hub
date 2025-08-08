export const prerender = false;
import type { APIRoute } from 'astro';
import { app } from '../../server/index';

export const ALL: APIRoute = ({ request }) => app.fetch(request);

export type App = typeof app;