import { LlmMessage, LlmProvider, LlmUsage } from '../providers/llmProvider';
import { ToolExecutor, ToolResult } from '../tools/toolExecutor';

const MAX_MODEL_CALLS = 6;

export type AgentResult = {
  answer: string;
  stopReason: 'completed' | 'step_limit';
  modelCalls: number;
  toolCalls: { name: string; arguments: Record<string, unknown> | null; ok: boolean }[];
  usage: LlmUsage;
};

export async function runAgentLoop(input: { provider: LlmProvider; toolExecutor: ToolExecutor; systemPrompt: string; userMessage: string }): Promise<AgentResult> {
  const tools = await input.toolExecutor.listTools();
  const messages: LlmMessage[] = [
    {
      role: 'system',
      // Without this note some models invent tool calls when none are offered, which the provider rejects.
      content: tools.length
        ? input.systemPrompt
        : `${input.systemPrompt}\n\nNo tools are available in this conversation. Never attempt to call a tool or function. When the user asks for data, say that you cannot look it up yet.`,
    },
    { role: 'user', content: input.userMessage },
  ];
  const toolCallLog: AgentResult['toolCalls'] = [];
  const usage: LlmUsage = { inputTokens: 0, outputTokens: 0 };

  for (let modelCalls = 1; modelCalls <= MAX_MODEL_CALLS; modelCalls++) {
    const response = await input.provider.complete({ messages, tools });
    usage.inputTokens += response.usage.inputTokens;
    usage.outputTokens += response.usage.outputTokens;

    if (!response.toolCalls.length) {
      return { answer: response.content, stopReason: 'completed', modelCalls, toolCalls: toolCallLog, usage };
    }

    messages.push({ role: 'assistant', content: response.content, toolCalls: response.toolCalls });

    const results = await Promise.all(
      response.toolCalls.map(async (call): Promise<ToolResult> => {
        if (!tools.some((tool) => tool.name === call.name)) {
          return { ok: false, error: `Unknown tool: ${call.name}` };
        }
        if (call.arguments === null) {
          return { ok: false, error: 'Tool arguments were not a valid JSON object' };
        }
        try {
          return await input.toolExecutor.runTool(call.name, call.arguments);
        } catch (error) {
          console.error(`tool ${call.name} failed`, error);
          return { ok: false, error: 'The tool failed to run' };
        }
      })
    );

    response.toolCalls.forEach((call, index) => {
      toolCallLog.push({ name: call.name, arguments: call.arguments, ok: results[index].ok });
      messages.push({ role: 'tool', toolCallId: call.id, content: JSON.stringify(results[index]) });
    });
  }

  return {
    answer: 'I could not complete this request. Please try rephrasing it or asking for less at once.',
    stopReason: 'step_limit',
    modelCalls: MAX_MODEL_CALLS,
    toolCalls: toolCallLog,
    usage,
  };
}
