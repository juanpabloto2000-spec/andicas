import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Sparkles, X, Send, User, MessageCircle, Calendar, 
  CheckCircle2, Compass, HelpCircle, ArrowRight, Heart
} from 'lucide-react';
import { cabinsData } from '../data/cabins';
import { sendAiChatMessage } from '../services/api';

export default function AiAssistantModal({ isOpen, onClose, onOpenBooking }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! 🌿 Soy **AndiBot**, la asistente virtual de **Andicas Bioparque & Eco-Resort** en Quimbaya, Quindío.\n\n¿En qué puedo ayudarte hoy? Pregúntame sobre cabañas, tarifas, jacuzzis privados, paquetes románticos o cómo reservar con el 50% de anticipo.',
      quickActions: ['cabanas', 'jacuzzis', 'adicionales', 'pagos', 'ubicacion']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const quickQuestions = [
    { label: '🏡 Cabañas y Precios', query: '¿Cuáles son las cabañas disponibles y cuánto cuestan?' },
    { label: '🛁 Jacuzzis Privados', query: '¿Qué cabañas tienen jacuzzi privado?' },
    { label: '🌹 Decoración Romántica', query: '¿Qué adicionales románticos ofrecen para parejas?' },
    { label: '💳 ¿Cómo es el Pago y Anticipo?', query: '¿Cómo funciona el pago del 50% de anticipo?' },
    { label: '📍 ¿Cómo llegar a Andicas?', query: '¿Dónde están ubicados en Quindío?' },
    { label: '⏰ Horarios de Check-in y Check-out', query: '¿A qué hora es el check-in y el check-out?' },
    { label: '🌿 Pasadía en el Bioparque', query: '¿Qué incluye el pasadía en el bioparque?' }
  ];

  const generateBotResponse = (userQuery) => {
    const q = userQuery.toLowerCase();

    // 1. CABAÑAS & PRECIOS
    if (q.includes('cabaña') || q.includes('precio') || q.includes('tarifa') || q.includes('cuanto cuesta') || q.includes('cuánto cuesta') || q.includes('hospedaje') || q.includes('habitacion')) {
      const cabinsList = cabinsData.map(c => `• **${c.name}**: ${c.priceFormatted} / noche (${c.capacity})`).join('\n');
      return {
        text: `En **Andicas Bioparque & Eco-Resort** contamos con experiencias de hospedaje únicas integradas en la naturaleza:\n\n${cabinsList}\n\n✨ *Todas las reservas incluyen acceso libre a senderos ecológicos, avistamiento y piscinas naturales.*\n\nPuedes apartar tu fecha con solo el **50% de anticipo** en línea.`,
        showBookingButton: true
      };
    }

    // 2. JACUZZI
    if (q.includes('jacuzzi') || q.includes('hidromasaje') || q.includes('tina')) {
      return {
        text: `¡Claro que sí! 🛁 Nuestras cabañas con **jacuzzi privado e hidromasaje climatizado** con vista al bosque son:\n\n• **Santuario de las Palmas**: Suite de lujo con jacuzzi exterior y mirador ($520.000 COP / noche).\n• **Nido Ancestral**: Nido elevado con jacuzzi panorámico ($480.000 COP / noche).\n• **Cueva del Sol**: Diseño rústico bioclimático con tina/jacuzzi de hidromasaje ($420.000 COP / noche).\n\n¿Te gustaría agendar una de estas cabañas?`,
        showBookingButton: true
      };
    }

    // 3. ADICIONALES ROMÁNTICOS / EXPERIENCIAS
    if (q.includes('romant') || q.includes('pareja') || q.includes('adicional') || q.includes('rosa') || q.includes('vino') || q.includes('queso') || q.includes('decoraci') || q.includes('aniversario')) {
      return {
        text: `¡Tenemos paquetes especiales para sorprender a tu pareja! 🌹🥂\n\n1. **Decoración Romántica Mágica ($85.000 COP)**:\n   Pétalos de rosa, velas LED aromatizadas, botella de vino tinto y globos.\n\n2. **Tabla de Quesos & Frutos Secos ($65.000 COP)**:\n   Selección de quesos madurados, jamón serrano, frutos secos y uvas.\n\n3. **Frigobar / Nevera Llena ($45.000 COP)**:\n   Cervezas artesanales frías, bebidas hidratantes y snacks.\n\nPuedes agregar cualquiera de estos servicios al momento de hacer tu reserva en la web.`,
        showBookingButton: true
      };
    }

    // 4. POLÍTICA DE PAGO & ANTICIPO
    if (q.includes('pago') || q.includes('anticipo') || q.includes('wompi') || q.includes('nequi') || q.includes('tarjeta') || q.includes('pse') || q.includes('saldo') || q.includes('como pagar')) {
      return {
        text: `Nuestra política de pago es muy cómoda y segura: 💳\n\n1. **50% de Anticipo al Reservar**: Bloquea y aparta tus fechas en el calendario mediante nuestra pasarela en línea (acepta Nequi, Tarjetas Débito/Crédito, PSE y Bancolombia).\n2. **50% Restante al Check-in**: Se cancela directamente en la recepción del Eco-Resort a tu llegada.\n\nRecibirás confirmación inmediata y comprobante por correo electrónico y WhatsApp.`,
        showBookingButton: true
      };
    }

    // 5. UBICACIÓN & CÓMO LLEGAR
    if (q.includes('ubicacion') || q.includes('ubicación') || q.includes('donde estan') || q.includes('dónde están') || q.includes('llegar') || q.includes('quindio') || q.includes('quimbaya') || q.includes('direccion')) {
      return {
        text: `📍 **Ubicación:** Estamos ubicados en **Quimbaya, Quindío**, en el corazón del Paisaje Cultural Cafetero de Colombia.\n\n• A solo **15 minutos de Panaca**.\n• A **30 minutos del Parque del Café**.\n• A **45 minutos de Armenia** y del Aeropuerto El Edén.\n\nEl acceso es por carretera pavimentada y contamos con parqueadero privado vigilado sin costo adicional.`,
        showWhatsAppButton: true
      };
    }

    // 6. HORARIOS CHECK-IN / CHECK-OUT
    if (q.includes('horario') || q.includes('check in') || q.includes('check-in') || q.includes('check out') || q.includes('check-out') || q.includes('hora')) {
      return {
        text: `⏰ **Horarios de Hospedaje:**\n\n• **Check-in (Entrada):** A partir de las **3:00 PM**.\n• **Check-out (Salida):** Hasta la **1:00 PM**.\n\n*Si llegas más temprano, puedes disfrutar del restaurante y de las instalaciones del Bioparque mientras preparamos tu cabaña.*`
      };
    }

    // 7. BIOPARQUE / PASADÍA / ANIMALES
    if (q.includes('pasadia') || q.includes('pasadía') || q.includes('animal') || q.includes('bioparque') || q.includes('parque') || q.includes('actividad') || q.includes('canopy') || q.includes('sendero')) {
      return {
        text: `🌿 **Experiencia Bioparque & Pasadía:**\n\n• Interacción y avistamiento de fauna y animales rescatados.\n• Senderos ecológicos entre cafetales y bosque nativo.\n• Piscinas naturales de agua de manantial.\n• Restaurante con gastronomía típica del Quindío.\n• Circuitos de canopy y mirador fotográfico.\n\n¡Es un plan perfecto tanto para parejas como para familias!`
      };
    }

    // 8. DEFAULT / GENERAL
    return {
      text: `Entiendo tu consulta sobre "${userQuery}". En **Andicas Bioparque & Eco-Resort** te ofrecemos una experiencia inolvidable en el Quindío con cabañas temáticas, jacuzzis privados y conexión con la naturaleza.\n\n¿Deseas revisar disponibilidad de fechas o comunicarte con nuestro equipo humano por WhatsApp?`,
      showBookingButton: true,
      showWhatsAppButton: true
    };
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMessageId = `user-${Date.now()}`;
    const updatedMessages = [
      ...messages,
      { id: userMessageId, sender: 'user', text: query }
    ];

    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      // 1. Intentar llamar al modelo de IA del backend (Gemini / OpenAI / Groq)
      const aiResponse = await sendAiChatMessage(query, updatedMessages);

      if (aiResponse && aiResponse.success && aiResponse.reply) {
        const lowerReply = aiResponse.reply.toLowerCase();
        const hasBookingIntent = lowerReply.includes('reserva') || lowerReply.includes('agendar') || lowerReply.includes('cabaña') || lowerReply.includes('anticipo') || lowerReply.includes('disponib');
        const hasWhatsAppIntent = lowerReply.includes('whatsapp') || lowerReply.includes('asesor') || lowerReply.includes('contacto') || lowerReply.includes('ubicaci');

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: aiResponse.reply,
            showBookingButton: hasBookingIntent,
            showWhatsAppButton: hasWhatsAppIntent
          }
        ]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Fallback a respuesta local:', err);
    }

    // 2. Fallback semántico instantáneo
    setTimeout(() => {
      const botReply = generateBotResponse(query);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply.text,
          showBookingButton: botReply.showBookingButton,
          showWhatsAppButton: botReply.showWhatsAppButton
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-start sm:justify-start p-2 sm:p-6 pointer-events-none">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative z-10 w-full sm:w-[420px] max-h-[85vh] h-[600px] flex flex-col rounded-3xl glass-dark border-2 border-gold-400/60 shadow-2xl overflow-hidden pointer-events-auto bg-[#072425]/95"
      >
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-jade-900 via-jade-800 to-jade-950 border-b border-gold-400/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 flex items-center justify-center filter drop-shadow-md">
              <img 
                src="/chatbot%20logo.png" 
                alt="AndiBot" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-sm font-black text-linen-100 uppercase tracking-wide">
                  AndiBot
                </h3>
                <span className="px-1.5 py-0.2 rounded-full bg-gold-400/20 border border-gold-400/40 text-gold-300 text-[9px] font-fredoka font-semibold">
                  En línea
                </span>
              </div>
              <p className="text-[10px] font-fredoka text-linen-300">
                Asistente Virtual · Andicas Bioparque
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-linen-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips Banner (Legible Typography, No Star Icon) */}
        <div className="px-3 py-2.5 bg-jade-950/90 border-b border-white/10 overflow-x-auto flex items-center gap-2 no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.query)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-gold-500/20 border border-white/15 hover:border-gold-400/50 text-linen-100 hover:text-gold-300 text-xs font-fredoka font-medium whitespace-nowrap transition-all cursor-pointer shadow-sm"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs font-fredoka">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[88%]">
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 flex items-center justify-center shrink-0 mb-1 filter drop-shadow-sm">
                    <img 
                      src="/chatbot%20logo.png" 
                      alt="AndiBot" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-hoja-600 to-hoja-700 text-white rounded-br-none shadow-md font-medium'
                      : 'bg-jade-950/90 border border-gold-500/30 text-linen-200 rounded-bl-none shadow-lg'
                  }`}
                >
                  {m.text}

                  {/* Optional CTAs */}
                  {(m.showBookingButton || m.showWhatsAppButton) && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-2">
                      {m.showBookingButton && (
                        <button
                          onClick={() => {
                            onClose();
                            if (onOpenBooking) onOpenBooking('cabana');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-jade-950 font-display text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Agendar Cabaña (50%)</span>
                        </button>
                      )}

                      {m.showWhatsAppButton && (
                        <a
                          href="https://wa.me/573105988350?text=Hola%20Andicas,%20quisiera%20asesoría%20sobre%20las%20cabañas%20y%20el%20bioparque"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-fredoka font-semibold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Asesor</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-linen-400 text-xs">
              <div className="w-7 h-7 flex items-center justify-center shrink-0 filter drop-shadow-sm">
                <img 
                  src="/chatbot%20logo.png" 
                  alt="AndiBot" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-jade-950/80 border border-white/10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-jade-950/95 border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pregúntale a AndiBot..."
            className="flex-1 bg-jade-900/80 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-linen-100 placeholder:text-linen-400/50 focus:outline-none focus:border-gold-400 font-fredoka"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2.5 rounded-2xl bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-jade-950 font-bold transition-all shadow-gold-glow cursor-pointer"
            aria-label="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
