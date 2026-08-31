import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, ShieldCheck, Copy, Check, Compass, ExternalLink,
  Lock, ArrowUpRight
} from 'lucide-react';
import { contactData } from '../data/banking';
import InteractiveTiltCard from './ui/InteractiveTiltCard';

export default function LocationAndBanking({ onShowToast, customConfig = {} }) {
  const [copiedBank, setCopiedBank] = useState(null);

  const activeBanks = (customConfig.bankAccounts && customConfig.bankAccounts.length > 0)
    ? customConfig.bankAccounts
    : (contactData.banks || []);

  const activeCustomPayments = (customConfig.customPaymentMethods || []).filter(m => m.enabled !== false);

  const copyToClipboard = (text, bankName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBank(bankName);
    setTimeout(() => setCopiedBank(null), 2500);

    if (onShowToast) {
      onShowToast({
        message: `Cuenta de ${bankName} copiada`,
        subtext: `${text} copiado al portapapeles con éxito`
      });
    }
  };

  const handleRouteClick = (platform) => {
    if (onShowToast) {
      onShowToast({
        message: `Ruta en ${platform}`,
        subtext: `Coordenadas fijadas: 04°38'12.4"N 75°45'28.9"W (Valle del Sol)`
      });
    }
  };

  return (
    <section id="ubicacion" aria-labelledby="ubicacion-heading" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Master Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ type: "spring", stiffness: 85, damping: 15 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <h2 id="ubicacion-heading" className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-linen-100 leading-tight mb-4 uppercase">
            CÓMO LLEGAR &{' '}
            <span className="text-3d-gold">GARANTÍA DE RESERVA</span>
          </h2>

          <p className="text-linen-200 font-fredoka text-sm sm:text-base leading-relaxed">
            Estamos ubicados en una privilegiada reserva natural, rodeados de bosque nativo y senderos ecológicos. Realiza tus reservas con total tranquilidad a través de nuestras cuentas corporativas oficiales.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start mb-12">
          {/* Left Column: Location & GPS Navigation (7 cols) - Slide in from Left */}
          <motion.div 
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="lg:col-span-7 rounded-3xl p-6 sm:p-8 glass-card border border-gold-600/30 flex flex-col justify-between shadow-2xl space-y-6"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-cartoon font-bold text-gold-400 tracking-wider uppercase block mb-1">
                    Dirección Principal
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-black text-linen-100 mb-1 uppercase">
                    Reserva Natural Los Andicas
                  </h3>
                  <address className="not-italic text-sm font-fredoka text-linen-200 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0" />
                    <span>{contactData.address}</span>
                  </address>
                </div>

                <div className="p-3 rounded-2xl bg-jade-900 border border-gold-600/40 text-gold-400 shadow-gold-glow">
                  <Compass className="w-6 h-6" />
                </div>
              </div>

              {/* Distance Times */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 text-xs font-fredoka">
                {[
                  { place: "Valle de Palmas", time: "15 min" },
                  { place: "Cascadas del Sol", time: "20 min" },
                  { place: "Terminal Ecoturístico", time: "25 min" },
                  { place: "Aeropuerto Regional", time: "45 min" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-jade-950/80 border border-white/10 text-center hover:border-gold-500/40 transition-colors">
                    <span className="text-linen-400 block text-[10px] uppercase font-cartoon">{item.place}</span>
                    <span className="text-gold-400 font-bold text-sm font-cartoon">{item.time}</span>
                  </div>
                ))}
              </div>

              {/* Interactive Visual Map Preview */}
              <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden border border-white/10 mb-4 shadow-inner group">
                <div 
                  className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80')"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/60 to-jade-950/40" />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gold-500 flex items-center justify-center text-jade-950 mb-2 shadow-gold-glow-lg animate-bounce">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="font-cartoon text-lg font-bold text-linen-100 uppercase tracking-wide">
                    Santuario Natural Andicas
                  </h4>
                  <p className="text-xs text-linen-300 font-fredoka mt-0.5">
                    Coordenadas GPS listas para navegación
                  </p>
                </div>
              </div>
            </div>

            {/* Redesigned Premium GPS Buttons with Official Vector SVGs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {/* Google Maps Button */}
              <button
                onClick={() => handleRouteClick('Google Maps')}
                className="group p-3.5 sm:p-4 rounded-2xl bg-jade-900/90 hover:bg-jade-900 border border-white/15 hover:border-gold-400 shadow-xl transition-all flex items-center gap-3.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-2 flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <img 
                    src="/google-maps-2020-icon.svg" 
                    alt="Google Maps" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-widest block leading-tight">
                    Ruta GPS Directa
                  </span>
                  <span className="font-display text-sm sm:text-base font-black text-linen-100 uppercase group-hover:text-gold-300 transition-colors leading-tight">
                    Google Maps
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-linen-400 group-hover:text-gold-400 transition-colors" />
              </button>

              {/* Waze Button */}
              <button
                onClick={() => handleRouteClick('Waze')}
                className="group p-3.5 sm:p-4 rounded-2xl bg-jade-900/90 hover:bg-jade-900 border border-white/15 hover:border-gold-400 shadow-xl transition-all flex items-center gap-3.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-xl bg-[#33CCFF] flex items-center justify-center p-1.5 flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <img 
                    src="/apple-waze.svg" 
                    alt="Waze" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-widest block leading-tight">
                    Tráfico en Vivo
                  </span>
                  <span className="font-display text-sm sm:text-base font-black text-linen-100 uppercase group-hover:text-gold-300 transition-colors leading-tight">
                    Waze Navegación
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-linen-400 group-hover:text-gold-400 transition-colors" />
              </button>
            </div>
          </motion.div>

          {/* Right Column: Redesigned Luxury Banking Cards (5 cols) - Slide in from Right */}
          <motion.div 
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
            className="lg:col-span-5 rounded-3xl p-6 sm:p-8 glass-dark border border-gold-500/40 shadow-2xl space-y-5"
          >
            {/* Header with Security Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-jade-900 border border-gold-600/40 text-gold-400 shadow-gold-glow">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-cartoon font-bold text-gold-400 tracking-widest uppercase block">
                    Cuentas Oficiales Autorizadas
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase">
                    Garantía Bancaria
                  </h3>
                </div>
              </div>
              <Lock className="w-4 h-4 text-gold-400/80" />
            </div>

            {/* Corporate Legal Entity Pill */}
            <div className="p-4 rounded-2xl bg-jade-950/90 border border-white/10 text-xs font-fredoka space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between text-linen-300">
                <span className="text-[11px] font-cartoon uppercase">Razón Social:</span>
                <span className="font-bold text-linen-100 text-right">{contactData.companyName}</span>
              </div>
              <div className="flex items-center justify-between text-linen-300">
                <span className="text-[11px] font-cartoon uppercase">NIT Oficial:</span>
                <span className="font-bold text-gold-400 font-mono text-xs">{contactData.nit}</span>
              </div>
              <div className="flex items-center justify-between text-linen-300 pt-1 border-t border-white/10">
                <span className="text-[11px] font-cartoon uppercase">Anticipo Requerido:</span>
                <span className="text-hoja-400 font-bold font-cartoon uppercase">50% para congelar tarifa</span>
              </div>
            </div>

            {/* Bespoke Luxury Bank Cards with 3D Tilt & Cursor Glow */}
            <div className="space-y-4">
              {activeBanks.map((b, bIdx) => (
                <InteractiveTiltCard
                  key={b.bank || bIdx}
                  tiltIntensity={10}
                  spotlightColor="rgba(252, 212, 119, 0.2)"
                  className="rounded-2xl border border-gold-500/40 bg-gradient-to-br from-jade-900/95 via-jade-950 to-[#041a1b] p-5 shadow-2xl space-y-3.5 hover:border-gold-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-lg text-gold-300 uppercase tracking-wide">
                        {b.bank}
                      </span>
                    </div>
                    <span className="text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-widest px-2.5 py-1 rounded-lg bg-gold-600/15 border border-gold-600/30">
                      {b.accountType || 'Ahorros Oficial'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white/[0.06] p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div>
                      <span className="text-[10px] text-linen-400 block uppercase font-cartoon tracking-wider">
                        Número de Cuenta:
                      </span>
                      <span className="font-mono text-base sm:text-lg font-black text-gold-gradient tracking-widest block">
                        {b.accountNumber}
                      </span>
                      {b.holder && (
                        <span className="text-[10px] text-linen-300 block font-fredoka mt-0.5">
                          Titular: {b.holder}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(b.accountNumber, b.bank);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-cartoon font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                        copiedBank === b.bank
                          ? 'bg-hoja-500 text-jade-950 shadow-hoja-glow'
                          : 'bg-gold-500 hover:bg-gold-400 text-jade-950 shadow-gold-glow'
                      }`}
                      title="Copiar número de cuenta"
                    >
                      {copiedBank === b.bank ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </InteractiveTiltCard>
              ))}

              {activeCustomPayments.map((method) => (
                <InteractiveTiltCard
                  key={method.id}
                  tiltIntensity={10}
                  spotlightColor="rgba(6, 182, 212, 0.2)"
                  className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-jade-950 to-[#041a1b] p-5 shadow-2xl space-y-3.5 hover:border-cyan-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-lg text-cyan-300 uppercase tracking-wide">
                        {method.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-cartoon font-bold text-cyan-300 uppercase tracking-widest px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
                      {method.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white/[0.06] p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div>
                      <span className="text-[10px] text-linen-400 block uppercase font-cartoon tracking-wider">
                        {method.type === 'Datáfono' ? 'Modalidad:' : 'Número / Cuenta:'}
                      </span>
                      <span className="font-mono text-base sm:text-lg font-black text-cyan-200 tracking-widest block">
                        {method.accountNumber || method.holder}
                      </span>
                      {method.holder && method.accountNumber && (
                        <span className="text-[10px] text-linen-300 block font-fredoka mt-0.5">
                          {method.holder}
                        </span>
                      )}
                    </div>

                    {method.accountNumber && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(method.accountNumber, method.name);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-cartoon font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                          copiedBank === method.name
                            ? 'bg-cyan-400 text-jade-950'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                        title="Copiar datos"
                      >
                        {copiedBank === method.name ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </InteractiveTiltCard>
              ))}
            </div>

            {/* Anti-Fraud Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-gold-600/10 border border-gold-600/25 text-xs font-fredoka text-linen-300 leading-relaxed flex items-start gap-2">
              <span className="text-gold-400 text-sm">🔒</span>
              <span>
                <strong>Garantía Oficial:</strong> Transfiere únicamente a cuentas a nombre de <strong>Andicas Bioparque S.A.S. (NIT 901.890.345-1)</strong>.
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
