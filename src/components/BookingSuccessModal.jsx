import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, MessageCircle, ArrowRight, Home, Calendar, User, Phone, Mail, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BookingSuccessModal({
  isOpen,
  onClose,
  bookingData,
}) {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#FCD477', '#D8A232', '#539E43', '#87D776', '#FAF7F2'],
      });
    }
  }, [isOpen]);

  if (!isOpen || !bookingData) return null;

  const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')} COP`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative w-full max-w-xl rounded-3xl glass-dark border border-gold-400 p-6 sm:p-8 shadow-2xl space-y-5 my-8 text-linen-100"
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-linen-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Principal Limpio (Sin tags ni píldoras) */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-hoja-600/20 border border-hoja-400 flex items-center justify-center mx-auto text-hoja-400 shadow-hoja-glow">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black text-3d-gold uppercase tracking-wide">
            ¡Reserva Confirmada!
          </h2>
          <p className="text-xs sm:text-sm font-fredoka text-linen-200">
            El pago del 50% fue verificado y enviamos el voucher a tu correo <strong>{bookingData.client_email}</strong>.
          </p>
        </div>

        {/* Tarjeta de Información Completa de la Reserva */}
        <div className="p-5 rounded-2xl bg-jade-950/80 border border-gold-500/40 space-y-4 text-xs font-fredoka shadow-inner">
          
          {/* Fila 1: Código y Cabaña */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-linen-400 block text-[11px]">Código de Reserva</span>
              <span className="font-mono text-base sm:text-lg font-black text-gold-gradient tracking-wider">
                {bookingData.booking_reference}
              </span>
            </div>
            <div className="text-right">
              <span className="text-linen-400 block text-[11px]">Hospedaje</span>
              <span className="font-display text-sm sm:text-base font-bold text-linen-100 uppercase">
                {bookingData.cabin_name}
              </span>
            </div>
          </div>

          {/* Fila 2: Huésped y Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/10">
            <div>
              <span className="text-linen-400 block text-[11px]">Huésped Titular:</span>
              <strong className="text-linen-100 text-sm block">{bookingData.client_name}</strong>
            </div>
            <div>
              <span className="text-linen-400 block text-[11px]">Teléfono / WhatsApp:</span>
              <span className="text-linen-200 text-xs font-mono block">{bookingData.client_phone}</span>
            </div>
          </div>

          {/* Fila 3: Fechas y Horarios */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/10">
            <div>
              <span className="text-linen-400 block text-[11px]">Llegada (Check-In):</span>
              <strong className="text-linen-100 text-xs block">{bookingData.check_in_date}</strong>
              <span className="text-[11px] text-gold-400">3:00 PM</span>
            </div>
            <div>
              <span className="text-linen-400 block text-[11px]">Salida (Check-Out):</span>
              <strong className="text-linen-100 text-xs block">{bookingData.check_out_date}</strong>
              <span className="text-[11px] text-gold-400">12:30 PM</span>
            </div>
          </div>

          {/* Fila Opcional: Servicios Adicionales */}
          {bookingData.notes && (
            <div className="pb-3 border-b border-white/10 space-y-1">
              <span className="text-linen-400 block text-[11px]">Servicios Adicionales Seleccionados:</span>
              <strong className="text-gold-300 text-xs block">{bookingData.notes.replace(/^Adicionales:\s*/, '')}</strong>
            </div>
          )}

          {/* Fila 4: Desglose Financiero Completo */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-linen-300">
              <span>Total Estadía ({bookingData.nights_count || 1} noche/s):</span>
              <span className="font-mono font-bold text-linen-100">{formatCOP(bookingData.total_amount_cop)}</span>
            </div>

            <div className="flex justify-between text-hoja-400 font-bold">
              <span>Anticipo 50% Abonado (Wompi):</span>
              <span className="font-mono">{formatCOP(bookingData.deposit_amount_cop)}</span>
            </div>

            <div className="flex justify-between text-gold-400 font-bold pt-2 border-t border-white/10 text-sm">
              <span>Saldo a Pagar en Recepción al Llegar:</span>
              <span className="font-mono text-base">{formatCOP(bookingData.remaining_balance_cop)}</span>
            </div>
          </div>

        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href={`https://wa.me/573104567890?text=${encodeURIComponent(`¡Hola Andicas! Mi reserva es ${bookingData.booking_reference} a nombre de ${bookingData.client_name} para ${bookingData.cabin_name}. Acabo de abonar mi anticipo del 50%.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cartoon font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Confirmar por WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase shadow-gold-glow hover:brightness-110 transition-all cursor-pointer btn-shimmer"
          >
            <span>Listo, Cerrar</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
