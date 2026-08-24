# Authentication & Authorization Policy for AI Agents

## Public Resources (No Auth Required)
All informational and discovery resources of Andicas Bioparque & Eco-Resort are public and free to access without authentication:
- `GET /llms.txt` — Concise summary for LLM agents.
- `GET /llms-full.txt` — Full knowledge document.
- `GET /.well-known/mcp/server-card.json` — MCP Server Card definition.
- `GET /.well-known/agent-skills/index.json` — Agent Skills registry.
- `GET /api-catalog.json` — API catalog.
- `POST /api/ai/chat` — Live conversational concierge API.

## Administrative Endpoints (Auth Required)
- Internal dashboard operations (`/api/bookings/admin/*`) require administrative bearer token / `x-admin-key` authentication and are strictly private.
