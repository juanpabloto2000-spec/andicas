import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Users, Home, Sparkles, Send, PawPrint, ChevronDown, ChevronLeft, ChevronRight, Check, Sun, Moon } from 'lucide-react';
import { contactData } from '../data/banking';

const EXPERIENCES = [
  {
    id: 'cabana',
    title: 'Cabañas Luxury & Hospedaje',
    desc: 'Nido en el Dosel, Las Palmas, Mirador o Glamping con jacuzzi',
    icon: Home,
    phone: contactData.phones.hospedaje.number,
  },
  {
    id: 'pasadia',
    title: 'Pasadía de Aventura',
    desc: 'Piscinas naturales, caverna, show equino y atracciones (9 AM a 5 PM)',
    icon: Sun,
    phone: contactData.phones.pasadia.number,
  },
  {
    id: 'pasanoche',
    title: 'Pasanoche Mágico',
    desc: 'Piscina climatizada nocturna, cine bajo las estrellas y fogata',
    icon: Moon,
    phone: contactData.phones.pasadia.number,
  },
  {
    id: 'eventos',
    title: 'Grupos & Eventos Especiales',
    desc: 'Integraciones empresariales, colegios y celebraciones privadas',
    icon: Users,
    phone: contactData.phones.eventos.number,
  },
];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export default function QuickBookingBar({ className = '' }) {
  const [selectedExp, setSelectedExp] = useState(EXPERIENCES[0]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [adults, setAdults] = useState(2);
  const [pets, setPets] = useState(0);

  // Dropdown / Popover states
  const [expDropdownOpen, setExpDropdownOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [guestsDropdownOpen, setGuestsDropdownOpen] = useState(false);

  // Calendar navigation state
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const expRef = useRef(null);
  const calRef = useRef(null);
  const guestsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expRef.current && !expRef.current.contains(event.target)) {
        setExpDropdownOpen(false);
      }
      if (calRef.current && !calRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target)) {
        setGuestsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    const message = `¡Hola Andicas Bioparque Temático! 🌿✨
Deseo verificar disponibilidad para mi visita:

📍 *Experiencia:* ${selectedExp.title}
📅 *Fecha:* ${selectedDate}
👥 *Adultos / Personas:* ${adults}
🐾 *Mascotas:* ${pets > 0 ? `${pets} Mascota(s)` : 'Ninguna'}

¿Me podrían brindar información de disponibilidad y el proceso de reserva con el 50% de anticipo? Muchas gracias.`;

    const url = `https://wa.me/${selectedExp.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(calYear, calMonth, 1);
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const handlePrevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handlePickDate = (day) => {
    const picked = new Date(calYear, calMonth, day);
    picked.setHours(0, 0, 0, 0);
    if (picked < today) return;
    setSelectedDate(picked.toISOString().split('T')[0]);
    setCalendarOpen(false);
  };

  // Formatted date string for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Elige una fecha';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const SelectedIcon = selectedExp.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className={`w-full max-w-5xl mx-auto rounded-2xl p-4 sm:p-5 bg-jade-950/95 border border-gold-600/40 shadow-2xl relative z-40 ${className}`}
    >
      <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
        {/* 1. Custom Experience Dropdown */}
        <div ref={expRef} className="space-y-1.5 text-left relative z-50">
          <label className="text-xs font-cartoon font-bold tracking-wider text-gold-400 uppercase flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" />
            <span>Experiencia</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setExpDropdownOpen(!expDropdownOpen);
              setCalendarOpen(false);
              setGuestsDropdownOpen(false);
            }}
            className="w-full min-h-[48px] bg-jade-900/90 border border-white/15 hover:border-gold-500 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between transition-all cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-gold-600/20 text-gold-400 flex-shrink-0">
                <SelectedIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-fredoka font-semibold text-linen-100 block truncate">
                  {selectedExp.title}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gold-400 transition-transform ${expDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {expDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-jade-950 border border-gold-600/50 shadow-2xl p-2 space-y-1"
              >
                {EXPERIENCES.map((exp) => {
                  const Icon = exp.icon;
                  const isSelected = selectedExp.id === exp.id;
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => {
                        setSelectedExp(exp);
                        setExpDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected 
                          ? 'bg-gold-600/20 border border-gold-500/60' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md mt-0.5 ${
                        isSelected ? 'bg-gold-500 text-jade-950' : 'bg-jade-900 text-gold-400'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-cartoon font-bold text-linen-100 block">
                          {exp.title}
                        </span>
                        <span className="text-[11px] font-fredoka text-linen-300 block leading-tight">
                          {exp.desc}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-gold-400 mt-1 flex-shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Compact, Crisp Calendar Popover without blur */}
        <div ref={calRef} className="space-y-1.5 text-left relative z-50">
          <label className="text-xs font-cartoon font-bold tracking-wider text-gold-400 uppercase flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Fecha de Visita</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setCalendarOpen(!calendarOpen);
              setExpDropdownOpen(false);
              setGuestsDropdownOpen(false);
            }}
            className="w-full min-h-[48px] bg-jade-900/90 border border-white/15 hover:border-gold-500 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between transition-all cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-gold-600/20 text-gold-400 flex-shrink-0">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-fredoka font-semibold text-linen-100 block truncate">
                {formatDateDisplay(selectedDate)}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gold-400 transition-transform ${calendarOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Compact Calendar Popover (Solid, No Blur) */}
          <AnimatePresence>
            {calendarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 sm:w-64 sm:-left-2 mt-2 z-50 rounded-xl bg-jade-950 border border-gold-600/60 shadow-2xl p-3 space-y-2 text-linen-100"
              >
                {/* Header with Month / Year Switcher */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <span className="text-[11px] font-cartoon font-bold text-gold-400 uppercase tracking-wide">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevCalMonth}
                      disabled={calYear === today.getFullYear() && calMonth <= today.getMonth()}
                      className="p-1 rounded bg-jade-900 border border-white/10 hover:border-gold-400 disabled:opacity-30 disabled:pointer-events-none text-gold-400 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextCalMonth}
                      className="p-1 rounded bg-jade-900 border border-white/10 hover:border-gold-400 text-gold-400 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAY_NAMES.map((d, i) => (
                    <span key={i} className="text-[9px] font-bold text-gold-400 uppercase">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-6" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const thisDate = new Date(calYear, calMonth, day);
                    thisDate.setHours(0, 0, 0, 0);
                    const dateStr = thisDate.toISOString().split('T')[0];
                    const isPast = thisDate < today;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isPast}
                        onClick={() => handlePickDate(day)}
                        className={`h-6 w-full rounded font-fredoka text-[11px] font-semibold flex items-center justify-center transition-all ${
                          isPast
                            ? 'opacity-25 cursor-not-allowed text-linen-400'
                            : 'cursor-pointer hover:border-gold-400'
                        } ${
                          isSelected
                            ? 'bg-gold-500 text-jade-950 font-bold shadow-gold-glow scale-105 z-10'
                            : 'text-linen-200 hover:bg-white/10'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Custom Guests & Pets Dropdown */}
        <div ref={guestsRef} className="space-y-1.5 text-left relative z-50">
          <label className="text-xs font-cartoon font-bold tracking-wider text-gold-400 uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Personas & Mascotas</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setGuestsDropdownOpen(!guestsDropdownOpen);
              setExpDropdownOpen(false);
              setCalendarOpen(false);
            }}
            className="w-full min-h-[48px] bg-jade-900/90 border border-white/15 hover:border-gold-500 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between transition-all cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-400" />
              <span className="text-xs sm:text-sm font-fredoka font-semibold text-linen-100">
                {adults} {adults === 1 ? 'Adulto' : 'Adultos'}{pets > 0 ? ` · ${pets} Mascota(s)` : ''}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gold-400 transition-transform ${guestsDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {guestsDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-jade-950 border border-gold-600/50 shadow-2xl p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <span className="text-xs font-cartoon font-bold text-linen-100 block">Adultos</span>
                    <span className="text-[11px] font-fredoka text-linen-300">Mayores de 12 años</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-xs font-bold text-linen-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-bold font-fredoka text-gold-400">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults(adults + 1)}
                      className="w-7 h-7 rounded-md bg-gold-500 hover:bg-gold-400 text-jade-950 text-xs font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-cartoon font-bold text-linen-100 block flex items-center gap-1">
                      <span>Mascotas</span>
                      <PawPrint className="w-3 h-3 text-hoja-400" />
                    </span>
                    <span className="text-[11px] font-fredoka text-linen-300">100% Pet Friendly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPets(Math.max(0, pets - 1))}
                      className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-xs font-bold text-linen-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-bold font-fredoka text-gold-400">{pets}</span>
                    <button
                      type="button"
                      onClick={() => setPets(pets + 1)}
                      className="w-7 h-7 rounded-md bg-gold-500 hover:bg-gold-400 text-jade-950 text-xs font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGuestsDropdownOpen(false)}
                  className="w-full py-1.5 rounded-lg bg-jade-900 border border-gold-600/30 text-xs font-cartoon font-bold text-gold-300 hover:bg-gold-500/20 transition-all cursor-pointer uppercase tracking-wider"
                >
                  Listo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Action Button */}
        <div>
          <button
            type="submit"
            className="w-full min-h-[48px] py-2.5 px-5 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-gold-400"
          >
            <Sparkles className="w-4 h-4 text-jade-950" />
            <span>Consultar Disponibilidad</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
