import { LlmToolDefinition } from '../providers/llmProvider';
import { ToolExecutor, ToolResult } from './toolExecutor';

type CatalogResponse = {
  response?: {
    version?: string;
    tools?: { name: string; description: string; input_schema: Record<string, unknown> }[];
  };
};

let cachedCatalog: { version: string; tools: LlmToolDefinition[] } | null = null;

// Runs tools in the TMS backend on behalf of one user message. The turn token identifies the user to the backend.
export class BackendToolExecutor implements ToolExecutor {
  constructor(private readonly turn: { baseUrl: string; turnToken: string; allowedTools: string[]; catalogVersion: string }) {}

  async listTools(): Promise<LlmToolDefinition[]> {
    if (!this.turn.allowedTools.length) {
      return [];
    }
    if (cachedCatalog?.version !== this.turn.catalogVersion) {
      const response = await fetch(`${this.turn.baseUrl}/api/agent-tools/catalog`, {
        headers: { Authorization: `Bearer ${this.turn.turnToken}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        throw new Error(`Tool catalog request failed with status ${response.status}`);
      }
      const catalog = ((await response.json()) as CatalogResponse).response;
      if (!catalog?.version || !Array.isArray(catalog.tools)) {
        throw new Error('Tool catalog response is malformed');
      }
      cachedCatalog = {
        version: catalog.version,
        tools: catalog.tools.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.input_schema })),
      };
    }
    return cachedCatalog.tools.filter((tool) => this.turn.allowedTools.includes(tool.name));
  }

  async runTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const response = await fetch(`${this.turn.baseUrl}/api/agent-tools/${encodeURIComponent(name)}/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.turn.turnToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ arguments: args }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await response.json().catch(() => null)) as { message?: unknown; response?: unknown } | null;
    if (!response.ok) {
      return { ok: false, error: typeof body?.message === 'string' ? body.message : `The tool failed with status ${response.status}` };
    }
    return { ok: true, data: body?.response ?? null };
  }
}
