import { LlmToolDefinition } from '../providers/llmProvider';

export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string };

export interface ToolExecutor {
  listTools(): Promise<LlmToolDefinition[]>;
  runTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
}
