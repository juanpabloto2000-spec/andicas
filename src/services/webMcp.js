import { cabinsData } from '../data/cabins';

/**
 * Registra herramientas WebMCP para navegadores de Agentes de IA
 * Cumple con el estándar WebMCP (https://webmcp.org)
 */
export function initWebMcp() {
  if (typeof window === 'undefined') return;

  const webMcpTools = [
    {
      name: 'get_cabins_and_prices',
      description: 'Obtiene el listado completo de cabañas de Andicas Eco-Resort con sus precios por noche, capacidades y fotos.',
      inputSchema: {
        type: 'object',
        properties: {
          has_jacuzzi: { type: 'boolean', description: 'Filtrar por cabañas con jacuzzi' }
        }
      },
      execute: async ({ has_jacuzzi } = {}) => {
        let results = cabinsData;
        if (has_jacuzzi) {
          results = results.filter(c => 
            c.name.toLowerCase().includes('palma') || 
            c.name.toLowerCase().includes('nido') || 
            c.name.toLowerCase().includes('cueva')
          );
        }
        return {
          cabins: results.map(c => ({
            id: c.id,
            name: c.name,
            priceCOP: c.price,
            priceFormatted: c.priceFormatted,
            capacity: c.capacity,
            description: c.description
          }))
        };
      },
      annotations: { readOnlyHint: true }
    },
    {
      name: 'calculate_stay_budget',
      description: 'Calcula el presupuesto total en COP para una estadía en Andicas, incluyendo noches, adicionales (paquete romántico) y el 50% de anticipo.',
      inputSchema: {
        type: 'object',
        properties: {
          cabin_name: { type: 'string', description: 'Nombre de la cabaña (ej: Santuario de las Palmas)' },
          nights: { type: 'integer', description: 'Número de noches' },
          include_romantic_pack: { type: 'boolean', description: 'Incluir paquete de $195.000 COP con todo' }
        },
        required: ['nights']
      },
      execute: async ({ cabin_name, nights = 1, include_romantic_pack = false } = {}) => {
        const found = cabinsData.find(c => cabin_name && c.name.toLowerCase().includes(cabin_name.toLowerCase())) || cabinsData[0];
        const nightsCost = found.price * nights;
        const extrasCost = include_romantic_pack ? 195000 : 0;
        const totalCOP = nightsCost + extrasCost;
        const deposit50 = Math.round(totalCOP * 0.5);

        return {
          cabin: found.name,
          nights,
          nightlyRateCOP: found.price,
          accommodationCostCOP: nightsCost,
          extrasCostCOP: extrasCost,
          totalBudgetCOP: totalCOP,
          requiredDeposit50PercentCOP: deposit50,
          balanceDueAtCheckInCOP: totalCOP - deposit50,
          includes: ['Desayuno campestre diario', 'Acceso ilimitado a bioparque y piscinas naturales']
        };
      },
      annotations: { readOnlyHint: true }
    }
  ];

  // Registrar en navigator.modelContext si el navegador lo soporta
  try {
    if ('modelContext' in navigator && navigator.modelContext && typeof navigator.modelContext.registerTool === 'function') {
      webMcpTools.forEach(tool => {
        try {
          navigator.modelContext.registerTool(tool);
        } catch (e) {
          console.debug('WebMCP tool register note:', e.message);
        }
      });
      console.log('🤖 [WebMCP] Herramientas registradas para agentes IA.');
    }
  } catch (err) {
    console.debug('WebMCP initialization note:', err);
  }

  // Exponer también en window.__ANDICAS_AGENT_TOOLS__ para agentes headless
  window.__ANDICAS_AGENT_TOOLS__ = webMcpTools;
}
