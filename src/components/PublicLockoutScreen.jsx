import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function PublicLockoutScreen({ onGoToAdmin }) {
  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-b from-[#150404] via-[#200707] to-[#0d0202] text-linen-100 flex items-center justify-center p-4 sm:p-6 select-none backdrop-blur-2xl">
      {/* Fondo con resplandor rojo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-black/85 border-2 border-red-500/70 shadow-[0_0_60px_rgba(239,68,68,0.4)] text-center space-y-6 backdrop-blur-xl"
      >
        {/* Ícono de Candado Grande con Resplandor */}
        <div className="relative w-24 h-24 rounded-full bg-red-950/90 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_35px_rgba(239,68,68,0.65)]">
          <Lock className="w-12 h-12 text-red-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border border-black flex items-center justify-center shadow-md">
            <AlertTriangle className="w-3.5 h-3.5 text-black" />
          </span>
        </div>

        {/* Textos Informativos */}
        <div className="space-y-3">
          <span className="px-4 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-display uppercase tracking-widest font-black inline-block shadow-sm">
            Servicio Deshabilitado
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-red-400 uppercase tracking-wide">
            Falta de Pago.
          </h1>
          <p className="font-fredoka text-sm text-linen-300 max-w-md mx-auto leading-relaxed">
            El acceso a esta página web y a todos sus servicios ha sido suspendido temporalmente debido a la falta de registro de pago de la suscripción o desarrollo.
          </p>
        </div>

        {/* Cuadro de Advertencia */}
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-left space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-cartoon text-red-300 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>Aviso al Administrador</span>
          </div>
          <p className="text-xs font-fredoka text-linen-400 leading-normal">
            Para reactivar este sitio web y habilitar nuevamente la visualización pública, catálogo y reservas, por favor regularice el pago correspondiente con su proveedor de servicios web.
          </p>
        </div>

        {/* Acceso discreto al panel */}
        {onGoToAdmin && (
          <div className="pt-2">
            <button
              onClick={onGoToAdmin}
              className="text-xs font-fredoka text-linen-500 hover:text-red-300 transition-colors cursor-pointer"
            >
              Acceso a panel administrativo →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
