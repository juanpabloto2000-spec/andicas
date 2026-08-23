import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Sparkles, Star, Sun, Clock, 
  ShieldCheck, PawPrint, CheckCircle2, Send, ArrowRight 
} from 'lucide-react';
import { ImageAutoSlider } from '../components/ui/image-auto-slider';
import AmbientFireflies from '../components/ui/AmbientFireflies';
import { animalsData } from '../data/animals';
import { contactData } from '../data/banking';

export default function AnimalesPage({ onNavigate }) {
  const [selectedAnimal, setSelectedAnimal] = useState(animalsData[0]);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      <AmbientFireflies count={20} />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Page Header with Spring Motion */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 85, damping: 15 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h1 className="font-display text-4xl sm:text-6xl font-black text-linen-100 uppercase tracking-wide leading-tight mb-4">
            NUESTROS AMIGOS DEL{' '}
            <span className="text-3d-gold">SANTUARIO</span>
          </h1>

          <p className="text-linen-200 font-fredoka text-sm sm:text-base leading-relaxed">
            En Andicas Bioparque Temático el bienestar animal es nuestro pilar. Todos nuestros animales son cuidados con amor, viven en amplias praderas y la interacción con ellos está <strong className="text-gold-400 font-bold">100% incluida en tu entrada general de Pasadía</strong>.
          </p>
        </motion.div>

        {/* 
          INFINITE AUTO-SLIDER AT TOP:
          Displays the family of sanctuary animals with Spring Arrival
        */}
        <motion.div 
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
          className="mb-10 w-full"
        >
          <ImageAutoSlider
            items={animalsData}
            activeId={selectedAnimal.id}
            onItemClick={(animal) => setSelectedAnimal(animal)}
          />
        </motion.div>

        {/* 
          FEATURED CHARACTER SPOTLIGHT 
          Dynamically updates when clicking any animal card above
        */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAnimal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className="mb-16 rounded-2xl overflow-hidden glass-dark border border-gold-600/40 shadow-2xl p-6 sm:p-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 relative h-72 sm:h-96 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <img
                  src={selectedAnimal.image}
                  alt={selectedAnimal.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-black/80 text-xs font-cartoon font-bold text-linen-100 border border-white/20">
                  {selectedAnimal.emoji} {selectedAnimal.species}
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-cartoon font-bold text-gold-400 uppercase tracking-widest block">
                  {selectedAnimal.role}
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-black text-linen-100 uppercase tracking-wide">
                  {selectedAnimal.name}
                </h2>
                <p className="text-xs font-fredoka text-gold-300 italic">
                  "{selectedAnimal.tagline}"
                </p>
                <p className="text-sm font-fredoka text-linen-200 leading-relaxed">
                  {selectedAnimal.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedAnimal.traits.map((t, i) => (
                    <span key={i} className="text-xs font-fredoka px-3 py-1 rounded-md bg-jade-900/80 border border-white/10 text-linen-100">
                      ★ {t}
                    </span>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-jade-950/90 border border-gold-600/30">
                  <div className="flex items-center gap-2 text-xs font-cartoon font-bold text-gold-400 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>DATO CURIOSO DE {selectedAnimal.name.toUpperCase()}:</span>
                  </div>
                  <p className="text-xs font-fredoka text-linen-300">
                    {selectedAnimal.funFact}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <a
                    href={`https://wa.me/${contactData.phones.pasadia.number.replace('+', '')}?text=${encodeURIComponent(`¡Hola! Deseo visitar el santuario y conocer a ${selectedAnimal.name} en el Pasadía de Andicas Bioparque. ¿Qué fechas tienen disponibles?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow flex items-center gap-2 border border-gold-400 hover:shadow-gold-glow-lg transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ven a Conocerlo en Pasadía</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Ethics & Rules Banner */}
        <div className="rounded-2xl p-6 sm:p-8 glass-jade border border-gold-600/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gold-400 font-cartoon font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>COMPROMISO DE BIENESTAR ANIMAL</span>
            </div>
            <h3 className="font-display text-2xl font-black text-linen-100 uppercase tracking-wide">
              AMOR, RESPETO Y LIBERTAD
            </h3>
            <p className="text-xs font-fredoka text-linen-200 max-w-2xl">
              Nuestros ejemplares no realizan trabajos forzados ni están enjaulados. Cuentan con supervisión veterinaria constante, alimentación balanceada y zonas verdes de libre pastoreo.
            </p>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-3 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow whitespace-nowrap cursor-pointer border border-gold-400"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
