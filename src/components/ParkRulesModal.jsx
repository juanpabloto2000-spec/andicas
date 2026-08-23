import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, ShieldCheck, Waves, PawPrint, Clock, Ban, CheckCircle2 } from 'lucide-react';
import { contactData } from '../data/banking';

export default function ParkRulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass-dark border border-gold-500/40 shadow-2xl p-5 sm:p-8 z-10 text-linen-100"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-emerald-950/80 border border-gold-500/30 text-linen-300 hover:text-white hover:border-gold-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-2xl bg-emerald-900 border border-gold-500/40 text-gold-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gold-400 tracking-widest uppercase block">
                Reglamento Interno & Convivencia
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-linen-100">
                Normas del Parque Temático
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-xs text-linen-200/90 leading-relaxed">
            {/* Rules list */}
            {contactData.rules.map((rule, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-emerald-950/80 border border-white/10 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-gold-500/20 text-gold-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-linen-100 mb-0.5">{rule.title}</h4>
                  <p className="text-linen-300/80 font-light">{rule.desc}</p>
                </div>
              </div>
            ))}

            {/* Additional Park Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-700/30">
                <div className="flex items-center gap-2 text-gold-400 font-semibold text-xs mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Horarios de Cabañas</span>
                </div>
                <p className="text-[11px] text-linen-300">
                  Check-in: <strong>3:00 PM</strong> | Check-out: <strong>12:30 PM</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-700/30">
                <div className="flex items-center gap-2 text-sage-300 font-semibold text-xs mb-1">
                  <PawPrint className="w-4 h-4" />
                  <span>Pauta Pet Friendly</span>
                </div>
                <p className="text-[11px] text-linen-300">
                  Mascotas siempre con correa en senderos y uso responsable de zonas comunes.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gold-gradient text-emerald-950 font-bold text-xs uppercase tracking-wider shadow-gold-glow cursor-pointer"
            >
              He Leído y Acepto las Normas
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
