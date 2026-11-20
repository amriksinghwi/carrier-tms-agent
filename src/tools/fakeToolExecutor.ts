import { LlmToolDefinition } from '../providers/llmProvider';
import { ToolExecutor, ToolResult } from './toolExecutor';

// Temporary stand-in until the backend agent-tools API exists. Returns fixed data.
export class FakeToolExecutor implements ToolExecutor {
  async listTools(): Promise<LlmToolDefinition[]> {
    return [
      {
        name: 'getLoadSummary',
        description: 'Summary of one load: status, customer, pickup and delivery stops with appointment times, and the assigned driver and truck if any.',
        inputSchema: {
          type: 'object',
          properties: { loadId: { type: 'integer', description: 'The numeric load id.' } },
          required: ['loadId'],
          additionalProperties: false,
        },
      },
    ];
  }

  async runTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    if (name !== 'getLoadSummary') {
      return { ok: false, error: `Unknown tool: ${name}` };
    }
    if (!Number.isInteger(args.loadId)) {
      return { ok: false, error: 'loadId must be an integer' };
    }
    if (args.loadId !== 4521) {
      return { ok: false, error: `Load ${args.loadId} not found` };
    }
    return {
      ok: true,
      data: {
        loadId: 4521,
        status: 'BOOKED',
        customer: 'Acme Foods (FAKE DATA)',
        pickup: { city: 'Dallas, TX', appointmentLocal: '2026-11-23 08:00', timezone: 'America/Chicago' },
        delivery: { city: 'Atlanta, GA', appointmentLocal: '2026-11-24 14:00', timezone: 'America/New_York' },
        loadedMiles: 781,
        assignedDriver: null,
        assignedTruck: null,
      },
    };
  }
}
