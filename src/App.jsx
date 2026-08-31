import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CabanasPage from './pages/CabanasPage';
import AnimalesPage from './pages/AnimalesPage';
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';
import FloatingContactHub from './components/FloatingContactHub';
import FloatingAiButton from './components/FloatingAiButton';
import AiAssistantModal from './components/AiAssistantModal';
import BookingModal from './components/BookingModal';
import BookingSummaryModal from './components/BookingSummaryModal';
import ParkRulesModal from './components/ParkRulesModal';
import CancellationRequestModal from './components/CancellationRequestModal';
import Preloader from './components/Preloader';
import Toast from './components/Toast';
import PublicLockoutScreen from './components/PublicLockoutScreen';
import { getSubscriptionStatus, subscribeToSystemChanges, getSiteCustomConfig } from './services/api';

const DEFAULT_SOCIAL_LINKS = [
  { id: 'instagram', name: 'Instagram', url: 'https://instagram.com/andicasbioparque', enabled: true, icon: 'instagram', tooltip: '@andicasbioparque' },
  { id: 'facebook', name: 'Facebook', url: 'https://facebook.com/andicasbioparque', enabled: true, icon: 'facebook', tooltip: 'Facebook Oficial' },
  { id: 'tiktok', name: 'TikTok', url: 'https://tiktok.com/@andicasbioparque', enabled: true, icon: 'tiktok', tooltip: 'TikTok Andicas' },
  { id: 'whatsapp', name: 'WhatsApp Reservas', url: 'https://wa.me/573000000001', enabled: true, icon: 'whatsapp', tooltip: 'WhatsApp Reservas' },
  { id: 'youtube', name: 'YouTube Oficial', url: '', enabled: false, icon: 'youtube', tooltip: 'Canal de YouTube' },
];

export default function App() {
  const isInitiallyAdmin = (() => {
    const hash = (typeof window !== 'undefined' ? window.location.hash || '' : '').toLowerCase();
    const path = (typeof window !== 'undefined' ? window.location.pathname || '' : '').toLowerCase();
    return hash.includes('dsb') || hash.includes('admin') || path.includes('dsb') || path.includes('admin');
  })();

  const [isSiteLocked, setIsSiteLocked] = useState(() => {
    try {
      return localStorage.getItem('andicas_subscription_status') === 'unpaid';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    const locked = typeof localStorage !== 'undefined' && localStorage.getItem('andicas_subscription_status') === 'unpaid';
    return !isInitiallyAdmin && !locked;
  });

  const [activeModules, setActiveModules] = useState({ bookings: true, wompi_payments: true });
  const [customConfig, setCustomConfig] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('andicas_custom_settings') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          enable_ai_chatbot: parsed.enable_ai_chatbot !== false,
          socials: Array.isArray(parsed.socials) ? parsed.socials : DEFAULT_SOCIAL_LINKS,
          ...parsed
        };
      } catch (e) {}
    }
    return {
      enable_ai_chatbot: true,
      socials: DEFAULT_SOCIAL_LINKS
    };
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const hash = (typeof window !== 'undefined' ? window.location.hash || '' : '').toLowerCase();
    const path = (typeof window !== 'undefined' ? window.location.pathname || '' : '').toLowerCase();
    if (hash.includes('dsb') || hash.includes('admin') || path.includes('dsb') || path.includes('admin')) return 'dsb';
    if (hash.includes('cabanas')) return 'cabanas';
    if (hash.includes('animales')) return 'animales';
    return 'home';
  });

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState('cabana');
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [aiChatModalOpen, setAiChatModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : `#/${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCancellation = () => {
    setCancellationModalOpen(true);
  };

  // Cargar configuración de personalización (Chatbot y Redes Sociales) en vivo
  useEffect(() => {
    getSiteCustomConfig().then(res => {
      if (res.success && res.config) {
        setCustomConfig(prev => ({
          ...prev,
          ...res.config,
          enable_ai_chatbot: res.config.enable_ai_chatbot !== false,
          socials: Array.isArray(res.config.socials) ? res.config.socials : prev.socials
        }));
      }
    });

    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setCustomConfig(prev => ({
          ...prev,
          ...e.detail,
          enable_ai_chatbot: e.detail.enable_ai_chatbot !== false,
          socials: Array.isArray(e.detail.socials) ? e.detail.socials : prev.socials
        }));
      }
    };

    window.addEventListener('andicas_settings_updated', handleConfigUpdate);
    return () => window.removeEventListener('andicas_settings_updated', handleConfigUpdate);
  }, []);

  // Suscripción reactiva instantánea a cambios en Supabase Realtime (<100ms) sin necesidad de refrescar
  useEffect(() => {
    const unsubscribe = subscribeToSystemChanges((res) => {
      if (res) {
        const locked = res.status === 'unpaid';
        setIsSiteLocked(locked);
        try {
          localStorage.setItem('andicas_subscription_status', res.status || 'active');
        } catch {}
        if (locked) {
          setIsLoading(false);
        }
        if (res.modules && typeof res.modules === 'object') {
          setActiveModules({
            ...(res.modules || {}),
            bookings: res.modules.bookings !== false,
            wompi_payments: res.modules.wompi_payments !== false && res.modules.payments !== false,
            recaudos: res.modules.recaudos !== false,
            cancelaciones: res.modules.cancelaciones !== false,
            personalizacion: res.modules.personalizacion !== false,
            users_management: res.modules.users_management !== false,
            cabanas: res.modules.cabanas !== false,
            animales: res.modules.animales !== false,
            pasadias: res.modules.pasadias !== false,
            experiencia: res.modules.experiencia !== false,
            normas: res.modules.normas !== false,
            ubicacion: res.modules.ubicacion !== false,
            ai_chatbot: res.modules.ai_chatbot !== false && res.modules.whatsapp_agent !== false,
            socials_hub: res.modules.socials_hub !== false
          });
        }
        if (res.customConfig && typeof res.customConfig === 'object') {
          setCustomConfig(prev => ({
            ...prev,
            ...res.customConfig,
            enable_ai_chatbot: res.customConfig.enable_ai_chatbot !== false,
            socials: Array.isArray(res.customConfig.socials) ? res.customConfig.socials : prev.socials
          }));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = (typeof window !== 'undefined' ? window.location.hash || '' : '').toLowerCase();
      const path = (typeof window !== 'undefined' ? window.location.pathname || '' : '').toLowerCase();
      if (hash.includes('dsb') || hash.includes('admin') || path.includes('dsb') || path.includes('admin')) {
        setCurrentPage('dsb');
        setIsLoading(false);
      } else if (hash.includes('cabanas')) {
        setCurrentPage('cabanas');
      } else if (hash.includes('animales')) {
        setCurrentPage('animales');
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const showToastNotification = ({ message, subtext }) => {
    setToast({ message, subtext });
  };

  const handleOpenBooking = (type = 'cabana') => {
    setBookingType(type);
    setBookingModalOpen(true);
  };

  const handleOpenSummary = (data) => {
    setSummaryData(data);
    setSummaryModalOpen(true);
  };

  const isAdminView = currentPage === 'dsb' || currentPage === 'admin';
  const isAiChatEnabled = activeModules.ai_chatbot !== false && customConfig.enable_ai_chatbot !== false;

  // 1. PANTALLA DE BLOQUEO POR FALTA DE PAGO (PÚBLICA - RETORNO LIMPIO INMEDIATO COMO EN KAL)
  if (isSiteLocked && !isAdminView) {
    return (
      <PublicLockoutScreen onGoToAdmin={() => navigateTo('dsb')} />
    );
  }

  // 2. VISTA ADMINISTRATIVA AISLADA DIRECTA (IDÉNTICO A KAL - SIN INTERFERENCIA DE PRELOADER NI WRAPPERS PÚBLICOS)
  if (isAdminView) {
    return (
      <AdminDashboard
        onNavigate={navigateTo}
        activeModules={activeModules}
      />
    );
  }

  // 3. VISTA PÚBLICA PRINCIPAL
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#062627] via-[#072E2F] to-[#041B1C] text-linen-100 flex flex-col justify-between selection:bg-gold-600 selection:text-jade-950 relative overflow-x-hidden">
      {/* Cinematic Logo Preloader Screen */}
      <AnimatePresence>
        {isLoading && (
          <Preloader key="app-preloader" onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* 
        FIXED WATERMARK BACKGROUND LAYER 
        Clean Translucent Logo Watermark with ZERO hard borders or square backgrounds
      */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center select-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src={customConfig.siteLogo || "/logo%20sin%20fondo.png"}
          alt="Andicas Bioparque Temático Fondo"
          className="w-[75vw] max-w-3xl h-auto max-h-[75vh] object-contain opacity-[0.06] sm:opacity-[0.07] filter contrast-125 brightness-110"
        />
      </div>

      {/* Navbar with transparent logo sin fondo */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onOpenBooking={handleOpenBooking}
        activeModules={activeModules}
        customConfig={customConfig}
      />

      {/* Main Page Content with Smooth Page Transitions */}
      <main className="flex-grow relative z-10">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <HomePage
                onOpenBooking={handleOpenBooking}
                onOpenSummary={handleOpenSummary}
                onNavigate={navigateTo}
                onShowToast={showToastNotification}
                activeModules={activeModules}
                customConfig={customConfig}
              />
            </motion.div>
          )}

          {currentPage === 'cabanas' && (
            <motion.div
              key="cabanas"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <CabanasPage
                onNavigate={navigateTo}
                onShowToast={showToastNotification}
                activeModules={activeModules}
                onOpenCancellation={handleOpenCancellation}
              />
            </motion.div>
          )}

          {currentPage === 'animales' && (
            <motion.div
              key="animales"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AnimalesPage
                onNavigate={navigateTo}
                activeModules={activeModules}
                customConfig={customConfig}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer
        onOpenBooking={handleOpenBooking}
        onOpenRules={() => setRulesModalOpen(true)}
        onNavigate={navigateTo}
        onOpenCancellation={handleOpenCancellation}
        socials={customConfig.socials}
      />

      {/* Floating Contact Hub with Hover Trigger (Derecha) */}
      {activeModules.socials_hub !== false && (
        <FloatingContactHub
          onOpenWhatsAppMenu={() => handleOpenBooking('cabana')}
          socials={customConfig.socials}
        />
      )}

      {/* Floating AI Assistant Button with Robot Icon (Izquierda) */}
      {isAiChatEnabled && (
        <FloatingAiButton
          onOpenAiChat={() => setAiChatModalOpen(true)}
        />
      )}

      {/* AI Assistant Chat Modal */}
      {isAiChatEnabled && (
        <AiAssistantModal
          isOpen={aiChatModalOpen}
          onClose={() => setAiChatModalOpen(false)}
          onOpenBooking={handleOpenBooking}
        />
      )}

      {/* Modals */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onOpenSummary={handleOpenSummary}
        initialType={bookingType}
        activeModules={activeModules}
        onOpenCancellation={handleOpenCancellation}
      />

      <BookingSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onEdit={() => setBookingModalOpen(true)}
        summaryData={summaryData}
        onShowToast={showToastNotification}
        activeModules={activeModules}
        customConfig={customConfig}
      />

      <ParkRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      <CancellationRequestModal
        isOpen={cancellationModalOpen}
        onClose={() => setCancellationModalOpen(false)}
      />

      {/* Toast */}
      <Toast
        isOpen={!!toast}
        message={toast?.message}
        subtext={toast?.subtext}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
