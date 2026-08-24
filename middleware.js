/**
 * Vercel Edge Middleware para Negociación de Contenido Markdown (Content Negotiation for Agents)
 * Cumple con el estándar de Cloudflare / isitagentready.com
 */
export default async function middleware(request) {
  const accept = request.headers.get('accept') || '';
  const url = new URL(request.url);

  // Si un Agente IA solicita contenido en Markdown (Accept: text/markdown)
  if (url.pathname === '/' && (accept.includes('text/markdown') || accept.includes('text/x-markdown'))) {
    const markdownUrl = new URL('/llms-full.txt', request.url);
    const res = await fetch(markdownUrl);
    const markdownContent = await res.text();

    return new Response(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept',
        'Link': '</llms.txt>; rel="alternate"; type="text/markdown", </.well-known/mcp/server-card.json>; rel="mcp-server-card", </.well-known/agent-skills/index.json>; rel="agent-skills", </.well-known/agentmap.json>; rel="agentmap", </api-catalog.json>; rel="api-catalog"',
        'Content-Signal': 'ai-train=no, search=yes, ai-input=yes'
      }
    });
  }
}

export const config = {
  matcher: '/',
};
