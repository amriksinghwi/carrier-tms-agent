import { ToolExecutor } from './toolExecutor';

// No tools yet. Replaced by the backend agent-tools client once that API exists.
export const toolExecutor: ToolExecutor = {
  listTools: async () => [],
  runTool: async (name) => ({ ok: false, error: `Unknown tool: ${name}` }),
};
