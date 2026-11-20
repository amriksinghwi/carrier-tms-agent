import express, { NextFunction, Request, Response } from 'express';
import appRoutes from './routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  appRoutes(app);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found.' });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ code: 'INVALID_JSON', message: 'Request body is not valid JSON.' });
      return;
    }
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' });
      return;
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' });
  });

  return app;
}
