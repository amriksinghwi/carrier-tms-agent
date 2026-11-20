# carrier-tms-agent

AI planning agent runtime for Carrier TMS.

This service owns the model loop, system prompts, LLM provider adapters and evals. It has no database access. Tool definitions and tool execution live in the TMS backend, and the agent calls them over HTTP.

## Run locally

```
copy .env.example .env
npm install
npm run start:dev
```

Check: `GET http://localhost:4100/health` returns `{"status":"ok"}`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run start:dev` | Run from source with reload |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | Type check without emitting |
| `npm run format` | Format `src/` with Prettier |

## Planned layout

```
src/
  server.ts      HTTP entry
  config/        environment
  loop/          model loop, step limit, retries
  providers/     LlmProvider interface + adapters
  tools/         catalog client + cache, generic tool caller
  prompts/       versioned system prompts
  context/       history trimming
evals/           golden questions, runner
```

Only `server.ts` and `config/` exist so far.
