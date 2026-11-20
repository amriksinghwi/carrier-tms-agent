import { env } from '../config/env';
import { LlmProvider } from './llmProvider';
import { OpenAiCompatibleProvider } from './openAiCompatible.provider';

function createProvider(): LlmProvider {
  switch (env.llm.provider) {
    case 'openai-compatible':
      return new OpenAiCompatibleProvider({ baseUrl: env.llm.baseUrl, apiKey: env.llm.apiKey, model: env.llm.model });
    default:
      throw new Error(`LLM_PROVIDER "${env.llm.provider}" is not supported`);
  }
}

export const llmProvider = createProvider();
