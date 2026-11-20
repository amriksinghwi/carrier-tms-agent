export type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmRequest = {
  messages: LlmMessage[];
};

export type LlmResponse = {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
};

export interface LlmProvider {
  complete(request: LlmRequest): Promise<LlmResponse>;
}

export class LlmProviderError extends Error {}
