import express from 'express';
import { env } from './config/env';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(env.port, () => {
  console.log(`carrier-tms-agent listening on port ${env.port} (${env.nodeEnv})`);
});
