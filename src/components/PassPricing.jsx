import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, PawPrint, ArrowRight, Sparkles, Check, 
  ShoppingBag, ShieldCheck, Ticket
} from 'lucide-react';
import { contactData } from '../data/banking';
import InteractiveTiltCard from './ui/InteractiveTiltCard';

export default function PassPricing({ onOpenSummary }) {
  const [activeTab, setActiveTab] = useState('pasadia');

  // Quantities state
  const [quantities, setQuantities] = useState({
    aventurero: 0,
    bronce: 0,
    nocturna: 0,
    plata: 0,
    pet_caminante: 0,
    pet_aventurero: 0,
  });

  const updateQty = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const CATEGORIES = [
    {
      id: 'pasadia',
      name: 'Pasadía',
      schedule: '9:00 AM a 5:00 PM',
      icon: Sun,
      iconColor: 'text-amber-400',
      plans: [
        {
          id: 'aventurero',
          name: 'Pase Andicas Bio-Aventura',
          tagline: 'Acceso Total al Bioparque',
          price: 65000,
          priceFormatted: '$65.000 COP',
          image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
          desc: 'Acceso completo a piscinas de roca natural con caverna, tobogán acuático, show equino y senderos ecológicos.',
          features: [
            'Piscina natural de roca con caverna & cascada',
            'Tobogán acuático & piscina climatizada',
            'Show equino de gala y destrezas',
            'Santuario animal con fotos libres',
            'Senderos & miradores fotográficos',
          ],
        },
        {
          id: 'bronce',
          name: 'Pase Andicas Gourmet & Selva',
          tagline: 'Aventura + Almuerzo Típico',
          price: 95000,
          priceFormatted: '$95.000 COP',
          image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
          desc: 'Todo lo del Pase Bio-Aventura + almuerzo campesino tradicional servido a la carta con bebida natural.',
          features: [
            'Todo lo incluido en Pase Bio-Aventura',
            'Almuerzo campesino gourmet a la carta',
            'Bebida natural de frutas incluida',
            'Mesa preferencial en restaurante',
            'Piscina climatizada & shows en vivo',
          ],
        },
      ],
    },
    {
      id: 'pasanoche',
      name: 'Pasanoche',
      schedule: '6:00 PM a 10:00 PM',
      icon: Moon,
      iconColor: 'text-sky-300',
      plans: [
        {
          id: 'nocturna',
          name: 'Noche de Luces & Manantiales',
          tagline: 'Noche Mágica & Chillout',
          price: 70000,
          priceFormatted: '$70.000 COP',
          image: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80',
          desc: 'Piscina natural climatizada bajo las estrellas con senderos iluminados por antorchas y coctelería.',
          features: [
            'Piscina natural climatizada nocturna',
            'Senderos y miradores iluminados',
            'Música ambiente & bar de bebidas',
            'Mallas flotantes para ver estrellas',
          ],
        },
        {
          id: 'plata',
          name: 'Velada Astral, Fogata & Cine',
          tagline: 'Cine Bajo Estrellas & Fogata',
          price: 90000,
          priceFormatted: '$90.000 COP',
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          desc: 'Piscina climatizada nocturna + función de cine en pantalla gigante al aire libre + fogata con masmelos.',
          features: [
            'Piscina nocturna climatizada',
            'Función de cine bajo las estrellas',
            'Fogata comunitaria con masmelos',
            'Crispetas recién hechas incluidas',
            'Bebida de bienvenida artesanal',
          ],
        },
      ],
    },
    {
      id: 'pet',
      name: 'Pet Friendly',
      schedule: 'Ingreso Todo el Día',
      icon: PawPrint,
      iconColor: 'text-hoja-400',
      plans: [
        {
          id: 'pet_caminante',
          name: 'Pase Huellitas Safari',
          tagline: 'Paseo en Praderas Libres',
          price: 25000,
          priceFormatted: '$25.000 COP',
          image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
          desc: 'Ingreso de tu mascota a todas las zonas verdes, praderas, senderos ecológicos y estaciones de hidratación.',
          features: [
            'Ingreso a zonas verdes y senderos',
            'Estaciones de hidratación fresca',
            'Zonas de restaurante pet friendly',
            'Bolsas biodegradables incluidas',
          ],
        },
        {
          id: 'pet_aventurero',
          name: 'Pase Pet VIP Acuático',
          tagline: 'Acceso a Piscina Canina VIP',
          price: 55000,
          priceFormatted: '$55.000 COP',
          image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
          desc: 'Acceso a senderos + uso exclusivo de la piscina canina con rampas de agua, pelotas y snack saludable.',
          features: [
            'Todo lo de Pase Huellitas Safari',
            'Acceso ilimitado a Piscina Canina',
            'Juguetes acuáticos & chalecos',
            'Área de secado al aire libre',
            'Snack artesanal de bienvenida',
          ],
        },
      ],
    },
  ];

  const allPlansMap = {
    aventurero: { name: 'Pase Andicas Bio-Aventura', price: 65000 },
    bronce: { name: 'Pase Andicas Gourmet & Selva (+Almuerzo)', price: 95000 },
    nocturna: { name: 'Noche de Luces & Manantiales', price: 70000 },
    plata: { name: 'Velada Astral, Fogata & Cine', price: 90000 },
    pet_caminante: { name: 'Pase Huellitas Safari', price: 25000 },
    pet_aventurero: { name: 'Pase Pet VIP Acuático (Piscina Canina)', price: 55000 },
  };

  const currentCategory = CATEGORIES.find((c) => c.id === activeTab) || CATEGORIES[0];

  const selectedItemsList = Object.entries(quantities)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => ({
      id,
      name: allPlansMap[id]?.name,
      qty,
      unitPrice: allPlansMap[id]?.price || 0,
      total: qty * (allPlansMap[id]?.price || 0),
    }));

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalCost = Object.entries(quantities).reduce((sum, [id, qty]) => sum + qty * (allPlansMap[id]?.price || 0), 0);
  const deposit50 = Math.round(totalCost * 0.5);

  const formatCOP = (num) => `$${num.toLocaleString('es-CO')} COP`;

  const handleOpenPlanSummary = () => {
    const selectedLines = selectedItemsList.map((item) => `${item.qty}x ${item.name} (${formatCOP(item.total)})`);

    const summaryData = {
      experienceName: 'Plan Personalizado (Arma Tu Plan)',
      dateText: 'Fecha a convenir con asesor en WhatsApp',
      adults: (quantities.aventurero || 0) + (quantities.bronce || 0) + (quantities.nocturna || 0) + (quantities.plata || 0),
      children: 0,
      pets: (quantities.pet_caminante || 0) + (quantities.pet_aventurero || 0),
      addonsText: selectedLines.join(' | '),
      totalCost: totalCost,
      deposit50: deposit50,
      targetPhone: contactData.phones.pasadia.number,
      notes: `Detalle del plan configurado:\n${selectedLines.join('\n')}`,
    };

    if (onOpenSummary) {
      onOpenSummary(summaryData);
    }
  };

  const hasSelectedItems = totalItems > 0;

  return (
    <section id="arma-tu-plan" aria-labelledby="arma-tu-plan-heading" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header with Spring Motion */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ type: "spring", stiffness: 85, damping: 15 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h2 id="arma-tu-plan-heading" className="font-display text-3xl sm:text-5xl font-black text-linen-100 leading-tight mb-3 uppercase">
            ARMA TU PLAN <span className="text-3d-gold">ANDICAS</span>
          </h2>

          <p className="text-linen-200 font-fredoka text-sm sm:text-base leading-relaxed">
            Selecciona entre Pasadía, Pasanoche o Pase de Mascotas. Agrega la cantidad de boletas que desees y revisa tu total en tiempo real.
          </p>
        </motion.div>

        {/* 
          MINI-NAVBAR TAB SWITCHER 
          Transparent grey active layer + sliding gold underline
        */}
        <motion.div 
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ type: "spring", stiffness: 90, damping: 15, delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl glass-dark border border-gold-600/30 shadow-2xl">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`relative px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-cartoon font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'text-gold-400'
                      : 'text-linen-300/80 hover:text-linen-100'
                  }`}
                >
                  {/* Transparent Grey Layer Active Background */}
                  {isActive && (
                    <motion.div
                      layoutId="planTabActiveBg"
                      className="absolute inset-0 bg-white/[0.08] border border-white/15 rounded-lg"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}

                  {/* Sliding Gold Underline */}
                  {isActive && (
                    <motion.div
                      layoutId="planTabUnderline"
                      className="absolute -bottom-1 left-3 right-3 h-0.5 bg-gold-500 rounded-full shadow-gold-glow"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}

                  <Icon className={`w-4 h-4 relative z-10 ${cat.iconColor}`} />
                  <span className="relative z-10">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 
          STABLE, NON-JUMPING 12-COLUMN MASTER GRID:
          Left (8 cols): Plan cards remain rock-solid in dimension and position.
          Right (4 cols): Summary transitions smoothly with a gentle fade/slide.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto">
          {/* PLAN CARDS CONTAINER (8 COLS) - 2 HORIZONTAL COLUMNS ON MOBILE */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.09 },
                  },
                  exit: { opacity: 0, transition: { duration: 0.15 } }
                }}
                className="grid grid-cols-2 gap-2.5 sm:gap-5"
              >
                {currentCategory.plans.map((plan, idx) => {
                  const qty = quantities[plan.id] || 0;
                  const isSelected = qty > 0;

                  return (
                    <motion.div
                      key={plan.id}
                      variants={{
                        hidden: { opacity: 0, y: 35, scale: 0.92 },
                        visible: { 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          transition: { type: "spring", stiffness: 100, damping: 14 } 
                        }
                      }}
                      className="h-full"
                    >
                      <InteractiveTiltCard
                        tiltIntensity={8}
                        spotlightColor="rgba(216, 162, 50, 0.2)"
                        className={`h-full rounded-xl sm:rounded-2xl overflow-hidden glass-dark border transition-all flex flex-col justify-between shadow-xl sm:shadow-2xl relative ${
                          isSelected
                            ? 'border-gold-400 shadow-gold-glow bg-jade-950/95 ring-2 ring-gold-400/60 scale-[1.01]'
                            : 'border-white/10 hover:border-gold-500/40'
                        }`}
                      >
                        <div className="flex flex-col justify-between h-full">
                          <div>
                            {/* Compact Visual Header */}
                            <div className="relative h-28 sm:h-40 overflow-hidden">
                              <img
                                src={plan.image}
                                alt={plan.name}
                                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 pointer-events-none"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/40 to-transparent" />
                              
                              <div className="absolute bottom-2 left-2.5 right-2.5 sm:bottom-2.5 sm:left-3.5 sm:right-3.5 flex items-end justify-between">
                                <div>
                                  <span className="text-[8px] sm:text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-widest block truncate">
                                    {plan.tagline}
                                  </span>
                                  <h3 className="font-display text-xs sm:text-xl font-black text-linen-100 uppercase tracking-wide leading-tight line-clamp-2 sm:line-clamp-none">
                                    {plan.name}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-2.5 sm:p-5 space-y-2 sm:space-y-3">
                              {/* Price Tag */}
                              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between pb-1.5 sm:pb-2 border-b border-white/10">
                                <span className="text-[9px] sm:text-[11px] font-fredoka text-linen-400">Por persona:</span>
                                <span className="font-display text-sm sm:text-2xl font-black text-gold-gradient">
                                  {plan.priceFormatted}
                                </span>
                              </div>

                              <p className="text-[10px] sm:text-xs font-fredoka text-linen-200 leading-snug sm:leading-relaxed line-clamp-2">
                                {plan.desc}
                              </p>

                              {/* Features */}
                              <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1">
                                <span className="text-[9px] sm:text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-wider block">
                                  Incluye:
                                </span>
                                <ul className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs font-fredoka text-linen-200">
                                  {plan.features.slice(0, 3).map((feat, i) => (
                                    <li key={i} className="flex items-start gap-1 sm:gap-1.5">
                                      <div className="p-0.5 rounded bg-gold-500/20 text-gold-400 flex-shrink-0 mt-0.5">
                                        <Check className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                                      </div>
                                      <span className="line-clamp-1">{feat}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Stepper with Lively Counter Spring */}
                          <div className="p-2.5 sm:p-5 pt-0">
                            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-jade-950/80 border border-white/10 flex items-center justify-between gap-1">
                              <span className="text-[9px] sm:text-[11px] font-cartoon font-bold text-linen-300 uppercase">
                                Cant:
                              </span>

                              <div className="flex items-center gap-1 sm:gap-2 bg-jade-900 border border-white/15 rounded-lg p-0.5">
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  type="button"
                                  onClick={() => updateQty(plan.id, -1)}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-white/10 hover:bg-white/20 text-[11px] sm:text-xs font-bold text-linen-100 flex items-center justify-center cursor-pointer transition-colors"
                                  aria-label={`Disminuir ${plan.name}`}
                                >
                                  -
                                </motion.button>

                                <motion.span
                                  key={qty}
                                  initial={{ scale: 1.4, color: '#FFF' }}
                                  animate={{ scale: 1, color: '#FCD477' }}
                                  transition={{ duration: 0.2 }}
                                  className="w-4 sm:w-6 text-center text-xs font-bold font-mono inline-block"
                                >
                                  {qty}
                                </motion.span>

                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  type="button"
                                  onClick={() => updateQty(plan.id, 1)}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-gold-500 hover:bg-gold-400 text-jade-950 text-[11px] sm:text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                                  aria-label={`Aumentar ${plan.name}`}
                                >
                                  +
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </InteractiveTiltCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: REAL-TIME SUMMARY PANEL (4 COLS) WITH SUBTLE ELEGANT FADE */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <AnimatePresence mode="wait">
              {hasSelectedItems ? (
                <motion.div
                  key="active-summary"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl glass-dark border border-gold-600/40 p-5 sm:p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2 text-gold-400">
                      <ShoppingBag className="w-5 h-5" />
                      <h3 className="font-display text-lg font-black text-linen-100 uppercase tracking-wide">
                        TU RESUMEN
                      </h3>
                    </div>
                    <span className="text-xs font-cartoon font-bold text-gold-400">
                      {totalItems} {totalItems === 1 ? 'Pase' : 'Pases'}
                    </span>
                  </div>

                  {/* Selected Items List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedItemsList.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-lg bg-jade-950/70 border border-white/10 flex items-center justify-between text-xs font-fredoka">
                        <div>
                          <span className="font-semibold text-linen-100 block">{item.name}</span>
                          <span className="text-[11px] text-gold-400">{item.qty} x {formatCOP(item.unitPrice)}</span>
                        </div>
                        <span className="font-mono font-bold text-linen-100">{formatCOP(item.total)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="pt-3 border-t border-white/10 space-y-2 text-xs font-fredoka">
                    <div className="flex items-center justify-between text-linen-300">
                      <span>Subtotal Boletas:</span>
                      <span className="font-mono">{formatCOP(totalCost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold text-gold-gradient font-display pt-1 border-t border-white/10">
                      <span>TOTAL:</span>
                      <span className="font-mono text-lg">{formatCOP(totalCost)}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-jade-900/80 border border-gold-600/30 text-xs text-linen-200 flex items-center justify-between">
                      <span>Anticipo 50% requerido:</span>
                      <span className="font-bold font-mono text-gold-400">{formatCOP(deposit50)}</span>
                    </div>
                  </div>

                  {/* Confirmation CTA */}
                  <button
                    onClick={handleOpenPlanSummary}
                    className="btn-shimmer w-full py-3.5 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-gold-300 active:scale-[0.98]"
                  >
                    <span>Revisar Resumen & Confirmar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-summary-guide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl glass-dark/40 border border-white/5 p-6 text-center space-y-3 hidden lg:block"
                >
                  <div className="w-12 h-12 rounded-xl bg-jade-900/80 border border-white/10 flex items-center justify-center mx-auto text-gold-400/70">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-cartoon text-sm font-bold text-linen-100 uppercase tracking-wide">
                      Arma Tu Aventura
                    </h4>
                    <p className="text-xs font-fredoka text-linen-400 mt-1 leading-relaxed">
                      Agrega tus boletas con el botón <strong className="text-gold-400">(+)</strong> para calcular tu tarifa y reservar en tiempo real.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MOBILE FLOATING REAL-TIME BAR (Visible only on mobile when items are selected) */}
        <AnimatePresence>
          {hasSelectedItems && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
              className="lg:hidden fixed bottom-4 left-4 right-4 z-40 p-3 rounded-2xl glass-dark border border-gold-400 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-xl ring-1 ring-gold-400/50"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block">
                  {totalItems} {totalItems === 1 ? 'Pase' : 'Pases'} Seleccionados
                </span>
                <span className="font-mono text-sm font-black text-gold-gradient block truncate">
                  Total: {formatCOP(totalCost)}
                </span>
              </div>

              <button
                onClick={handleOpenPlanSummary}
                className="btn-shimmer px-4 py-2.5 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase flex items-center gap-1.5 shadow-gold-glow flex-shrink-0 cursor-pointer"
              >
                <span>Confirmar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
