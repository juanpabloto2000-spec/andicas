import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, AlertTriangle, ShieldAlert, CheckCircle2, 
  Send, Phone, Calendar, ArrowRight, MessageSquare, User, Mail, Search, RefreshCw, AlertCircle
} from 'lucide-react';
import { requestBookingCancellation, verifyBookingReference } from '../services/api';
import { contactData } from '../data/banking';

export default function CancellationRequestModal({ isOpen, onClose }) {
  const [step, setStep] = useState('lookup'); // 'lookup' | 'confirm' | 'success'
  const [bookingReference, setBookingReference] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [reason, setReason] = useState('');
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedBooking, setVerifiedBooking] = useState(null);
  const [penaltyInfo, setPenaltyInfo] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Submit states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultData, setResultData] = useState(null);

  if (!isOpen) return null;

  const formatCOP = (num) => `$${Number(num || 0).toLocaleString('es-CO')} COP`;

  const handleVerifyReference = async (e) => {
    e.preventDefault();
    setLookupError('');
    setVerifiedBooking(null);
    setPenaltyInfo(null);

    const ref = bookingReference.trim().toUpperCase();
    if (!ref) {
      setLookupError('Por favor ingresa tu número o código de reserva.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyBookingReference(ref);
      if (res.exists && res.booking) {
        setVerifiedBooking(res.booking);
        setPenaltyInfo({
          diffDays: res.diffDays,
          isEligibleForFullReview: res.isEligibleForFullReview,
          penaltyPercentage: res.penaltyPercentage,
          penaltyAmount: res.penaltyAmount,
          remainingEligibleAmount: res.remainingEligibleAmount
        });
        setClientName(res.booking.client_name || '');
        setClientEmail(res.booking.client_email || '');
        setClientPhone(res.booking.client_phone || '');
        setStep('confirm');
      } else {
        setLookupError(res.error || 'El número de reserva no se encuentra registrado en nuestro sistema. Verifica el código e intenta de nuevo.');
      }
    } catch (err) {
      setLookupError('Error de conexión al verificar la reserva. Intenta de nuevo o contáctanos directamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitCancellation = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await requestBookingCancellation({
        booking_reference: bookingReference.trim().toUpperCase(),
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        client_phone: clientPhone.trim(),
        reason: reason.trim() || 'Cancelación solicitada por el huésped',
      });

      if (res.success) {
        setResultData(res);
        setStep('success');
      } else {
        setErrorMsg(res.error || 'No se pudo radicar la solicitud. Verifica el número de reserva.');
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
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep('lookup');
    setBookingReference('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setReason('');
    setVerifiedBooking(null);
    setPenaltyInfo(null);
    setLookupError('');
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
          className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-jade-950 border border-gold-500/50 shadow-2xl p-4 sm:p-6 z-10 text-linen-100 font-fredoka"
        >
          {/* Close Button */}
          <button
            onClick={resetAndClose}
            className="absolute top-3.5 right-3.5 p-1.5 sm:p-2 rounded-xl bg-jade-900 border border-gold-500/30 text-linen-300 hover:text-white hover:border-gold-400 transition-colors cursor-pointer z-20"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* ========================================================================= */}
          {/* PASO 1: CONSULTAR NÚMERO DE RESERVA */}
          {/* ========================================================================= */}
          {step === 'lookup' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center pb-3 border-b border-white/10 pr-6 pl-2">
                <div className="w-12 h-12 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400 mb-2">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="font-display text-lg sm:text-xl font-black text-linen-100 uppercase tracking-wide">
                  Solicitud de Cancelación de Reserva
                </h2>
                <p className="text-xs text-linen-300 mt-1">
                  Ingresa tu código de reserva para validar tus fechas y calcular los términos de cancelación.
                </p>
              </div>

              {/* Policy & Penalties Notice Box */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-left text-xs">
                <div className="flex items-center gap-1.5 font-cartoon font-bold text-amber-300 uppercase text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Política Oficial de Cancelaciones:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-linen-200 text-[11px] leading-relaxed">
                  <li>
                    <strong>Con 3 o más días de anticipación:</strong> 0% de penalidad (sujeto a reprogramación o saldo a favor).
                  </li>
                  <li>
                    <strong>Con menos de 3 días (72 horas):</strong> Se aplicará una <strong>penalidad del 40%</strong> sobre el anticipo abonado por bloqueo de inventario.
                  </li>
                  <li>Las cancelaciones no generan desembolso inmediato y deben ser radicadas formalmente para auditoría.</li>
                </ul>
              </div>

              {/* Form de Consulta */}
              <form onSubmit={handleVerifyReference} className="space-y-4 text-xs">
                <div>
                  <label className="font-cartoon text-gold-400 uppercase text-[11px] block mb-1.5 font-bold">
                    Número / Código de Reserva (*):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej: AND-178652..."
                      value={bookingReference}
                      onChange={(e) => {
                        setBookingReference(e.target.value.toUpperCase());
                        if (lookupError) setLookupError('');
                      }}
                      className="w-full bg-jade-900 border border-white/15 focus:border-gold-400 rounded-xl px-4 py-3 text-xs text-linen-100 font-mono placeholder:text-linen-500 outline-none uppercase font-bold"
                    />
                    <Search className="w-4 h-4 text-gold-400 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                {lookupError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Reserva no encontrada:</span>
                      <span>{lookupError}</span>
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !bookingReference.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-gold-400 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Consultando Reserva...' : 'Verificar Reserva & Fechas'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: CONFIRMACIÓN Y CÁLCULO DE MULTA/PENALIDAD */}
          {/* ========================================================================= */}
          {step === 'confirm' && verifiedBooking && (
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-white/10 pr-6 pl-2">
                <h2 className="font-display text-lg sm:text-xl font-black text-linen-100 uppercase tracking-wide">
                  Detalles de tu Reserva & Penalidad
                </h2>
                <span className="font-mono text-xs text-gold-400 font-bold">
                  Código: {verifiedBooking.booking_reference}
                </span>
              </div>

              {/* Booking Summary Box */}
              <div className="p-4 rounded-2xl bg-jade-900/80 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-linen-400">Titular de la Reserva:</span>
                  <span className="font-bold text-white">{verifiedBooking.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Cabaña:</span>
                  <span className="text-linen-100 font-medium">{verifiedBooking.cabin_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Fechas de Estadía:</span>
                  <span className="font-mono text-gold-300">{verifiedBooking.check_in_date} al {verifiedBooking.check_out_date}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10 font-mono">
                  <span className="text-linen-400">Anticipo Abonado (50%):</span>
                  <span className="font-bold text-hoja-400">{formatCOP(verifiedBooking.deposit_amount_cop)}</span>
                </div>
              </div>

              {/* DYNAMIC PENALTY NOTICE BANNER */}
              {penaltyInfo && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  penaltyInfo.penaltyPercentage > 0
                    ? 'bg-red-950/70 border-red-500/50 text-red-200'
                    : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2 font-cartoon font-bold text-sm uppercase">
                    {penaltyInfo.penaltyPercentage > 0 ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <span className="text-red-300">⚠️ Aplica Penalidad del 40% (Menos de 3 días)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300">✅ Cancelación Oportuna (0% de Multa)</span>
                      </>
                    )}
                  </div>

                  {penaltyInfo.penaltyPercentage > 0 ? (
                    <div className="space-y-1.5 text-[11px] leading-relaxed">
                      <p>
                        Tu estadía inicia en <strong>{penaltyInfo.diffDays} días</strong> (menos de 72 horas). De acuerdo con las políticas del Bioparque:
                      </p>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-red-500/30 font-mono space-y-1">
                        <div className="flex justify-between text-red-300">
                          <span>Multa por cancelación tardía (40%):</span>
                          <span className="font-bold">{formatCOP(penaltyInfo.penaltyAmount)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-300">
                          <span>Monto sujeto a reprogramación/saldo a favor (60%):</span>
                          <span className="font-bold">{formatCOP(penaltyInfo.remainingEligibleAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] leading-relaxed">
                      Faltan <strong>{penaltyInfo.diffDays} días</strong> para tu check-in. Cumples con el plazo mínimo de 3 días, por lo que el 100% de tu anticipo ({formatCOP(verifiedBooking.deposit_amount_cop)}) queda libre de penalidad para reprogramación o saldo a favor.
                    </p>
                  )}
                </div>
              )}

              {/* Form Motivo */}
              <form onSubmit={handleSubmitCancellation} className="space-y-3 text-xs">
                <div>
                  <label className="font-cartoon text-gold-400 uppercase text-[11px] block mb-1">
                    Motivo de la Cancelación (*):
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe brevemente la razón por la cual no podrás asistir..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-jade-900 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs text-linen-100 placeholder:text-linen-500 outline-none resize-none"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-900/50 border border-red-500/60 text-red-200 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('lookup')}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-linen-200 font-cartoon text-xs uppercase font-bold cursor-pointer transition-colors"
                  >
                    Volver
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !reason.trim()}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cartoon text-xs uppercase font-bold cursor-pointer transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>{isLoading ? 'Radicando...' : 'Radicar Solicitud Formal'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 3: SOLICITUD RADICADA CON ÉXITO */}
          {/* ========================================================================= */}
          {step === 'success' && resultData && (
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-display text-xl font-black text-white uppercase tracking-wide">
                  Solicitud de Cancelación Radicada
                </h3>
                <p className="text-xs font-fredoka text-linen-300 mt-1 max-w-md mx-auto">
                  {resultData.message}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-jade-900/70 border border-white/10 text-xs space-y-2 text-left font-mono">
                <div className="flex justify-between">
                  <span className="text-linen-400">Código de Reserva:</span>
                  <span className="font-bold text-gold-300">{bookingReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Titular:</span>
                  <span className="text-white">{clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Penalidad Aplicada:</span>
                  <span className={resultData.penaltyPercentage > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {resultData.penaltyPercentage}% {resultData.penaltyAmount ? `(${formatCOP(resultData.penaltyAmount)})` : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleContactWhatsApp}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-cartoon font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Notificar al Administrador por WhatsApp</span>
                </button>

                <button
                  onClick={resetAndClose}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-linen-300 font-cartoon text-xs uppercase transition-colors cursor-pointer"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
