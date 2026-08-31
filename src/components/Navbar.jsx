import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';

export default function Navbar({ 
  currentPage = 'home',
  onNavigate,
  onOpenBooking,
  activeModules = {},
  customConfig = {}
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 25);
      
      if (currentPage === 'home') {
        const expEl = document.getElementById('experiencia');
        const armaEl = document.getElementById('arma-tu-plan');
        const normasEl = document.getElementById('normas');
        const ubicacionEl = document.getElementById('ubicacion');

        const scrollPos = scrollY + 260;

        // When at the top / in the Hero: NOTHING is selected in the navbar!
        if (!expEl || scrollPos < expEl.offsetTop) {
          setActiveSection(null);
          return;
        }

        // Once the user reaches or enters 'experiencia' (Refugio):
        if (ubicacionEl && scrollPos >= ubicacionEl.offsetTop) {
          setActiveSection('ubicacion');
        } else if (normasEl && scrollPos >= normasEl.offsetTop) {
          setActiveSection('normas');
        } else if (armaEl && scrollPos >= armaEl.offsetTop) {
          setActiveSection('arma-tu-plan');
        } else {
          // Inside 'experiencia' section: Inicio is selected!
          setActiveSection('inicio');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to establish initial state
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  const navConfig = customConfig.navItems || {};

  // Left Nav Group
  const allLeftNavItems = [
    { 
      id: 'inicio', 
      name: navConfig.inicio?.label || 'Inicio', 
      page: 'home', 
      href: '#experiencia', 
      enabled: activeModules?.experiencia !== false && navConfig.inicio?.enabled !== false 
    },
    ...(navConfig.experiencia && navConfig.experiencia.enabled ? [{
      id: 'experiencia',
      name: navConfig.experiencia?.label || 'Atracciones',
      page: 'home',
      href: '#experiencia',
      enabled: activeModules?.experiencia !== false
    }] : []),
    { 
      id: 'arma-tu-plan', 
      name: navConfig.pasadias?.label || navConfig['arma-tu-plan']?.label || 'Arma Tu Plan', 
      page: 'home', 
      href: '#arma-tu-plan', 
      enabled: activeModules?.pasadias !== false && navConfig.pasadias?.enabled !== false && navConfig['arma-tu-plan']?.enabled !== false 
    },
    { 
      id: 'normas', 
      name: navConfig.normas?.label || 'Normas & Políticas', 
      page: 'home', 
      href: '#normas', 
      enabled: activeModules?.normas !== false && navConfig.normas?.enabled !== false 
    },
    { 
      id: 'ubicacion', 
      name: navConfig.ubicacion?.label || 'Ubicación', 
      page: 'home', 
      href: '#ubicacion', 
      enabled: activeModules?.ubicacion !== false && navConfig.ubicacion?.enabled !== false 
    },
  ];
  const leftNavItems = allLeftNavItems.filter(item => item.enabled);

  // Right Nav Group (Dedicated Pages)
  const allRightNavItems = [
    { 
      id: 'cabanas', 
      name: navConfig.cabanas?.label || 'Reservar Cabaña', 
      page: 'cabanas', 
      href: '#', 
      enabled: activeModules?.cabanas !== false && navConfig.cabanas?.enabled !== false 
    },
    { 
      id: 'animales', 
      name: navConfig.animales?.label || 'Santuario Animal', 
      page: 'animales', 
      href: '#', 
      enabled: activeModules?.animales !== false && navConfig.animales?.enabled !== false 
    },
  ];
  const rightNavItems = allRightNavItems.filter(item => item.enabled);

  const handleItemClick = (item) => {
    setMobileMenuOpen(false);

    if (item.id === 'inicio') {
      if (currentPage !== 'home') {
        onNavigate('home');
        setTimeout(() => {
          const el = document.getElementById('experiencia');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            setActiveSection('inicio');
          }
        }, 120);
      } else {
        const el = document.getElementById('experiencia');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          setActiveSection('inicio');
        }
      }
      return;
    }

    if (item.page !== currentPage) {
      onNavigate(item.page);
      if (item.href && item.href !== '#') {
        setTimeout(() => {
          const el = document.querySelector(item.href);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(item.id);
          }
        }, 120);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (item.href && item.href !== '#') {
        const el = document.querySelector(item.href);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(item.id);
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveSection(null);
      }
    }
  };

  const getIsActive = (item) => {
    if (currentPage === 'cabanas') return item.id === 'cabanas';
    if (currentPage === 'animales') return item.id === 'animales';
    if (currentPage === 'home') {
      if (item.page === 'cabanas' || item.page === 'animales') return false;
      return activeSection === item.id;
    }
    return false;
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'py-2.5 bg-jade-950/95 backdrop-blur-2xl border-b border-gold-600/30 shadow-2xl'
            : 'py-3.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Official PNG Logo without background + Main Left Navigation */}
            <div className="flex items-center gap-6">
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveSection(null);
                  onNavigate('home'); 
                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                }}
                className="group flex items-center gap-3 cursor-pointer flex-shrink-0"
              >
                <div className="h-12 w-auto flex items-center justify-center">
                  <img
                    src={customConfig.siteLogo || "/logo sin fondo.png"}
                    alt={`${customConfig.siteName || "Andicas Bioparque Temático"} Logo`}
                    className="h-12 w-auto object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                  />
                </div>
              </a>

              {/* Left Navigation Group */}
              <nav className="hidden lg:flex items-center gap-1.5">
                {leftNavItems.map((item) => {
                  const isActive = getIsActive(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`relative px-4 py-2 text-sm font-fredoka font-semibold transition-colors cursor-pointer rounded-md ${
                        isActive
                          ? 'text-gold-400 font-bold'
                          : 'text-linen-300/90 hover:text-white'
                      }`}
                    >
                      {/* Transparent Grey Layer Active Background */}
                      {isActive && (
                        <motion.div
                          layoutId="navbarActiveTab"
                          className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-md"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}

                      {/* Sliding Gold Underline */}
                      {isActive && (
                        <motion.div
                          layoutId="navbarUnderline"
                          className="absolute -bottom-1 left-2 right-2 h-0.5 bg-gold-500 rounded-full shadow-gold-glow"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}

                      <span className="relative z-10">{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right: Dedicated Pages Navigation (Reservar Cabaña & Santuario Animal) */}
            <div className="hidden lg:flex items-center gap-2">
              {rightNavItems.map((item) => {
                const isActive = getIsActive(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`relative px-4 py-2 text-sm font-fredoka font-semibold transition-colors cursor-pointer rounded-md ${
                      isActive
                        ? 'text-gold-400 font-bold'
                        : 'text-linen-300/90 hover:text-white'
                    }`}
                  >
                    {/* Transparent Grey Layer Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="navbarActiveTabRight"
                        className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-md"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}

                    {/* Sliding Gold Underline */}
                    {isActive && (
                      <motion.div
                        layoutId="navbarUnderlineRight"
                        className="absolute -bottom-1 left-2 right-2 h-0.5 bg-gold-500 rounded-full shadow-gold-glow"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}

                    <span className="relative z-10">{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-linen-100 transition-colors"
                aria-label="Abrir Menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-gold-400" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[72px] z-30 bg-jade-950/98 border-b border-gold-600/30 p-6 shadow-2xl lg:hidden backdrop-blur-2xl"
          >
            <div className="flex flex-col space-y-2">
              <span className="text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-widest px-3 mb-1">
                Navegación
              </span>
              {[...leftNavItems, ...rightNavItems].map((item) => {
                const isActive = getIsActive(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-white/[0.08] text-gold-400 font-bold border border-white/15'
                        : 'text-linen-200 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-base font-fredoka font-semibold">{item.name}</span>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-linen-400'}`} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
