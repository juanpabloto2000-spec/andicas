import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl glass-dark border border-gold-500/40 shadow-2xl text-linen-100 max-w-md backdrop-blur-2xl"
          >
            <div className="p-1.5 rounded-xl bg-gold-500/20 text-gold-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium pr-2">
              <p className="text-linen-100">{toast.message}</p>
              {toast.subtext && (
                <p className="text-xs text-gold-400/80 mt-0.5">{toast.subtext}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-linen-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
