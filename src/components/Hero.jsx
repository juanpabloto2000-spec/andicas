import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import QuickBookingBar from './QuickBookingBar';
import AmbientFireflies from './ui/AmbientFireflies';

const HERO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=85",
    caption: "Cabañas Suspendidas en los Árboles · Andicas"
  },
  {
    url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85",
    caption: "Piscina Natural con Caverna & Agua Manantial"
  },
  {
    url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2000&q=85",
    caption: "Atardeceres Mágicos en la Reserva Natural"
  }
];

export default function Hero({ onOpenBooking, customConfig = {} }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const heroLine1 = customConfig.heroTitle1 || "EL LUJO DE CONECTAR CON LA";
  const heroLine2 = customConfig.heroTitle2 || "NATURALEZA";
  const heroSubtitle = customConfig.heroSubtitle || "Piscina natural con caverna, cabañas en los árboles con jacuzzi privado y aventuras inolvidables para toda la familia.";

  return (
    <section aria-label="Hero Principal" className="relative min-h-screen flex flex-col justify-center items-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-transparent z-20 overflow-hidden">
      
      {/* Bioluminescent Nature Fireflies in Background */}
      <AmbientFireflies count={26} />

      {/* 
        Background Slideshow with Continuous Gradient Mask Dissolve 
      */}
      <div 
        className="absolute inset-0 overflow-hidden z-0 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0) 100%)',
        }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1.0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMAGES[currentImageIndex].url})` }}
          />
        </AnimatePresence>

        {/* Multi-layered Vignette with Jade Teal & Dark Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-jade-950/75 to-black/75" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-30 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* 3D Precolumbian Indigenous Display Title */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1 mb-5 text-center max-w-4xl pt-4 w-full px-2"
        >
          <span className="font-cartoon text-lg sm:text-3xl md:text-5xl lg:text-6xl font-black uppercase text-3d-white tracking-wide block">
            {heroLine1}
          </span>
          <h1 className="font-display text-[2.4rem] xs:text-[2.9rem] sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase text-3d-gold tracking-normal sm:tracking-wider leading-none hover:scale-[1.02] transition-transform duration-500 cursor-default select-none whitespace-nowrap inline-block">
            {heroLine2}
          </h1>
        </motion.div>

        {/* Friendly Secondary Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xs sm:text-base md:text-xl text-linen-100 font-fredoka font-normal max-w-2xl leading-relaxed mb-6 sm:mb-8 text-balance drop-shadow-md px-2"
        >
          {heroSubtitle}
        </motion.p>

        {/* Quick Booking Floating Bar with High Z-Index & Overflow Visible */}
        <div className="w-full relative z-40 mb-6">
          <QuickBookingBar />
        </div>
      </div>

      {/* Scroll Down Cue with Breathing Bounce */}
      <motion.a
        href="#experiencia"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-20 mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-jade-950/60 border border-white/10 hover:border-gold-400 text-linen-300 hover:text-gold-400 transition-all text-xs font-cartoon uppercase tracking-widest backdrop-blur-sm"
      >
        <span>DESCUBRIR EXPERIENCIAS</span>
        <ChevronDown className="w-4 h-4 text-gold-400" />
      </motion.a>
    </section>
  );
}
