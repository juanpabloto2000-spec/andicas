import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Home, Sun, Moon, Calendar, Users, 
  Check, ArrowRight, ShieldCheck, PawPrint, MessageSquare,
  CheckCircle2, Info, ChevronRight, Lock
} from 'lucide-react';
import CustomCalendar from './CustomCalendar';
import { cabinsData } from '../data/cabins';
import { contactData } from '../data/banking';

export default function BookingModal({ 
  isOpen, 
  onClose, 
  onOpenSummary,
  initialType = 'cabana',
  activeModules
}) {
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedCabin, setSelectedCabin] = useState(cabinsData[0]);
  const [selectedPlan, setSelectedPlan] = useState('aventurero'); // aventurero ($65k) | bronce ($95k)
  const [selectedNightPlan, setSelectedNightPlan] = useState('nocturna'); // nocturna ($70k) | plata ($90k)
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [dates, setDates] = useState({ checkIn: null, checkOut: null });
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const experienceTypes = [
    {
      id: 'cabana',
      name: 'Cabañas Luxury',
      subtitle: 'Hospedaje & Jacuzzi',
      icon: Home,
    },
    {
      id: 'pasadia',
      name: 'Pasadía',
      subtitle: '9:00 AM – 5:00 PM',
      icon: Sun,
    },
    {
      id: 'pasanoche',
      name: 'Pasanoche',
      subtitle: '6:00 PM – 10:00 PM',
      icon: Moon,
    },
  ];

  const formatCOP = (num) => `$${(num || 0).toLocaleString('es-CO')} COP`;

  const calculateEstimates = () => {
    let totalCost = 0;
    let experienceName = '';
    let dateText = '';
    let addons = [];

    if (selectedType === 'cabana') {
      if (selectedCabin.pricingModel === 'por-persona') {
        const totalGuests = Math.max(1, adults + children);
        totalCost = totalGuests * selectedCabin.price;
        experienceName = `${selectedCabin.name} (Hospedaje)`;
        addons.push(`${totalGuests} persona(s) a ${selectedCabin.priceFormatted}/pers.`);
      } else {
        const basePrice = selectedCabin.price;
        const extraGuests = Math.max(0, adults - 2);
        const extraPrice = extraGuests * (selectedCabin.extraPersonPrice || 130000);
        totalCost = basePrice + extraPrice;
        experienceName = `${selectedCabin.name} (Hospedaje)`;
        if (extraGuests > 0) {
          addons.push(`${extraGuests} huésped(es) adicional(es)`);
        }
      }
      
      if (dates.checkIn && dates.checkOut) {
        dateText = `Check-in: ${dates.checkIn} al Check-out: ${dates.checkOut}`;
      } else if (dates.checkIn) {
        dateText = `Noche del ${dates.checkIn}`;
      } else {
        dateText = 'Fecha por coordinar';
      }
    } else if (selectedType === 'pasadia') {
      const pricePerPerson = selectedPlan === 'bronce' ? 95000 : 65000;
      totalCost = (adults * pricePerPerson) + (children * Math.max(0, pricePerPerson - 10000));
      experienceName = `Pasadía (${selectedPlan === 'bronce' ? 'Pase Andicas Gourmet & Selva' : 'Pase Andicas Bio-Aventura'})`;
      dateText = dates.checkIn ? `Día de visita: ${dates.checkIn}` : 'Fecha por coordinar';
      if (selectedPlan === 'bronce') addons.push('Almuerzo campesino gourmet incluido');
    } else if (selectedType === 'pasanoche') {
      const pricePerPerson = selectedNightPlan === 'plata' ? 90000 : 70000;
      totalCost = (adults * pricePerPerson) + (children * Math.max(0, pricePerPerson - 10000));
      experienceName = `Pasanoche (${selectedNightPlan === 'plata' ? 'Velada Astral, Fogata & Cine' : 'Noche de Luces & Manantiales'})`;
      dateText = dates.checkIn ? `Noche de visita: ${dates.checkIn}` : 'Fecha por coordinar';
      if (selectedNightPlan === 'plata') addons.push('Cine al aire libre & masmelos en fogata');
    }

    if (pets > 0) {
      addons.push(`${pets} Mascota(s)`);
    }

    const deposit50 = Math.round(totalCost * 0.5);

    let targetPhone = contactData.phones.pasadia.number;
    if (selectedType === 'cabana') targetPhone = contactData.phones.hospedaje.number;

    return {
      experienceName,
      dateText,
      adults,
      children,
      pets,
      addonsText: addons.join(' | '),
      totalCost,
      deposit50,
      targetPhone,
      notes,
    };
  };

  const currentEstimates = calculateEstimates();

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const summary = calculateEstimates();
    onClose();
    if (onOpenSummary) {
      onOpenSummary(summary);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-jade-950 border border-gold-500/50 shadow-2xl p-3.5 sm:p-6 z-10 text-linen-100"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 sm:p-2 rounded-xl bg-jade-900 border border-gold-500/30 text-linen-300 hover:text-white hover:border-gold-400 transition-colors cursor-pointer z-20"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Header */}
          <div className="mb-3.5 sm:mb-4 pr-8">
            <h2 className="font-display text-lg sm:text-2xl font-black text-linen-100 uppercase tracking-wide leading-tight">
              {activeModules?.bookings === false ? 'SERVICIO TEMPORALMENTE EN PAUSA' : 'CONFIGURA TU VISITA'}
            </h2>
            <p className="text-[11px] sm:text-xs font-fredoka text-linen-300 mt-0.5">
              {activeModules?.bookings === false 
                ? 'El agendamiento en línea no está disponible en este momento.'
                : 'Personaliza tu plan, selecciona fechas y obtén tu cotización instantánea.'}
            </p>
          </div>

          {activeModules?.bookings === false ? (
            <div className="py-8 px-4 text-center space-y-4 font-fredoka">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-lg">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-red-400 uppercase tracking-wide">
                  Agendamiento de Citas Deshabilitado
                </h3>
                <p className="text-xs text-linen-300 max-w-md mx-auto mt-2 leading-relaxed font-light">
                  El motor de agendamiento de citas y reservas en línea se encuentra temporalmente suspendido. Para consultar fechas disponibles y atención directa, comunícate con recepción.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <a
                  href="https://wa.me/573104567890?text=Hola%20Andicas,%20deseo%20consultar%20disponibilidad%20de%20cabañas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Atención Vía WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-linen-200 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4 sm:space-y-5 font-fredoka">
            {/* 1. Experience Type Selector - 3 columns aligned horizontally */}
            <div>
              <label className="text-[11px] sm:text-xs font-cartoon font-bold uppercase tracking-wider text-gold-400 block mb-1.5">
                1. Tipo de Experiencia:
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                {experienceTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex flex-col justify-between items-center text-center gap-1 ${
                        isSelected
                          ? 'bg-jade-900/90 border-gold-400 shadow-gold-glow'
                          : 'bg-jade-950/70 border-white/10 hover:border-gold-500/40'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-gold-500 text-jade-950' : 'bg-jade-900 text-gold-400'}`}>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <h4 className="font-cartoon text-[11px] sm:text-xs font-bold text-linen-100 uppercase leading-tight">{type.name}</h4>
                        <p className="text-[9px] sm:text-[10px] text-linen-400 mt-0.5 line-clamp-1">{type.subtitle}</p>
                      </div>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2A. If Cabana: LEFT THUMBNAILS ONLY + RIGHT PHOTO & DESCRIPTION */}
            {selectedType === 'cabana' && (
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-cartoon font-bold uppercase tracking-wider text-gold-400 block mb-1">
                  2. Elige tu Hospedaje:
                </label>

                {/* SIDE-BY-SIDE SPLIT: LEFT (THUMBNAIL IMAGES ONLY) | RIGHT (PHOTO + INFO ABAJITO) */}
                <div className="flex gap-2 sm:gap-3 items-stretch">
                  {/* LEFT SIDE: Vertical rail of ONLY thumbnail images */}
                  <div className="w-14 sm:w-16 flex-shrink-0 flex flex-col gap-1.5 max-h-[310px] sm:max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-gold-500/40">
                    {cabinsData.map((cabin) => {
                      const isSelected = selectedCabin.id === cabin.id;
                      return (
                        <button
                          key={cabin.id}
                          type="button"
                          onClick={() => setSelectedCabin(cabin)}
                          className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 group ${
                            isSelected
                              ? 'border-gold-400 ring-2 ring-gold-400/60 shadow-gold-glow scale-[1.03] z-10'
                              : 'border-white/15 opacity-60 hover:opacity-100 hover:border-gold-500/50'
                          }`}
                          title={cabin.name}
                        >
                          <img
                            src={cabin.image}
                            alt={cabin.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-gold-500/20 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-gold-300 drop-shadow" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* RIGHT SIDE: Selected Cabin Showcase (Photo on top + Description & Info below) */}
                  <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedCabin.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="h-full rounded-2xl overflow-hidden glass-dark border border-gold-500/40 shadow-xl bg-jade-950/90 flex flex-col justify-between"
                      >
                        {/* Main Photo Banner */}
                        <div className="relative h-28 sm:h-40 overflow-hidden flex-shrink-0">
                          <img
                            src={selectedCabin.image}
                            alt={selectedCabin.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/30 to-transparent" />
                          
                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md bg-black/85 text-gold-300 font-cartoon font-bold text-[9px] uppercase tracking-wider border border-gold-500/30 backdrop-blur-sm truncate max-w-[130px] sm:max-w-none">
                              ★ {selectedCabin.badge}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-jade-900/90 text-linen-100 font-fredoka font-bold text-[9px] border border-white/10">
                              {selectedCabin.capacity}
                            </span>
                          </div>

                          {/* Bottom Info inside image */}
                          <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-end justify-between">
                            <div className="min-w-0">
                              <span className="text-[8px] text-gold-400 font-cartoon uppercase tracking-wider block">
                                {selectedCabin.type}
                              </span>
                              <h4 className="font-display text-xs sm:text-base font-black text-linen-100 uppercase tracking-wide truncate">
                                {selectedCabin.name}
                              </h4>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-display text-xs sm:text-base font-black text-gold-gradient block leading-tight">
                                {selectedCabin.priceFormatted}
                              </span>
                              <span className="text-[8px] text-linen-400 block font-fredoka">
                                {selectedCabin.period}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Integrated Description & Specs (Directamente abajito de la foto) */}
                        <div className="p-2.5 sm:p-3.5 space-y-1.5 text-left flex-1 flex flex-col justify-between">
                          <p className="text-[10px] sm:text-xs font-fredoka text-linen-200 leading-snug line-clamp-2">
                            {selectedCabin.tagline}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-jade-900 border border-white/10 text-[8px] sm:text-[9px] text-gold-300 font-fredoka">
                              🛁 {selectedCabin.jacuzzi}
                            </span>
                            {selectedCabin.hasCatamaran && (
                              <span className="px-1.5 py-0.5 rounded bg-jade-900 border border-white/10 text-[8px] sm:text-[9px] text-hoja-400 font-fredoka">
                                🕸️ Catamarán
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-jade-900 border border-white/10 text-[8px] sm:text-[9px] text-linen-300 font-fredoka">
                              🍳 Desayuno incl.
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-jade-900 border border-white/10 text-[8px] sm:text-[9px] text-linen-300 font-fredoka">
                              🔥 Fogata & Cine
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/* 2B. If Pasadia: Modalidad de Pasadía */}
            {selectedType === 'pasadia' && (
              <div>
                <label className="text-[11px] sm:text-xs font-cartoon font-bold uppercase tracking-wider text-gold-400 block mb-1.5">
                  2. Modalidad de Pasadía:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedPlan('aventurero')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedPlan === 'aventurero'
                        ? 'bg-jade-900 border-gold-400 shadow-gold-glow'
                        : 'bg-jade-950/60 border-white/10 hover:border-gold-500/30'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] text-gold-400 font-cartoon font-bold uppercase block">Pase Aventura</span>
                      <h4 className="font-cartoon text-xs font-bold text-linen-100 leading-tight">Bio-Aventura</h4>
                      <p className="text-[10px] text-linen-300 mt-1 line-clamp-2">Piscinas de roca, caverna, shows y senderos.</p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-white/10 font-mono text-xs font-bold text-gold-400">
                      $65.000 COP
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedPlan('bronce')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedPlan === 'bronce'
                        ? 'bg-jade-900 border-gold-400 shadow-gold-glow'
                        : 'bg-jade-950/60 border-white/10 hover:border-gold-500/30'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] text-hoja-400 font-cartoon font-bold uppercase block">+ Almuerzo Típico</span>
                      <h4 className="font-cartoon text-xs font-bold text-linen-100 leading-tight">Gourmet & Selva</h4>
                      <p className="text-[10px] text-linen-300 mt-1 line-clamp-2">Todo lo anterior + Almuerzo campesino a la mesa.</p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-white/10 font-mono text-xs font-bold text-gold-400">
                      $95.000 COP
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2C. If Pasanoche: Modalidad de Pasanoche */}
            {selectedType === 'pasanoche' && (
              <div>
                <label className="text-[11px] sm:text-xs font-cartoon font-bold uppercase tracking-wider text-gold-400 block mb-1.5">
                  2. Modalidad de Pasanoche:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedNightPlan('nocturna')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedNightPlan === 'nocturna'
                        ? 'bg-jade-900 border-gold-400 shadow-gold-glow'
                        : 'bg-jade-950/60 border-white/10 hover:border-gold-500/30'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] text-sky-300 font-cartoon font-bold uppercase block">Piscina Nocturna</span>
                      <h4 className="font-cartoon text-xs font-bold text-linen-100 leading-tight">Luces & Manantiales</h4>
                      <p className="text-[10px] text-linen-300 mt-1 line-clamp-2">Piscina climatizada bajo estrellas y antorchas.</p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-white/10 font-mono text-xs font-bold text-gold-400">
                      $70.000 COP
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedNightPlan('plata')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedNightPlan === 'plata'
                        ? 'bg-jade-900 border-gold-400 shadow-gold-glow'
                        : 'bg-jade-950/60 border-white/10 hover:border-gold-500/30'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] text-gold-400 font-cartoon font-bold uppercase block">Cine + Fogata</span>
                      <h4 className="font-cartoon text-xs font-bold text-linen-100 leading-tight">Velada Astral</h4>
                      <p className="text-[10px] text-linen-300 mt-1 line-clamp-2">Piscina + Cine en pantalla gigante y masmelos.</p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-white/10 font-mono text-xs font-bold text-gold-400">
                      $90.000 COP
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Custom Interactive Calendar */}
            <div>
              <label className="text-[11px] sm:text-xs font-cartoon font-bold uppercase tracking-wider text-gold-400 block mb-1.5">
                {selectedType === 'cabana' ? '3. Fechas de Hospedaje (Check-in / Out):' : '3. Fecha de Visita:'}
              </label>
              <CustomCalendar
                mode={selectedType === 'cabana' ? "range" : "single"}
                startDate={dates.checkIn}
                endDate={dates.checkOut}
                onRangeChange={({ startDate, endDate }) => setDates({ checkIn: startDate, checkOut: endDate })}
                singleDate={dates.checkIn}
                onSingleDateChange={(date) => setDates({ checkIn: date, checkOut: null })}
                compact={true}
              />
            </div>

            {/* 4. Guests & Pets Counters */}
            <div>
              <label className="text-[11px] sm:text-xs font-cartoon font-bold uppercase tracking-wider text-gold-400 block mb-1.5">
                4. Personas y Mascotas:
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                {/* Adults */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-jade-900/70 border border-white/10 text-center">
                  <span className="text-[10px] sm:text-xs font-cartoon font-bold text-linen-100 uppercase block mb-1">
                    Adultos
                  </span>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center cursor-pointer text-linen-100"
                    >-</button>
                    <span className="w-5 text-center font-mono font-bold text-gold-400 text-xs sm:text-sm">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults(adults + 1)}
                      className="w-6 h-6 rounded bg-gold-500 hover:bg-gold-400 text-jade-950 text-xs font-bold flex items-center justify-center cursor-pointer"
                    >+</button>
                  </div>
                </div>

                {/* Children */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-jade-900/70 border border-white/10 text-center">
                  <span className="text-[10px] sm:text-xs font-cartoon font-bold text-linen-100 uppercase block mb-1">
                    Niños
                  </span>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center cursor-pointer text-linen-100"
                    >-</button>
                    <span className="w-5 text-center font-mono font-bold text-gold-400 text-xs sm:text-sm">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren(children + 1)}
                      className="w-6 h-6 rounded bg-gold-500 hover:bg-gold-400 text-jade-950 text-xs font-bold flex items-center justify-center cursor-pointer"
                    >+</button>
                  </div>
                </div>

                {/* Pets */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-jade-900/70 border border-white/10 text-center">
                  <span className="text-[10px] sm:text-xs font-cartoon font-bold text-linen-100 uppercase block mb-1">
                    Mascotas
                  </span>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setPets(Math.max(0, pets - 1))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center justify-center cursor-pointer text-linen-100"
                    >-</button>
                    <span className="w-5 text-center font-mono font-bold text-gold-400 text-xs sm:text-sm">{pets}</span>
                    <button
                      type="button"
                      onClick={() => setPets(pets + 1)}
                      className="w-6 h-6 rounded bg-gold-500 hover:bg-gold-400 text-jade-950 text-xs font-bold flex items-center justify-center cursor-pointer"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Observations */}
            <div>
              <label className="text-[11px] sm:text-xs font-cartoon font-bold uppercase tracking-wider text-gold-400 block mb-1">
                Peticiones u Observaciones (Opcional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="¿Celebras aniversario, cumpleaños o requieres algo especial?"
                className="w-full bg-jade-900/60 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs text-linen-100 outline-none transition-colors"
              />
            </div>

            {/* 6. Live Cost Estimate Bar */}
            <div className="p-3 rounded-xl bg-jade-900/90 border border-gold-500/40 flex items-center justify-between gap-2 shadow-inner">
              <div>
                <span className="text-[9px] text-linen-400 uppercase font-cartoon block">Total Estimado:</span>
                <span className="font-display text-base sm:text-lg font-black text-gold-gradient block leading-tight">
                  {formatCOP(currentEstimates.totalCost)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-gold-400 uppercase font-cartoon block">Anticipo 50%:</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-linen-100 block leading-tight">
                  {formatCOP(currentEstimates.deposit50)}
                </span>
              </div>
            </div>

            {/* 7. Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl sm:rounded-2xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg flex items-center justify-center gap-2 cursor-pointer transition-all border border-gold-400"
              >
                <span>Ver Resumen & Confirmar Disponibilidad</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
