import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, DollarSign, Users, CheckCircle2, AlertCircle, Ban, 
  Search, RefreshCw, LogOut, Phone, Mail, MessageCircle, Home, 
  Clock, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Trash2, Calendar as CalendarIcon,
  Filter, Check, ArrowUpRight, ArrowLeft, Lock, History, User, FileText,
  Sliders, AlertTriangle, Sparkles, CreditCard, Eye, Save, Sun, Moon, CalendarDays,
  Layers, CheckSquare, MessageSquare, Send, Crown, HelpCircle, KeyRound, UserPlus, Shield
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
  updateSiteCustomConfigAdmin,
  getAdminUsers,
  createAdminUser,
  updateAdminUserPassword,
  deleteAdminUser
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
    return localStorage.getItem('andicas_user_role') || 'master_admin';
  });
  const [currentUserInfo, setCurrentUserInfo] = useState(() => {
    return {
      username: localStorage.getItem('andicas_username') || 'admin_master',
      name: localStorage.getItem('andicas_user_name') || 'Administrador Master'
    };
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Main Sidebar Navigation Section: 'agendamientos' | 'recaudos' | 'cancelaciones' | 'personalizacion' | 'usuarios'
  const [activeSection, setActiveSection] = useState('agendamientos');

  // Sub-tabs for Agendamientos: 'tabla' | 'calendario' | 'auditoria'
  const [agendaSubTab, setAgendaSubTab] = useState('tabla');

  // Time filter for "Saldo Pendiente por Cobrar": 'hoy' | 'semana' | 'mes' | 'todos'
  const [pendingBalancePeriod, setPendingBalancePeriod] = useState('mes');

  // Users Management State (Master Admin Only)
  const [systemUsers, setSystemUsers] = useState([]);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff' // 'admin' | 'staff'
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');

  // Edit User Password Modal State (Master Admin Only)
  const [editUserModal, setEditUserModal] = useState({
    isOpen: false,
    user: null,
    newPassword: '',
    isSaving: false,
    error: '',
    success: ''
  });

  // Cancel with Reason Modal State
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    booking: null,
    reason: '',
    notes: '',
    isCancelling: false,
    error: ''
  });

  // Master Password Change Modal State
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
  const [calendarViewMode, setCalendarViewMode] = useState('month'); // 'month' | 'week'
  const [revenuePeriod, setRevenuePeriod] = useState('month'); // 'month' | 'week' | 'all'

  // Cancellation Requests State (Admin / Master only)
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [cancellationFilter, setCancellationFilter] = useState('ALL');
  const [resolvingCancelId, setResolvingCancelId] = useState(null);

  // Interactive Day Popup Modal State (Calendar Day Click)
  const [dayAgendaModal, setDayAgendaModal] = useState({
    isOpen: false,
    dateStr: '',
    dayBookings: [],
    dayBlocks: []
  });

  // Customization CMS Lite State (Admin / Master only)
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

  // Search & Filter state
  const [selectedCabinFilter, setSelectedCabinFilter] = useState('ALL');
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

  // Status formatting: strictly AGENDADO | CANCELADO
  const formatStatusLabel = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'CANCELADA' || s === 'CANCELLED' || s === 'CANCELADO') return 'CANCELADO';
    return 'AGENDADO';
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'CANCELADA' || s === 'CANCELLED' || s === 'CANCELADO') {
      return 'bg-red-500/15 border-red-500/40 text-red-400';
    }
    return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';
  };

  const isMasterAdmin = userRole === 'master_admin';
  const isAdminOrMaster = userRole === 'master_admin' || userRole === 'admin';

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

      // Solicitudes de cancelación (Admin y Master)
      if (isAdminOrMaster || data.role === 'admin' || data.role === 'master_admin') {
        const cancelData = await getAdminCancellationRequests(targetKey);
        if (cancelData.success) {
          setCancellationRequests(cancelData.requests || []);
        }

        // Historial de auditoría
        const auditData = await getAdminAuditLogs(targetKey);
        if (auditData.success) {
          setAuditLogs(auditData.logs || []);
        }

        // Configuración de sitio CMS
        const cmsData = await getSiteCustomConfig();
        if (cmsData.success && cmsData.config) {
          setSiteConfig(prev => ({
            ...prev,
            ...cmsData.config
          }));
        }
      }

      // Usuarios del sistema (Solo Master Admin)
      if (isMasterAdmin || data.role === 'master_admin') {
        const usersData = await getAdminUsers(targetKey);
        if (usersData.success) {
          setSystemUsers(usersData.users || []);
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
    if (!isAuthenticated) return;

    const unsubscribe = subscribeToSystemChanges((sub) => {
      if (sub) {
        if (sub.status === 'unpaid') {
          setUserRole('unpaid');
        } else if (sub.adminPassword && adminKey && sub.adminPassword !== adminKey && userRole === 'master_admin') {
          // La contraseña de admin fue cambiada remotamente desde el panel Owner
          setShowSessionClosedModal(true);
        }
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, adminKey, userRole]);

  const handleSaveMasterPassword = async (e) => {
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
        setPasswordChangeSuccess('Contraseña Master actualizada con éxito en la nube.');
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
    localStorage.removeItem('andicas_username');
    localStorage.removeItem('andicas_user_name');
    setIsAuthenticated(false);
    setAdminKey('');
    onNavigate('home');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await adminLogin(passwordInput.trim(), usernameInput.trim());
      if (res.success) {
        const resolvedRole = res.role || 'master_admin';
        localStorage.setItem('andicas_admin_token', res.token || passwordInput.trim());
        localStorage.setItem('andicas_user_role', resolvedRole);
        localStorage.setItem('andicas_username', res.username || usernameInput.trim());
        localStorage.setItem('andicas_user_name', res.name || usernameInput.trim());
        
        setIsAuthenticated(true);
        setAdminKey(res.token || passwordInput.trim());
        setUserRole(resolvedRole);
        setCurrentUserInfo({
          username: res.username || usernameInput.trim(),
          name: res.name || usernameInput.trim()
        });

        // Ensure active section is accessible for the role
        if (resolvedRole === 'staff') {
          setActiveSection('agendamientos');
        }

        fetchDashboardData(res.token || passwordInput.trim());
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
    localStorage.removeItem('andicas_username');
    localStorage.removeItem('andicas_user_name');
    setIsAuthenticated(false);
    setAdminKey('');
    onNavigate('home');
  };

  // User Management Handlers (Master Admin only)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');

    if (!newUserData.username.trim() || !newUserData.password.trim()) {
      setCreateUserError('El usuario y la contraseña son obligatorios.');
      return;
    }
    if (newUserData.password.trim().length < 4) {
      setCreateUserError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await createAdminUser(newUserData, adminKey);
      if (res.success) {
        setCreateUserSuccess(`Usuario "${newUserData.username}" creado exitosamente.`);
        setNewUserData({ username: '', password: '', name: '', role: 'staff' });
        fetchDashboardData(adminKey);
        setTimeout(() => setCreateUserSuccess(''), 4000);
      } else {
        setCreateUserError(res.error || 'No se pudo crear el usuario.');
      }
    } catch (err) {
      setCreateUserError('Error de conexión con el servidor.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleOpenEditUserModal = (user) => {
    setEditUserModal({
      isOpen: true,
      user,
      newPassword: '',
      isSaving: false,
      error: '',
      success: ''
    });
  };

  const handleSaveUserPassword = async (e) => {
    e.preventDefault();
    if (!editUserModal.user || !editUserModal.newPassword.trim()) return;

    if (editUserModal.newPassword.trim().length < 4) {
      setEditUserModal(prev => ({ ...prev, error: 'La contraseña debe tener al menos 4 caracteres.' }));
      return;
    }

    setEditUserModal(prev => ({ ...prev, isSaving: true, error: '', success: '' }));

    try {
      const res = await updateAdminUserPassword({
        userId: editUserModal.user.id,
        newPassword: editUserModal.newPassword.trim()
      }, adminKey);

      if (res.success) {
        setEditUserModal(prev => ({
          ...prev,
          isSaving: false,
          success: 'Contraseña actualizada con éxito.'
        }));
        setTimeout(() => {
          setEditUserModal({ isOpen: false, user: null, newPassword: '', isSaving: false, error: '', success: '' });
        }, 1200);
      } else {
        setEditUserModal(prev => ({ ...prev, isSaving: false, error: res.error || 'Error al actualizar.' }));
      }
    } catch (err) {
      setEditUserModal(prev => ({ ...prev, isSaving: false, error: 'Error de conexión.' }));
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`¿Estás seguro de eliminar el usuario "${username}"?`)) return;
    try {
      const res = await deleteAdminUser(userId, adminKey);
      if (res.success) {
        setSystemUsers(prev => prev.filter(u => u.id !== userId));
        fetchDashboardData(adminKey);
      } else {
        alert(res.error || 'No se pudo eliminar el usuario.');
      }
    } catch (err) {
      alert('Error eliminando usuario.');
    }
  };

  // Booking Actions
  const handleOpenCancelModal = (booking) => {
    setCancelModal({
      isOpen: true,
      booking,
      reason: '',
      notes: '',
      isCancelling: false,
      error: ''
    });
  };

  const handleConfirmCancelBooking = async (e) => {
    e.preventDefault();
    if (!cancelModal.booking) return;

    if (!cancelModal.reason.trim()) {
      setCancelModal(prev => ({ ...prev, error: 'Debes ingresar el motivo de la cancelación.' }));
      return;
    }

    setCancelModal(prev => ({ ...prev, isCancelling: true, error: '' }));

    try {
      const fullReason = `${cancelModal.reason.trim()}${cancelModal.notes ? ` · Notas: ${cancelModal.notes.trim()}` : ''}`;
      const res = await cancelBookingAdmin(cancelModal.booking.booking_reference, fullReason, adminKey);
      
      if (res.success) {
        setBookings(prev => prev.map(b => 
          b.booking_reference === cancelModal.booking.booking_reference 
            ? { ...b, status: 'CANCELADA' } 
            : b
        ));
        setCancelModal({ isOpen: false, booking: null, reason: '', notes: '', isCancelling: false, error: '' });
        fetchDashboardData(adminKey);
      } else {
        setCancelModal(prev => ({ ...prev, isCancelling: false, error: res.error || 'No se pudo cancelar la reserva.' }));
      }
    } catch (err) {
      setCancelModal(prev => ({ ...prev, isCancelling: false, error: 'Error de conexión con el servidor.' }));
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

  // Helper dates calculations
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
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

  // Week calculation
  const currDayOfWeek = (todayDate.getDay() + 6) % 7;
  const startOfWeek = new Date(todayDate);
  startOfWeek.setDate(todayDate.getDate() - currDayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Financial Metrics (Admin / Master Only)
  const activeScheduledBookings = bookings.filter(b => b.status !== 'CANCELADA' && b.status !== 'CANCELLED');
  const totalRevenue = activeScheduledBookings.reduce((sum, b) => sum + (b.total_amount_cop || 0), 0);
  const totalDepositsCollected = activeScheduledBookings.reduce((sum, b) => sum + (b.deposit_amount_cop || 0), 0);
  const totalRemainingPendingGlobal = activeScheduledBookings.reduce((sum, b) => {
    const remaining = (b.total_amount_cop || 0) - (b.deposit_amount_cop || 0);
    return sum + Math.max(0, remaining);
  }, 0);

  // Remaining Balance Filtered for the Bottom Card (Available to Staff, Admin and Master)
  const pendingFilteredBookings = activeScheduledBookings.filter(b => {
    if (pendingBalancePeriod === 'hoy') {
      return b.check_in_date === todayStr;
    }
    if (pendingBalancePeriod === 'semana') {
      return b.check_in_date >= startOfWeekStr && b.check_in_date <= endOfWeekStr;
    }
    if (pendingBalancePeriod === 'mes') {
      return b.check_in_date && b.check_in_date.startsWith(currentMonthStr);
    }
    return true; // 'todos'
  });

  const periodPendingBalanceTotal = pendingFilteredBookings.reduce((sum, b) => {
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
    
    let matchesStatus = true;
    if (statusFilter === 'AGENDADO') {
      matchesStatus = b.status !== 'CANCELADA' && b.status !== 'CANCELLED' && b.status !== 'CANCELADO';
    } else if (statusFilter === 'CANCELADO') {
      matchesStatus = b.status === 'CANCELADA' || b.status === 'CANCELLED' || b.status === 'CANCELADO';
    }

    const matchesMonth = tableMonthFilter === 'ALL' || (b.check_in_date && b.check_in_date.startsWith(tableMonthFilter));

    return matchesSearch && matchesCabin && matchesStatus && matchesMonth;
  });

  // Filtered cancellation requests
  const filteredCancellations = cancellationRequests.filter(r => {
    if (cancellationFilter === 'ALL') return true;
    return r.status === cancellationFilter;
  });

  // Helper for audit badges
  const getAuditMovementBadge = (prev, next) => {
    const n = String(next || '').toUpperCase();
    if (n.includes('CANCEL')) {
      return <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-cartoon font-bold text-[10px]">CANCELADO</span>;
    }
    if (n.includes('PAGA') || n.includes('AGEN') || n.includes('CONFIRM')) {
      return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-cartoon font-bold text-[10px]">AGENDADO</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-cartoon font-bold text-[10px]">{n}</span>;
  };

  const getAuditUserBadge = (changedBy) => {
    const u = String(changedBy || '').toLowerCase();
    if (u.includes('master')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 font-cartoon font-bold text-[10px] inline-flex items-center gap-1">
          <Crown className="w-3 h-3 text-gold-400" />
          <span>Admin Master</span>
        </span>
      );
    }
    if (u.includes('admin') || u.includes('owner')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 font-cartoon font-bold text-[10px] inline-flex items-center gap-1">
          <Shield className="w-3 h-3 text-gold-400" />
          <span>Administrador</span>
        </span>
      );
    }
    if (u.includes('recep') || u.includes('staff')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-cartoon font-bold text-[10px] inline-flex items-center gap-1">
          <User className="w-3 h-3 text-cyan-400" />
          <span>Empleado / Recepción</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-cartoon font-bold text-[10px] inline-flex items-center gap-1">
        <span>🌐 {changedBy}</span>
      </span>
    );
  };

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
              Ingresa tu usuario y contraseña de Administrador Master o Empleado.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-fredoka text-xs text-left">
            <div>
              <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Usuario:</label>
              <input
                type="text"
                required
                placeholder="Ej. admin_master, recepcion..."
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
          
          {/* Brand & Corona Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {isMasterAdmin ? (
                <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center text-jade-950 shadow-gold-glow">
                  <Crown className="w-5 h-5 text-jade-950 fill-jade-950" />
                </div>
              ) : isAdminOrMaster ? (
                <div className="w-10 h-10 rounded-2xl bg-gold-gradient/80 border border-gold-400 flex items-center justify-center text-jade-950">
                  <Shield className="w-5 h-5 text-jade-950" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-jade-900 border border-white/10 flex items-center justify-center text-gold-400">
                  <User className="w-5 h-5" />
                </div>
              )}

              <div>
                <h2 className="font-display text-base font-black text-linen-100 uppercase tracking-wide leading-none">
                  Andicas Panel
                </h2>
                <span className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block mt-0.5">
                  {isMasterAdmin ? '👑 Admin Master' : userRole === 'admin' ? '🛡️ Administrador' : '👤 Empleado / Recepción'}
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
            
            {/* 1. Agendamientos & Calendario (Visible para todos) */}
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

            {/* 2. Recaudos & Caja (Solo Admin y Master) */}
            {isAdminOrMaster && (
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
            )}

            {/* 3. Cancelaciones (Solo Admin y Master) */}
            {isAdminOrMaster && (
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
            )}

            {/* 4. Personalización / CMS Lite (Solo Admin y Master) */}
            {isAdminOrMaster && (
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
            )}

            {/* 5. Gestión de Usuarios / Empleados (Exclusivo Admin Master) */}
            {isMasterAdmin && (
              <button
                onClick={() => setActiveSection('usuarios')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${
                  activeSection === 'usuarios'
                    ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                    : 'bg-jade-900/60 hover:bg-jade-900 text-linen-200 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>Gestión de Usuarios</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 font-mono">
                  {systemUsers.length}
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          {isMasterAdmin && (
            <button
              onClick={() => setPasswordModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-xs font-cartoon uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Clave Master</span>
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
        {/* SECCIÓN 1: AGENDAMIENTOS, CALENDARIO & AUDITORÍA INTEGRADA */}
        {/* ======================================================================= */}
        {activeSection === 'agendamientos' && (
          <div className="space-y-6">
            
            {/* Header & Sub-tab Switcher (Lista | Calendario | Auditoría) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-3xl glass-dark border border-white/10 shadow-xl">
              <div>
                <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                  Operaciones de Hospedaje & Control
                </span>
                <h1 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                  Agendamientos de Cabañas
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center bg-jade-950 p-1 rounded-2xl border border-white/10 font-cartoon text-xs">
                  <button
                    onClick={() => setAgendaSubTab('tabla')}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      agendaSubTab === 'tabla'
                        ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    Lista de Reservas
                  </button>
                  <button
                    onClick={() => setAgendaSubTab('calendario')}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      agendaSubTab === 'calendario'
                        ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    Calendario Visual
                  </button>
                  {isAdminOrMaster && (
                    <button
                      onClick={() => setAgendaSubTab('auditoria')}
                      className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                        agendaSubTab === 'auditoria'
                          ? 'bg-gold-gradient text-jade-950 font-bold shadow-gold-glow'
                          : 'text-linen-300 hover:text-white'
                      }`}
                    >
                      🛡️ Auditoría
                    </button>
                  )}
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
                    <option value="AGENDADO">Agendado</option>
                    <option value="CANCELADO">Cancelado</option>
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
                                <span className={`px-2.5 py-1 rounded-full font-cartoon font-bold text-[10px] uppercase border inline-block ${getStatusBadgeStyle(b.status)}`}>
                                  {formatStatusLabel(b.status)}
                                </span>
                              </td>
                              <td className="p-3.5 text-right space-x-1">
                                {isAdminOrMaster && b.status !== 'CANCELADA' && b.status !== 'CANCELLED' && b.status !== 'CANCELADO' && (
                                  <button
                                    onClick={() => handleOpenCancelModal(b)}
                                    className="p-1.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-500/30 transition-colors"
                                    title="Cancelar Reserva con Motivo"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {isMasterAdmin && (
                                  <button
                                    onClick={() => handleDeletePermanent(b.booking_reference)}
                                    className="p-1.5 rounded-lg bg-white/5 text-linen-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
                                    title="Eliminar permanentemente"
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

                      const isToday = day.dateStr === todayStr;
                      const dayBookings = bookings.filter(b => 
                        b.status !== 'CANCELADA' && 
                        b.status !== 'CANCELLED' && 
                        b.status !== 'CANCELADO' &&
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
                                {dayBookings.length} {dayBookings.length === 1 ? 'Agendada' : 'Agendadas'}
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

            {/* VISTA 1C: AUDITORÍA DE AGENDAMIENTOS */}
            {agendaSubTab === 'auditoria' && isAdminOrMaster && (
              <div className="space-y-4">
                <div className="p-4 rounded-3xl glass-dark border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-cartoon text-sm uppercase text-gold-400 tracking-wider">
                      🛡️ Historial de Trazabilidad & Auditoría
                    </h3>
                    <p className="text-xs text-linen-300">
                      Registro cronológico de movimientos, cancelaciones, cambios de fechas y operadores.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-linen-400">
                    {auditLogs.length} eventos registrados
                  </span>
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
                          <th className="p-3.5">Detalles / Motivo</th>
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
                              <td className="p-3.5 text-linen-200 font-medium">
                                {log.client_name}
                              </td>
                              <td className="p-3.5">
                                {getAuditMovementBadge(log.previous_status, log.new_status)}
                              </td>
                              <td className="p-3.5">
                                {getAuditUserBadge(log.changed_by)}
                              </td>
                              <td className="p-3.5 text-linen-300 text-[11px] italic">
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

            {/* =================================================================== */}
            {/* BARRA INFERIOR DE SALDOS PENDIENTES POR COBRAR EN RECEPCIÓN */}
            {/* (Visible para todo usuario: Master, Admin y Staff) */}
            {/* =================================================================== */}
            <div className="p-5 sm:p-6 rounded-3xl glass-dark border border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-cartoon text-amber-400 uppercase tracking-widest block">
                    Control de Caja en Recepción
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-black text-white uppercase tracking-wide">
                    Saldo Restante Pendiente por Cobrar
                  </h3>
                </div>

                {/* Time Filters */}
                <div className="flex items-center gap-1.5 bg-jade-950 p-1 rounded-2xl border border-white/10 font-cartoon text-xs">
                  <button
                    onClick={() => setPendingBalancePeriod('hoy')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      pendingBalancePeriod === 'hoy'
                        ? 'bg-amber-500 text-jade-950 font-bold shadow-md'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setPendingBalancePeriod('semana')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      pendingBalancePeriod === 'semana'
                        ? 'bg-amber-500 text-jade-950 font-bold shadow-md'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    Esta Semana
                  </button>
                  <button
                    onClick={() => setPendingBalancePeriod('mes')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      pendingBalancePeriod === 'mes'
                        ? 'bg-amber-500 text-jade-950 font-bold shadow-md'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    Este Mes
                  </button>
                  <button
                    onClick={() => setPendingBalancePeriod('todos')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      pendingBalancePeriod === 'todos'
                        ? 'bg-amber-500 text-jade-950 font-bold shadow-md'
                        : 'text-linen-300 hover:text-white'
                    }`}
                  >
                    Todo
                  </button>
                </div>
              </div>

              {/* Balance Summary & Guest Quick Strip */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="text-[10px] text-amber-300 uppercase font-cartoon block">
                    Total a Recaudar al Check-in:
                  </span>
                  <span className="font-mono text-2xl font-black text-amber-300 block">
                    {formatCOP(periodPendingBalanceTotal)}
                  </span>
                  <span className="text-[11px] text-linen-300 block">
                    {pendingFilteredBookings.length} {pendingFilteredBookings.length === 1 ? 'estadía por recibir' : 'estadías por recibir en este período'}
                  </span>
                </div>

                <div className="lg:col-span-8">
                  {pendingFilteredBookings.length === 0 ? (
                    <div className="p-4 text-center text-xs text-linen-400/70 italic rounded-2xl bg-jade-900/40 border border-white/5">
                      No hay estadías pendientes de cobro para el período seleccionado.
                    </div>
                  ) : (
                    <div className="flex gap-2.5 overflow-x-auto pb-1 text-xs">
                      {pendingFilteredBookings.map((b) => {
                        const remaining = (b.total_amount_cop || 0) - (b.deposit_amount_cop || 0);
                        return (
                          <div
                            key={b.id || b.booking_reference}
                            className="p-3 rounded-2xl bg-jade-900/80 border border-white/10 min-w-[200px] shrink-0 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-linen-100 truncate block max-w-[120px]">
                                {b.client_name}
                              </span>
                              <span className="text-[9px] font-mono text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded">
                                {b.check_in_date}
                              </span>
                            </div>
                            <span className="text-[10px] text-linen-400 block truncate">{b.cabin_name}</span>
                            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                              <span className="text-[10px] text-linen-400">Resta:</span>
                              <span className="font-bold text-amber-300">{formatCOP(remaining)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* SECCIÓN 2: RECAUDOS, CAJA & MÉTRICAS (SOLO ADMIN Y MASTER) */}
        {/* ======================================================================= */}
        {activeSection === 'recaudos' && isAdminOrMaster && (
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
                <span className="font-mono text-xl sm:text-2xl font-black text-gold-300 block">
                  {formatCOP(totalRevenue)}
                </span>
                <span className="text-[11px] text-linen-400 block">Monto total de estadías activas</span>
              </div>

              <div className="p-5 rounded-3xl glass-dark border border-amber-500/30 space-y-1 shadow-lg">
                <span className="text-[10px] font-cartoon text-amber-400 uppercase tracking-wider block">
                  Saldos Pendientes en Recepción
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 block">
                  {formatCOP(totalRemainingPendingGlobal)}
                </span>
                <span className="text-[11px] text-linen-400 block">Por cobrar al check-in en efectivo/datafono</span>
              </div>

              <div className="p-5 rounded-3xl glass-dark border border-cyan-500/30 space-y-1 shadow-lg">
                <span className="text-[10px] font-cartoon text-cyan-400 uppercase tracking-wider block">
                  Total Reservas Agendadas
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-cyan-300 block">
                  {activeScheduledBookings.length}
                </span>
                <span className="text-[11px] text-linen-400 block">Estadías activas en el sistema</span>
              </div>
            </div>

            {/* Ocupación por Cabaña */}
            <div className="p-6 rounded-3xl glass-dark border border-white/10 space-y-4 shadow-xl">
              <h3 className="font-cartoon text-sm uppercase text-gold-400 tracking-wider">
                Desglose de Ocupación por Cabaña:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cabinsData.map((cabin) => {
                  const cabinBookings = activeScheduledBookings.filter(b => b.cabin_id === cabin.id);
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
        {/* SECCIÓN 3: SOLICITUDES DE CANCELACIÓN (SOLO ADMIN Y MASTER) */}
        {/* ======================================================================= */}
        {activeSection === 'cancelaciones' && isAdminOrMaster && (
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
        {/* SECCIÓN 4: PERSONALIZACIÓN DE PÁGINA (CMS LITE - ADMIN Y MASTER) */}
        {/* ======================================================================= */}
        {activeSection === 'personalizacion' && isAdminOrMaster && (
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
        {/* SECCIÓN 5: GESTIÓN DE USUARIOS / EMPLEADOS (EXCLUSIVO ADMIN MASTER) */}
        {/* ======================================================================= */}
        {activeSection === 'usuarios' && isMasterAdmin && (
          <div className="space-y-6">
            <div className="p-5 rounded-3xl glass-dark border border-white/10 shadow-xl">
              <span className="text-xs font-cartoon text-gold-400 uppercase tracking-wider block">
                Control de Acceso, Empleados & Permisos
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-black text-linen-100 uppercase tracking-wide">
                Gestión de Usuarios
              </h1>
            </div>

            {/* Form to create a new user */}
            <div className="p-6 rounded-3xl glass-dark border border-gold-500/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-gold-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-cartoon text-sm uppercase tracking-wider">
                  Crear Nuevo Usuario / Empleado:
                </h3>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 font-fredoka text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">
                      Nombre Completo / Cargo:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Laura Martínez (Recepción)"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-xs text-linen-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">
                      Usuario de Inicio de Sesión:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. laura.recepcion"
                      value={newUserData.username}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-xs text-linen-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">
                      Contraseña Asignada:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Mínimo 4 caracteres"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-xs font-mono text-linen-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">
                      Nivel de Permisos / Rol:
                    </label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-xs text-linen-100 outline-none cursor-pointer"
                    >
                      <option value="staff">👤 Usuario Normal / Empleado (Solo Agendamientos & Cobro)</option>
                      <option value="admin">👑 Administrador (Acceso a Caja, Cancelaciones y Personalización)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isCreatingUser}
                      className="w-full py-3 px-4 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:shadow-gold-glow-lg flex items-center justify-center gap-2 cursor-pointer transition-all border border-gold-400 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isCreatingUser ? 'Creando...' : 'Crear Cuenta de Usuario'}</span>
                    </button>
                  </div>
                </div>

                {createUserError && (
                  <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-300 text-xs">
                    {createUserError}
                  </div>
                )}

                {createUserSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 text-xs">
                    {createUserSuccess}
                  </div>
                )}
              </form>
            </div>

            {/* List of existing users */}
            <div className="p-6 rounded-3xl glass-dark border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-cartoon text-sm uppercase text-gold-400 tracking-wider">
                  Usuarios Registrados ({systemUsers.length}):
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs font-fredoka">
                  <thead className="bg-jade-900/80 font-cartoon text-[11px] text-gold-400 uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Usuario</th>
                      <th className="p-3.5">Nombre / Cargo</th>
                      <th className="p-3.5">Nivel de Rol</th>
                      <th className="p-3.5">Fecha Creación</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {systemUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-linen-400/60 italic">
                          Aún no has creado usuarios adicionales. Crea el primero arriba.
                        </td>
                      </tr>
                    ) : (
                      systemUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 font-mono font-bold text-gold-300">
                            {u.username}
                          </td>
                          <td className="p-3.5 text-linen-100 font-medium">
                            {u.name}
                          </td>
                          <td className="p-3.5">
                            {u.role === 'admin' ? (
                              <span className="px-2.5 py-1 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 font-cartoon font-bold text-[10px] inline-flex items-center gap-1">
                                <Shield className="w-3 h-3 text-gold-400" />
                                <span>Administrador</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-cartoon font-bold text-[10px] inline-flex items-center gap-1">
                                <User className="w-3 h-3 text-cyan-400" />
                                <span>Usuario / Empleado</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-[11px] text-linen-400 font-mono">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : 'Reciente'}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditUserModal(u)}
                              className="px-3 py-1.5 rounded-lg bg-gold-500/15 hover:bg-gold-500/30 text-gold-300 border border-gold-500/30 font-cartoon text-[11px] uppercase transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Cambiar contraseña de este usuario"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Cambiar Clave</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      {/* MODAL: CAMBIAR CONTRASEÑA DE UN USUARIO (ADMIN MASTER ONLY) */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {editUserModal.isOpen && editUserModal.user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !editUserModal.isSaving && setEditUserModal(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 rounded-3xl glass-dark border border-gold-500/50 shadow-2xl space-y-4 z-10 text-linen-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-gold-400">
                  <KeyRound className="w-5 h-5" />
                  <h3 className="font-display text-base font-black text-white uppercase">
                    Cambiar Clave de Usuario
                  </h3>
                </div>
                <button
                  disabled={editUserModal.isSaving}
                  onClick={() => setEditUserModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-1.5 rounded-xl bg-jade-900 text-linen-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-jade-900/80 border border-white/10 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-linen-400">Usuario:</span>
                  <span className="font-mono font-bold text-gold-300">{editUserModal.user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Nombre:</span>
                  <span className="font-bold text-white">{editUserModal.user.name}</span>
                </div>
              </div>

              <form onSubmit={handleSaveUserPassword} className="space-y-3 font-fredoka text-xs">
                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">
                    Nueva Contraseña para {editUserModal.user.username}:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={editUserModal.newPassword}
                    onChange={(e) => setEditUserModal(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3.5 py-2 text-xs font-mono text-linen-100 outline-none"
                  />
                </div>

                {editUserModal.error && (
                  <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-500/50 text-red-300 text-xs">
                    {editUserModal.error}
                  </div>
                )}

                {editUserModal.success && (
                  <div className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 text-xs">
                    {editUserModal.success}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={editUserModal.isSaving}
                    onClick={() => setEditUserModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-linen-200 font-cartoon text-xs uppercase font-bold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={editUserModal.isSaving}
                    className="flex-1 py-3 rounded-xl bg-gold-gradient text-jade-950 font-cartoon font-bold text-xs uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-1 cursor-pointer transition-all border border-gold-400 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editUserModal.isSaving ? 'Guardando...' : 'Actualizar Clave'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* MODAL: CANCELAR RESERVA CON MOTIVO (SOLO ADMIN Y MASTER) */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {cancelModal.isOpen && cancelModal.booking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !cancelModal.isCancelling && setCancelModal(prev => ({ ...prev, isOpen: false }))}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 rounded-3xl glass-dark border border-red-500/50 shadow-2xl space-y-4 z-10 text-linen-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-red-400">
                  <Ban className="w-5 h-5" />
                  <h3 className="font-display text-base font-black text-white uppercase">
                    Cancelar Reserva
                  </h3>
                </div>
                <button
                  disabled={cancelModal.isCancelling}
                  onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-1.5 rounded-xl bg-jade-900 text-linen-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs space-y-1.5 font-fredoka">
                <div className="flex justify-between">
                  <span className="text-linen-400">Referencia:</span>
                  <span className="font-mono font-bold text-gold-300">{cancelModal.booking.booking_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Huésped:</span>
                  <span className="font-bold text-white">{cancelModal.booking.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Cabaña:</span>
                  <span className="text-linen-200">{cancelModal.booking.cabin_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-linen-400">Fechas:</span>
                  <span className="font-mono text-linen-200">{cancelModal.booking.check_in_date} al {cancelModal.booking.check_out_date}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmCancelBooking} className="space-y-3 font-fredoka text-xs">
                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">
                    Motivo Obligatorio de Cancelación:
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Ej. Solicitud directa del cliente / No show / Fuerza mayor..."
                    value={cancelModal.reason}
                    onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-jade-950 border border-white/15 focus:border-red-400 rounded-xl px-3 py-2 text-xs text-linen-100 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-cartoon text-linen-400 uppercase block mb-1">
                    Notas Administrativas / Acuerdo (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Se acordó reprogramación para noviembre / Penalidad 40%..."
                    value={cancelModal.notes}
                    onChange={(e) => setCancelModal(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-jade-950 border border-white/15 focus:border-gold-400 rounded-xl px-3 py-2 text-xs text-linen-100 outline-none"
                  />
                </div>

                {cancelModal.error && (
                  <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-500/50 text-red-300 text-xs">
                    {cancelModal.error}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={cancelModal.isCancelling}
                    onClick={() => setCancelModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-linen-200 font-cartoon text-xs uppercase font-bold cursor-pointer transition-colors"
                  >
                    Volver
                  </button>

                  <button
                    type="submit"
                    disabled={cancelModal.isCancelling}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-cartoon text-xs uppercase font-bold cursor-pointer transition-all shadow-md disabled:opacity-50"
                  >
                    {cancelModal.isCancelling ? 'Procesando...' : 'Confirmar Cancelación'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                        <span className={`px-2 py-0.5 rounded-full font-cartoon font-bold text-[10px] uppercase border ${getStatusBadgeStyle(b.status)}`}>
                          {formatStatusLabel(b.status)}
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
                          <span className="text-[10px] text-amber-300 block">Saldo en Recepción:</span>
                          <span className="font-bold text-amber-300">{formatCOP((b.total_amount_cop || 0) - (b.deposit_amount_cop || 0))}</span>
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

                        {isAdminOrMaster && b.status !== 'CANCELADA' && b.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              setDayAgendaModal(prev => ({ ...prev, isOpen: false }));
                              handleOpenCancelModal(b);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-red-600/30 text-red-300 hover:bg-red-600/50 font-cartoon text-xs uppercase font-bold transition-all"
                          >
                            Cancelar
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
      {/* MODAL: CAMBIAR CONTRASEÑA MASTER (ADMIN MASTER ONLY) */}
      {/* ======================================================================= */}
      <AnimatePresence>
        {passwordModalOpen && isMasterAdmin && (
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
                  <Crown className="w-5 h-5" />
                  <h3 className="font-display text-base font-black text-white uppercase">
                    Cambiar Contraseña Master
                  </h3>
                </div>
                <button
                  onClick={() => setPasswordModalOpen(false)}
                  className="p-1.5 rounded-xl bg-jade-900 text-linen-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMasterPassword} className="space-y-3 font-fredoka text-xs">
                <div>
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Nueva Contraseña Master:</label>
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
                  <label className="text-[10px] font-cartoon text-gold-400 uppercase block mb-1">Confirmar Contraseña Master:</label>
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
                  <span>{isChangingPassword ? 'Guardando...' : 'Guardar Nueva Contraseña Master'}</span>
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
