import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import uploadRoute from './routes/upload';
import progressRoute from './routes/progress';

const app = new Hono();

app.route('/upload', uploadRoute);
app.route('/progress', progressRoute);

app.get('/', (c) => c.text('Hono backend is running 🚀'));

const port = process.env.PORT || 8787;
console.log(`🚀 Hono API running at http://localhost:${port}`);
serve({ fetch: app.fetch, port: Number(port) });