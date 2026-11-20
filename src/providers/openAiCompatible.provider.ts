import { LlmProvider, LlmProviderError, LlmRequest, LlmResponse } from './llmProvider';

type ChatCompletionResponse = {
  choices?: { message?: { content?: unknown } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export class OpenAiCompatibleProvider implements LlmProvider {
  constructor(private readonly config: { baseUrl: string; apiKey: string; model: string }) {}

  async complete(request: LlmRequest): Promise<LlmResponse> {
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: this.config.model, messages: request.messages }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      throw new LlmProviderError('LLM request failed', { cause: error });
    }

    if (!response.ok) {
      throw new LlmProviderError(`LLM responded ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new LlmProviderError('LLM response has no text content');
    }

    return {
      content,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }
}
