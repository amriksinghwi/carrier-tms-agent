import { Request, Response } from 'express';
import { llmProvider } from '../providers';

export async function chat(req: Request, res: Response) {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message || message.length > 4000) {
    res.status(400).json({ code: 'INVALID_MESSAGE', message: 'Message is required and must be at most 4000 characters.' });
    return;
  }

  try {
    const result = await llmProvider.complete({ messages: [{ role: 'user', content: message }] });
    res.json({ answer: result.content, usage: result.usage });
  } catch (error) {
    console.error('chat failed', error);
    res.status(502).json({ code: 'ASSISTANT_UNAVAILABLE', message: 'The assistant is unavailable right now. Please try again.' });
  }
}
