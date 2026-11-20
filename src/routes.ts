import { Express, Request, Response } from 'express';
import { chat } from './chat/chat.controller';

export default function appRoutes(app: Express) {
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/v1/chat', chat);
}
