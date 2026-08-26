import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ArrowRight, Check, Ban, Sparkles, CreditCard, ShieldCheck, 
  CheckCircle2, Mail, Phone, User, ExternalLink, HelpCircle, Lock
} from 'lucide-react';
import { cabinsData, cabinAddons, generalCabinPolicy } from '../data/cabins';
import CustomCalendar from '../components/CustomCalendar';
import BookingSummaryModal from '../components/BookingSummaryModal';
import BookingSuccessModal from '../components/BookingSuccessModal';
import { contactData } from '../data/banking';
import { getCabinAvailability, createWompiCheckout, openWompiWidget, simulatePayment } from '../services/api';

export default function CabanasPage({ onNavigate, onShowToast, activeModules }) {
  const [selectedCabin, setSelectedCabin] = useState(cabinsData[0]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Client info form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isProcessingWompi, setIsProcessingWompi] = useState(false);

  // Date range
  const [dateRange, setDateRange] = useState({
    startDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d.toISOString().split('T')[0];
    })(),
    endDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 4);
      return d.toISOString().split('T')[0];
    })()
  });
  
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // Fetch availability when cabin changes
  useEffect(() => {
    let isMounted = true;
    async function loadBlocked() {
      setIsLoadingAvailability(true);
      try {
        const dates = await getCabinAvailability(selectedCabin.id);
        if (isMounted) setBlockedDates(dates);
      } catch (err) {
        console.error('Error cargando fechas:', err);
      } finally {
        if (isMounted) setIsLoadingAvailability(false);
      }
    }
    loadBlocked();
    return () => { isMounted = false; };
  }, [selectedCabin.id]);

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) => 
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Calculations
  let nightCount = 1;
  if (dateRange.startDate && dateRange.endDate) {
    const s = new Date(dateRange.startDate);
    const e = new Date(dateRange.endDate);
    nightCount = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  }

  // Cost calculation
  const baseCost = selectedCabin.price * nightCount;
  const addonsCost = selectedAddons.reduce((sum, addonId) => {
    const addon = cabinAddons.find((a) => a.id === addonId);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const totalCost = baseCost + addonsCost;
  const deposit50 = Math.round(totalCost * 0.5);
  const remaining50 = totalCost - deposit50;

  const formatCOP = (num) => `$${(num || 0).toLocaleString('es-CO')} COP`;

  const resetReservationForm = () => {
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setSelectedAddons([]);
    setDateRange({
      startDate: null,
      endDate: null,
    });
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
    resetReservationForm();
  };

  // WOMPI PAYMENT HANDLER (50% Deposit)
  const handlePayDepositWompi = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      if (onShowToast) onShowToast({ message: 'Selecciona fechas', subtext: 'Elige fecha de check-in y check-out.' });
      return;
    }

    if (!clientName || !clientEmail || !clientPhone) {
      if (onShowToast) onShowToast({ message: 'Datos incompletos', subtext: 'Por favor ingresa tu nombre, correo y celular.' });
      return;
    }

    setIsProcessingWompi(true);
    try {
      const formattedNotes = selectedAddons.length > 0 
        ? selectedAddons.map(id => {
            const a = cabinAddons.find(item => item.id === id);
            return a ? `${a.emoji} ${a.name} (${a.priceFormatted})` : id;
          }).join(' • ')
        : '';

      // 1. Crear checkout en backend
      const checkoutRes = await createWompiCheckout({
        cabin_id: selectedCabin.id,
        cabin_name: selectedCabin.name,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        check_in_date: dateRange.startDate,
        check_out_date: dateRange.endDate,
        guests_count: selectedCabin.pricingModel === 'por-persona' ? 1 : 2,
        addons_cost: addonsCost,
        notes: formattedNotes,
      });

      // 2. Abrir Wompi Widget Oficial
      openWompiWidget({
        publicKey: checkoutRes.public_key,
        amountInCents: checkoutRes.amount_in_cents,
        reference: checkoutRes.booking_reference,
        signature: checkoutRes.signature,
        clientEmail,
        clientName,
        clientPhone,
        onComplete: (transaction) => {
          if (transaction?.status === 'APPROVED') {
            setConfirmedBookingData({
              booking_reference: checkoutRes.booking_reference,
              cabin_name: selectedCabin.name,
              client_name: clientName,
              client_email: clientEmail,
              client_phone: clientPhone,
              check_in_date: dateRange.startDate,
              check_out_date: dateRange.endDate,
              guests_count: 2,
              total_amount_cop: totalCost,
              deposit_amount_cop: deposit50,
              remaining_balance_cop: remaining50,
              notes: formattedNotes,
            });
            setSuccessModalOpen(true);
            resetReservationForm();
            // Refresh blocked dates
            getCabinAvailability(selectedCabin.id).then(setBlockedDates);
          }
        }
      });
    } catch (err) {
      console.error('Error procesando Wompi:', err);
      if (onShowToast) onShowToast({ message: 'Error de pasarela', subtext: err.message });
    } finally {
      setIsProcessingWompi(false);
    }
  };

  // Simulación de prueba directa para desarrollo
  const handleSimulatePaymentDev = async () => {
    let start = dateRange.startDate;
    let end = dateRange.endDate;

    // Si no ha seleccionado fechas, asignamos automáticamente 2 noches próximas para la prueba
    if (!start || !end) {
      const d1 = new Date();
      d1.setDate(d1.getDate() + 2);
      const d2 = new Date();
      d2.setDate(d2.getDate() + 4);
      start = d1.toISOString().split('T')[0];
      end = d2.toISOString().split('T')[0];
      setDateRange({ startDate: start, endDate: end });
    }

    const finalName = clientName.trim() || 'Juan Pablo Huésped';
    const finalEmail = clientEmail.trim() || 'juanpabloto2000@gmail.com';
    const finalPhone = clientPhone.trim() || '3104567890';

    setIsProcessingWompi(true);
    try {
      const formattedNotes = selectedAddons.length > 0 
        ? selectedAddons.map(id => {
            const a = cabinAddons.find(item => item.id === id);
            return a ? `${a.emoji} ${a.name} (${a.priceFormatted})` : id;
          }).join(' • ')
        : '';

      const checkoutRes = await createWompiCheckout({
        cabin_id: selectedCabin.id,
        cabin_name: selectedCabin.name,
        client_name: finalName,
        client_email: finalEmail,
        client_phone: finalPhone,
        check_in_date: start,
        check_out_date: end,
        guests_count: selectedCabin.pricingModel === 'por-persona' ? 1 : 2,
        addons_cost: addonsCost,
        notes: formattedNotes,
      });

      const simRes = await simulatePayment(checkoutRes.booking_reference);
      if (simRes.success && simRes.booking) {
        setConfirmedBookingData(simRes.booking);
        setSuccessModalOpen(true);
        resetReservationForm();
        const updatedDates = await getCabinAvailability(selectedCabin.id);
        setBlockedDates(updatedDates);
        if (onShowToast) {
          onShowToast({
            message: '¡Reserva Confirmada & Agendada!',
            subtext: `Voucher enviado a ${simRes.booking.client_email}`
          });
        }
      } else {
        throw new Error(simRes.error || 'Error procesando la simulación en el servidor.');
      }
    } catch (err) {
      console.error('Error simulando:', err);
      if (onShowToast) {
        onShowToast({ message: 'Error de simulación', subtext: err.message || 'Verifica la conexión con el servidor backend.' });
      }
    } finally {
      setIsProcessingWompi(false);
    }
  };

  const summaryData = {
    experienceName: `Hospedaje: ${selectedCabin.name}`,
    dateText: `${dateRange.startDate || 'Pendiente'} hasta ${dateRange.endDate || 'Pendiente'} (${nightCount} Noche/s)`,
    adults: selectedCabin.pricingModel === 'por-persona' ? (selectedCabin.maxGuests || 4) : 2,
    children: 0,
    pets: 0,
    addonsText: selectedAddons.map((id) => {
      const a = cabinAddons.find((add) => add.id === id);
      return a ? `${a.emoji} ${a.name}` : '';
    }).filter(Boolean).join(' | '),
    totalCost: totalCost,
    deposit50: deposit50,
    targetPhone: contactData.phones.hospedaje.number,
    notes: `Reserva para ${selectedCabin.name} (${selectedCabin.capacity}).`
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-20 px-2.5 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 mb-6 sm:mb-10"
        >
          <h1 className="font-display text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-black text-3d-gold uppercase tracking-wide">
            Cabañas & Hospedaje Ancestral
          </h1>
          <p className="text-xs sm:text-base font-fredoka text-linen-300 max-w-2xl mx-auto px-4">
            Reserva con el <strong className="text-gold-400">50% de anticipo garantizado vía Wompi</strong> (Nequi, PSE, Tarjetas) y paga el saldo al llegar al resort.
          </p>
        </motion.div>

        {/* Master Responsive Layout: Split Layout on Mobile & 3-Column on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          
          {/* ========================================================= */}
          {/* MOBILE ONLY: Horizontal Photo Selector Strip */}
          {/* ========================================================= */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 px-1 scrollbar-none">
            {cabinsData.map((cabin) => {
              const isSelected = selectedCabin.id === cabin.id;

              return (
                <button
                  type="button"
                  key={cabin.id}
                  onClick={() => {
                    setSelectedCabin(cabin);
                    setActiveGalleryIndex(0);
                  }}
                  className={`w-14 h-14 rounded-2xl overflow-hidden border-2 cursor-pointer relative flex-shrink-0 transition-all ${
                    isSelected
                      ? 'border-gold-400 shadow-gold-glow ring-2 ring-gold-400/60 scale-105'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={cabin.image} 
                    alt={cabin.name} 
                    className="w-full h-full object-cover" 
                  />
                </button>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* DESKTOP ONLY: Minimalist Visual Photo Rail (lg:block hidden) */}
          {/* ========================================================= */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
            className="hidden lg:flex lg:col-span-2 flex-col gap-2 p-3 rounded-3xl glass-dark border border-gold-600/20 shadow-2xl max-h-[660px] overflow-y-auto scrollbar-thin scrollbar-thumb-gold-500/20"
          >
            <div className="pb-1 text-center border-b border-white/10">
              <span className="text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-widest block">
                Cabañas
              </span>
            </div>

            {/* 10 Cabins Clean Photo Grid */}
            <div className="grid grid-cols-2 gap-2">
              {cabinsData.map((cabin) => {
                const isSelected = selectedCabin.id === cabin.id;

                return (
                  <div
                    key={cabin.id}
                    onClick={() => {
                      setSelectedCabin(cabin);
                      setActiveGalleryIndex(0);
                    }}
                    title={`${cabin.name} — ${cabin.priceFormatted}`}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer relative group transition-all duration-300 ${
                      isSelected
                        ? 'border-gold-400 shadow-gold-glow scale-[1.04] ring-2 ring-gold-400/60 z-10'
                        : 'border-white/10 opacity-65 hover:opacity-100 hover:border-gold-500/50 hover:scale-[1.02]'
                    }`}
                  >
                    <img 
                      src={cabin.image} 
                      alt={cabin.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-gold-500/10 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* SHOWCASE COLUMN: Center Feature Showcase */}
          {/* ========================================================================= */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 85, damping: 15, delay: 0.15 }}
            className="lg:col-span-6 space-y-4"
          >
            {/* Main Showcase Card */}
            <div className="rounded-3xl glass-dark border border-gold-500/30 overflow-hidden shadow-2xl space-y-4 p-3.5 sm:p-5 text-left">
              
              {/* Image & Gallery Carousel */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-inner">
                <img
                  src={selectedCabin.gallery?.[activeGalleryIndex] || selectedCabin.image}
                  alt={selectedCabin.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-transparent to-transparent pointer-events-none" />

                {/* Price Display */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div>
                    <span className="font-mono text-xl sm:text-2xl font-black text-gold-gradient drop-shadow-md block">
                      {selectedCabin.priceFormatted}
                    </span>
                    <span className="text-[10px] sm:text-xs text-linen-300 font-fredoka block">
                      {selectedCabin.period}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cabin Details & Description */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-widest block">
                      {selectedCabin.type}
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                      {selectedCabin.name}
                    </h2>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-fredoka text-linen-300 leading-relaxed">
                  {selectedCabin.description}
                </p>
              </div>

              {/* Inclusions Grid */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-[11px] font-cartoon font-bold text-gold-400 uppercase block mb-2">
                  ✨ Incluye en tu Estadía:
                </span>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {selectedCabin.features?.map((f, i) => (
                    <div key={i} className="p-2 rounded-xl bg-jade-950/60 border border-white/5 flex items-center gap-2 text-xs font-fredoka">
                      <span className="text-sm">{f.emoji}</span>
                      <span className="text-linen-200 truncate">{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: CALENDAR + CLIENT INFO + WOMPI 50% CHECKOUT CARD */}
          {/* ========================================================================= */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.2 }}
            className="lg:col-span-4 w-full space-y-4"
          >
            {activeModules?.bookings === false ? (
              <div className="w-full p-6 sm:p-7 rounded-3xl glass-dark border-2 border-red-500/40 text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400 shadow-lg">
                  <Lock className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] uppercase font-black tracking-widest inline-block">
                    Módulo en Pausa
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-black text-white uppercase tracking-wide">
                    Agendamiento en Línea Deshabilitado
                  </h3>
                  <p className="text-xs font-fredoka text-linen-300 max-w-sm mx-auto leading-relaxed">
                    El motor de reservas en línea está pausado temporalmente. Para consultar disponibilidad de la <strong>{selectedCabin.name}</strong> y agendar tu estadía de forma directa, comunícate con recepción vía WhatsApp.
                  </p>
                </div>
                <a
                  href={`https://wa.me/573104567890?text=${encodeURIComponent(`¡Hola Andicas! Deseo consultar disponibilidad para la ${selectedCabin.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-shimmer w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cartoon font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400"
                >
                  <span>Consultar Disponibilidad por WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <>
                {/* TOP: Calendar with Real Blocked Dates */}
                <div className="w-full max-w-[320px] sm:max-w-md mx-auto px-1 sm:px-0">
                  <CustomCalendar
                    mode="range"
                    compact={true}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onRangeChange={setDateRange}
                    blockedDates={blockedDates}
                  />
                </div>

                {/* Customizer & Wompi Checkout Card */}
                <div className="w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl glass-dark border border-gold-600/30 space-y-3 sm:space-y-4 shadow-2xl text-left">
                  <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-white/10">
                    <h3 className="font-display text-sm sm:text-base font-black text-linen-100 uppercase tracking-wide">
                      DATOS & RESERVA SEGURA
                    </h3>
                    <span className="text-[10px] sm:text-xs font-cartoon font-bold text-gold-400 px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/30">
                      {nightCount} {nightCount === 1 ? 'Noche' : 'Noches'}
                    </span>
                  </div>

                  {/* Client Form Fields */}
                  <div className="space-y-2 font-fredoka text-xs">
                    <div>
                      <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Nombre Completo:</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ej. Mateo Gómez"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-jade-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-linen-100 placeholder-linen-500 focus:outline-none focus:border-gold-400 pr-8"
                        />
                        <User className="w-3.5 h-3.5 text-linen-400 absolute right-2.5 top-2.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Correo Electrónico:</label>
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="tu@correo.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full bg-jade-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-linen-100 placeholder-linen-500 focus:outline-none focus:border-gold-400 pr-7"
                          />
                          <Mail className="w-3.5 h-3.5 text-linen-400 absolute right-2 top-2.5" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">WhatsApp / Teléfono:</label>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="312 456 7890"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full bg-jade-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-linen-100 placeholder-linen-500 focus:outline-none focus:border-gold-400 pr-7"
                          />
                          <Phone className="w-3.5 h-3.5 text-linen-400 absolute right-2 top-2.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Addons */}
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-cartoon font-bold text-gold-400 uppercase block mb-1.5">
                      Adicionales Opcionales:
                    </label>
                    <div className="space-y-1.5">
                      {cabinAddons.map((addon) => {
                        const isChecked = selectedAddons.includes(addon.id);
                        return (
                          <div
                            key={addon.id}
                            onClick={() => toggleAddon(addon.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isChecked
                                ? 'bg-gold-600/15 border-gold-500/50 shadow-inner'
                                : 'bg-jade-950/60 border-white/10 hover:border-gold-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                                isChecked ? 'bg-gold-500 border-gold-400 text-jade-950' : 'border-white/30'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className="text-sm flex-shrink-0">{addon.emoji}</span>
                              <span className="text-[11px] font-cartoon font-bold text-linen-100 block truncate">
                                {addon.name}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-gold-400 pl-1.5">
                              + {addon.priceFormatted}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cost Calculation & 50% Deposit Breakdown */}
                  <div className="p-3.5 rounded-2xl bg-jade-950/90 border border-gold-600/30 space-y-2 text-xs font-fredoka">
                    <div className="flex justify-between text-linen-300 text-[11px]">
                      <span>Total Estadía ({nightCount} noche/s):</span>
                      <span className="font-mono text-linen-100 font-bold">{formatCOP(totalCost)}</span>
                    </div>

                    <div className="flex justify-between text-hoja-400 font-bold pt-1 border-t border-white/10 text-xs">
                      <span>Anticipo 50% Obligatorio:</span>
                      <span className="font-mono">{formatCOP(deposit50)}</span>
                    </div>

                    <div className="flex justify-between text-linen-400 text-[10px]">
                      <span>Saldo a pagar en recepción al llegar:</span>
                      <span className="font-mono">{formatCOP(remaining50)}</span>
                    </div>
                  </div>

                  {/* WOMPI CHECKOUT BUTTON OR LOCKED NOTICE */}
                  {activeModules?.wompi_payments === false ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs font-cartoon uppercase">
                        <Lock className="w-4 h-4" />
                        <span>Pasarela Wompi en Pausa</span>
                      </div>
                      <p className="text-[11px] text-linen-300 font-fredoka leading-relaxed">
                        La verificación de pagos en línea está en pausa. Asegura tu reserva transfiriendo directamente a la cuenta institucional.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSummaryModalOpen(true)}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <span>Ver Cuentas Bancarias / WhatsApp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handlePayDepositWompi}
                        disabled={isProcessingWompi}
                        className="btn-shimmer w-full py-3.5 px-4 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-gold-400 disabled:opacity-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {isProcessingWompi ? 'Conectando con Wompi...' : `Pagar Anticipo 50% (${formatCOP(deposit50)})`}
                        </span>
                      </button>

                      {/* Payment Methods Supported Icons */}
                      <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-linen-400 font-fredoka">
                        <ShieldCheck className="w-3.5 h-3.5 text-hoja-400" />
                        <span>Acepta <strong>Nequi, PSE, Tarjetas y Bancolombia</strong></span>
                      </div>

                      {/* Developer Test Simulation Button */}
                      <div className="pt-2 border-t border-white/5 text-center">
                        <button
                          type="button"
                          onClick={handleSimulatePaymentDev}
                          className="text-[10px] font-mono text-gold-400/70 hover:text-gold-300 underline cursor-pointer"
                        >
                          ⚡ [Modo Demo] Simular Pago Wompi & Enviar Correo de Prueba
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>

        </div>
      </div>

      {/* Booking Summary Modal */}
      <BookingSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        summaryData={summaryData}
        onShowToast={onShowToast}
      />

      {/* Booking Success & Voucher Modal */}
      <BookingSuccessModal
        isOpen={successModalOpen}
        onClose={handleCloseSuccessModal}
        bookingData={confirmedBookingData}
      />
    </div>
  );
}
