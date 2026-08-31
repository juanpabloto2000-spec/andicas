import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Preloader({ onComplete }) {
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    }, 1100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#051e1f] select-none pointer-events-auto touch-none overflow-hidden px-4"
      style={{
        background: 'radial-gradient(circle at center, #0a383a 0%, #062627 65%, #021213 100%)',
      }}
    >
      {/* Soft Gold & Teal Ambient Glow */}
      <motion.div
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-56 h-56 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-gold-500/25 via-gold-400/15 to-teal-400/20 filter blur-3xl pointer-events-none"
      />

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-40 sm:w-56 md:w-64 h-auto flex items-center justify-center will-change-transform"
        >
          <img
            src="/logo sin fondo.png"
            alt="Andicas Bioparque Temático"
            className="w-full h-auto object-contain filter drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        {/* Minimal Luxury Progress Line */}
        <div className="mt-7 w-28 sm:w-36 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-1/2 h-full bg-gold-gradient rounded-full shadow-gold-glow"
          />
        </div>
      </div>
    </motion.div>
  );
}
