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
import Preloader from './components/Preloader';
import Toast from './components/Toast';
import PublicLockoutScreen from './components/PublicLockoutScreen';
import { getSubscriptionStatus } from './services/api';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSiteLocked, setIsSiteLocked] = useState(false);
  const [activeModules, setActiveModules] = useState({ bookings: true, wompi_payments: true });
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (hash === 'cabanas' || hash === 'animales' || hash === 'admin') return hash;
    return 'home';
  });

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingType, setBookingType] = useState('cabana');
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

  // Verificar estado de suscripción / pago del sitio y módulos en tiempo real (<150ms)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await getSubscriptionStatus();
        if (res) {
          setIsSiteLocked(res.status === 'unpaid');
          if (res.modules && typeof res.modules === 'object') {
            setActiveModules({
              bookings: res.modules.bookings !== false,
              wompi_payments: res.modules.wompi_payments !== false && res.modules.payments !== false
            });
          }
        }
      } catch (err) {
        console.warn('Error verificando estado Andicas:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash === 'cabanas' || hash === 'animales' || hash === 'dsb' || hash === 'admin') {
        setCurrentPage(hash === 'admin' ? 'dsb' : hash);
      } else if (!hash || hash === 'experiencia' || hash === 'cabanas-seccion' || hash === 'arma-tu-plan' || hash === 'normas' || hash === 'ubicacion') {
        setCurrentPage('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#062627] via-[#072E2F] to-[#041B1C] text-linen-100 flex flex-col justify-between selection:bg-gold-600 selection:text-jade-950 relative overflow-x-hidden">
      {/* Cinematic Logo Preloader Screen */}
      <AnimatePresence>
        {isLoading && (
          <Preloader key="app-preloader" onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* PANTALLA DE BLOQUEO POR FALTA DE PAGO (PÚBLICA) */}
      {isSiteLocked && !isAdminView && (
        <PublicLockoutScreen onGoToAdmin={() => navigateTo('dsb')} />
      )}

      {/* 
        FIXED WATERMARK BACKGROUND LAYER 
        Clean Translucent Logo Watermark with ZERO hard borders or square backgrounds
      */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center select-none overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/logo%20sin%20fondo.png"
          alt="Andicas Bioparque Temático Fondo"
          className="w-[75vw] max-w-3xl h-auto max-h-[75vh] object-contain opacity-[0.06] sm:opacity-[0.07] filter contrast-125 brightness-110"
        />
      </div>

      {/* Navbar with transparent logo sin fondo (Oculta en panel admin /dsb) */}
      {!isAdminView && (
        <Navbar
          currentPage={currentPage}
          onNavigate={navigateTo}
          onOpenBooking={handleOpenBooking}
        />
      )}

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
              />
            </motion.div>
          )}

          {(currentPage === 'dsb' || currentPage === 'admin') && (
            <motion.div
              key="dsb"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AdminDashboard
                onNavigate={navigateTo}
                activeModules={activeModules}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer (Hidden on Admin page /dsb) */}
      {!isAdminView && (
        <Footer
          onOpenBooking={handleOpenBooking}
          onOpenRules={() => setRulesModalOpen(true)}
          onNavigate={navigateTo}
        />
      )}

      {/* Floating Contact Hub with Hover Trigger (Derecha, Oculto en panel admin /dsb) */}
      {!isAdminView && (
        <FloatingContactHub
          onOpenWhatsAppMenu={() => handleOpenBooking('cabana')}
        />
      )}

      {/* Floating AI Assistant Button with Robot Icon (Izquierda, Oculto en panel admin /dsb) */}
      {!isAdminView && (
        <FloatingAiButton
          onOpenAiChat={() => setAiChatModalOpen(true)}
        />
      )}

      {/* AI Assistant Chat Modal */}
      <AiAssistantModal
        isOpen={aiChatModalOpen}
        onClose={() => setAiChatModalOpen(false)}
        onOpenBooking={handleOpenBooking}
      />

      {/* Modals */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onOpenSummary={handleOpenSummary}
        initialType={bookingType}
        activeModules={activeModules}
      />

      <BookingSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onEdit={() => setBookingModalOpen(true)}
        summaryData={summaryData}
        onShowToast={showToastNotification}
        activeModules={activeModules}
      />

      <ParkRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
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
