import React, { useState } from 'react';
import { 
  Send, Phone, Mail, MapPin, Clock
} from 'lucide-react';
import { TikTokIcon, InstagramIcon, FacebookIcon } from './Icons';
import { contactData } from '../data/banking';

export default function Footer({ 
  onOpenBooking, 
  onOpenRules, 
  onNavigate,
  onOpenCancellation
}) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const navLinks = [
    { name: 'Inicio', action: () => { onNavigate('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { name: 'Reservar Cabaña', action: () => { onNavigate('cabanas'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { name: 'Santuario Animal', action: () => { onNavigate('animales'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { name: 'Arma Tu Plan', action: () => { onNavigate('home'); setTimeout(() => document.getElementById('arma-tu-plan')?.scrollIntoView({ behavior: 'smooth' }), 100); } },
    { name: 'Normas & Políticas', action: () => { onNavigate('home'); setTimeout(() => document.getElementById('normas')?.scrollIntoView({ behavior: 'smooth' }), 100); } },
    { name: 'Solicitar Cancelación', action: () => { if (onOpenCancellation) onOpenCancellation(); } },
  ];

  const scheduleText = contactData.schedules?.general || "Martes a Domingo: 9:00 AM – 5:00 PM";
  const phoneText = contactData.phones?.pasadia?.display || "+57 300 000 0001";
  const addressText = contactData.address || "Km 4 Vía Valle del Sol, Reserva Natural Los Andicas, Colombia";

  return (
    <footer className="relative bg-[#041617] text-linen-100 pt-20 pb-12 border-t border-gold-500/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* VIP Newsletter Banner */}
        <div className="rounded-2xl p-5 sm:p-10 lg:p-12 glass-dark border border-gold-500/40 shadow-2xl mb-12 sm:mb-16 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-7 space-y-1.5 sm:space-y-2 text-left">
              <h3 className="font-display text-xl sm:text-3xl lg:text-4xl font-black text-linen-100 uppercase tracking-wide leading-tight">
                Ofertas Secretas & Experiencias de Temporada
              </h3>
              <p className="text-xs sm:text-sm font-fredoka text-linen-300 max-w-xl">
                Suscríbete y recibe tarifas preferenciales en cabañas y lanzamientos exclusivos de nuevas atracciones.
              </p>
            </div>

            <div className="lg:col-span-5 w-full">
              {subscribed ? (
                <div className="p-4 rounded-xl bg-jade-900 border border-gold-400 text-gold-300 text-center font-fredoka font-semibold text-xs sm:text-sm">
                  ¡Gracias por suscribirte al Club VIP Andicas!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 sm:gap-2 w-full">
                  <input
                    type="email"
                    required
                    placeholder="Tu correo electrónico..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 min-w-0 bg-jade-950/90 border border-white/20 focus:border-gold-400 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-linen-100 outline-none transition-colors font-fredoka"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-gold-400 flex-shrink-0"
                  >
                    <span>Unirme</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 4 Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-white/10">
          {/* Column 1: Brand & Logo (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo sin fondo.png"
                alt="Andicas Bioparque Temático"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-xs sm:text-sm font-fredoka text-linen-300 leading-relaxed">
              Un santuario de descanso, naturaleza y aventura. Diseñado para reconectar con el entorno natural en una experiencia ecoturística inolvidable.
            </p>
            <div className="text-xs font-fredoka text-gold-400/90 space-y-1 pt-1">
              <p><strong>Razón Social:</strong> {contactData.companyName}</p>
              <p><strong>NIT:</strong> {contactData.nit} · Persona Jurídica</p>
            </div>
          </div>

          {/* Column 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-cartoon text-sm font-bold text-gold-400 uppercase tracking-widest">
              Explorar Plataforma
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-fredoka text-linen-200">
              {navLinks.map((link, idx) => (
                <li key={idx}>
                  <button
                    onClick={link.action}
                    className="hover:text-gold-400 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <span>›</span>
                    <span>{link.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact & Hours (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-cartoon text-sm font-bold text-gold-400 uppercase tracking-widest">
              Contacto Directo
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm font-fredoka text-linen-200">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <span>{addressText}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>{scheduleText}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                <span>{phoneText}</span>
              </div>
            </div>
          </div>

          {/* Column 4: Socials (2 cols - inert/no-op as requested) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-cartoon text-sm font-bold text-gold-400 uppercase tracking-widest">
              Comunidad
            </h4>
            <div className="flex flex-col gap-2 text-xs font-fredoka text-linen-200">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
                title="Canal Oficial Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Instagram</span>
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Canal Oficial TikTok"
              >
                <TikTokIcon className="w-4 h-4" />
                <span>TikTok</span>
              </a>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                title="Canal Oficial Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-fredoka text-linen-400">
          <p>© {new Date().getFullYear()} Andicas Bioparque S.A.S. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <button onClick={onOpenRules} className="hover:text-gold-400 transition-colors cursor-pointer">
              Términos & Reglamento
            </button>
            <span>·</span>
            <span>RNT Vigente</span>
            <span>·</span>
            <span>Colombia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
