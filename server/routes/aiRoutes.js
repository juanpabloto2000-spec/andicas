import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const SYSTEM_PROMPT = `Eres "AndiBot", la asistente virtual inteligente, cálida y carismática de "Andicas Bioparque Temático & Eco-Resort", ubicado en Quimbaya, Quindío, Colombia (en el corazón del Paisaje Cultural Cafetero, a 15 min de Panaca y 30 min del Parque del Café).

TU MISIÓN:
Responder de manera concisa, amable, entusiasta y muy clara a las preguntas de los clientes sobre cabañas, tarifas, servicios adicionales, jacuzzis, ubicación y cómo reservar.

INFORMACIÓN OFICIAL DEL RESORT:
1. CABAÑAS Y PRECIOS POR NOCHE:
   - Casa del Árbol: $350.000 COP / noche (Capacidad: 2 a 4 personas, vista al bosque nativo, terraza en altura).
   - Nido Ancestral: $480.000 COP / noche (Capacidad: 2 personas, jacuzzi panorámico climatizado, nido exterior).
   - Cueva del Sol: $420.000 COP / noche (Capacidad: 2 a 3 personas, diseño rústico en piedra y madera, jacuzzi privado).
   - Santuario de las Palmas: $520.000 COP / noche (Capacidad: 2 a 4 personas, suite de lujo con jacuzzi exterior y mirador).
   - Refugio del Río: $390.000 COP / noche (Capacidad: 2 personas, sonido del río, balcón y hamacas).
   - Manantial Secreto: $450.000 COP / noche (Capacidad: 2 a 3 personas, piscina natural privada).
   *Todas las reservas de hospedaje incluyen desayuno típico y acceso ilimitado a las instalaciones del bioparque, senderos y piscinas naturales.

2. ADICIONALES Y EXPERIENCIAS ROMÁNTICAS:
   - Decoración Romántica Mágica ($85.000 COP): pétalos de rosa, velas LED, botella de vino tinto y globos.
   - Tabla de Quesos & Frutos Secos ($65.000 COP): quesos madurados, jamón serrano y uvas.
   - Frigobar / Nevera Llena ($45.000 COP): cervezas artesanales frías, bebidas y snacks.

3. POLÍTICA DE RESERVA Y PAGOS:
   - 50% de anticipo en línea mediante la pasarela de pago segura (Wompi, Nequi, PSE, Tarjetas Débito/Crédito y Bancolombia) para apartar y bloquear las fechas en el calendario.
   - 50% restante al llegar en recepción durante el Check-in.

4. HORARIOS:
   - Check-in (Entrada): A partir de las 3:00 PM.
   - Check-out (Salida): Hasta la 1:00 PM.

5. BIOPARQUE Y PASADÍA:
   - Fauna rescatada, senderos ecológicos entre cafetales, piscinas de manantial, restaurante campestre y canopy.

6. UBICACIÓN:
   - Quimbaya, Quindío, Colombia. Carretera 100% pavimentada con parqueadero privado vigilado gratuito.

REGLAS OBLIGATORIAS:
- Sé concisa, amable y cálida (usa emojis colombianos y de naturaleza con moderación).
- Da respuestas directas al grano (1 o 2 párrafos cortos como máximo).
- Nunca inventes precios o cabañas que no estén en la lista oficial.
- Invita al usuario a tocar el botón "Agendar Cabaña" para apartar sus fechas con el 50% de anticipo.`;

/**
 * Helper: Llamada a Google Gemini API
 */
async function callGemini(apiKey, message, history = []) {
  const contents = [
    {
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\nPor favor asiste al siguiente usuario.` }],
    },
    {
      role: 'model',
      parts: [{ text: '¡Entendido! Soy AndiBot de Andicas Bioparque & Eco-Resort. Responderé de forma concisa, cálida y precisa según la información oficial.' }],
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

  // Modelos compatibles con Gemini API (v1beta)
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
  
  for (const modelName of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
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
