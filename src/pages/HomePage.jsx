import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, PawPrint,
  CreditCard, Waves, Flower2, ChevronRight
} from 'lucide-react';
import Hero from '../components/Hero';
import ExperienceStory from '../components/ExperienceStory';
import PassPricing from '../components/PassPricing';
import LocationAndBanking from '../components/LocationAndBanking';
import { ThreeDPhotoCarousel } from '../components/ui/3d-carousel';
import { AnimatedCounter } from '../components/ui/animated-counter';
import { ImageAutoSlider } from '../components/ui/image-auto-slider';
import InteractiveTiltCard from '../components/ui/InteractiveTiltCard';
import { cabinsData } from '../data/cabins';
import { animalsData } from '../data/animals';
import ThatchedRoofDecoration from '../components/ui/ThatchedRoofDecoration';

const RULES_CATEGORIES = [
  {
    id: 'reservas',
    title: 'Reservas & Anticipos',
    subtitle: 'Políticas de abono y confirmación oficial',
    icon: CreditCard,
    accent: 'text-gold-400',
    description: 'Todas las reservas en Andicas Bioparque se gestionan de forma directa y personalizada.',
    rules: [
      {
        title: 'Anticipo Requerido del 50%',
        text: 'Para congelar la tarifa y garantizar el cupo de tu cabaña o pasadía, es indispensable el abono del 50% del valor total.'
      },
      {
        title: 'Cuentas Corporativas Oficiales',
        text: 'Los pagos se realizan exclusivamente a las cuentas institucionales a nombre de Andicas Bioparque S.A.S. (NIT 901.890.345-1).'
      },
      {
        title: 'Cancelación con 3 Días (72h) de Anticipación',
        text: 'Las cancelaciones deben radicarse formalmente en la web con mínimo 3 días (72h) antes de la llegada para evaluación de trámite sin penalidad.'
      },
      {
        title: 'Penalidad del 40% por Cancelación Tardía',
        text: 'Solicitudes efectuadas con menos de 3 días de antelación incurrirán en una penalidad del 40% sobre el valor abonado para cubrir costos de bloqueo de cupo.'
      }
    ]
  },
  {
    id: 'piscinas',
    title: 'Piscinas & Caverna',
    subtitle: 'Calidad de agua y uso de zonas húmedas',
    icon: Waves,
    accent: 'text-hoja-400',
    description: 'Nuestras piscinas se nutren de manantiales naturales y requieren de cuidados especiales.',
    rules: [
      {
        title: 'Traje de Baño Obligatorio',
        text: 'Uso indispensable de traje de baño en licra, spandex o poliéster. No se permite el ingreso con ropa de algodón.'
      },
      {
        title: 'Ducha Previa Obligatoria',
        text: 'Por higiene y preservación del agua de manantial, es requisito ducharse antes de ingresar a piscinas y caverna.'
      },
      {
        title: 'Supervisión de Menores',
        text: 'Los niños menores de 12 años deben estar permanentemente acompañados por un adulto responsable en el agua.'
      }
    ]
  },
  {
    id: 'pet',
    title: 'Pet Friendly 🐾',
    subtitle: 'Convivencia armónica para tus peludos',
    icon: PawPrint,
    accent: 'text-hoja-400',
    description: 'Somos pioneros en turismo con mascotas en el Eje Cafetero con praderas y piscina canina.',
    rules: [
      {
        title: 'Correa en Senderos',
        text: 'Mantén a tu perro siempre con collar y correa en senderos peatonales, restaurante y áreas comunes del parque.'
      },
      {
        title: 'Piscina Canina Exclusiva',
        text: 'Los caninos disfrutan de su propia piscina especializada en el Plan Mascota Aventurero ($50.000 COP).'
      },
      {
        title: 'Responsabilidad y Limpieza',
        text: 'Es deber de cada dueño portar bolsas biodegradables para recoger deyecciones y velar por el comportamiento del animal.'
      }
    ]
  },
  {
    id: 'santuario',
    title: 'Santuario Animal',
    subtitle: 'Bienestar, respeto y libertad',
    icon: Flower2,
    accent: 'text-gold-400',
    description: 'Nuestros animales rescatados viven en un entorno digno y protegido.',
    rules: [
      {
        title: 'Alimentación Autorizada Únicamente',
        text: 'Prohibido suministrar alimentos externos o procesados a los caballos, ponys, tortugas o cabritas.'
      },
      {
        title: 'Trato Amoroso y Respetuoso',
        text: 'La interacción y fotografías son libres y gratuitas con tu pasadía, siempre bajo la guía de nuestros cuidadores.'
      },
      {
        title: 'Zonas de Descanso Protegidas',
        text: 'Respeta los cercados y momentos de pastoreo o siesta de los animales sin forzar interacciones.'
      }
    ]
  }
];

export default function HomePage({ 
  onOpenBooking, 
  onOpenSummary, 
  onNavigate, 
  onShowToast,
  activeModules,
  customConfig = {}
}) {
  const [activeRuleCategory, setActiveRuleCategory] = useState(RULES_CATEGORIES[0]);

  const handleCabinSelect = (cabin) => {
    onNavigate('cabanas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnimalSelect = (animal) => {
    onNavigate('animales');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-0 relative z-10">
      {/* 1. Hero Section */}
      <Hero onOpenBooking={onOpenBooking} activeModules={activeModules} customConfig={customConfig} />

      {/* 2. La Experiencia Quimbayas (With CardStack Component) */}
      {activeModules?.experiencia !== false && (
        <ExperienceStory />
      )}

      {/* 3. Cabañas Luxury & Miradores with 3D Rotating Carousel & Full Thatched Roof Atmosphere */}
      {activeModules?.cabanas !== false && (
        <section id="cabanas-seccion" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-thatch-texture">
        {/* Photorealistic Thatched Roof Eave (Techo de Paja Ancestral con Difuminado) */}
        <ThatchedRoofDecoration />

        {/* Ambient Realistic Woven Straw Background Photo Overlay (Covers Entire Section with Soft Fade) */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay overflow-hidden select-none"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,1) 88%, transparent 100%)',
          }}
        >
          <img 
            src="/decorations/thatched_roof_bg.jpg" 
            alt="" 
            className="w-full h-full object-cover filter contrast-125 brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-transparent to-forest/80" />
        </div>

        {/* Floating Subtle Amber/Straw Particle Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-gold-400/60 shadow-gold-glow"
              style={{
                left: `${12 + i * 11}%`,
                top: `${30 + (i % 4) * 18}%`,
              }}
              animate={{
                y: [0, -35, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10 pt-4 sm:pt-6">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 85, damping: 15 }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <h2 className="font-display text-3xl sm:text-5xl font-black text-linen-100 uppercase tracking-wide mb-3">
              CABAÑAS TRADICIONALES, SUITES EN ROCA & <span className="text-3d-gold">HABITACIONES</span>
            </h2>
            <p className="text-xs sm:text-sm font-fredoka text-linen-300 max-w-2xl mx-auto leading-relaxed">
              Vive una noche mágica en el corazón de la naturaleza. Todas nuestras opciones de hospedaje incluyen <strong>desayuno campesino</strong>, <strong>jacuzzi compartido con hidromasaje</strong>, <strong>cine bajo las estrellas</strong>, <strong>fogata nocturna con masmelos</strong> y acceso libre a la Aldea Andicas.
            </p>
          </motion.div>

          {/* 3D Smooth Rotational Cylinder Carousel with Visible Gliding Arrival */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 60 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 70, damping: 14, delay: 0.1 }}
            className="w-full mb-10 sm:mb-14"
          >
            <ThreeDPhotoCarousel
              items={cabinsData}
              onItemClick={handleCabinSelect}
            />
          </motion.div>

          {/* Call to Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center mb-14 sm:mb-16"
          >
            <button
              onClick={() => {
                onNavigate('cabanas');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn-shimmer inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs sm:text-sm uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg hover:scale-105 transition-all cursor-pointer border border-gold-400"
            >
              <span>Ver Catálogo Completo & Reservar Cabaña</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Woven Guadua / Straw Divider before Metrics */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.7 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-4 mb-8 sm:mb-10"
          >
            <div className="h-0.5 flex-1 max-w-[200px] bg-gradient-to-r from-transparent via-amber-600/40 to-gold-500/60 rounded-full" />
            <span className="text-xs font-cartoon font-bold text-gold-400 tracking-widest uppercase flex items-center gap-2">
              <span>🌾</span>
              <span>BIOPARQUE EN NÚMEROS</span>
              <span>🌾</span>
            </span>
            <div className="h-0.5 flex-1 max-w-[200px] bg-gradient-to-l from-transparent via-amber-600/40 to-gold-500/60 rounded-full" />
          </motion.div>

          {/* 4 Brand Pillars / Metrics with 3D Tilt & Staggered Spring Arrival */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 lg:gap-6 relative z-10">
            {[
              { targetNumber: 100, suffix: "%", label: "Pet Friendly", desc: "Piscina canina y senderos libres" },
              { targetNumber: 5, suffix: " Op.", label: "Hospedajes", desc: "Cabañas A-Frame, Roca y Bohíos" },
              { targetNumber: 8, suffix: " Pers.", label: "Grupos", desc: "Suites de hasta 8 huéspedes" },
              { targetNumber: 15, suffix: " min", label: "Reserva", desc: "Ubicación en Valle del Sol" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40, scale: 0.88 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ type: "spring", stiffness: 90, damping: 14, delay: idx * 0.08 }}
              >
                <InteractiveTiltCard
                  tiltIntensity={12}
                  spotlightColor="rgba(252, 212, 119, 0.22)"
                  className="p-2.5 sm:p-5 lg:p-7 rounded-xl sm:rounded-2xl glass-dark border border-gold-600/30 text-center space-y-1 sm:space-y-2 hover:border-gold-400 hover:shadow-gold-glow transition-all shadow-xl sm:shadow-2xl backdrop-blur-md flex flex-col justify-center items-center h-full cursor-pointer"
                >
                  <div className="font-display text-lg sm:text-3xl lg:text-5xl font-black text-3d-gold block leading-none">
                    <AnimatedCounter to={stat.targetNumber} suffix={stat.suffix} duration={2.0} />
                  </div>
                  <h3 className="font-cartoon text-[10px] sm:text-sm lg:text-base font-bold text-linen-100 uppercase tracking-wider leading-tight">
                    {stat.label}
                  </h3>
                  <p className="text-[9px] sm:text-xs font-fredoka text-linen-300 leading-snug line-clamp-2 sm:line-clamp-none hidden min-[380px]:block">
                    {stat.desc}
                  </p>
                </InteractiveTiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 4. Arma Tu Plan (With Mini-Navbar Tabs & Side-by-Side Cards & Summary) */}
      {activeModules?.pasadias !== false && (
        <PassPricing onOpenSummary={onOpenSummary} activeModules={activeModules} />
      )}

      {/* 5. Santuario Animal Preview Section (With ImageAutoSlider) */}
      {activeModules?.animales !== false && (
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ type: "spring", stiffness: 85, damping: 15 }}
              className="text-center max-w-3xl mx-auto mb-10"
            >
              <h2 className="font-display text-3xl sm:text-5xl font-black text-linen-100 uppercase tracking-wide">
                CONOCE NUESTROS <span className="text-3d-gold">ANIMALES</span> DE LA CASA
              </h2>
              <p className="text-xs sm:text-sm font-fredoka text-linen-300 mt-2">
                Interacción gratuita 100% incluida con tu entrada general de Pasadía.
              </p>
            </motion.div>

            {/* Integrated Infinite Auto-Slider Component with Gliding Arrival */}
            <motion.div
              initial={{ opacity: 0, x: 70, scale: 0.94 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ type: "spring", stiffness: 75, damping: 14, delay: 0.12 }}
              className="w-full"
            >
              <ImageAutoSlider
                items={animalsData}
                onItemClick={handleAnimalSelect}
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* 6. Normas & Políticas del Parque */}
      {activeModules?.normas !== false && (
        <section id="normas" aria-labelledby="normas-heading" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ type: "spring", stiffness: 85, damping: 15 }}
              className="text-center max-w-3xl mx-auto mb-14"
            >
              <h2 id="normas-heading" className="font-display text-3xl sm:text-5xl font-black text-linen-100 uppercase tracking-wide mb-3">
                GUÍA DE ESTADÍA & POLÍTICAS
              </h2>
              <p className="text-xs sm:text-sm font-fredoka text-linen-300 max-w-xl mx-auto">
                Diseñadas para garantizar la seguridad, el bienestar y una estancia memorable en el corazón de la naturaleza.
              </p>
            </motion.div>

            {/* Interactive Dual-Column Hospitality Guide with Animated Entry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Category Selector (4 cols) with Slide from Left */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                className="lg:col-span-4 space-y-2.5"
              >
                {RULES_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = activeRuleCategory.id === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveRuleCategory(cat)}
                      className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-jade-950/90 border-gold-400 shadow-gold-glow'
                          : 'glass-card border-white/10 hover:border-gold-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-jade-900/90 border border-white/10 ${cat.accent}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-cartoon text-sm font-bold text-linen-100 uppercase tracking-wider">
                            {cat.title}
                          </h4>
                          <p className="text-[11px] font-fredoka text-linen-300/80">
                            {cat.subtitle}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-gold-400 translate-x-1' : 'text-linen-400'}`} />
                    </button>
                  );
                })}
              </motion.div>

              {/* Right Rule Detail Card (8 cols) with Slide from Right */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
                className="lg:col-span-8 p-6 sm:p-8 rounded-2xl glass-dark border border-gold-600/40 shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-gold-600/20 text-gold-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                        {activeRuleCategory.title}
                      </h3>
                      <p className="text-xs font-fredoka text-gold-400">
                        {activeRuleCategory.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rules List */}
                <div className="space-y-3.5">
                  {activeRuleCategory.rules.map((rule, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl bg-jade-950/70 border border-white/10 flex items-start gap-3.5 hover:border-gold-500/30 transition-all"
                    >
                      <div className="w-6 h-6 rounded-md bg-gold-500/20 text-gold-400 text-xs font-bold font-cartoon flex items-center justify-center flex-shrink-0 mt-0.5">
                        0{idx + 1}
                      </div>
                      <div>
                        <h4 className="font-cartoon text-sm font-bold text-linen-100 mb-0.5 uppercase tracking-wide">
                          {rule.title}
                        </h4>
                        <p className="text-xs font-fredoka text-linen-300 leading-relaxed">
                          {rule.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-xs font-fredoka text-linen-400 flex items-center justify-between">
                  <span>¿Dudas sobre el reglamento? Escríbenos directamente a WhatsApp.</span>
                  <span className="text-gold-400 font-bold">Andicas Bioparque Temático</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Ubicación & Garantía Bancaria */}
      {activeModules?.ubicacion !== false && (
        <LocationAndBanking onShowToast={onShowToast} customConfig={customConfig} />
      )}
    </div>
  );
}
