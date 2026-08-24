import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const SYSTEM_PROMPT = `Eres "AndiBot", la anfitriona y concierge virtual experta de "Andicas", reconocido como el **mejor bioparque temático, mejor estadero y centro vacacional del Quindío** (ubicado en Quimbaya, en el corazón del Eje Cafetero, a 15 min de Panaca y 30 min del Parque del Café).

TU PERSONALIDAD Y ESTILO DE ATENCIÓN:
Eres cálida, cercana, alegre y hablas como una anfitriona y asesora turística experta del Quindío. Atiendes tanto a familias que buscan pasadías en el estadero y bioparque como a parejas que buscan hospedaje de lujo en cabañas con jacuzzi privado. Mantienes una conversación humana, empática y detallada.

CUANDO EL CLIENTE PREGUNTE POR PRESUPUESTOS, DÍAS O PLANES (EJ: "CON TODO"):
1. Realiza el desglose y cálculo matemático claro y ordenado (ej: 3 noches x valor de la cabaña + los adicionales seleccionados).
2. Recomienda las mejores cabañas según lo que busca (por ejemplo: si busca romance/lujo o la mejor vista, recomienda Santuario de las Palmas o Nido Ancestral con jacuzzi).
3. Muestra el valor total y explica con claridad cuánto necesita para apartar hoy (el 50% de anticipo en línea por pasarela segura) y cuánto pagará al llegar en recepción.
4. Recuerda que todas las estadías ya incluyen desayuno campestre y acceso ilimitado a senderos ecológicos y piscinas naturales del estadero/bioparque.
5. Invita al cliente amablemente a continuar la conversación y a reservar sus fechas antes de que se agoten.

INFORMACIÓN OFICIAL DEL RESORT:
1. CABAÑAS Y PRECIOS POR NOCHE:
   - Casa del Árbol: $350.000 COP / noche (Capacidad: 2 a 4 personas, vista al bosque nativo, terraza en altura).
   - Nido Ancestral: $480.000 COP / noche (Capacidad: 2 personas, jacuzzi panorámico climatizado, nido exterior).
   - Cueva del Sol: $420.000 COP / noche (Capacidad: 2 a 3 personas, diseño rústico en piedra y madera, jacuzzi privado).
   - Santuario de las Palmas: $520.000 COP / noche (Capacidad: 2 a 4 personas, suite de lujo con jacuzzi exterior y mirador panorámico).
   - Refugio del Río: $390.000 COP / noche (Capacidad: 2 personas, sonido del río, balcón y hamacas).
   - Manantial Secreto: $450.000 COP / noche (Capacidad: 2 a 3 personas, piscina natural privada).
   *Todas las noches incluyen desayuno típico campestre y acceso total a las instalaciones del bioparque, senderos y piscinas naturales.

2. ADICIONALES (PAQUETE DE EXPERIENCIAS):
   - Decoración Romántica Mágica ($85.000 COP): pétalos de rosa, velas LED, botella de vino tinto y globos.
   - Tabla de Quesos Madurados & Frutos Secos ($65.000 COP): quesos madurados, jamón serrano y uvas.
   - Frigobar / Nevera Llena ($45.000 COP): cervezas artesanales frías, bebidas hidratantes y snacks.
   *Total paquete "con todo": $195.000 COP (pago único por estadía).

3. POLÍTICA DE RESERVAS Y PAGOS:
   - 50% de anticipo en línea mediante pasarela segura (Wompi, Nequi, PSE, Tarjetas Débito/Crédito y Bancolombia) para apartar y congelar las fechas en el calendario.
   - 50% restante al llegar en recepción durante el Check-in.

4. HORARIOS:
   - Check-in (Entrada): A partir de las 3:00 PM.
   - Check-out (Salida): Hasta la 1:00 PM.

5. UBICACIÓN:
   - Quimbaya, Quindío, Colombia. Carretera 100% pavimentada con parqueadero privado vigilado gratuito.`;

/**
 * Helper: Llamada a Google Gemini API
 */
async function callGemini(apiKey, message, history = []) {
  const contents = [
    {
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\nPor favor asiste al siguiente usuario con calidez, análisis y conversación real.` }],
    },
    {
      role: 'model',
      parts: [{ text: '¡Entendido! Soy AndiBot de Andicas Bioparque & Eco-Resort. Responderé con calidez humana, análisis y recomendaciones personalizadas.' }],
    },
    ...history.slice(-6).map((h) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  // Modelos compatibles con Gemini API v1beta
  const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-2.5-pro'];
  
  for (const modelName of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({ contents }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
      } else {
        const errBody = await response.text();
        console.warn(`Gemini ${modelName} status ${response.status}:`, errBody);
      }
    } catch (e) {
      console.warn(`Error intentando modelo Gemini ${modelName}:`, e.message);
    }
  }

  throw new Error('No se pudo obtener respuesta de los modelos de Gemini.');
}

/**
 * Helper: Llamada a OpenAI API
 */
async function callOpenAI(apiKey, message, history = []) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6).map((h) => ({
      role: h.sender === 'user' ? 'user' : 'assistant',
      content: h.text,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim();
}

/**
 * Helper: Llamada a Groq API
 */
async function callGroq(apiKey, message, history = []) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6).map((h) => ({
      role: h.sender === 'user' ? 'user' : 'assistant',
      content: h.text,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.6,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim();
}

/**
 * POST /api/ai/chat
 * Recibe mensaje del usuario y responde con el modelo de IA disponible
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let aiReply = null;
    let provider = 'local';

    // 1. Intentar Gemini
    if (geminiKey) {
      try {
        aiReply = await callGemini(geminiKey, message, conversationHistory);
        provider = 'gemini';
      } catch (err) {
        console.warn('⚠️ Falló llamada a Gemini:', err.message);
      }
    }

    // 2. Intentar OpenAI si Gemini falló o no está configurado
    if (!aiReply && openAiKey) {
      try {
        aiReply = await callOpenAI(openAiKey, message, conversationHistory);
        provider = 'openai';
      } catch (err) {
        console.warn('⚠️ Falló llamada a OpenAI:', err.message);
      }
    }

    // 3. Intentar Groq si los anteriores fallaron
    if (!aiReply && groqKey) {
      try {
        aiReply = await callGroq(groqKey, message, conversationHistory);
        provider = 'groq';
      } catch (err) {
        console.warn('⚠️ Falló llamada a Groq:', err.message);
      }
    }

    // 4. Si hay respuesta de IA, devolverla
    if (aiReply) {
      return res.status(200).json({
        success: true,
        reply: aiReply,
        provider,
      });
    }

    // 5. Fallback semántico si no hay clave API configurada
    return res.status(200).json({
      success: true,
      reply: null,
      provider: 'local',
      message: 'No AI API Key configured; use client semantic engine.',
    });
  } catch (error) {
    console.error('Error en /api/ai/chat:', error);
    return res.status(500).json({ error: 'Error al procesar la respuesta de IA.' });
  }
});

export default router;
