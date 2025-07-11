import { Hono } from 'hono';
import uploadRoute from './routes/upload';
// import progressRoute from './routes/progress';

export const app = new Hono().basePath('/api');
app.route('/upload', uploadRoute);
// app.route('/progress', progressRoute);