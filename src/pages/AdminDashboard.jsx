import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, DollarSign, Users, CheckCircle2, AlertCircle, Ban, 
  Search, RefreshCw, LogOut, Phone, Mail, MessageCircle, Home, 
  Clock, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Trash2, Calendar as CalendarIcon,
  Filter, Check, ArrowUpRight, ArrowLeft, Lock, History, User, FileText,
  Sliders, AlertTriangle, Sparkles, CreditCard, Eye, Save, Sun, Moon, CalendarDays,
  Layers, CheckSquare, MessageSquare, Send
} from 'lucide-react';
import { 
  adminLogin, 
  getAdminBookings, 
  blockDatesAdmin, 
  updateBookingStatusAdmin, 
  cancelBookingAdmin,
  getAdminAuditLogs,
  deleteBookingPermanentlyAdmin,
  purgeAllDataAdmin,
  updateAdminPasswordAdmin,
  getSubscriptionStatus,
  subscribeToSystemChanges,
  getAdminCancellationRequests,
  resolveCancellationRequestAdmin,
  getSiteCustomConfig,
  updateSiteCustomConfigAdmin
} from '../services/api';
import { cabinsData, cabinAddons } from '../data/cabins';
import { contactData } from '../data/banking';

export default function AdminDashboard({ onNavigate, activeModules }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('andicas_admin_token');
  });
  const [adminKey, setAdminKey] = useState(() => {
    return localStorage.getItem('andicas_admin_token') || '';
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('andicas_user_role') || 'admin';
  });
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Main Sidebar Navigation Section: 'agendamientos' | 'recaudos' | 'cancelaciones' | 'personalizacion' | 'auditoria'
  const [activeSection, setActiveSection] = useState('agendamientos');

  // Sub-tabs for Agendamientos: 'tabla' | 'calendario'
  const [agendaSubTab, setAgendaSubTab] = useState('tabla');

  // Password Change Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Inmutable Session Closed Modal State
  const [showSessionClosedModal, setShowSessionClosedModal] = useState(false);

  // Data states
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [calendarViewMode, setCalendarViewMode] = useState('month'); // 'month' | 'week'
  const [revenuePeriod, setRevenuePeriod] = useState('month'); // 'month' | 'week' | 'all'

  // Cancellation Requests State
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [cancellationFilter, setCancellationFilter] = useState('ALL'); // 'ALL' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  const [resolvingCancelId, setResolvingCancelId] = useState(null);

  // Interactive Day Popup Modal State (Calendar Day Click)
  const [dayAgendaModal, setDayAgendaModal] = useState({
    isOpen: false,
    dateStr: '',
    dayBookings: [],
    dayBlocks: []
  });

  // Customization CMS Lite State
  const [siteConfig, setSiteConfig] = useState({
    cabinPrices: {},
    extraPersonPrices: {},
    cabinStatus: {},
    passPlans: {
      aventurero: { enabled: true, price: 65000, name: 'Pasadía Bio-Aventurero' },
      bronce: { enabled: true, price: 95000, name: 'Pasadía Gourmet & Selva' },
      nocturna: { enabled: true, price: 70000, name: 'Pasanoche de Luces' },
      plata: { enabled: true, price: 90000, name: 'Pasanoche Velada Astral' },
      pet_aventurero: { enabled: true, price: 45000, name: 'Pase Mascota Aventurera' },
    },
    bankAccounts: contactData.banks || []
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState('');

  // Purge modal state
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgePassword, setPurgePassword] = useState('');
  const [purgeError, setPurgeError] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [selectedCabinFilter, setSelectedCabinFilter] = useState(cabinsData[0]?.id || 'casa-del-arbol');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tableMonthFilter, setTableMonthFilter] = useState('ALL');

  // Manual block modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockCabinId, setBlockCabinId] = useState(cabinsData[0]?.id || 'casa-del-arbol');
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('MANUAL_BLOCK');

  // Calendar dates state (Defaults to current date)
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatCOP = (num) => `$${Number(num || 0).toLocaleString('es-CO')} COP`;

  const getStatusTextColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAGA' || s === 'CONFIRMED') return 'text-emerald-400';
    if (s === 'AGENDADA' || s === 'PENDIENTE') return 'text-amber-400';
    if (s === 'CANCELADA' || s === 'CANCELADO' || s === 'CANCELLED') return 'text-red-400';
    if (s === 'SOLICITUD_CANCELACION') return 'text-pink-400';
    if (s === 'PENDING_PAYMENT' || s === 'INICIO' || s === 'CREACIÓN') return 'text-cyan-400';
    if (s === 'BLOQUEADO' || s === 'BLOQUEO_MANUAL') return 'text-orange-400';
    return 'text-gold-300';
  };

  const formatStatusLabel = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'SOLICITUD_CANCELACION') return 'SOLICITUD CANCELACIÓN';
    if (s === 'CANCELADA' || s === 'CANCELLED') return 'CANCELADO';
    return s;
  };

  const fetchDashboardData = async (key) => {
    setIsLoading(true);
    try {
      const targetKey = key || adminKey;
      const data = await getAdminBookings(targetKey);
      if (data.success) {
        setBookings(data.bookings || []);
        setBlockedDates(data.blocked_dates || []);
        if (data.role) setUserRole(data.role);
      }

      // Solicitudes de cancelación
      const cancelData = await getAdminCancellationRequests(targetKey);
      if (cancelData.success) {
        setCancellationRequests(cancelData.requests || []);
      }

      // Configuración de sitio CMS
      const cmsData = await getSiteCustomConfig();
      if (cmsData.success && cmsData.config) {
        setSiteConfig(prev => ({
          ...prev,
          ...cmsData.config
        }));
      }

      // Si es admin, consultar el historial de auditoría
      if ((data.role || userRole) === 'admin') {
        const auditData = await getAdminAuditLogs(targetKey);
        if (auditData.success) {
          setAuditLogs(auditData.logs || []);
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminKey) {
      fetchDashboardData(adminKey);
    }
  }, [isAuthenticated, adminKey]);

  // Suscripción reactiva instantánea a cambios en tiempo real (<100ms) sin recargar la página
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'admin') return;

    const unsubscribe = subscribeToSystemChanges((sub) => {
      if (sub) {
        if (sub.status === 'unpaid') {
          setUserRole('unpaid');
        } else if (sub.adminPassword && adminKey && sub.adminPassword !== adminKey) {
          // La contraseña de admin fue cambiada remotamente desde el panel Owner
          setShowSessionClosedModal(true);
        }
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, adminKey, userRole]);

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!newAdminPassword || newAdminPassword.trim().length < 4) {
      setPasswordChangeError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordChangeError('Las contraseñas no coinciden.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await updateAdminPasswordAdmin(newAdminPassword.trim(), adminKey);
      if (res.success) {
        setPasswordChangeSuccess('Contraseña actualizada con éxito en la nube.');
        const cleanPass = newAdminPassword.trim();
        setAdminKey(cleanPass);
        localStorage.setItem('andicas_admin_token', cleanPass);
        setTimeout(() => {
          setPasswordModalOpen(false);
          setNewAdminPassword('');
          setConfirmAdminPassword('');
          setPasswordChangeSuccess('');
        }, 1200);
      } else {
        setPasswordChangeError(res.error || 'Error al actualizar contraseña.');
      }
    } catch (err) {
      setPasswordChangeError('Error de comunicación con el servidor.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleForceSessionLogout = () => {
    setShowSessionClosedModal(false);
    localStorage.removeItem('andicas_admin_token');
    localStorage.removeItem('andicas_user_role');
    setIsAuthenticated(false);
    setAdminKey('');
    onNavigate('home');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await adminLogin(usernameInput.trim(), passwordInput.trim());
      if (res.success) {
        localStorage.setItem('andicas_admin_token', passwordInput.trim());
        localStorage.setItem('andicas_user_role', res.role || 'admin');
        setIsAuthenticated(true);
        setAdminKey(passwordInput.trim());
        setUserRole(res.role || 'admin');
        fetchDashboardData(passwordInput.trim());
      } else {
        setLoginError(res.error || 'Credenciales de acceso no válidas.');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('andicas_admin_token');
    localStorage.removeItem('andicas_user_role');
    setIsAuthenticated(false);
    setAdminKey('');
    onNavigate('home');
  };

  const handleStatusChange = async (bookingReference, newStatus) => {
    try {
      const res = await updateBookingStatusAdmin(bookingReference, newStatus, adminKey);
      if (res.success) {
        setBookings(prev => prev.map(b => b.booking_reference === bookingReference ? { ...b, status: newStatus } : b));
        fetchDashboardData(adminKey);
      }
    } catch (err) {
      alert('Error actualizando estado de reserva.');
    }
  };

  const handleCancelBooking = async (bookingReference) => {
    if (!window.confirm(`¿Confirmas la cancelación de la reserva ${bookingReference}? Las fechas se liberarán.`)) return;
    try {
      const res = await cancelBookingAdmin(bookingReference, adminKey);
      if (res.success) {
        setBookings(prev => prev.map(b => b.booking_reference === bookingReference ? { ...b, status: 'CANCELADA' } : b));
        fetchDashboardData(adminKey);
      }
    } catch (err) {
      alert('Error cancelando reserva.');
    }
  };

  const handleDeletePermanent = async (bookingReference) => {
    if (!window.confirm(`⚠️ ACCIÓN IRREVERSIBLE: ¿Deseas eliminar permanentemente la reserva ${bookingReference}?`)) return;
    try {
      const res = await deleteBookingPermanentlyAdmin(bookingReference, adminKey);
      if (res.success) {
        setBookings(prev => prev.filter(b => b.booking_reference !== bookingReference));
        fetchDashboardData(adminKey);
      }
    } catch (err) {
      alert('Error al eliminar reserva.');
    }
  };

  const handleResolveCancellation = async (requestId, bookingReference, action) => {
    setResolvingCancelId(requestId);
    try {
      const res = await resolveCancellationRequestAdmin({
        requestId,
        booking_reference: bookingReference,
        action,
        notes: `Resolución manual por ${userRole}`,
        adminKey
      });

      if (res.success) {
        setCancellationRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: action === 'APPROVE' ? 'APROBADA' : 'RECHAZADA' } : r));
        fetchDashboardData(adminKey);
      }
    } catch (err) {
      alert('Error procesando resolución de cancelación.');
    } finally {
      setResolvingCancelId(null);
    }
  };

  const handleSaveSiteCustomization = async (e) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSaveSuccess('');

    try {
      const res = await updateSiteCustomConfigAdmin(siteConfig, adminKey);
      if (res.success) {
        setConfigSaveSuccess('¡Configuración de página guardada y sincronizada en la nube con éxito!');
        setTimeout(() => setConfigSaveSuccess(''), 4000);
      }
    } catch (err) {
      alert('Error guardando configuración.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleOpenDayModal = (dateStr) => {
    const dayBookings = bookings.filter(b => 
      b.status !== 'CANCELADA' && 
      b.status !== 'CANCELLED' && 
      dateStr >= b.check_in_date && 
      dateStr < b.check_out_date
    );
    const dayBlocks = blockedDates.filter(bd => bd.blocked_date === dateStr);

    setDayAgendaModal({
      isOpen: true,
      dateStr,
      dayBookings,
      dayBlocks
    });
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNamesList = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthName = `${monthNamesList[month]} ${year}`;

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dayNum: d, dateStr });
  }

  // Vista Semanal
  const currDayOfWeek = (currentDate.getDay() + 6) % 7;
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currDayOfWeek);

  const weekDays = [];
  const dayLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    weekDays.push({ dayNum: d.getDate(), dayName: dayLabels[i], dateStr });
  }

  // Financial Metrics Calculation
  const validBookings = bookings.filter(b => b.status !== 'CANCELADA' && b.status !== 'CANCELLED');
  const totalRevenue = validBookings.reduce((sum, b) => sum + (b.total_amount_cop || 0), 0);
  const totalDepositsCollected = validBookings
    .filter(b => b.status === 'PAGA')
    .reduce((sum, b) => sum + (b.deposit_amount_cop || 0), 0);
  const totalRemainingPending = validBookings.reduce((sum, b) => {
    const remaining = (b.total_amount_cop || 0) - (b.deposit_amount_cop || 0);
    return sum + Math.max(0, remaining);
  }, 0);

  const pendingCancellationCount = cancellationRequests.filter(r => r.status === 'PENDIENTE').length;

  // Filtered bookings table
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      (b.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.booking_reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.client_phone || '').includes(searchQuery);

    const matchesCabin = selectedCabinFilter === 'ALL' || b.cabin_id === selectedCabinFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesMonth = tableMonthFilter === 'ALL' || (b.check_in_date && b.check_in_date.startsWith(tableMonthFilter));

    return matchesSearch && matchesCabin && matchesStatus && matchesMonth;
  });

  // Filtered cancellation requests
  const filteredCancellations = cancellationRequests.filter(r => {
    if (cancellationFilter === 'ALL') return true;
    return r.status === cancellationFilter;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-jade-950 text-linen-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-dark border border-gold-500/40 shadow-2xl space-y-6 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-cartoon text-gold-400 uppercase tracking-widest block">
              Acceso Restringido
            </span>
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-wide">
              Panel Administrativo
            </h1>
            <p className="text-xs font-fredoka text-linen-300 mt-1">
              Ingresa tus credenciales de recepción o administrador para gestionar la plataforma.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-fredoka text-xs text-left">
            <div>
              <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Usuario:</label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-jade-900 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-xs text-linen-100 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Contraseña:</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-jade-900 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-xs text-linen-100 outline-none"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-300 text-xs">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-gold-400 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verificando...' : 'Entrar al Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-fredoka text-linen-400 hover:text-gold-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la página web</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jade-950 text-linen-100 flex flex-col lg:flex-row font-fredoka">
      
      {/* ========================================================================= */}
      {/* SIDEBAR DE NAVEGACIÓN IZQUIERDO */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-72 bg-jade-950/95 border-b lg:border-b-0 lg:border-r border-white/10 p-4 sm:p-5 flex flex-col justify-between shrink-0 shadow-2xl z-30">
        <div className="space-y-6">
          
          {/* Brand & Status Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center text-jade-950 shadow-gold-glow font-display font-black text-lg">
                A
              </div>
              <div>
                <h2 className="font-display text-base font-black text-linen-100 uppercase tracking-wide leading-none">
                  Andicas Panel
                </h2>
                <span className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block mt-0.5">
                  {userRole === 'admin' ? 'Administrador' : 'Recepción / Staff'}
                </span>
              </div>
            </div>

            <button
              onClick={() => fetchDashboardData(adminKey)}
              className="p-2 rounded-xl bg-jade-900 hover:bg-jade-800 text-gold-400 border border-white/10 cursor-pointer"
              title="Refrescar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Section Navigation Buttons */}
          <nav className="space-y-1.5 font-cartoon text-xs uppercase">
            
            {/* 1. Agendamientos & Calendario */}
            <button
              onClick={() => setActiveSection('agendamientos')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                activeSection === 'agendamientos'
                  ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                  : 'bg-jade-900/60 hover:bg-jade-900 text-linen-200 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4" />
                <span>Agendamientos</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 font-mono">
                {bookings.length}
              </span>
            </button>

            {/* 2. Recaudos & Caja */}
            <button
              onClick={() => setActiveSection('recaudos')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                activeSection === 'recaudos'
                  ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                  : 'bg-jade-900/60 hover:bg-jade-900 text-linen-200 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4" />
                <span>Recaudos & Caja</span>
              </div>
            </button>

            {/* 3. Cancelaciones */}
            <button
              onClick={() => setActiveSection('cancelaciones')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                activeSection === 'cancelaciones'
                  ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                  : 'bg-jade-900/60 hover:bg-jade-900 text-linen-200 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Cancelaciones</span>
              </div>
              {pendingCancellationCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-mono font-bold animate-pulse">
                  {pendingCancellationCount}
                </span>
              )}
            </button>

            {/* 4. Personalización / CMS Lite */}
            <button
              onClick={() => setActiveSection('personalizacion')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                activeSection === 'personalizacion'
                  ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                  : 'bg-jade-900/60 hover:bg-jade-900 text-linen-200 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4" />
                <span>Personalización</span>
              </div>
            </button>

            {/* 5. Auditoría */}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveSection('auditoria')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeSection === 'auditoria'
                    ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                    : 'bg-jade-900/60 hover:bg-jade-900 text-linen-200 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4" />
                  <span>Auditoría</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          {userRole === 'admin' && (
            <button
              onClick={() => setPasswordModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-xs font-cartoon uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cambiar Clave</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-linen-300 text-xs font-cartoon uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Web</span>
            </button>

            <button
              onClick={handleLogout}
              className="py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-cartoon uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* ======================================================================= */}
        {/* SECCIÓN 1: AGENDAMIENTOS & CALENDARIO INTERACTIVO */}
        {/* ======================================================================= */}
        {activeSection === 'agendamientos' && (
          <div className="space-y-6">
            
            {/* Header & Sub-tab Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl glass-dark border border-white/10 shadow-xl">
              <div>
                <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                  Gestión de Estadías & Fechas
                </span>
                <h1 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                  Agendamientos & Calendario
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-jade-950 p-1 rounded-2xl border border-white/10 font-cartoon text-xs">
                  <button
                    onClick={() => setAgendaSubTab('tabla')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                      agendaSubTab === 'tabla'
                        ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    Lista de Reservas
                  </button>
                  <button
                    onClick={() => setAgendaSubTab('calendario')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                      agendaSubTab === 'calendario'
                        ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    Calendario Visual
                  </button>
                </div>

                <button
                  onClick={() => setBlockModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-hoja-600 hover:bg-hoja-500 text-white font-cartoon text-xs uppercase font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Bloquear Fechas</span>
                </button>
              </div>
            </div>

            {/* VISTA 1A: TABLA DE AGENDAS */}
            {agendaSubTab === 'tabla' && (
              <div className="space-y-4">
                
                {/* Search & Filters */}
                <div className="p-4 rounded-3xl glass-dark border border-white/10 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                    <input
                      type="text"
                      placeholder="Buscar por cliente, teléfono o # reserva..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-jade-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-linen-100 placeholder-linen-500 outline-none focus:border-gold-400 pl-9"
                    />
                    <Search className="w-4 h-4 text-linen-400 absolute left-3 top-2.5" />
                  </div>

                  <select
                    value={selectedCabinFilter}
                    onChange={(e) => setSelectedCabinFilter(e.target.value)}
                    className="bg-jade-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-linen-100 focus:border-gold-400 outline-none cursor-pointer"
                  >
                    <option value="ALL">Todas las Cabañas</option>
                    {cabinsData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-jade-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-linen-100 focus:border-gold-400 outline-none cursor-pointer"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="PAGA">Paga (Confirmada)</option>
                    <option value="AGENDADA">Agendada (Pendiente Pago)</option>
                    <option value="SOLICITUD_CANCELACION">Solicitud Cancelación</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>

                {/* Table */}
                <div className="rounded-3xl glass-dark border border-white/10 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-fredoka">
                      <thead className="bg-jade-900/80 font-cartoon text-[11px] text-gold-400 uppercase tracking-wider border-b border-white/10">
                        <tr>
                          <th className="p-3.5">Ref / Fecha</th>
                          <th className="p-3.5">Huésped</th>
                          <th className="p-3.5">Cabaña</th>
                          <th className="p-3.5">Estadía</th>
                          <th className="p-3.5">Valor / Anticipo</th>
                          <th className="p-3.5">Estado</th>
                          <th className="p-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-linen-400/60 italic">
                              No hay reservas que coincidan con los filtros.
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map((b) => (
                            <tr key={b.id || b.booking_reference} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3.5 font-mono">
                                <span className="font-bold text-linen-100 block">{b.booking_reference}</span>
                                <span className="text-[10px] text-linen-400">{b.created_at ? new Date(b.created_at).toLocaleDateString('es-CO') : ''}</span>
                              </td>
                              <td className="p-3.5">
                                <span className="font-bold text-linen-100 block">{b.client_name}</span>
                                <div className="flex items-center gap-2 text-[11px] text-linen-300 mt-0.5">
                                  <a href={`https://wa.me/${(b.client_phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-hoja-400 hover:underline flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{b.client_phone}</span>
                                  </a>
                                </div>
                              </td>
                              <td className="p-3.5 font-medium text-linen-200">
                                {b.cabin_name}
                              </td>
                              <td className="p-3.5">
                                <span className="block font-mono text-linen-100">{b.check_in_date} al {b.check_out_date}</span>
                                <span className="text-[10px] text-gold-400">{b.guests_count || 2} personas</span>
                              </td>
                              <td className="p-3.5">
                                <span className="block font-mono font-bold text-linen-100">{formatCOP(b.total_amount_cop)}</span>
                                <span className="text-[10px] text-hoja-400 font-mono">Anticipo: {formatCOP(b.deposit_amount_cop)}</span>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded-full font-cartoon font-bold text-[10px] uppercase border inline-block ${
                                  b.status === 'PAGA' 
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                    : b.status === 'SOLICITUD_CANCELACION'
                                    ? 'bg-pink-500/15 border-pink-500/30 text-pink-400'
                                    : b.status === 'CANCELADA'
                                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                }`}>
                                  {formatStatusLabel(b.status)}
                                </span>
                              </td>
                              <td className="p-3.5 text-right space-x-1">
                                {b.status !== 'PAGA' && b.status !== 'CANCELADA' && (
                                  <button
                                    onClick={() => handleStatusChange(b.booking_reference, 'PAGA')}
                                    className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 transition-colors"
                                    title="Marcar como Paga"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {b.status !== 'CANCELADA' && (
                                  <button
                                    onClick={() => handleCancelBooking(b.booking_reference)}
                                    className="p-1.5 rounded-lg bg-red-600/30 text-red-300 hover:bg-red-600/50 transition-colors"
                                    title="Cancelar Reserva"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {userRole === 'admin' && (
                                  <button
                                    onClick={() => handleDeletePermanent(b.booking_reference)}
                                    className="p-1.5 rounded-lg bg-white/5 text-linen-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
                                    title="Eliminar registro"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VISTA 1B: CALENDARIO VISUAL INTERACTIVO CON CLIC DE DÍA */}
            {agendaSubTab === 'calendario' && (
              <div className="space-y-4">
                
                {/* Calendar Navigation Header */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-5 rounded-3xl glass-dark border border-white/10 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-500/30">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                        🗓️ Vista de Calendario
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase">
                        {monthName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={month}
                      onChange={(e) => {
                        const newD = new Date(currentDate);
                        newD.setMonth(Number(e.target.value));
                        setCurrentDate(newD);
                      }}
                      className="bg-jade-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-linen-100 focus:border-gold-400 outline-none cursor-pointer"
                    >
                      {monthNamesList.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-linen-200 text-xs font-cartoon uppercase cursor-pointer"
                    >
                      Hoy
                    </button>

                    <button
                      onClick={() => {
                        const newD = new Date(currentDate);
                        newD.setMonth(newD.getMonth() - 1);
                        setCurrentDate(newD);
                      }}
                      className="p-2 rounded-xl bg-jade-900 hover:bg-jade-800 text-gold-400 border border-white/10 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const newD = new Date(currentDate);
                        newD.setMonth(newD.getMonth() + 1);
                        setCurrentDate(newD);
                      }}
                      className="p-2 rounded-xl bg-jade-900 hover:bg-jade-800 text-gold-400 border border-white/10 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid (Interactive Clicks) */}
                <div className="rounded-3xl glass-dark border border-white/10 p-4 sm:p-6 shadow-2xl space-y-3">
                  <div className="text-xs font-fredoka text-linen-400 flex items-center justify-between pb-2 border-b border-white/10">
                    <span>💡 Haz clic sobre cualquier día para ver la agenda detallada y huéspedes agendados.</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                      <div key={d} className="p-2 text-center text-xs font-cartoon text-gold-400 uppercase tracking-wider">
                        {d}
                      </div>
                    ))}

                    {calendarDays.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="p-3 sm:p-4 rounded-2xl bg-white/[0.01]" />;
                      }

                      const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                      const dayBookings = bookings.filter(b => 
                        b.status !== 'CANCELADA' && 
                        b.status !== 'CANCELLED' && 
                        day.dateStr >= b.check_in_date && 
                        day.dateStr < b.check_out_date
                      );
                      const isBlocked = blockedDates.some(bd => bd.blocked_date === day.dateStr);

                      return (
                        <div
                          key={day.dateStr}
                          onClick={() => handleOpenDayModal(day.dateStr)}
                          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer min-h-[85px] sm:min-h-[105px] flex flex-col justify-between hover:border-gold-400 hover:scale-[1.02] shadow-sm ${
                            isToday
                              ? 'bg-jade-900/90 border-gold-400 shadow-gold-glow'
                              : dayBookings.length > 0
                              ? 'bg-emerald-950/40 border-emerald-500/30'
                              : isBlocked
                              ? 'bg-orange-950/40 border-orange-500/30'
                              : 'bg-jade-950/50 border-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                              isToday ? 'bg-gold-500 text-jade-950' : 'text-linen-100'
                            }`}>
                              {day.dayNum}
                            </span>
                            {dayBookings.length > 0 && (
                              <span className="text-[9px] font-cartoon font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                {dayBookings.length} {dayBookings.length === 1 ? 'Reserva' : 'Reservas'}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 mt-1">
                            {dayBookings.slice(0, 2).map((b, bIdx) => (
                              <div key={bIdx} className="text-[10px] font-fredoka truncate text-linen-300 bg-black/40 px-1.5 py-0.5 rounded">
                                {b.client_name}
                              </div>
                            ))}
                            {dayBookings.length > 2 && (
                              <span className="text-[9px] text-gold-400 font-bold block">
                                +{dayBookings.length - 2} más...
                              </span>
                            )}
                            {isBlocked && dayBookings.length === 0 && (
                              <span className="text-[9px] text-orange-400 font-bold block">
                                Bloqueado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECCIÓN 2: RECAUDOS, CAJA & MÉTRICAS */}
        {/* ======================================================================= */}
        {activeSection === 'recaudos' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl glass-dark border border-white/10 shadow-xl">
              <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                Métricas Financieras & Flujo de Caja
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                Recaudos & Caja
              </h1>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl glass-dark border border-emerald-500/30 space-y-1 shadow-lg">
                <span className="text-[10px] font-cartoon text-emerald-400 uppercase tracking-wider block">
                  Anticipos Recaudados (50%)
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-white block">
                  {formatCOP(totalDepositsCollected)}
                </span>
                <span className="text-[11px] text-linen-400 block">Pagos confirmados por Wompi y banco</span>
              </div>

              <div className="p-5 rounded-3xl glass-dark border border-gold-500/30 space-y-1 shadow-lg">
                <span className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block">
                  Ventas Totales Proyectadas
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-gold- gradient text-gold-300 block">
                  {formatCOP(totalRevenue)}
                </span>
                <span className="text-[11px] text-linen-400 block">Monto total de estadías activas</span>
              </div>

              <div className="p-5 rounded-3xl glass-dark border border-amber-500/30 space-y-1 shadow-lg">
                <span className="text-[10px] font-cartoon text-amber-400 uppercase tracking-wider block">
                  Saldos Pendientes en Recepción
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 block">
                  {formatCOP(totalRemainingPending)}
                </span>
                <span className="text-[11px] text-linen-400 block">Por cobrar al check-in en efectivo/datafono</span>
              </div>

              <div className="p-5 rounded-3xl glass-dark border border-cyan-500/30 space-y-1 shadow-lg">
                <span className="text-[10px] font-cartoon text-cyan-400 uppercase tracking-wider block">
                  Total Reservas Activas
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-cyan-300 block">
                  {validBookings.length}
                </span>
                <span className="text-[11px] text-linen-400 block">Estadías agendadas en el sistema</span>
              </div>
            </div>

            {/* Ocupación por Cabaña */}
            <div className="p-6 rounded-3xl glass-dark border border-white/10 space-y-4 shadow-xl">
              <h3 className="font-cartoon text-sm uppercase text-gold-400 tracking-wider">
                Desglose de Ocupación por Cabaña:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cabinsData.map((cabin) => {
                  const cabinBookings = validBookings.filter(b => b.cabin_id === cabin.id);
                  const cabinRevenue = cabinBookings.reduce((sum, b) => sum + (b.total_amount_cop || 0), 0);

                  return (
                    <div key={cabin.id} className="p-4 rounded-2xl bg-jade-900/60 border border-white/5 space-y-2">
                      <h4 className="font-bold text-xs text-linen-100 truncate">{cabin.name}</h4>
                      <div className="flex justify-between text-xs text-linen-300">
                        <span>Reservas:</span>
                        <span className="font-bold font-mono text-gold-400">{cabinBookings.length}</span>
                      </div>
                      <div className="flex justify-between text-xs text-linen-300">
                        <span>Ingreso Total:</span>
                        <span className="font-bold font-mono text-emerald-400">{formatCOP(cabinRevenue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECCIÓN 3: SOLICITUDES DE CANCELACIÓN */}
        {/* ======================================================================= */}
        {activeSection === 'cancelaciones' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl glass-dark border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-xs font-cartoon text-amber-400 uppercase tracking-wider block">
                  Gestión de Cancelaciones & Políticas
                </span>
                <h1 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                  Solicitudes de Cancelación
                </h1>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-jade-950 p-1 rounded-2xl border border-white/10 text-xs font-cartoon">
                {['ALL', 'PENDIENTE', 'APROBADA', 'RECHAZADA'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCancellationFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      cancellationFilter === filter
                        ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    {filter === 'ALL' ? 'Todas' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Cancellation Requests */}
            <div className="space-y-3">
              {filteredCancellations.length === 0 ? (
                <div className="p-12 text-center rounded-3xl glass-dark border border-white/10 text-linen-400 italic">
                  No hay solicitudes de cancelación registradas.
                </div>
              ) : (
                filteredCancellations.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-3xl glass-dark border border-white/10 space-y-3 shadow-xl text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-gold-300">{req.booking_reference}</span>
                          <span className={`px-2.5 py-0.5 rounded-full font-cartoon font-bold text-[10px] uppercase border ${
                            req.status === 'APROBADA'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : req.status === 'RECHAZADA'
                              ? 'bg-red-500/15 border-red-500/30 text-red-400'
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-linen-400">Titular: <strong>{req.client_name}</strong> · Tel: {req.client_phone}</span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-xl font-mono font-bold text-[11px] inline-block ${
                          req.penalty_percentage > 0
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {req.penalty_percentage > 0 ? '⚠️ Penalidad del 40% (< 3 días)' : '✅ Solicitud Oportuna (>= 3 días)'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-linen-300">
                      <div>
                        <span className="text-[10px] text-linen-500 block uppercase font-cartoon">Cabaña & Fechas:</span>
                        <span className="font-bold text-linen-100">{req.cabin_name}</span>
                        <span className="block font-mono text-[11px]">{req.check_in_date} al {req.check_out_date}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-linen-500 block uppercase font-cartoon">Monto / Anticipo Abonado:</span>
                        <span className="font-mono text-linen-100 font-bold block">{formatCOP(req.total_amount_cop)}</span>
                        <span className="font-mono text-hoja-400 text-[11px]">Abono: {formatCOP(req.deposit_amount_cop)}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-linen-500 block uppercase font-cartoon">Motivo Manifestado:</span>
                        <p className="italic text-linen-200 text-[11px] bg-black/30 p-2 rounded-xl border border-white/5">
                          "{req.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {req.status === 'PENDIENTE' && (
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-end gap-2">
                        <a
                          href={`https://wa.me/${(req.client_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${req.client_name}! Te saludamos de Andicas Bioparque sobre tu solicitud de cancelación para la reserva ${req.booking_reference}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cartoon text-xs uppercase font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Contactar WhatsApp</span>
                        </a>

                        <button
                          disabled={resolvingCancelId === req.id}
                          onClick={() => handleResolveCancellation(req.id, req.booking_reference, 'APPROVE')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cartoon text-xs uppercase font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Aprobar & Liberar Fechas
                        </button>

                        <button
                          disabled={resolvingCancelId === req.id}
                          onClick={() => handleResolveCancellation(req.id, req.booking_reference, 'REJECT')}
                          className="px-3.5 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 font-cartoon text-xs uppercase font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECCIÓN 4: PERSONALIZACIÓN DE PÁGINA (CMS LITE) */}
        {/* ======================================================================= */}
        {activeSection === 'personalizacion' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl glass-dark border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                  Control en Vivo de Tarifas, Planes & Cuentas
                </span>
                <h1 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                  Personalización de Página
                </h1>
              </div>

              <button
                onClick={handleSaveSiteCustomization}
                disabled={isSavingConfig}
                className="px-5 py-3 rounded-2xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg flex items-center gap-2 cursor-pointer transition-all border border-gold-400 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingConfig ? 'Guardando en la Nube...' : 'Guardar Cambios en la Nube'}</span>
              </button>
            </div>

            {configSaveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center animate-fade-in">
                {configSaveSuccess}
              </div>
            )}

            {/* 1. Gestión de Tarifas de Cabañas */}
            <div className="p-6 rounded-3xl glass-dark border border-white/10 space-y-4 shadow-xl">
              <h3 className="font-cartoon text-sm uppercase text-gold-400 tracking-wider">
                1. Tarifas y Precios de Cabañas Luxury:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cabinsData.map((cabin) => {
                  const currentPrice = siteConfig.cabinPrices?.[cabin.id] || cabin.price;
                  const currentExtraPrice = siteConfig.extraPersonPrices?.[cabin.id] || cabin.extraPersonPrice;
                  const isEnabled = siteConfig.cabinStatus?.[cabin.id] !== false;

                  return (
                    <div key={cabin.id} className="p-4 rounded-2xl bg-jade-900/70 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-linen-100">{cabin.name}</h4>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-linen-300">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              setSiteConfig(prev => ({
                                ...prev,
                                cabinStatus: {
                                  ...(prev.cabinStatus || {}),
                                  [cabin.id]: e.target.checked
                                }
                              }));
                            }}
                            className="rounded accent-gold-500 cursor-pointer"
                          />
                          <span>Activa para Reservas</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-linen-400 uppercase block mb-1">Precio Noche (COP):</label>
                          <input
                            type="number"
                            value={currentPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSiteConfig(prev => ({
                                ...prev,
                                cabinPrices: {
                                  ...(prev.cabinPrices || {}),
                                  [cabin.id]: val
                                }
                              }));
                            }}
                            className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs font-mono text-linen-100 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-linen-400 uppercase block mb-1">Persona Extra (COP):</label>
                          <input
                            type="number"
                            value={currentExtraPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSiteConfig(prev => ({
                                ...prev,
                                extraPersonPrices: {
                                  ...(prev.extraPersonPrices || {}),
                                  [cabin.id]: val
                                }
                              }));
                            }}
                            className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs font-mono text-linen-100 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Planes Pasadía & Pasanoche */}
            <div className="p-6 rounded-3xl glass-dark border border-white/10 space-y-4 shadow-xl">
              <h3 className="font-cartoon text-sm uppercase text-gold-400 tracking-wider">
                2. Planes de Pasadía & Pasanoche (Habilitar / Deshabilitar):
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(siteConfig.passPlans || {}).map(([planKey, planData]) => (
                  <div key={planKey} className="p-4 rounded-2xl bg-jade-900/70 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-linen-100">{planData.name || planKey}</h4>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-linen-300">
                        <input
                          type="checkbox"
                          checked={planData.enabled !== false}
                          onChange={(e) => {
                            setSiteConfig(prev => ({
                              ...prev,
                              passPlans: {
                                ...(prev.passPlans || {}),
                                [planKey]: {
                                  ...planData,
                                  enabled: e.target.checked
                                }
                              }
                            }));
                          }}
                          className="rounded accent-gold-500 cursor-pointer"
                        />
                        <span className={planData.enabled !== false ? 'text-emerald-400 font-bold' : 'text-linen-400'}>
                          {planData.enabled !== false ? 'Disponible' : 'Pausado'}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="text-[10px] text-linen-400 uppercase block mb-1">Precio por Persona (COP):</label>
                      <input
                        type="number"
                        value={planData.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSiteConfig(prev => ({
                            ...prev,
                            passPlans: {
                              ...(prev.passPlans || {}),
                              [planKey]: {
                                ...planData,
                                price: val
                              }
                            }
                          }));
                        }}
                        className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs font-mono text-linen-100 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Cuentas Bancarias Institucionales */}
            <div className="p-6 rounded-3xl glass-dark border border-white/10 space-y-4 shadow-xl">
              <h3 className="font-cartoon text-sm uppercase text-gold-400 tracking-wider">
                3. Cuentas Bancarias Oficiales para Abonos:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(siteConfig.bankAccounts || contactData.banks).map((bank, bIdx) => (
                  <div key={bIdx} className="p-4 rounded-2xl bg-jade-900/70 border border-white/10 space-y-3">
                    <h4 className="font-bold text-xs text-gold-300">{bank.bank}</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-linen-400 uppercase block mb-1">Número de Cuenta:</label>
                        <input
                          type="text"
                          value={bank.accountNumber}
                          onChange={(e) => {
                            const newBanks = [...(siteConfig.bankAccounts || contactData.banks)];
                            newBanks[bIdx] = { ...newBanks[bIdx], accountNumber: e.target.value };
                            setSiteConfig(prev => ({ ...prev, bankAccounts: newBanks }));
                          }}
                          className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs font-mono text-linen-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-linen-400 uppercase block mb-1">Titular:</label>
                        <input
                          type="text"
                          value={bank.holder}
                          onChange={(e) => {
                            const newBanks = [...(siteConfig.bankAccounts || contactData.banks)];
                            newBanks[bIdx] = { ...newBanks[bIdx], holder: e.target.value };
                            setSiteConfig(prev => ({ ...prev, bankAccounts: newBanks }));
                          }}
                          className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs text-linen-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SECCIÓN 5: AUDITORÍA & HISTORIAL */}
        {/* ======================================================================= */}
        {activeSection === 'auditoria' && userRole === 'admin' && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl glass-dark border border-white/10 shadow-xl">
              <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                Trazabilidad & Seguridad de Operaciones
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                Historial de Auditoría
              </h1>
            </div>

            <div className="rounded-3xl glass-dark border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-fredoka">
                  <thead className="bg-jade-900/80 font-cartoon text-[11px] text-gold-400 uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Fecha / Hora</th>
                      <th className="p-3.5">Referencia</th>
                      <th className="p-3.5">Huésped / Recurso</th>
                      <th className="p-3.5">Movimiento</th>
                      <th className="p-3.5">Operador</th>
                      <th className="p-3.5">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-linen-400 italic">
                          No hay registros de auditoría aún.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 font-mono text-[11px] text-linen-300">
                            {log.created_at ? new Date(log.created_at).toLocaleString('es-CO') : 'Reciente'}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-gold-400">
                            {log.booking_reference}
                          </td>
                          <td className="p-3.5 text-linen-200">
                            {log.client_name}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-white/10 font-cartoon text-[10px] uppercase text-linen-200">
                              {log.previous_status} → {log.new_status}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-linen-100">
                            {log.changed_by}
                          </td>
                          <td className="p-3.5 text-linen-400 text-[11px]">
                            {log.notes}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================================= */}
      {/* MODAL: VENTANA EMERGENTE INTERACTIVA DEL DÍA (CALENDAR DAY POPUP) */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {dayAgendaModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDayAgendaModal(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-jade-950 border border-gold-500/40 p-5 sm:p-6 shadow-2xl z-10 space-y-4 text-linen-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-500/30">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-cartoon text-gold-400 uppercase tracking-widest block">
                      Agenda Detallada del Día
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-black text-white uppercase font-mono">
                      {dayAgendaModal.dateStr}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setDayAgendaModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 rounded-xl bg-jade-900 border border-white/10 text-linen-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bookings on this day */}
              <div className="space-y-3">
                <h4 className="font-cartoon text-xs uppercase text-gold-400 tracking-wider">
                  Huéspedes & Cabañas Agendadas ({dayAgendaModal.dayBookings.length}):
                </h4>

                {dayAgendaModal.dayBookings.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-jade-900/50 border border-white/5 space-y-3">
                    <p className="text-xs text-linen-400 italic">
                      No hay reservas agendadas para esta fecha. Todas las cabañas están disponibles.
                    </p>
                    <button
                      onClick={() => {
                        setBlockCabinId(selectedCabinFilter === 'ALL' ? cabinsData[0].id : selectedCabinFilter);
                        setBlockStartDate(dayAgendaModal.dateStr);
                        setBlockEndDate(dayAgendaModal.dateStr);
                        setDayAgendaModal(prev => ({ ...prev, isOpen: false }));
                        setBlockModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-hoja-600 hover:bg-hoja-500 text-white font-cartoon text-xs uppercase font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Bloquear este día para mantenimiento</span>
                    </button>
                  </div>
                ) : (
                  dayAgendaModal.dayBookings.map((b) => (
                    <div
                      key={b.id || b.booking_reference}
                      className="p-4 rounded-2xl bg-jade-900/80 border border-white/10 space-y-2.5 text-xs shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-linen-100 text-sm">{b.cabin_name}</span>
                        <span className={`px-2 py-0.5 rounded-full font-cartoon font-bold text-[10px] uppercase border ${
                          b.status === 'PAGA'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        }`}>
                          {b.status === 'PAGA' ? 'PAGA (50% ABONADO)' : 'AGENDADA (PENDIENTE)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-linen-300 text-[11px]">
                        <div>
                          <span className="text-[10px] text-linen-500 uppercase block font-cartoon">Huésped:</span>
                          <span className="font-bold text-linen-100">{b.client_name}</span>
                          <span className="block text-linen-400">{b.guests_count || 2} personas</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-linen-500 uppercase block font-cartoon">Contacto:</span>
                          <span className="block">{b.client_phone}</span>
                          <span className="block truncate text-linen-400">{b.client_email}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-linen-500 block">Total Estadía:</span>
                          <span className="font-bold text-linen-100">{formatCOP(b.total_amount_cop)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-hoja-400 block">Anticipo 50%:</span>
                          <span className="font-bold text-hoja-400">{formatCOP(b.deposit_amount_cop)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-linen-500 block">Saldo en Recepción:</span>
                          <span className="font-bold text-linen-200">{formatCOP((b.total_amount_cop || 0) - (b.deposit_amount_cop || 0))}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <a
                          href={`https://wa.me/${(b.client_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${b.client_name}! Te saludamos desde recepción de Andicas Bioparque sobre tu estadía en ${b.cabin_name}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cartoon text-xs uppercase font-bold flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        {b.status !== 'PAGA' && (
                          <button
                            onClick={() => {
                              handleStatusChange(b.booking_reference, 'PAGA');
                              setDayAgendaModal(prev => ({ ...prev, isOpen: false }));
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gold-gradient text-jade-950 font-cartoon text-xs uppercase font-bold transition-all"
                          >
                            Marcar como Paga
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* MODAL: CAMBIAR CONTRASEÑA ADMIN */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {passwordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPasswordModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 rounded-3xl glass-dark border border-gold-500/50 shadow-2xl space-y-4 z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-gold-400">
                  <Lock className="w-5 h-5" />
                  <h3 className="font-display text-base font-black text-white uppercase">
                    Cambiar Contraseña Admin
                  </h3>
                </div>
                <button
                  onClick={() => setPasswordModalOpen(false)}
                  className="p-1.5 rounded-xl bg-jade-900 text-linen-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNewPassword} className="space-y-3 font-fredoka text-xs">
                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Nueva Contraseña:</label>
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs text-linen-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Confirmar Contraseña:</label>
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Repite la nueva contraseña"
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs text-linen-100 outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-linen-400">
                  <input
                    type="checkbox"
                    checked={showPasswordText}
                    onChange={(e) => setShowPasswordText(e.target.checked)}
                    className="rounded accent-gold-500 cursor-pointer"
                  />
                  <span>Mostrar texto de contraseña</span>
                </label>

                {passwordChangeError && (
                  <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-500/50 text-red-300 text-xs">
                    {passwordChangeError}
                  </div>
                )}

                {passwordChangeSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 text-xs">
                    {passwordChangeSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-3 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2 cursor-pointer border border-gold-400 disabled:opacity-50"
                >
                  <span>{isChangingPassword ? 'Guardando...' : 'Guardar Nueva Contraseña'}</span>
                  <Save className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* MODAL INMUTABLE: SESIÓN CERRADA REMOTAMENTE */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {showSessionClosedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-jade-950 border-2 border-red-500/50 shadow-2xl text-center space-y-4 z-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display text-xl font-black text-white uppercase tracking-wide">
                  Sesión Cerrada por Seguridad
                </h3>
                <p className="text-xs font-fredoka text-linen-300 mt-2 leading-relaxed">
                  La contraseña del panel de administración fue actualizada remotamente. Tu sesión actual ha caducado por motivos de protección.
                </p>
              </div>
              <button
                onClick={handleForceSessionLogout}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-cartoon font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
              >
                Salir del Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* MODAL: BLOQUEAR FECHAS MANUALMENTE */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {blockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBlockModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 rounded-3xl glass-dark border border-gold-500/50 shadow-2xl space-y-4 z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-display text-base font-black text-white uppercase">
                  Bloquear Fechas en Cabaña
                </h3>
                <button
                  onClick={() => setBlockModalOpen(false)}
                  className="p-1.5 rounded-xl bg-jade-900 text-linen-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!blockStartDate || !blockEndDate) return;
                  const res = await blockDatesAdmin(blockCabinId, [blockStartDate, blockEndDate], blockReason, adminKey);
                  if (res.success) {
                    setBlockModalOpen(false);
                    fetchDashboardData(adminKey);
                  }
                }}
                className="space-y-3 font-fredoka text-xs"
              >
                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Cabaña a Bloquear:</label>
                  <select
                    value={blockCabinId}
                    onChange={(e) => setBlockCabinId(e.target.value)}
                    className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs text-linen-100 outline-none cursor-pointer"
                  >
                    {cabinsData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Fecha Inicial:</label>
                    <input
                      type="date"
                      required
                      value={blockStartDate}
                      onChange={(e) => setBlockStartDate(e.target.value)}
                      className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs text-linen-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Fecha Final:</label>
                    <input
                      type="date"
                      required
                      value={blockEndDate}
                      onChange={(e) => setBlockEndDate(e.target.value)}
                      className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs text-linen-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Motivo del Bloqueo:</label>
                  <input
                    type="text"
                    placeholder="Ej. Mantenimiento de Jacuzzi o Reserva Telefónica"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs text-linen-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Confirmar Bloqueo de Fechas</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
