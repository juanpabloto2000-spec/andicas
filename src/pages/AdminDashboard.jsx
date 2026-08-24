import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, DollarSign, Users, CheckCircle2, AlertCircle, Ban, 
  Search, RefreshCw, LogOut, Phone, Mail, MessageCircle, Home, 
  Clock, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Trash2, Calendar as CalendarIcon,
  Filter, Check, ArrowUpRight, ArrowLeft, Lock, History, User, FileText
} from 'lucide-react';
import { 
  adminLogin, 
  getAdminBookings, 
  blockDatesAdmin, 
  updateBookingStatusAdmin, 
  cancelBookingAdmin,
  getAdminAuditLogs,
  deleteBookingPermanentlyAdmin,
  purgeAllDataAdmin
} from '../services/api';
import { cabinsData } from '../data/cabins';

export default function AdminDashboard({ onNavigate }) {
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

  // Data states
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('agendas'); // 'agendas' | 'calendario' | 'auditoria'
  const [calendarViewMode, setCalendarViewMode] = useState('month'); // 'month' | 'week'
  const [revenuePeriod, setRevenuePeriod] = useState('month'); // 'month' | 'week'
  const [revenueDropdownOpen, setRevenueDropdownOpen] = useState(false);

  // Purge modal state
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgePassword, setPurgePassword] = useState('');
  const [purgeError, setPurgeError] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [selectedCabinFilter, setSelectedCabinFilter] = useState(cabinsData[0]?.id || 'casa-del-arbol');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tableMonthFilter, setTableMonthFilter] = useState('ALL'); // 'ALL' or 'YYYY-MM'

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
    if (s === 'PENDING_PAYMENT' || s === 'INICIO' || s === 'CREACIÓN') return 'text-cyan-400';
    if (s === 'BLOQUEADO' || s === 'BLOQUEO_MANUAL') return 'text-orange-400';
    return 'text-gold-300';
  };

  const formatStatusLabel = (status) => {
    const s = String(status || '').toUpperCase();
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await adminLogin(passwordInput, usernameInput);
      if (res.success && res.token) {
        const role = res.role || 'admin';
        localStorage.setItem('andicas_admin_token', res.token);
        localStorage.setItem('andicas_user_role', role);
        setAdminKey(res.token);
        setUserRole(role);
        setIsAuthenticated(true);
        fetchDashboardData(res.token);
      } else {
        setLoginError('Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      setLoginError('No se pudo conectar con el servidor backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('andicas_admin_token');
    localStorage.removeItem('andicas_user_role');
    setIsAuthenticated(false);
    setAdminKey('');
    setUserRole('admin');
  };

  // Change booking status handler
  const handleStatusChange = async (bookingRef, newStatus) => {
    try {
      const res = await updateBookingStatusAdmin(bookingRef, newStatus, adminKey);
      if (res.success) {
        fetchDashboardData();
      } else {
        alert(res.error || 'Error al actualizar estado.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const handleBlockDates = async (e) => {
    e.preventDefault();
    if (!blockStartDate || !blockEndDate) {
      alert('Por favor selecciona fecha inicial y final.');
      return;
    }

    const start = new Date(blockStartDate);
    const end = new Date(blockEndDate);
    const dates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    try {
      const res = await blockDatesAdmin(blockCabinId, dates, blockReason, adminKey);
      if (res.success) {
        setBlockModalOpen(false);
        fetchDashboardData();
      } else {
        alert(res.error || 'Error al bloquear fechas.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const handleDeleteCanceledBooking = async (bookingReference, clientName) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente la reserva ${bookingReference} de ${clientName || 'Huésped'}? Esta acción liberará cualquier fecha remanente y borrará el registro por completo.`)) {
      return;
    }

    try {
      const res = await deleteBookingPermanentlyAdmin(bookingReference, adminKey);
      if (res.success) {
        fetchDashboardData();
      } else {
        alert(res.error || 'Error eliminando la reserva.');
      }
    } catch (err) {
      alert('Error de conexión al eliminar la reserva.');
    }
  };

  const handleExecutePurge = async () => {
    if (!purgePassword) {
      setPurgeError('Por favor ingresa la contraseña de administrador.');
      return;
    }

    setIsPurging(true);
    setPurgeError('');
    try {
      const res = await purgeAllDataAdmin(purgePassword, adminKey);
      if (res.success) {
        setPurgeModalOpen(false);
        setPurgePassword('');
        fetchDashboardData();
        alert('✅ ¡Todos los datos de agendas y movimientos han sido purgados exitosamente!');
      } else {
        setPurgeError(res.error || 'Contraseña incorrecta o error en el servidor.');
      }
    } catch (err) {
      setPurgeError('Error de conexión al conectar con el servidor.');
    } finally {
      setIsPurging(false);
    }
  };

  // Metric calculations based on exact statuses: AGENDADA, PAGA, CANCELADA
  const activeBookings = bookings.filter((b) => b.status === 'AGENDADA' || b.status === 'CONFIRMED' || b.status === 'PAGA');
  const pagasBookings = bookings.filter((b) => b.status === 'PAGA');
  const agendadasBookings = bookings.filter((b) => b.status === 'AGENDADA' || b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT');
  const canceladasBookings = bookings.filter((b) => b.status === 'CANCELADA' || b.status === 'CANCELLED');

  // Recaudado: 100% de las PAGAS + 50% de las AGENDADAS
  const totalRecaudado = activeBookings.reduce((acc, b) => {
    if (b.status === 'PAGA') {
      return acc + Number(b.total_amount_cop || 0);
    }
    return acc + Number(b.deposit_amount_cop || 0);
  }, 0);

  // Saldo Faltante: 50% de las AGENDADAS (Las PAGAS tienen saldo 0)
  const totalSaldoFaltante = agendadasBookings.reduce((acc, b) => {
    if (b.status === 'PAGA' || b.status === 'CANCELADA') return acc;
    return acc + Number(b.remaining_balance_cop || (Number(b.total_amount_cop) - Number(b.deposit_amount_cop)));
  }, 0);

  // Helper for Month format
  const formatMonthName = (monthKey) => {
    if (!monthKey || monthKey === 'Sin fecha') return 'Sin Fecha Asignada';
    const [y, m] = monthKey.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  };

  // Helper para extraer emojis limpios de los servicios adicionales
  const extractAddonEmojis = (notes) => {
    if (!notes) return [];
    const emojis = [];
    const lower = String(notes).toLowerCase();
    if (notes.includes('🌹') || lower.includes('decoraci') || lower.includes('romance') || lower.includes('aniversario')) {
      emojis.push({ emoji: '🌹', name: 'Decoración Mágica / Aniversario' });
    }
    if (notes.includes('🧊') || lower.includes('nevera') || lower.includes('frigobar') || lower.includes('bebida')) {
      emojis.push({ emoji: '🧊', name: 'Frigobar / Nevera Llena' });
    }
    if (notes.includes('🧀') || lower.includes('queso') || lower.includes('tabla')) {
      emojis.push({ emoji: '🧀', name: 'Tabla de Quesos & Frutos Secos' });
    }
    return emojis;
  };

  // Get list of unique available months across all bookings
  const availableMonths = Array.from(
    new Set(bookings.map((b) => (b.check_in_date ? b.check_in_date.substring(0, 7) : ''))).values()
  ).filter(Boolean).sort();

  // Filtered Bookings for "Agendas y Recaudo"
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      (b.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.booking_reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.cabin_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.client_phone || '').includes(searchQuery);
    
    let matchesStatus = true;
    if (statusFilter === 'AGENDADA') {
      matchesStatus = b.status === 'AGENDADA' || b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT';
    } else if (statusFilter === 'PAGA') {
      matchesStatus = b.status === 'PAGA';
    } else if (statusFilter === 'CANCELADA') {
      matchesStatus = b.status === 'CANCELADA' || b.status === 'CANCELLED';
    }

    const bookingMonth = b.check_in_date ? b.check_in_date.substring(0, 7) : '';
    const matchesMonth = tableMonthFilter === 'ALL' || bookingMonth === tableMonthFilter;

    return matchesSearch && matchesStatus && matchesMonth;
  });

  // Group filtered bookings by Month
  const bookingsByMonth = filteredBookings.reduce((acc, b) => {
    const mKey = b.check_in_date ? b.check_in_date.substring(0, 7) : 'Sin fecha';
    if (!acc[mKey]) acc[mKey] = [];
    acc[mKey].push(b);
    return acc;
  }, {});

  const sortedMonthKeys = Object.keys(bookingsByMonth).sort();

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  // Weekly calculation
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return {
      date: d,
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('es-CO', { weekday: 'short' }),
      dayNum: d.getDate(),
    };
  });

  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const weekStartStr = weekDays[0]?.dateStr || '';
  const weekEndStr = weekDays[6]?.dateStr || '';

  // Agendas activas por periodo (Semanal o Mensual)
  const displayPeriodBookings = revenuePeriod === 'week'
    ? activeBookings.filter((b) => b.check_in_date && b.check_in_date >= weekStartStr && b.check_in_date <= weekEndStr)
    : activeBookings.filter((b) => b.check_in_date && b.check_in_date.startsWith(currentMonthPrefix));

  // Recaudado según periodo seleccionado (si es semanal, calcula la semana actual; si es mensual, calcula el mes)
  const displayRecaudado = (revenuePeriod === 'week' ? displayPeriodBookings : activeBookings).reduce((acc, b) => {
    if (b.status === 'PAGA') {
      return acc + Number(b.total_amount_cop || 0);
    }
    return acc + Number(b.deposit_amount_cop || 0);
  }, 0);

  const displaySaldoFaltante = (revenuePeriod === 'week' ? displayPeriodBookings : activeBookings).filter((b) => b.status !== 'PAGA' && b.status !== 'CANCELADA').reduce((acc, b) => {
    return acc + Number(b.remaining_balance_cop || (Number(b.total_amount_cop) - Number(b.deposit_amount_cop || 0)));
  }, 0);

  const monthNamesList = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // LOGIN VIEW
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#062627] via-[#072E2F] to-[#041B1C] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl glass-dark border border-gold-400 shadow-2xl space-y-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-jade-900 border border-gold-500 flex items-center justify-center mx-auto text-gold-400 shadow-gold-glow">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h1 className="font-display text-2xl font-black text-linen-100 uppercase tracking-wide">
              Panel Administrativo
            </h1>
            <p className="text-xs font-fredoka text-linen-300 mt-1">
              Control de Agendas, Ocupación y Recaudo
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-fredoka">
            {/* Selector Rápido de Cuenta / Rol */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                Selecciona tu Cuenta
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setUsernameInput('admin')}
                  className={`p-3 rounded-2xl border text-xs font-display uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    usernameInput === 'admin'
                      ? 'bg-gold-500/25 border-gold-400 text-gold-300 shadow-gold-glow font-black ring-1 ring-gold-400/50'
                      : 'bg-jade-950/60 border-white/10 text-linen-400 hover:border-white/20 hover:text-linen-200'
                  }`}
                >
                  <span className="text-xl">👑</span>
                  <span className="font-black text-sm">ADMIN</span>
                  <span className="text-[9px] font-fredoka opacity-75 lowercase tracking-normal">acceso total</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUsernameInput('recepcion')}
                  className={`p-3 rounded-2xl border text-xs font-display uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    usernameInput === 'recepcion' || usernameInput === 'staff'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-md font-black ring-1 ring-cyan-400/50'
                      : 'bg-jade-950/60 border-white/10 text-linen-400 hover:border-white/20 hover:text-linen-200'
                  }`}
                >
                  <span className="text-xl">👤</span>
                  <span className="font-black text-sm">RECEPCIÓN</span>
                  <span className="text-[9px] font-fredoka opacity-75 lowercase tracking-normal">estándar / staff</span>
                </button>
              </div>
            </div>

            {/* Input Clave */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                Clave de Seguridad
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-linen-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="w-full bg-jade-950 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-linen-100 placeholder-linen-500 focus:border-gold-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase shadow-gold-glow hover:brightness-110 transition-all cursor-pointer btn-shimmer disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Entrar al Dashboard'}
            </button>
          </form>

          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-fredoka text-linen-400 hover:text-gold-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al sitio público</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD (FULL SCREEN, NO NAVBAR)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#062627] via-[#072E2F] to-[#041B1C] text-linen-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1440px] mx-auto">
      
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="space-y-1.5">
          {userRole === 'admin' ? (
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-gold-500/20 border border-gold-400 text-gold-300 shadow-gold-glow">
              <span className="text-2xl">👑</span>
              <span className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-gold-gradient">
                ADMIN
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-md">
              <span className="text-2xl">👤</span>
              <span className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-cyan-300">
                RECEPCION
              </span>
            </div>
          )}
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-linen-100 uppercase tracking-wide block">
            Panel de Agendas & Recaudo
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('home')}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-linen-200 text-xs font-cartoon uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ir a la Web</span>
          </button>

          <button
            onClick={() => setBlockModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-hoja-600 hover:bg-hoja-500 text-white font-cartoon text-xs uppercase flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Bloquear Fechas</span>
          </button>

          <button
            onClick={() => fetchDashboardData()}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-linen-200 transition-colors cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2.5 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-red-200 text-xs font-cartoon uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* 2. METRICS CARDS WITH CONSISTENT CARTOON TYPOGRAPHY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Recaudado Total (Restringido para Staff, con Filtro Semanal / Mensual para Admin) */}
        <div className="p-5 rounded-2xl glass-dark border border-gold-500/40 shadow-gold-glow space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
              Recaudado ({revenuePeriod === 'month' ? 'Mensual' : 'Semanal'})
            </span>
            {userRole === 'admin' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRevenueDropdownOpen(!revenueDropdownOpen)}
                  className="px-2.5 py-1 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-400/50 text-gold-300 text-[10px] font-display uppercase tracking-wider font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  title="Filtrar recaudos por periodo"
                >
                  <span>{revenuePeriod === 'month' ? '📅 Mensual' : '📆 Semanal'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gold-400 transition-transform duration-200 ${revenueDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {revenueDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 rounded-2xl bg-jade-950/95 border border-gold-400/50 shadow-2xl p-1.5 z-40 space-y-1 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => {
                        setRevenuePeriod('month');
                        setRevenueDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-display uppercase tracking-wider flex items-center justify-between cursor-pointer transition-colors ${
                        revenuePeriod === 'month' ? 'bg-gold-500 text-jade-950 font-black shadow-gold-glow' : 'text-linen-300 hover:bg-white/10'
                      }`}
                    >
                      <span>📅 Mensual</span>
                      {revenuePeriod === 'month' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRevenuePeriod('week');
                        setRevenueDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-display uppercase tracking-wider flex items-center justify-between cursor-pointer transition-colors ${
                        revenuePeriod === 'week' ? 'bg-gold-500 text-jade-950 font-black shadow-gold-glow' : 'text-linen-300 hover:bg-white/10'
                      }`}
                    >
                      <span>📆 Semanal</span>
                      {revenuePeriod === 'week' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            {userRole === 'admin' ? (
              <span className="font-mono text-2xl sm:text-3xl font-black text-gold-gradient">
                {formatCOP(displayRecaudado)}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 py-1">
                <Lock className="w-5 h-5 text-gold-400/80" />
                <span className="font-cartoon text-xs text-gold-400/90 font-bold uppercase tracking-wider">
                  Restringido (Solo Admin)
                </span>
              </div>
            )}
            <DollarSign className="w-6 h-6 text-gold-400" />
          </div>
          <span className="text-[10px] font-fredoka text-linen-400 block">
            {userRole === 'admin' 
              ? revenuePeriod === 'month'
                ? `Mes de ${monthName} (${displayPeriodBookings.length} agendas activas)`
                : `Semana en curso (${displayPeriodBookings.length} agendas activas)`
              : 'Información financiera confidencial'
            }
          </span>
        </div>

        {/* Saldo Faltante por Pagar (Visible para Staff y Admin) */}
        <div className="p-5 rounded-2xl glass-dark border border-white/10 space-y-1.5">
          <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
            Saldo Faltante por Cobrar
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl sm:text-3xl font-black text-linen-100">
              {formatCOP(userRole === 'admin' ? displaySaldoFaltante : totalSaldoFaltante)}
            </span>
            <Clock className="w-6 h-6 text-gold-400/80" />
          </div>
          <span className="text-[10px] font-fredoka text-linen-400 block">
            A cobrar en recepción al check-in
          </span>
        </div>

        {/* Agendas Activas */}
        <div className="p-5 rounded-2xl glass-dark border border-white/10 space-y-1.5">
          <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
            Total Agendas Activas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-black text-linen-100">
              {activeBookings.length}
            </span>
            <CheckCircle2 className="w-6 h-6 text-hoja-400" />
          </div>
          <span className="text-[10px] font-fredoka text-linen-400 block">
            {agendadasBookings.length} Agendadas · {pagasBookings.length} Pagas
          </span>
        </div>

        {/* Cancelado */}
        <div className="p-5 rounded-2xl glass-dark border border-white/10 space-y-1.5">
          <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
            Agendas en Cancelado
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-black text-red-400">
              {canceladasBookings.length}
            </span>
            <Ban className="w-6 h-6 text-red-400" />
          </div>
          <span className="text-[10px] font-fredoka text-linen-400 block">
            Fechas liberadas en el calendario
          </span>
        </div>

      </div>

      {/* 3. MAIN NAVIGATION TABS */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('agendas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-cartoon uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'agendas'
                ? 'bg-gold-500 text-jade-950 font-bold shadow-gold-glow'
                : 'text-linen-300 hover:text-white bg-white/5'
            }`}
          >
            📋 Agendas y Recaudo ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('calendario')}
            className={`px-4 py-2.5 rounded-xl text-xs font-cartoon uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'calendario'
                ? 'bg-gold-500 text-jade-950 font-bold shadow-gold-glow'
                : 'text-linen-300 hover:text-white bg-white/5'
            }`}
          >
            📅 Calendario de Ocupación
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('auditoria')}
              className={`px-4 py-2.5 rounded-xl text-xs font-cartoon uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'auditoria'
                  ? 'bg-gold-500 text-jade-950 font-bold shadow-gold-glow'
                  : 'text-linen-300 hover:text-white bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>🕒 Historial de Movimientos ({auditLogs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: AGENDAS Y RECAUDO (SEPARADO Y AGRUPADO POR MES) */}
      {/* ======================================================================= */}
      {activeTab === 'agendas' && (
        <div className="rounded-3xl glass-dark border border-white/10 p-5 space-y-5 shadow-2xl">
          
          {/* Table Filters & Search */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-linen-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono, cabaña o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-jade-950 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-xs font-fredoka text-linen-100 placeholder-linen-500 focus:outline-none focus:border-gold-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              
              {/* Filtro de Mes en la Tabla */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider">Mes:</span>
                <select
                  value={tableMonthFilter}
                  onChange={(e) => setTableMonthFilter(e.target.value)}
                  className="bg-jade-950 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-fredoka text-linen-100 focus:outline-none focus:border-gold-400 capitalize"
                >
                  <option value="ALL">✦ Todos los Meses</option>
                  {availableMonths.map((mKey) => (
                    <option key={mKey} value={mKey}>
                      {formatMonthName(mKey)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro de Estado */}
              <div className="flex items-center gap-1 bg-jade-950 p-1 rounded-xl border border-white/10 text-xs font-display">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider font-black ${
                    statusFilter === 'ALL' ? 'bg-gold-500 text-jade-950 shadow-gold-glow' : 'text-linen-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('AGENDADA')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider font-black ${
                    statusFilter === 'AGENDADA' ? 'bg-amber-500 text-jade-950 shadow-md' : 'text-amber-300'
                  }`}
                >
                  Agendadas
                </button>
                <button
                  onClick={() => setStatusFilter('PAGA')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider font-black ${
                    statusFilter === 'PAGA' ? 'bg-emerald-500 text-jade-950 shadow-md' : 'text-emerald-300'
                  }`}
                >
                  Pagas (100%)
                </button>
                <button
                  onClick={() => setStatusFilter('CANCELADA')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider font-black ${
                    statusFilter === 'CANCELADA' ? 'bg-red-500 text-white shadow-md' : 'text-red-300'
                  }`}
                >
                  Cancelado
                </button>
              </div>
            </div>
          </div>

          {/* Bookings Grouped by Month */}
          {sortedMonthKeys.length === 0 ? (
            <div className="py-14 text-center text-linen-400 font-fredoka space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-linen-500 opacity-50" />
              <p>No se encontraron reservas con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedMonthKeys.map((monthKey) => {
                const monthGroupBookings = bookingsByMonth[monthKey] || [];
                
                // Group totals
                const groupTotal = monthGroupBookings.reduce((sum, b) => sum + Number(b.total_amount_cop || 0), 0);
                const groupRecaudado = monthGroupBookings.reduce((sum, b) => {
                  if (b.status === 'PAGA') return sum + Number(b.total_amount_cop || 0);
                  if (b.status === 'CANCELADA' || b.status === 'CANCELLED') return sum;
                  return sum + Number(b.deposit_amount_cop || 0);
                }, 0);
                const groupFaltante = monthGroupBookings.reduce((sum, b) => {
                  if (b.status === 'PAGA' || b.status === 'CANCELADA' || b.status === 'CANCELLED') return sum;
                  return sum + Number(b.remaining_balance_cop || (Number(b.total_amount_cop) - Number(b.deposit_amount_cop)));
                }, 0);

                return (
                  <div key={monthKey} className="rounded-2xl border border-white/10 bg-jade-950/50 overflow-hidden shadow-lg">
                    
                    {/* Month Banner Header */}
                    <div className="px-4 py-3 bg-jade-900/90 border-b border-gold-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-cartoon text-gold-400 uppercase tracking-widest font-bold">
                          📅 {formatMonthName(monthKey).toUpperCase()}
                        </span>
                        <span className="text-[11px] font-fredoka px-2 py-0.5 rounded-full bg-white/10 text-linen-300">
                          {monthGroupBookings.length} {monthGroupBookings.length === 1 ? 'reserva' : 'reservas'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-linen-300">
                          Recaudado: <strong className="text-emerald-400">{userRole === 'admin' ? formatCOP(groupRecaudado) : '🔒 Privado'}</strong>
                        </span>
                        <span className="text-linen-300">
                          Faltante: <strong className="text-gold-400">{formatCOP(groupFaltante)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Table for this Month */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-fredoka">
                        <thead className="border-b border-white/10 text-gold-400 font-cartoon uppercase tracking-wider text-[10px] bg-black/20">
                          <tr>
                            <th className="py-2.5 px-3">Código</th>
                            <th className="py-2.5 px-3">Huésped & Contacto</th>
                            <th className="py-2.5 px-3">Cabaña Reservada</th>
                            <th className="py-2.5 px-3">Fechas Estadía</th>
                            <th className="py-2.5 px-3">Total</th>
                            <th className="py-2.5 px-3">Recaudado</th>
                            <th className="py-2.5 px-3">Falta por Pagar</th>
                            <th className="py-2.5 px-3">Cambiar Estatus</th>
                            <th className="py-2.5 px-3 text-right">WhatsApp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {monthGroupBookings.map((b) => {
                            const isPaga = b.status === 'PAGA';
                            const isCancelada = b.status === 'CANCELADA' || b.status === 'CANCELLED';

                            const total = Number(b.total_amount_cop || 0);
                            const recaudado = isPaga ? total : isCancelada ? 0 : Number(b.deposit_amount_cop || 0);
                            const faltante = isPaga || isCancelada ? 0 : Number(b.remaining_balance_cop || (total - recaudado));

                            return (
                              <tr key={b.id || b.booking_reference} className="hover:bg-white/[0.03] transition-colors">
                                {/* Código */}
                                <td className="py-3 px-3 font-mono font-bold text-gold-300">
                                  {b.booking_reference}
                                </td>

                                {/* Huésped */}
                                <td className="py-3 px-3">
                                  <strong className="text-linen-100 text-xs block">{b.client_name}</strong>
                                  <span className="text-[10px] text-linen-400 font-mono">{b.client_phone}</span>
                                </td>

                                {/* Cabaña y Emojis de Adicionales */}
                                <td className="py-3 px-3">
                                  <span className="font-cartoon text-linen-100 text-xs block font-bold">{b.cabin_name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-linen-400">{b.guests_count || 2} Huéspedes</span>
                                    {extractAddonEmojis(b.notes).length > 0 && (
                                      <div className="flex items-center gap-1">
                                        {extractAddonEmojis(b.notes).map((item, idx) => (
                                          <span 
                                            key={idx} 
                                            title={item.name} 
                                            className="text-xs filter drop-shadow-sm cursor-help px-1 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 hover:scale-125 transition-transform"
                                          >
                                            {item.emoji}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Fechas */}
                                <td className="py-3 px-3">
                                  <span className="text-linen-200 block">{b.check_in_date} ➔ {b.check_out_date}</span>
                                  <span className="text-[10px] text-gold-400 font-cartoon">({b.nights_count || 1} Noches)</span>
                                </td>

                                {/* Total Estadía */}
                                <td className="py-3 px-3 font-mono font-bold text-linen-100">
                                  {formatCOP(total)}
                                </td>

                                {/* Recaudado */}
                                <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                                  {userRole === 'admin' ? formatCOP(recaudado) : <span className="text-linen-400 text-[11px] font-cartoon">🔒 Privado</span>}
                                </td>

                                {/* Falta por Pagar */}
                                <td className="py-3 px-3 font-mono font-bold text-gold-400">
                                  {faltante > 0 ? formatCOP(faltante) : <span className="text-emerald-400 font-cartoon">¡Al Día!</span>}
                                </td>

                                {/* Selector Interactivo de Estado y Botón de Eliminar Cancelada */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={isPaga ? 'PAGA' : isCancelada ? 'CANCELADA' : 'AGENDADA'}
                                      onChange={(e) => handleStatusChange(b.booking_reference, e.target.value)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-display uppercase tracking-wider font-black border cursor-pointer focus:outline-none ${
                                        isPaga
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                          : isCancelada
                                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      }`}
                                    >
                                      <option value="AGENDADA" className="bg-jade-950 text-amber-300 font-display">🟡 Agendada (50%)</option>
                                      <option value="PAGA" className="bg-jade-950 text-emerald-300 font-display">🟢 Paga (100%)</option>
                                      {userRole === 'admin' ? (
                                        <option value="CANCELADA" className="bg-jade-950 text-red-300 font-display">🔴 Cancelado</option>
                                      ) : (
                                        <option value="CANCELADA" disabled className="bg-jade-950 text-linen-500 font-display">🚫 Cancelado (Solo Admin)</option>
                                      )}
                                    </select>

                                    {/* Botón con X para eliminar cita cancelada (Exclusivo Admin) */}
                                    {userRole === 'admin' && isCancelada && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCanceledBooking(b.booking_reference, b.client_name)}
                                        className="p-1.5 rounded-xl bg-red-950/90 hover:bg-red-600 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-white transition-all shadow-md cursor-pointer group"
                                        title="Eliminar esta cita cancelada definitivamente"
                                      >
                                        <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Acciones */}
                                <td className="py-3 px-3 text-right">
                                  <a
                                    href={`https://wa.me/${(b.client_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${b.client_name}, te saludamos de Andicas Bioparque sobre tu reserva ${b.booking_reference} en ${b.cabin_name}.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors text-xs font-cartoon"
                                    title="Abrir WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline">WhatsApp</span>
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: CALENDARIO DE OCUPACIÓN (SEMANAL & MENSUAL CON SELECTOR DE MES) */}
      {/* ======================================================================= */}
      {activeTab === 'calendario' && (
        <div className="space-y-4">
          
          {/* Calendar Header Controls con Indicador y Selector de Mes */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl glass-dark border border-white/10 shadow-xl">
            
            {/* Indicador Claro del Mes que se está viendo */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="p-2.5 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-500/30">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                  {calendarViewMode === 'week' ? 'Agenda de la Semana' : '🗓️ VIENDO EL MES DE:'}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase capitalize">
                  {monthName}
                </h3>
              </div>
            </div>

            {/* Navegación y Selectores de Mes / Año */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
              
              {/* Selector Directo de Mes */}
              <div className="flex items-center gap-1.5">
                <select
                  value={month}
                  onChange={(e) => {
                    const newD = new Date(currentDate);
                    newD.setMonth(Number(e.target.value));
                    setCurrentDate(newD);
                  }}
                  className="bg-jade-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-fredoka text-linen-100 focus:outline-none focus:border-gold-400 cursor-pointer"
                >
                  {monthNamesList.map((mName, idx) => (
                    <option key={idx} value={idx}>{mName}</option>
                  ))}
                </select>

                {/* Selector de Año */}
                <select
                  value={year}
                  onChange={(e) => {
                    const newD = new Date(currentDate);
                    newD.setFullYear(Number(e.target.value));
                    setCurrentDate(newD);
                  }}
                  className="bg-jade-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-fredoka text-linen-100 focus:outline-none focus:border-gold-400 cursor-pointer"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>

              {/* Botón Mes Actual */}
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-linen-200 text-xs font-cartoon uppercase cursor-pointer transition-colors"
              >
                Hoy
              </button>

              {/* Prev / Next Month */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const newD = new Date(currentDate);
                    if (calendarViewMode === 'week') {
                      newD.setDate(newD.getDate() - 7);
                    } else {
                      newD.setMonth(newD.getMonth() - 1);
                    }
                    setCurrentDate(newD);
                  }}
                  className="p-2 rounded-xl bg-jade-900 hover:bg-jade-800 text-gold-400 border border-white/10 cursor-pointer"
                  title="Mes Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const newD = new Date(currentDate);
                    if (calendarViewMode === 'week') {
                      newD.setDate(newD.getDate() + 7);
                    } else {
                      newD.setMonth(newD.getMonth() + 1);
                    }
                    setCurrentDate(newD);
                  }}
                  className="p-2 rounded-xl bg-jade-900 hover:bg-jade-800 text-gold-400 border border-white/10 cursor-pointer"
                  title="Mes Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* View Mode Toggle (Semanal vs Mensual) */}
              <div className="flex items-center gap-1 bg-jade-950 p-1 rounded-xl border border-white/10 text-xs font-cartoon">
                <button
                  onClick={() => setCalendarViewMode('week')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    calendarViewMode === 'week' ? 'bg-gold-500 text-jade-950 font-bold' : 'text-linen-300'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setCalendarViewMode('month')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    calendarViewMode === 'month' ? 'bg-gold-500 text-jade-950 font-bold' : 'text-linen-300'
                  }`}
                >
                  Mes
                </button>
              </div>

            </div>
          </div>

          {/* Cabaña Filter Selector for Calendar */}
          <div className="p-4 rounded-3xl glass-dark border border-white/10 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                Seleccionar Cabaña a Visualizar:
              </span>
              <span className="text-[11px] font-fredoka text-linen-400">
                Mostrando: {cabinsData.find((c) => c.id === selectedCabinFilter)?.name || cabinsData[0].name}
              </span>
            </div>

            {/* Quick Clickable Cabin Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-cartoon">
              {cabinsData.map((cabin) => (
                <button
                  key={cabin.id}
                  onClick={() => setSelectedCabinFilter(cabin.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                    selectedCabinFilter === cabin.id
                      ? 'bg-gold-500 text-jade-950 font-bold shadow-gold-glow'
                      : 'bg-jade-950/80 text-linen-300 border border-white/10 hover:border-gold-400'
                  }`}
                >
                  {cabin.name}
                </button>
              ))}
            </div>
          </div>

          {/* VISTA 1: AGENDA SEMANAL */}
          {calendarViewMode === 'week' && (
            <div className="rounded-3xl glass-dark border border-white/10 p-5 space-y-4 shadow-2xl">
              <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                🗓️ Vista Semanal ({weekDays[0].dateStr} al {weekDays[6].dateStr})
              </span>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weekDays.map((wd) => {
                  const isToday = wd.dateStr === new Date().toISOString().split('T')[0];
                  
                  // Bookings active on this day
                  const dayBookings = bookings.filter((b) => 
                    b.status !== 'CANCELADA' && 
                    b.status !== 'CANCELLED' &&
                    wd.dateStr >= b.check_in_date && 
                    wd.dateStr < b.check_out_date &&
                    b.cabin_id === selectedCabinFilter
                  );

                  return (
                    <div 
                      key={wd.dateStr} 
                      className={`rounded-2xl p-3 space-y-2 border transition-all ${
                        isToday 
                          ? 'bg-jade-900/90 border-gold-400 shadow-gold-glow' 
                          : 'bg-jade-950/60 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-xs font-cartoon uppercase">
                        <span className={isToday ? 'text-gold-400 font-bold' : 'text-linen-300'}>{wd.dayName}</span>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          isToday ? 'bg-gold-500 text-jade-950' : 'text-linen-100'
                        }`}>
                          {wd.dayNum}
                        </span>
                      </div>

                      {/* Bookings cards on this day */}
                      <div className="space-y-1.5 min-h-[90px]">
                        {dayBookings.length === 0 ? (
                          <span className="text-[10px] font-fredoka text-linen-400/60 italic block text-center pt-6">
                            Disponible
                          </span>
                        ) : (
                          dayBookings.map((b) => (
                            <div 
                              key={b.id || b.booking_reference} 
                              className={`p-2 rounded-xl border text-[10px] font-fredoka space-y-1 shadow-sm ${
                                b.status === 'PAGA'
                                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100'
                                  : 'bg-amber-950/80 border-amber-500/40 text-amber-100'
                              }`}
                            >
                              <div className="flex items-center justify-between font-cartoon uppercase text-[9px]">
                                <span className="truncate">{b.cabin_name}</span>
                                <span className={b.status === 'PAGA' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                  {b.status === 'PAGA' ? 'PAGA' : 'AGENDADA'}
                                </span>
                              </div>
                              <strong className="block text-linen-100 truncate">{b.client_name}</strong>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono opacity-80 block">{b.booking_reference}</span>
                                {extractAddonEmojis(b.notes).length > 0 && (
                                  <div className="flex items-center gap-0.5">
                                    {extractAddonEmojis(b.notes).map((item, idx) => (
                                      <span key={idx} title={item.name} className="text-xs cursor-help">
                                        {item.emoji}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISTA 2: AGENDA MENSUAL EN CUADRÍCULA COMPLETA DE 7 COLUMNAS */}
          {calendarViewMode === 'month' && (
            <div className="rounded-3xl glass-dark border border-white/10 p-5 space-y-4 shadow-2xl">
              {/* Encabezado de la Cabaña Seleccionada en el Mes */}
              {(() => {
                const targetCabin = cabinsData.find((c) => c.id === selectedCabinFilter) || cabinsData[0];
                
                // Días del mes y offset del primer día (Lunes = 0)
                const firstDay = new Date(year, month, 1);
                let startOffset = firstDay.getDay() - 1;
                if (startOffset === -1) startOffset = 6;

                // Reservas activas de este mes
                const cabinMonthBookings = bookings.filter((b) => 
                  b.cabin_id === targetCabin.id && 
                  (b.status === 'AGENDADA' || b.status === 'CONFIRMED' || b.status === 'PAGA')
                );

                return (
                  <div className="space-y-4">
                    {/* Header de la Cabaña */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-xs font-cartoon text-gold-400 uppercase tracking-widest block">
                          Calendario Mensual: {monthName.toUpperCase()}
                        </span>
                        <h2 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                          {targetCabin.name}
                        </h2>
                      </div>

                      <div className="flex items-center gap-3 font-fredoka text-xs">
                        <span className="text-linen-300 font-mono">
                          Tarifa: <strong className="text-gold-400">{targetCabin.priceFormatted}</strong> / noche
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-jade-950 border border-white/10 text-linen-200">
                          {targetCabin.capacity}
                        </span>
                      </div>
                    </div>

                    {/* Días de la Semana (Lunes a Domingo) */}
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-cartoon text-gold-400 uppercase tracking-wider">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dayName, idx) => (
                        <div key={idx} className="py-1 bg-jade-950/60 rounded-lg border border-white/5">
                          {dayName}
                        </div>
                      ))}
                    </div>

                    {/* Cuadrícula de Días del Mes (7 Columnas con Espacio Amplio) */}
                    <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-2.5">
                      {/* Espacios vacíos antes del día 1 */}
                      {Array.from({ length: startOffset }).map((_, offsetIdx) => (
                        <div 
                          key={`offset-${offsetIdx}`} 
                          className="min-h-[90px] sm:min-h-[105px] rounded-2xl bg-black/15 border border-white/5 opacity-30 hidden sm:block" 
                        />
                      ))}

                      {/* Días del mes */}
                      {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                        const dayNum = dayIdx + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isToday = dateStr === new Date().toISOString().split('T')[0];

                        // Buscar si hay reserva activa o bloqueo para este día
                        const isBlocked = blockedDates.some((b) => b.cabin_id === targetCabin.id && b.blocked_date === dateStr);
                        const booking = bookings.find((b) => 
                          b.cabin_id === targetCabin.id && 
                          (b.status === 'AGENDADA' || b.status === 'CONFIRMED' || b.status === 'PAGA') &&
                          dateStr >= b.check_in_date && 
                          dateStr < b.check_out_date
                        );

                        return (
                          <div
                            key={dayNum}
                            className={`min-h-[90px] sm:min-h-[105px] rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between border transition-all ${
                              isToday
                                ? 'border-gold-400 bg-jade-900/90 shadow-gold-glow'
                                : booking
                                ? booking.status === 'PAGA'
                                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100 shadow-md'
                                  : 'bg-amber-950/80 border-amber-500/50 text-amber-100 shadow-md'
                                : isBlocked
                                ? 'bg-red-950/70 border-red-500/40 text-red-200'
                                : 'bg-jade-950/60 border-white/10 hover:border-gold-400/50'
                            }`}
                          >
                            {/* Número de Día y Estado */}
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-mono font-bold ${
                                isToday ? 'text-gold-400' : 'text-linen-200'
                              }`}>
                                {dayNum}
                              </span>

                              {booking && (
                                <span className={`text-[8px] font-cartoon uppercase px-1.5 py-0.5 rounded font-bold ${
                                  booking.status === 'PAGA' ? 'bg-emerald-500 text-jade-950' : 'bg-amber-500 text-jade-950'
                                }`}>
                                  {booking.status === 'PAGA' ? 'Paga' : 'Agendada'}
                                </span>
                              )}
                            </div>

                            {/* Contenido Central del Día */}
                            <div className="my-1">
                              {booking ? (
                                <div className="space-y-0.5 font-fredoka text-[10px]">
                                  <strong className="block text-linen-100 truncate leading-tight">
                                    {booking.client_name}
                                  </strong>
                                  <span className="text-[8px] font-mono text-gold-300 block truncate">
                                    {booking.booking_reference}
                                  </span>
                                </div>
                              ) : isBlocked ? (
                                <span className="text-[9px] font-cartoon text-red-400 uppercase block">
                                  Bloqueado
                                </span>
                              ) : (
                                <span className="text-[9px] font-fredoka text-linen-400/50 block">
                                  Libre
                                </span>
                              )}
                            </div>

                            {/* Detalle Inferior: Noches Huéspedes + Emojis de Adicionales */}
                            <div className="text-[8px] font-mono opacity-80 flex items-center justify-between pt-0.5">
                              <span>{booking ? `${booking.nights_count || 1}n · ${booking.guests_count || 2}p` : ''}</span>
                              {booking && extractAddonEmojis(booking.notes).length > 0 && (
                                <div className="flex items-center gap-0.5">
                                  {extractAddonEmojis(booking.notes).map((item, idx) => (
                                    <span 
                                      key={idx} 
                                      title={item.name} 
                                      className="text-xs filter drop-shadow-sm cursor-help hover:scale-125 transition-transform"
                                    >
                                      {item.emoji}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      )}

      {/* ======================================================================= */}
      {/* VISTA 3: HISTORIAL DE MOVIMIENTOS & AUDITORÍA (EXCLUSIVO ADMINISTRADOR) */}
      {/* ======================================================================= */}
      {activeTab === 'auditoria' && userRole === 'admin' && (
        <div className="space-y-4">
          {/* Header de la sección */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl glass-dark border border-white/10 shadow-2xl">
            <div>
              <span className="text-xs font-cartoon text-gold-400 uppercase tracking-widest block">
                Auditoría & Trazabilidad
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                Historial de Movimientos en Agendas
              </h2>
              <p className="text-xs font-fredoka text-linen-400 mt-0.5">
                Registro cronológico de quién, cuándo y qué cambios se realizaron en las reservas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-linen-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, huésped, cabaña o responsable..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="bg-jade-950 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-xs text-linen-100 placeholder-linen-500 focus:border-gold-400 focus:outline-none w-64 sm:w-80 font-fredoka"
                />
              </div>

              <button
                onClick={() => fetchDashboardData()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-linen-300 hover:text-white transition-colors cursor-pointer"
                title="Recargar Historial"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabla de Registros de Auditoría */}
          <div className="rounded-3xl glass-dark border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-fredoka">
                <thead className="border-b border-white/10 text-gold-400 font-cartoon uppercase tracking-wider text-[10px] bg-black/30">
                  <tr>
                    <th className="py-3 px-4">Fecha & Hora Exacta</th>
                    <th className="py-3 px-4">Código Reserva</th>
                    <th className="py-3 px-4">Huésped & Cabaña</th>
                    <th className="py-3 px-4">Cambio de Estado</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4">Detalle / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(() => {
                    const filteredLogs = auditLogs.filter((log) => {
                      if (!auditSearchQuery) return true;
                      const q = auditSearchQuery.toLowerCase();
                      return (
                        (log.booking_reference && log.booking_reference.toLowerCase().includes(q)) ||
                        (log.client_name && log.client_name.toLowerCase().includes(q)) ||
                        (log.cabin_name && log.cabin_name.toLowerCase().includes(q)) ||
                        (log.changed_by && log.changed_by.toLowerCase().includes(q)) ||
                        (log.new_status && log.new_status.toLowerCase().includes(q)) ||
                        (log.notes && log.notes.toLowerCase().includes(q))
                      );
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6" className="py-14 text-center text-linen-400 font-fredoka">
                            <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-gold-400" />
                            <p className="text-sm">No se encontraron movimientos registrados con ese filtro.</p>
                          </td>
                        </tr>
                      );
                    }

                    return filteredLogs.map((log, idx) => {
                      const logDate = log.created_at ? new Date(log.created_at) : new Date();
                      const dateStr = logDate.toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                      const timeStr = logDate.toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      });

                      const isCancel = log.new_status === 'CANCELADA';
                      const isPaga = log.new_status === 'PAGA';

                      return (
                        <tr key={log.id || idx} className="hover:bg-white/[0.03] transition-colors">
                          {/* Fecha y Hora */}
                          <td className="py-3.5 px-4">
                            <strong className="text-linen-100 text-xs block font-mono">{dateStr}</strong>
                            <span className="text-[10px] text-gold-400/90 font-mono block">{timeStr}</span>
                          </td>

                          {/* Código */}
                          <td className="py-3.5 px-4 font-mono font-bold text-gold-300">
                            {log.booking_reference}
                          </td>

                          {/* Huésped & Cabaña */}
                          <td className="py-3.5 px-4">
                            <strong className="text-linen-100 text-xs block">{log.client_name}</strong>
                            <span className="text-[10px] text-linen-400 font-cartoon">{log.cabin_name}</span>
                          </td>

                          {/* Transición de Estado con Colores Reales */}
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase tracking-wider border border-white/10 bg-black/40 shadow-inner">
                              <span className={getStatusTextColor(log.previous_status)}>
                                {formatStatusLabel(log.previous_status || 'INICIO')}
                              </span>
                              <span className="text-gold-400 font-bold">➔</span>
                              <span className={getStatusTextColor(log.new_status)}>
                                {formatStatusLabel(log.new_status)}
                              </span>
                            </div>
                          </td>

                          {/* Responsable (Usuario que hizo el cambio) */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-black uppercase tracking-wider border ${
                              String(log.changed_by).toLowerCase().includes('admin')
                                ? 'bg-gold-500/20 text-gold-300 border-gold-400/50 shadow-gold-glow'
                                : String(log.changed_by).toLowerCase().includes('recep') || String(log.changed_by).toLowerCase().includes('staff')
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-md'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-md'
                            }`}>
                              {String(log.changed_by).toLowerCase().includes('admin') ? (
                                <>
                                  <span className="text-sm">👑</span>
                                  <span>ADMIN</span>
                                </>
                              ) : String(log.changed_by).toLowerCase().includes('recep') || String(log.changed_by).toLowerCase().includes('staff') ? (
                                <>
                                  <span className="text-sm">👤</span>
                                  <span>RECEPCION</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm">⚡</span>
                                  <span>{String(log.changed_by).toUpperCase()}</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Detalle */}
                          <td className="py-3.5 px-4 text-linen-300 text-[11px] max-w-xs truncate">
                            {log.notes || 'Actualización de agenda registrada'}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Zona de Peligro / Purga Total (Exclusivo para Admin) */}
            {userRole === 'admin' && (
              <div className="mt-8 p-5 rounded-2xl bg-red-950/30 border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-red-400 font-display text-sm font-black uppercase tracking-wider">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Zona de Peligro: Reinicio & Purga del Sistema</span>
                  </div>
                  <p className="text-[11px] font-fredoka text-linen-300">
                    Elimina todas las reservas, agendas, bloqueos de fechas y registros de movimientos de forma irreversible.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPurgePassword('');
                    setPurgeError('');
                    setPurgeModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-display text-xs uppercase tracking-wider font-black flex items-center gap-2 shadow-lg hover:shadow-red-500/40 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Todos los Datos</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: PURGA TOTAL DEL SISTEMA (CONFIRMACIÓN CON CONTRASEÑA ADMIN) */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {purgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#091f20] border-2 border-red-500/60 shadow-2xl space-y-4 text-linen-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-6 h-6 text-red-400 animate-pulse" />
                  <h3 className="font-display text-lg font-black text-red-300 uppercase tracking-wide">
                    Confirmar Purga Total
                  </h3>
                </div>
                <button
                  onClick={() => setPurgeModalOpen(false)}
                  className="text-linen-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 font-fredoka text-xs text-linen-300">
                <p className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 leading-relaxed">
                  ⚠️ <strong className="text-red-300">¡Advertencia crítica!</strong> Esta acción borrará todas las reservas (agendadas, pagas y canceladas), los bloqueos de fechas y todos los registros del historial de movimientos. No se puede deshacer.
                </p>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-display text-gold-400 uppercase tracking-wider block">
                    Introduce la Contraseña de Administrador
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={purgePassword}
                      onChange={(e) => {
                        setPurgePassword(e.target.value);
                        setPurgeError('');
                      }}
                      placeholder="Contraseña del Panel Admin..."
                      className="w-full bg-jade-950 border border-white/20 rounded-xl px-4 py-2.5 text-linen-100 text-sm font-mono focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                      autoFocus
                    />
                    <Lock className="w-4 h-4 text-linen-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                  {purgeError && (
                    <span className="text-red-400 font-cartoon text-xs block">{purgeError}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPurgeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-linen-200 text-xs font-display uppercase tracking-wider transition-colors cursor-pointer"
                  disabled={isPurging}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecutePurge}
                  disabled={isPurging || !purgePassword}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-display text-xs uppercase tracking-wider font-black flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isPurging ? 'Borrando...' : 'Confirmar Eliminación Total'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* MODAL: BLOQUEAR FECHAS MANUALMENTE */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {blockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl glass-dark border border-gold-400 shadow-2xl space-y-4 text-linen-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display text-lg font-black text-linen-100 uppercase tracking-wide">
                  Bloquear Fechas en el Calendario
                </h3>
                <button onClick={() => setBlockModalOpen(false)} className="text-linen-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBlockDates} className="space-y-4 font-fredoka text-xs">
                <div className="space-y-1">
                  <label className="text-gold-400 font-cartoon uppercase tracking-wider block">Cabaña</label>
                  <select
                    value={blockCabinId}
                    onChange={(e) => setBlockCabinId(e.target.value)}
                    className="w-full bg-jade-950 border border-white/15 rounded-xl p-2.5 text-linen-100"
                  >
                    {cabinsData.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gold-400 font-cartoon uppercase tracking-wider block">Fecha Inicio</label>
                    <input
                      type="date"
                      value={blockStartDate}
                      onChange={(e) => setBlockStartDate(e.target.value)}
                      className="w-full bg-jade-950 border border-white/15 rounded-xl p-2.5 text-linen-100"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gold-400 font-cartoon uppercase tracking-wider block">Fecha Fin</label>
                    <input
                      type="date"
                      value={blockEndDate}
                      onChange={(e) => setBlockEndDate(e.target.value)}
                      className="w-full bg-jade-950 border border-white/15 rounded-xl p-2.5 text-linen-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-gold-400 font-cartoon uppercase tracking-wider block">Motivo del Bloqueo</label>
                  <select
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full bg-jade-950 border border-white/15 rounded-xl p-2.5 text-linen-100"
                  >
                    <option value="MANUAL_BLOCK">Reserva Telefónica / Presencial</option>
                    <option value="MAINTENANCE">Mantenimiento de Cabaña</option>
                    <option value="ADMIN_CLOSE">Cierre Administrativo</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBlockModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-linen-300 font-cartoon uppercase text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold uppercase text-xs shadow-gold-glow cursor-pointer btn-shimmer"
                  >
                    Confirmar Bloqueo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
