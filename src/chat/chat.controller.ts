import { Request, Response } from 'express';
import { runAgentLoop } from '../loop/agentLoop';
import { SUBJECT_PROMPTS } from '../prompts';
import { llmProvider } from '../providers';
import { toolExecutor } from '../tools';

export async function chat(req: Request, res: Response) {
  const subject = typeof req.body?.subject === 'string' ? req.body.subject : '';
  if (!Object.prototype.hasOwnProperty.call(SUBJECT_PROMPTS, subject)) {
    res.status(400).json({ code: 'INVALID_SUBJECT', message: 'Subject is missing or not supported.' });
    return;
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message || message.length > 4000) {
    res.status(400).json({ code: 'INVALID_MESSAGE', message: 'Message is required and must be at most 4000 characters.' });
    return;
  }

  try {
    res.json(await runAgentLoop({ provider: llmProvider, toolExecutor, systemPrompt: SUBJECT_PROMPTS[subject], userMessage: message }));
  } catch (error) {
    console.error('chat failed', error);
    res.status(502).json({ code: 'ASSISTANT_UNAVAILABLE', message: 'The assistant is unavailable right now. Please try again.' });
  }
}
