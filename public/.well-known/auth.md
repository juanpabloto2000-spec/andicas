# Authentication & Authorization Policy for AI Agents

## Public Endpoints (No Auth Required)
All informational, catalog and concierge endpoints are open and free:
- `GET /llms.txt` — LLM summary.
- `GET /llms-full.txt` — Comprehensive knowledge base.
- `GET /.well-known/mcp/server-card.json` — Model Context Protocol (MCP) server card.
- `GET /.well-known/agent-skills/index.json` — Agent Skills registry.
- `GET /api-catalog.json` — API catalog.
- `POST /api/ai/chat` — AI conversational concierge.

## Administrative Endpoints
- Dashboard management endpoints (`/api/bookings/admin/*`) require bearer token / `x-admin-key` authentication.
