export type LlmToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type LlmToolCall = {
  id: string;
  name: string;
  // null when the model produced arguments that are not a valid JSON object
  arguments: Record<string, unknown> | null;
};

export type LlmMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: LlmToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string };

export type LlmUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type LlmRequest = {
  messages: LlmMessage[];
  tools?: LlmToolDefinition[];
};

export type LlmResponse = {
  content: string;
  toolCalls: LlmToolCall[];
  usage: LlmUsage;
};

export interface LlmProvider {
  complete(request: LlmRequest): Promise<LlmResponse>;
}

export class LlmProviderError extends Error {}
