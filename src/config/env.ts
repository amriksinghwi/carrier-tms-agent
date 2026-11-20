import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

const port = Number(required('PORT'));
if (!Number.isInteger(port) || port <= 0) {
  throw new Error('PORT is invalid');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  llm: {
    provider: required('LLM_PROVIDER'),
    baseUrl: required('LLM_BASE_URL').replace(/\/+$/, ''),
    apiKey: required('LLM_API_KEY'),
    model: required('LLM_MODEL'),
  },
};
