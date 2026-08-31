import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldCheck, Check, Copy, Send, Edit3, 
  Calendar, Users, DollarSign, Sparkles, Building2 
} from 'lucide-react';
import { contactData } from '../data/banking';

export default function BookingSummaryModal({
  isOpen,
  onClose,
  onEdit,
  summaryData,
  onShowToast,
  customConfig = {}
}) {
  const [copiedBank, setCopiedBank] = useState(null);

  if (!isOpen || !summaryData) return null;

  const formatCOP = (num) => `$${(num || 0).toLocaleString('es-CO')} COP`;

  const copyAccount = (number, bankName) => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopiedBank(bankName);
    if (onShowToast) {
      onShowToast(`Cuenta ${bankName} copiada: ${number}`);
    }
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const activeBanks = (customConfig.bankAccounts && customConfig.bankAccounts.length > 0)
    ? customConfig.bankAccounts
    : (contactData.banks || []);

  const activeCustomPayments = (customConfig.customPaymentMethods || []).filter(m => m.enabled !== false);

  const handleFinalConfirm = () => {
    const { 
      experienceName, 
      dateText, 
      adults, 
      children, 
      pets, 
      addonsText, 
      totalCost, 
      deposit50, 
      targetPhone,
      notes 
    } = summaryData;

    const message = `¡Hola Andicas Bioparque Temático! 🌿✨
He revisado el resumen de mi reserva y deseo confirmarla:

📋 *RESUMEN DE RESERVA:*
🏡 *Experiencia:* ${experienceName}
📅 *Fecha(s):* ${dateText}
👥 *Huéspedes:* ${adults} Adulto(s)${children > 0 ? ` | ${children} Niño(s)` : ''}
🐾 *Mascotas:* ${pets > 0 ? `${pets} Mascota(s)` : 'Ninguna'}
${addonsText ? `🎁 *Adicionales:* ${addonsText}\n` : ''}${notes ? `📝 *Observaciones:* ${notes}\n` : ''}
💰 *Valor Total Estimado:* ${formatCOP(totalCost)}
💳 *Anticipo del 50% requerido:* ${formatCOP(deposit50)}

Tengo listos los datos de consignación institucional a nombre de Andicas Bioparque S.A.S. (NIT 901.890.345-1). ¿Me confirman disponibilidad para enviar el soporte de pago? Muchas gracias.`;

    const url = `https://wa.me/${(targetPhone || contactData.phones.pasadia.number).replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
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
          className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-jade-950 border border-gold-500/50 shadow-2xl p-3.5 sm:p-6 z-10 text-linen-100"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 sm:p-2 rounded-xl bg-jade-900 border border-gold-500/30 text-linen-300 hover:text-white hover:border-gold-400 transition-colors cursor-pointer z-20"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Header */}
          <div className="text-center pb-3.5 sm:pb-4 border-b border-white/10 pr-6 pl-2">
            <h2 className="font-display text-lg sm:text-2xl font-black text-linen-100 uppercase tracking-wide leading-tight">
              RESUMEN DE RESERVA
            </h2>
            <p className="text-[11px] sm:text-xs font-fredoka text-linen-300 mt-0.5">
              Revisa los detalles antes de conectar con el asesor oficial.
            </p>
          </div>

          {/* Specs Box */}
          <div className="py-3.5 sm:py-4 space-y-3 font-fredoka">
            <div className="p-3 sm:p-4 rounded-xl bg-jade-900/80 border border-gold-500/30 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[10px] font-cartoon text-linen-400 uppercase tracking-wider">Plan:</span>
                <span className="text-xs sm:text-sm font-display font-black text-gold-gradient uppercase truncate max-w-[240px] text-right">
                  {summaryData.experienceName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-linen-400 block text-[9px] uppercase font-cartoon">Fecha(s):</span>
                    <span className="font-semibold text-linen-100 text-[11px] leading-tight block">{summaryData.dateText}</span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-linen-400 block text-[9px] uppercase font-cartoon">Huéspedes:</span>
                    <span className="font-semibold text-linen-100 text-[11px] leading-tight block">
                      {summaryData.adults} Ad. {summaryData.children > 0 ? `| ${summaryData.children} Niñ.` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {summaryData.pets > 0 && (
                <div className="text-[11px] text-hoja-400 pt-1 flex items-center gap-1 border-t border-white/5">
                  <span>🐾 Mascotas:</span> <strong className="font-semibold">{summaryData.pets} Mascota(s)</strong>
                </div>
              )}

              {summaryData.addonsText && (
                <div className="text-[11px] text-gold-300 pt-1 border-t border-white/10">
                  🎁 <strong>Detalle:</strong> {summaryData.addonsText}
                </div>
              )}
            </div>

            {/* Financial Summary - 2 Columns Side by Side on Mobile */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-jade-900/60 border border-white/10">
                <span className="text-[9px] font-cartoon font-bold uppercase tracking-wider text-linen-400 block mb-0.5">
                  Valor Total:
                </span>
                <span className="text-sm sm:text-xl font-black font-display text-gold-gradient block truncate">
                  {formatCOP(summaryData.totalCost)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-jade-900/90 border border-gold-500/40">
                <span className="text-[9px] font-cartoon font-bold uppercase tracking-wider text-gold-400 block mb-0.5">
                  Anticipo (50%):
                </span>
                <span className="text-sm sm:text-xl font-black font-display text-linen-100 block truncate">
                  {formatCOP(summaryData.deposit50)}
                </span>
              </div>
            </div>

            {/* Dynamic Banking Box */}
            <div className="p-3 sm:p-4 rounded-xl bg-jade-900/90 border border-gold-500/40 space-y-2.5 shadow-xl">
              <div className="flex items-center gap-1.5 text-[11px] font-cartoon font-bold text-linen-100 uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                <span>Cuentas para Abono del Anticipo (50%):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeBanks.map((b, idx) => (
                  <div key={b.bank || idx} className="p-2.5 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-between gap-2 group hover:border-gold-400 transition-colors">
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-gold-300 uppercase font-cartoon block">{b.bank}</span>
                        <span className="text-[8px] text-linen-400 uppercase font-cartoon block">{b.accountType || 'Ahorros'}:</span>
                        <span className="text-[11px] font-mono text-gold-400 font-bold block">{b.accountNumber}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyAccount(b.accountNumber, b.bank)}
                      className={`p-1.5 rounded-md text-[10px] font-cartoon font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm ${
                        copiedBank === b.bank
                          ? 'bg-hoja-500 text-jade-950'
                          : 'bg-gold-500 hover:bg-gold-400 text-jade-950'
                      }`}
                      title="Copiar cuenta"
                    >
                      {copiedBank === b.bank ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}

                {activeCustomPayments.map((method) => (
                  <div key={method.id} className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-2 group hover:border-cyan-400 transition-colors">
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-cyan-300 uppercase font-cartoon block">{method.name}</span>
                        <span className="text-[8px] text-linen-400 uppercase font-cartoon block">{method.type}:</span>
                        <span className="text-[11px] font-mono text-cyan-200 font-bold block">{method.accountNumber || method.holder}</span>
                      </div>
                    </div>
                    {method.accountNumber && (
                      <button
                        onClick={() => copyAccount(method.accountNumber, method.name)}
                        className={`p-1.5 rounded-md text-[10px] font-cartoon font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm ${
                          copiedBank === method.name
                            ? 'bg-cyan-400 text-jade-950'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                        title="Copiar cuenta"
                      >
                        {copiedBank === method.name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <span className="text-[10px] text-linen-400 block text-center font-fredoka">
                Titular: <strong>{activeBanks[0]?.holder || 'Andicas Bioparque S.A.S. (NIT 901.890.345-1)'}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons: 2 Columns Side by Side on Mobile */}
          <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
            <button
              onClick={() => { onClose(); if (onEdit) onEdit(); }}
              className="py-2.5 px-3 rounded-xl border border-gold-500/40 text-gold-300 hover:bg-white/5 font-cartoon font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modificar</span>
            </button>

            <button
              onClick={handleFinalConfirm}
              className="py-2.5 px-3 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-[11px] uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-gold-400"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar a WhatsApp</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
