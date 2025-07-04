import { Hono } from 'hono';
import { progressStore } from '../utils/progressStore';

const progress = new Hono();

progress.get('/:jobId', (c) => {
  const jobId = c.req.param('jobId');
  const status = progressStore.get(jobId);

  if (!status) {
    return c.json({ error: 'Job not found' }, 404);
  }

  return c.json(status);
});

export default progress;
