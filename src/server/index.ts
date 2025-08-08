import { Hono } from 'hono';
import uploadRoute from './routes/upload';
import dbQueryRoute from './routes/dbQuery';
import uploadToDB from './routes/uploadToDB';

export const app = new Hono().basePath('/api');

app.route('/upload', uploadRoute);
app.route('/dbquery', dbQueryRoute);
app.route('/uploadToDB', uploadToDB);

app.get('/', (ctx) => ctx.text('Hono backend is running!'));