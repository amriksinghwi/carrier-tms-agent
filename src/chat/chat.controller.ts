import { Request, Response } from 'express';
import { env } from '../config/env';
import { runAgentLoop } from '../loop/agentLoop';
import { SUBJECT_PROMPTS } from '../prompts';
import { llmProvider } from '../providers';
import { BackendToolExecutor } from '../tools';

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

  const turnToken = typeof req.body?.turn_token === 'string' ? req.body.turn_token : '';
  const toolExecutor = new BackendToolExecutor({
    baseUrl: env.backendBaseUrl,
    turnToken,
    allowedTools: turnToken && Array.isArray(req.body?.allowed_tools) ? req.body.allowed_tools.filter((name: unknown) => typeof name === 'string') : [],
    catalogVersion: typeof req.body?.catalog_version === 'string' ? req.body.catalog_version : '',
  });

  try {
    res.json(await runAgentLoop({ provider: llmProvider, toolExecutor, systemPrompt: SUBJECT_PROMPTS[subject], userMessage: message }));
  } catch (error) {
    console.error('chat failed', error);
    res.status(502).json({ code: 'ASSISTANT_UNAVAILABLE', message: 'The assistant is unavailable right now. Please try again.' });
  }
}
