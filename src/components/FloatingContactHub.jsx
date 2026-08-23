import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { 
  LibretaIcon, WhatsAppIcon, PhoneCallIcon, 
  InstagramIcon, FacebookIcon, TikTokIcon 
} from './Icons';
import { contactData } from '../data/banking';

export default function FloatingContactHub({ onOpenWhatsAppMenu }) {
  const [isOpen, setIsOpen] = useState(false);

  const contactItems = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Oficial',
      icon: WhatsAppIcon,
      action: () => {
        if (onOpenWhatsAppMenu) {
          onOpenWhatsAppMenu();
        }
      },
      iconColor: 'text-[#25D366] hover:drop-shadow-[0_0_12px_rgba(37,211,102,0.8)]',
      tooltip: 'WhatsApp Reservas'
    },
    {
      id: 'phone',
      name: 'Línea de Atención',
      icon: PhoneCallIcon,
      action: () => {
        if (onOpenWhatsAppMenu) {
          onOpenWhatsAppMenu();
        }
      },
      iconColor: 'text-[#D8A232] hover:drop-shadow-[0_0_12px_rgba(216,162,50,0.8)]',
      tooltip: 'Línea Directa'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: InstagramIcon,
      action: () => {},
      iconColor: 'text-[#E1306C] hover:drop-shadow-[0_0_12px_rgba(225,48,108,0.8)]',
      tooltip: '@andicasbioparque'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: FacebookIcon,
      action: () => {},
      iconColor: 'text-[#1877F2] hover:drop-shadow-[0_0_12px_rgba(24,119,242,0.8)]',
      tooltip: 'Facebook Oficial'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: TikTokIcon,
      action: () => {},
      iconColor: 'text-[#FFFFFF] hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]',
      tooltip: 'TikTok Andicas'
    }
  ];

  return (
    <div 
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Animated Fan of Floating Icons (Hover-triggered, NO BACKGROUND, PURE VIVID ICON COLOR) */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col-reverse items-center gap-3.5 mb-3.5 pr-1.5">
            {contactItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 25, scale: 0.4 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.4 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 450, 
                    damping: 25, 
                    delay: index * 0.035 
                  }}
                  className="relative group flex items-center justify-center"
                >
                  {/* Tooltip on left */}
                  <span className="absolute right-12 px-2.5 py-1 rounded-md glass-dark text-xs font-cartoon font-bold text-linen-100 border border-gold-600/30 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.tooltip}
                  </span>

                  {/* Pure Icon Button without background */}
                  <button
                    onClick={() => {
                      item.action();
                    }}
                    aria-label={item.name}
                    className={`p-2 transition-all hover:scale-130 active:scale-95 cursor-pointer ${item.iconColor}`}
                  >
                    <Icon className="w-7 h-7" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger: Circular Libreta Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Abrir libreta de contactos y redes sociales"
        className="relative group w-14 h-14 rounded-full bg-gradient-to-br from-jade-800 to-jade-950 text-gold-300 border-2 border-gold-400 shadow-2xl shadow-gold-glow flex items-center justify-center cursor-pointer"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-gold-300" />
            </motion.div>
          ) : (
            <motion.div
              key="libreta"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="flex items-center justify-center text-gold-400"
            >
              <LibretaIcon className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse gold indicator */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gold-400 border border-jade-950 flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-jade-950" />
          </span>
        )}
      </motion.button>
    </div>
  );
}
