import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

export default function FloatingAiButton({ onOpenAiChat }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="fixed bottom-6 left-6 z-40 flex flex-col items-start pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip on right / top on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.9 }}
            className="mb-2.5 px-3 py-1.5 rounded-xl glass-dark border border-gold-400/50 shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="text-left">
              <span className="font-display text-xs font-black text-gold-300 uppercase tracking-wider block">
                Asistente Virtual IA
              </span>
              <span className="font-fredoka text-[10px] text-linen-300 block">
                Pregúntame sobre cabañas, precios y planes
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger: Circular Robot Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onOpenAiChat}
        aria-label="Abrir asistente virtual de Inteligencia Artificial"
        className="relative group w-14 h-14 rounded-full bg-gradient-to-br from-jade-800 via-jade-900 to-jade-950 text-gold-300 border-2 border-gold-400 shadow-2xl shadow-gold-glow flex items-center justify-center cursor-pointer transition-all hover:border-gold-300"
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-7 h-7 text-gold-400 group-hover:scale-110 transition-transform" />
          
          {/* Subtle AI indicator */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-jade-950"></span>
          </span>
        </div>

        {/* Small AI label badge */}
        <span className="absolute -bottom-1 px-1.5 py-0.2 rounded-md bg-gold-500 text-jade-950 font-display text-[9px] font-black uppercase tracking-wider shadow-md">
          IA
        </span>
      </motion.button>
    </div>
  );
}
