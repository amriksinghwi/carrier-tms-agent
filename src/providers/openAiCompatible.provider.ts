import { LlmProvider, LlmProviderError, LlmRequest, LlmResponse, LlmToolCall } from './llmProvider';

type ChatCompletionResponse = {
  choices?: {
    message?: {
      content?: unknown;
      tool_calls?: { id?: string; function?: { name?: string; arguments?: string } }[];
    };
  }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export class OpenAiCompatibleProvider implements LlmProvider {
  constructor(private readonly config: { baseUrl: string; apiKey: string; model: string }) {}

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const body = {
      model: this.config.model,
      messages: request.messages.map((message) => {
        if (message.role === 'tool') {
          return { role: 'tool', tool_call_id: message.toolCallId, content: message.content };
        }
        if (message.role === 'assistant' && message.toolCalls?.length) {
          return {
            role: 'assistant',
            content: message.content || null,
            tool_calls: message.toolCalls.map((call) => ({
              id: call.id,
              type: 'function',
              function: { name: call.name, arguments: JSON.stringify(call.arguments ?? {}) },
            })),
          };
        }
        return { role: message.role, content: message.content };
      }),
      tools: request.tools?.length
        ? request.tools.map((tool) => ({ type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.inputSchema } }))
        : undefined,
    };

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      throw new LlmProviderError('LLM request failed', { cause: error });
    }

    if (!response.ok) {
      throw new LlmProviderError(`LLM responded ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const message = data.choices?.[0]?.message;
    const content = typeof message?.content === 'string' ? message.content : '';

    const toolCalls: LlmToolCall[] = (message?.tool_calls ?? []).map((call, index) => {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(call.function?.arguments || '{}');
      } catch {
        parsed = null;
      }
      return {
        id: call.id ?? `call_${index}`,
        name: call.function?.name ?? '',
        arguments: parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null,
      };
    });

    if (!content && !toolCalls.length) {
      throw new LlmProviderError('LLM response has no text content and no tool calls');
    }

    return {
      content,
      toolCalls,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }
}
