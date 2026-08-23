import React from 'react';
import { motion } from 'framer-motion';

export default function ThatchedRoofDecoration() {
  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none z-10 overflow-hidden select-none">
      {/* Photorealistic Thatched Eave with Gentle Ambient Wind Sway & Smooth Seamless Fade */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1, 
          y: [0, -3, 0],
          scale: [1, 1.006, 1]
        }}
        transition={{ 
          opacity: { duration: 1.2 },
          y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
          scale: { repeat: Infinity, duration: 8, ease: "easeInOut" }
        }}
        className="relative w-full h-40 sm:h-56 md:h-72 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.7) 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.7) 80%, transparent 100%)',
        }}
      >
        <img 
          src="/decorations/thatched_eave.jpg" 
          alt="Techo de paja ancestral"
          className="w-full h-full object-cover object-top filter brightness-110 contrast-115 opacity-90"
        />
        {/* Soft Golden Ambient Light Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/25 via-amber-600/10 to-transparent pointer-events-none mix-blend-overlay" />
      </motion.div>
    </div>
  );
}
