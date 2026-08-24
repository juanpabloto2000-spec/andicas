import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
            <div className="text-left">
              <span className="font-display text-xs font-black text-gold-300 uppercase tracking-wider block">
                Asistente Virtual
              </span>
              <span className="font-fredoka text-[10px] text-linen-300 block">
                Pregúntame sobre cabañas, precios y planes
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger: The character herself as the floating button */}
      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        onClick={onOpenAiChat}
        aria-label="Abrir asistente virtual"
        className="relative group w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center cursor-pointer transition-transform filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] hover:drop-shadow-[0_0_25px_rgba(216,162,50,0.5)]"
      >
        <img 
          src="/chatbot%20logo.png" 
          alt="Asistente Virtual Andicas" 
          className="w-full h-full object-contain pointer-events-none"
        />
      </motion.button>
    </div>
  );
}
