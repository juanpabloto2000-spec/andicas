import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, ShieldAlert, CheckCircle2, 
  Send, Phone, Calendar, ArrowRight, MessageSquare, User, Mail
} from 'lucide-react';
import { requestBookingCancellation } from '../services/api';
import { contactData } from '../data/banking';

export default function CancellationRequestModal({ isOpen, onClose }) {
  const [bookingReference, setBookingReference] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultData, setResultData] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await requestBookingCancellation({
        booking_reference: bookingReference.trim(),
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        client_phone: clientPhone.trim(),
        reason: reason.trim() || 'Cancelación solicitada por el huésped',
      });

      if (res.success) {
        setResultData(res);
      } else {
        setErrorMsg(res.error || 'No se pudo enviar la solicitud. Verifica el número de reserva.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión con el servidor. Intenta de nuevo o contáctanos por WhatsApp.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactWhatsApp = () => {
    const ref = bookingReference.trim().toUpperCase();
    const msg = `¡Hola Andicas Bioparque! 🌿
He radicado una solicitud de cancelación en la web para mi reserva con código *${ref}*.
Titular: ${clientName.trim()}
Teléfono: ${clientPhone.trim()}
Motivo: ${reason.trim()}

Agradezco su gestión para el seguimiento de mi solicitud. Muchas gracias.`;

    const url = `https://wa.me/${contactData.phones.hospedaje.number.replace('+', '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    onClose();
  };

  const resetAndClose = () => {
    setBookingReference('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setReason('');
    setErrorMsg('');
    setResultData(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-jade-950 border border-gold-500/50 shadow-2xl p-4 sm:p-6 z-10 text-linen-100"
        >
          {/* Close Button */}
          <button
            onClick={resetAndClose}
            className="absolute top-3.5 right-3.5 p-1.5 sm:p-2 rounded-xl bg-jade-900 border border-gold-500/30 text-linen-300 hover:text-white hover:border-gold-400 transition-colors cursor-pointer z-20"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {!resultData ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center pb-3 border-b border-white/10 pr-6 pl-2">
                <div className="w-12 h-12 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400 mb-2">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="font-display text-lg sm:text-xl font-black text-linen-100 uppercase tracking-wide">
                  Solicitud de Cancelación de Reserva
                </h2>
                <p className="text-xs font-fredoka text-linen-300 mt-1">
                  Radica tu solicitud formal para revisión y gestión de fechas por parte de administración.
                </p>
              </div>

              {/* Policy & Penalties Notice Box */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-left font-fredoka text-xs">
                <div className="flex items-center gap-1.5 font-cartoon font-bold text-amber-300 uppercase text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Condiciones de Cancelación & Reembolsos:</span>
                </div>
                <ul className="space-y-1.5 text-linen-200 pl-1 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Solicitud en trámite:</strong> Esta acción no genera un reembolso inmediato, sino una radicación formal que es evaluada por recepción.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Anticipación de 3 días (72h):</strong> La solicitud debe realizarse con mínimo 3 días de antelación a tu fecha de llegada para aplicar a reprogramación o trámite sin penalidad.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><strong>Penalidad del 40%:</strong> En caso de solicitarse con menos de 3 días de antelación, se aplicará una retención del <strong>40% sobre el monto abonado</strong> por concepto de costos operativos y bloqueo de cupos.</span>
                  </li>
                </ul>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 font-fredoka text-xs">
                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block mb-1">
                    Número o Código de Reserva:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. AND-8942-X o REF de reserva"
                    value={bookingReference}
                    onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
                    className="w-full bg-jade-900/90 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-gold-300 uppercase placeholder-linen-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block mb-1">
                      Nombre Completo del Titular:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Nombre registrado al agendar"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-jade-900/90 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs text-linen-100 placeholder-linen-500 outline-none pr-8"
                      />
                      <User className="w-3.5 h-3.5 text-linen-400 absolute right-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block mb-1">
                      WhatsApp / Teléfono:
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="310 000 0000"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-jade-900/90 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs text-linen-100 placeholder-linen-500 outline-none pr-8"
                      />
                      <Phone className="w-3.5 h-3.5 text-linen-400 absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block mb-1">
                    Correo Electrónico (Opcional):
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-jade-900/90 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs text-linen-100 placeholder-linen-500 outline-none pr-8"
                    />
                    <Mail className="w-3.5 h-3.5 text-linen-400 absolute right-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block mb-1">
                    Motivo de la Cancelación:
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe brevemente el motivo de fuerza mayor o situación personal..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-jade-900/90 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs text-linen-100 placeholder-linen-500 outline-none resize-none"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-300 text-xs text-left">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-gold-400 disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Enviando Solicitud...' : 'Enviar Solicitud de Cancelación'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Success Response State */
            <div className="text-center py-4 space-y-4 font-fredoka">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-display text-xl font-black text-white uppercase tracking-wide">
                  Solicitud Radicada con Éxito
                </h3>
                <p className="text-xs text-linen-300 mt-1 max-w-md mx-auto">
                  Hemos registrado tu solicitud para la reserva <strong className="text-gold-300 font-mono">{bookingReference.toUpperCase()}</strong>.
                </p>
              </div>

              {/* Status Details Card */}
              <div className="p-4 rounded-2xl bg-jade-900/80 border border-white/10 text-left space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-white/10">
                  <span className="text-linen-400">Estado de Solicitud:</span>
                  <span className="font-bold text-amber-400 uppercase font-cartoon">En Revisión</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-white/10">
                  <span className="text-linen-400">Anticipación al Check-in:</span>
                  <span className="font-bold text-linen-100 font-mono">
                    {resultData.diffDays !== null ? `${resultData.diffDays} días` : 'Por verificar'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Penalidad Aplicable:</span>
                  <span className={`font-bold font-mono ${resultData.penaltyPercentage > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {resultData.penaltyPercentage > 0 ? `40% (Solicitud < 3 días)` : `0% (Solicitud Oportuna)`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleContactWhatsApp}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Seguimiento por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={resetAndClose}
                  className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-linen-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
