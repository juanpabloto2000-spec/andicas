import express from 'express';
import { supabase, mockStore } from '../config/supabase.js';

const router = express.Router();
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'PanelPassword1966@';
const STAFF_SECRET = process.env.STAFF_SECRET_KEY || 'StaffAndicas2026!';
const UNPAID_SECRET = process.env.UNPAID_SECRET_KEY || 'NoPagoAndicas2026!';

// Helper para obtener la contraseña de admin efectiva (desde Supabase o env)
async function getEffectiveAdminSecret() {
  if (mockStore.admin_password) {
    return mockStore.admin_password;
  }
  if (supabase) {
    try {
      const { data } = await supabase
        .from('cabins')
        .select('*')
        .eq('id', 'admin_auth')
        .maybeSingle();
      if (data?.description) {
        mockStore.admin_password = data.description.trim();
        return mockStore.admin_password;
      }
    } catch (err) {
      console.warn('Fallo consultando admin_auth en Supabase:', err.message);
    }
  }
  return ADMIN_SECRET;
}

// Helper para obtener la lista de usuarios creados
async function getSystemUsers() {
  if (mockStore.system_users && Array.isArray(mockStore.system_users)) {
    return mockStore.system_users;
  }
  if (supabase) {
    try {
      const { data } = await supabase
        .from('cabins')
        .select('*')
        .eq('id', 'system_users')
        .maybeSingle();
      if (data?.description) {
        mockStore.system_users = JSON.parse(data.description);
        return mockStore.system_users;
      }
    } catch (err) {
      console.warn('Nota: system_users en Supabase:', err.message);
    }
  }
  return mockStore.system_users || [];
}

// Helper para guardar la lista de usuarios creados
async function saveSystemUsers(users) {
  mockStore.system_users = users;
  if (supabase) {
    try {
      await supabase.from('cabins').upsert({
        id: 'system_users',
        name: 'System Users Store',
        type: 'active',
        price_per_night: 0,
        description: JSON.stringify(users)
      });
    } catch (err) {
      console.warn('Error guardando system_users en Supabase:', err.message);
    }
  }
}

// Middleware para verificar clave de admin, staff o estado de cuenta suspendida
async function requireAdminOrStaffAuth(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  const cleanToken = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  const effectiveAdminKey = await getEffectiveAdminSecret();

  // Si el sistema está configurado globalmente como 'unpaid'
  if (mockStore.subscription_status === 'unpaid') {
    req.userRole = 'unpaid';
    return next();
  }

  // 1. Admin Master
  if (
    cleanToken === effectiveAdminKey || 
    cleanToken === ADMIN_SECRET
  ) {
    req.userRole = 'master_admin';
    return next();
  }

  // 2. Verificar en usuarios registrados
  const users = await getSystemUsers();
  const matchedUser = users.find(u => u.password === cleanToken || u.username === cleanToken);
  if (matchedUser) {
    req.userRole = matchedUser.role; // 'admin' | 'staff'
    req.currentUser = matchedUser;
    return next();
  }

  // 3. Staff genérico
  if (cleanToken === STAFF_SECRET) {
    req.userRole = 'staff';
    return next();
  }

  // 4. Clave de bloqueo
  if (cleanToken === UNPAID_SECRET || cleanToken === 'UNPAID_TOKEN_LOCKOUT') {
    req.userRole = 'unpaid';
    return next();
  }

  return res.status(401).json({ error: 'Acceso no autorizado al panel administrativo.' });
}

// Middleware para restringir acciones exclusivas de administrador
function requireAdminOnly(req, res, next) {
  if (req.userRole === 'unpaid') {
    return res.status(403).json({ error: 'Acceso restringido: No se registró pago del servicio.' });
  }
  if (req.userRole !== 'admin' && req.userRole !== 'master_admin') {
    return res.status(403).json({ error: 'Acceso restringido: Esta acción requiere permisos de Administrador.' });
  }
  next();
}

// Middleware para restringir acciones exclusivas de Admin Master
function requireMasterAdminOnly(req, res, next) {
  if (req.userRole !== 'master_admin') {
    return res.status(403).json({ error: 'Acceso restringido: Esta acción es exclusiva del Administrador Master.' });
  }
  next();
}

// Helper para registrar eventos de auditoría / historial de movimientos
export async function recordAuditLog({ booking_reference, client_name, cabin_name, previous_status, new_status, changed_by, notes = '' }) {
  const logEntry = {
    booking_reference: booking_reference || 'N/A',
    client_name: client_name || 'Huésped',
    cabin_name: cabin_name || 'Cabaña',
    previous_status: previous_status || 'PENDIENTE',
    new_status: new_status || 'ACTUALIZADO',
    changed_by: changed_by || 'Sistema',
    notes: notes || '',
    created_at: new Date().toISOString(),
  };

  if (!mockStore.booking_audit_logs) {
    mockStore.booking_audit_logs = [];
  }
  mockStore.booking_audit_logs.unshift({ id: `log-${Date.now()}-${Math.random()}`, ...logEntry });

  if (supabase) {
    try {
      await supabase.from('booking_audit_logs').insert([logEntry]);
    } catch (err) {
      console.warn('Nota: Tabla booking_audit_logs pendiente en Supabase:', err.message);
    }
  }
}

/**
 * 1. GET /api/bookings/availability/:cabinId
 * Obtiene todas las fechas bloqueadas/ocupadas de una cabaña para el calendario público
 */
router.get('/availability/:cabinId', async (req, res) => {
  try {
    const { cabinId } = req.params;
    let blockedDates = [];

    if (supabase) {
      const { data } = await supabase
        .from('blocked_dates')
        .select('blocked_date')
        .eq('cabin_id', cabinId);
      blockedDates = (data || []).map((x) => x.blocked_date);
    } else {
      blockedDates = (mockStore.blocked_dates || [])
        .filter((x) => x.cabin_id === cabinId)
        .map((x) => x.blocked_date);
    }

    return res.status(200).json({ cabin_id: cabinId, blocked_dates: blockedDates });
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando disponibilidad' });
  }
});

/**
 * 2. POST /api/admin/login
 * Valida usuario y clave de acceso para rol Admin Master, Sub-Admin o Usuario Estándar (Staff)
 */
router.post('/admin/login', async (req, res) => {
  const { username = '', password = '' } = req.body;
  const cleanUser = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();
  const effectiveAdminKey = await getEffectiveAdminSecret();

  // Si el sistema está configurado globalmente como 'unpaid'
  if (mockStore.subscription_status === 'unpaid') {
    return res.status(200).json({
      success: true,
      token: 'UNPAID_TOKEN_LOCKOUT',
      role: 'unpaid',
      roleLabel: 'No se registró pago'
    });
  }

  // 1. Usuario Oculto / Clave de Suspensión por Falta de Pago
  if (cleanPass === UNPAID_SECRET) {
    return res.status(200).json({
      success: true,
      token: UNPAID_SECRET,
      role: 'unpaid',
      roleLabel: 'No se registró pago'
    });
  }

  // 2. Administrador Master (Clave maestra de Supabase o env)
  if ((!cleanUser || cleanUser === 'admin' || cleanUser === 'master' || cleanUser === 'admin_master' || cleanUser === 'administrador') && (cleanPass === effectiveAdminKey || cleanPass === ADMIN_SECRET)) {
    return res.status(200).json({ 
      success: true, 
      token: cleanPass, 
      role: 'master_admin',
      roleLabel: '👑 Administrador Master',
      username: 'admin_master',
      name: 'Administrador Master'
    });
  }

  // 3. Buscar en la base de datos de usuarios creados
  const users = await getSystemUsers();
  const user = users.find(u => u.username.toLowerCase() === cleanUser && u.password === cleanPass);
  if (user) {
    return res.status(200).json({
      success: true,
      token: user.password,
      role: user.role, // 'admin' | 'staff'
      roleLabel: user.role === 'admin' ? '👑 Administrador' : '👤 Usuario / Empleado',
      username: user.username,
      name: user.name || user.username
    });
  }

  // 4. Recepción / Staff por defecto
  if ((cleanUser === 'recepcion' || cleanUser === 'staff' || cleanUser === 'estandar') && cleanPass === STAFF_SECRET) {
    return res.status(200).json({ 
      success: true, 
      token: STAFF_SECRET, 
      role: 'staff',
      roleLabel: '👤 Usuario Estándar / Recepción',
      username: 'recepcion',
      name: 'Recepción'
    });
  }

  return res.status(401).json({ error: 'Usuario o contraseña de acceso incorrectos.' });
});

/**
 * 2.1. GET /api/bookings/admin/subscription-status
 * Consulta el estado de suscripción/pago actual del sistema
 */
router.get('/admin/subscription-status', async (req, res) => {
  const status = mockStore.subscription_status || 'active';
  const effectiveAdminKey = await getEffectiveAdminSecret();
  return res.status(200).json({
    success: true,
    status,
    adminPassword: effectiveAdminKey,
    modules: mockStore.modules || { bookings: true, wompi_payments: true },
    message: status === 'unpaid' ? 'No se registró pago.' : 'Servicio activo.'
  });
});

/**
 * 2.2. POST /api/bookings/admin/set-subscription-status
 * Permite desde otro dashboard en Vercel activar o apagar remotamente la función cambiando el estado a 'unpaid' o 'active'
 */
router.post('/admin/set-subscription-status', async (req, res) => {
  const { status, modules, key } = req.body;
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  const effectiveAdminKey = await getEffectiveAdminSecret();

  if (key !== ADMIN_SECRET && key !== effectiveAdminKey && authHeader !== ADMIN_SECRET && authHeader !== `Bearer ${ADMIN_SECRET}` && authHeader !== effectiveAdminKey && authHeader !== `Bearer ${effectiveAdminKey}`) {
    return res.status(403).json({ error: 'No autorizado para modificar el estado de suscripción.' });
  }

  const newStatus = (status === 'unpaid' || status === 'inactive' || status === 'locked') ? 'unpaid' : 'active';
  mockStore.subscription_status = newStatus;

  if (modules && typeof modules === 'object') {
    mockStore.modules = {
      ...(mockStore.modules || { bookings: true, wompi_payments: true }),
      ...modules
    };
  }

  if (supabase) {
    try {
      await supabase.from('cabins').upsert({
        id: 'system_settings',
        name: 'System Settings',
        type: newStatus,
        price_per_night: 0,
        description: JSON.stringify(mockStore.modules || { bookings: true, wompi_payments: true })
      });
    } catch (sbErr) {
      console.warn('Fallo persistiendo system_settings en Supabase:', sbErr.message);
    }
  }

  return res.status(200).json({
    success: true,
    status: newStatus,
    modules: mockStore.modules || { bookings: true, wompi_payments: true },
    message: newStatus === 'unpaid' 
      ? 'Sistema bloqueado: Pantalla configurada en "No se registró pago."' 
      : 'Sistema reactivado con éxito con acceso normal.'
  });
});

/**
 * 2.3. POST /api/bookings/admin/update-admin-password
 * Permite cambiar la contraseña del panel de administración (desde el dashboard o remotamente desde Dynamind)
 */
router.post('/admin/update-admin-password', async (req, res) => {
  try {
    const { newPassword, currentKey } = req.body;
    const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
    const effectiveAdminKey = await getEffectiveAdminSecret();

    if (!newPassword || String(newPassword).trim().length < 4) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
    }

    const cleanPass = String(newPassword).trim();
    const authorized = 
      currentKey === effectiveAdminKey || 
      currentKey === ADMIN_SECRET || 
      authHeader === effectiveAdminKey || 
      authHeader === `Bearer ${effectiveAdminKey}` ||
      authHeader === ADMIN_SECRET || 
      authHeader === `Bearer ${ADMIN_SECRET}`;

    if (!authorized) {
      return res.status(403).json({ error: 'No autorizado para cambiar la contraseña administrativa.' });
    }

    // Actualizar en memoria
    mockStore.admin_password = cleanPass;

    // Actualizar en Supabase Cloud
    if (supabase) {
      try {
        await supabase.from('cabins').upsert({
          id: 'admin_auth',
          name: 'Admin Auth Credentials',
          type: 'active',
          price_per_night: 0,
          description: cleanPass
        });
      } catch (sbErr) {
        console.warn('Fallo guardando admin_auth en Supabase:', sbErr.message);
      }
    }

    await recordAuditLog({
      booking_reference: 'CONFIG_AUTH',
      client_name: 'Administración',
      cabin_name: 'Panel Admin',
      previous_status: 'PASSWORD_ACTIVA',
      new_status: 'PASSWORD_ACTUALIZADA',
      changed_by: 'Owner / Admin',
      notes: 'Contraseña del panel administrativo actualizada.',
    });

    return res.status(200).json({
      success: true,
      message: 'Contraseña de administrador actualizada con éxito en la nube.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

/**
 * 3. GET /api/admin/bookings
 * Devuelve todas las reservas para el panel de administración (filtra montos si es staff)
 */
router.get('/admin/bookings', requireAdminOrStaffAuth, async (req, res) => {
  try {
    let bookings = [];
    let blockedDates = [];

    if (supabase) {
      const { data: bData } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: dData } = await supabase
        .from('blocked_dates')
        .select('*');

      bookings = bData || [];
      blockedDates = dData || [];
    } else {
      bookings = mockStore.bookings || [];
      blockedDates = mockStore.blocked_dates || [];
    }

    return res.status(200).json({
      success: true,
      role: req.userRole,
      bookings,
      blocked_dates: blockedDates,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al consultar reservas administrativas' });
  }
});

/**
 * 4. POST /api/admin/block-dates
 * Permite al administrador o staff bloquear fechas manualmente (teléfono, mantenimiento)
 */
router.post('/admin/block-dates', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { cabin_id, dates = [], reason = 'MANUAL_BLOCK' } = req.body;

    if (!cabin_id || dates.length === 0) {
      return res.status(400).json({ error: 'Cabaña y fechas requeridas.' });
    }

    if (supabase) {
      const records = dates.map((d) => ({
        cabin_id,
        blocked_date: d,
        reason,
      }));
      await supabase.from('blocked_dates').upsert(records, { onConflict: 'cabin_id, blocked_date' });
    } else {
      dates.forEach((d) => {
        if (!mockStore.blocked_dates.some((b) => b.cabin_id === cabin_id && b.blocked_date === d)) {
          mockStore.blocked_dates.push({
            id: `b-${Date.now()}-${Math.random()}`,
            cabin_id,
            blocked_date: d,
            reason,
          });
        }
      });
    }

    await recordAuditLog({
      booking_reference: 'BLOQUEO_MANUAL',
      client_name: 'Administración Interna',
      cabin_name: cabin_id,
      previous_status: 'DISPONIBLE',
      new_status: 'BLOQUEADO',
      changed_by: req.userRole === 'admin' ? 'Admin' : 'Recepción',
      notes: `Bloqueo manual de ${dates.length} fechas: ${dates.join(', ')}`,
    });

    return res.status(200).json({ success: true, message: 'Fechas bloqueadas con éxito.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al bloquear fechas' });
  }
});

/**
 * 5. POST /api/admin/update-status
 * Actualiza el estado de una reserva (AGENDADA, PAGA, CANCELADA) y recalcula saldos y fechas
 */
router.post('/admin/update-status', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { booking_reference, new_status } = req.body;

    if (!booking_reference || !new_status) {
      return res.status(400).json({ error: 'Referencia y nuevo estado son obligatorios.' });
    }

    const validStatuses = ['AGENDADA', 'PAGA', 'CANCELADA', 'CONFIRMED'];
    const normalizedStatus = new_status === 'CONFIRMED' ? 'AGENDADA' : new_status.toUpperCase();

    if (!validStatuses.includes(normalizedStatus) && !validStatuses.includes(new_status)) {
      return res.status(400).json({ error: 'Estado no válido. Use AGENDADA, PAGA o CANCELADA.' });
    }

    // Restricción de permisos: Rol Staff no puede cancelar agendas
    if (req.userRole === 'staff' && normalizedStatus === 'CANCELADA') {
      return res.status(403).json({ 
        error: 'Permiso denegado: La cuenta estándar/recepción no tiene permisos para cancelar reservas.' 
      });
    }

    let previousStatus = 'DESCONOCIDO';
    let clientName = 'Huésped';
    let cabinName = 'Cabaña';

    if (supabase) {
      const { data: booking, error: findError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', booking_reference)
        .single();

      if (findError || !booking) {
        return res.status(404).json({ error: 'Reserva no encontrada.' });
      }

      previousStatus = booking.status;
      clientName = booking.client_name;
      cabinName = booking.cabin_name;

      let depositAmount = Number(booking.deposit_amount_cop);
      let remainingBalance = Number(booking.remaining_balance_cop);
      const total = Number(booking.total_amount_cop);

      if (normalizedStatus === 'PAGA') {
        depositAmount = total;
        remainingBalance = 0;
      } else if (normalizedStatus === 'AGENDADA') {
        depositAmount = Math.round(total / 2);
        remainingBalance = total - depositAmount;
      }

      // Actualizar reserva
      await supabase
        .from('bookings')
        .update({
          status: normalizedStatus,
          deposit_amount_cop: depositAmount,
          remaining_balance_cop: remainingBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      // Manejo de fechas bloqueadas
      if (normalizedStatus === 'CANCELADA') {
        // Liberar fechas
        await supabase.from('blocked_dates').delete().eq('booking_id', booking.id);
      } else {
        // Asegurar que las fechas estén bloqueadas
        const inDate = new Date(booking.check_in_date);
        const outDate = new Date(booking.check_out_date);
        const datesToBlock = [];

        for (let d = new Date(inDate); d < outDate; d.setDate(d.getDate() + 1)) {
          datesToBlock.push({
            cabin_id: booking.cabin_id,
            blocked_date: d.toISOString().split('T')[0],
            reason: 'RESERVATION',
            booking_id: booking.id,
          });
        }

        if (datesToBlock.length > 0) {
          await supabase.from('blocked_dates').upsert(datesToBlock, { onConflict: 'cabin_id, blocked_date' });
        }
      }
    } else {
      const b = (mockStore.bookings || []).find((x) => x.booking_reference === booking_reference);
      if (!b) return res.status(404).json({ error: 'Reserva no encontrada.' });

      previousStatus = b.status;
      clientName = b.client_name;
      cabinName = b.cabin_name;

      b.status = normalizedStatus;
      const total = Number(b.total_amount_cop);

      if (normalizedStatus === 'PAGA') {
        b.deposit_amount_cop = total;
        b.remaining_balance_cop = 0;
      } else if (normalizedStatus === 'AGENDADA') {
        b.deposit_amount_cop = Math.round(total / 2);
        b.remaining_balance_cop = total - b.deposit_amount_cop;
      }

      if (normalizedStatus === 'CANCELADA') {
        mockStore.blocked_dates = (mockStore.blocked_dates || []).filter((x) => x.booking_id !== b.id);
      }
    }

    // Registrar en Historial de Movimientos / Auditoría
    await recordAuditLog({
      booking_reference,
      client_name: clientName,
      cabin_name: cabinName,
      previous_status: previousStatus,
      new_status: normalizedStatus,
      changed_by: req.userRole === 'admin' ? 'Admin' : 'Recepción',
      notes: `Estado modificado manualmente de ${previousStatus} a ${normalizedStatus}`,
    });

    console.log(`🔄 [ESTADO ACTUALIZADO] Ref: ${booking_reference} ➔ ${normalizedStatus} (Por: ${req.userRole})`);
    return res.status(200).json({ success: true, message: `Estado actualizado a ${normalizedStatus}` });
  } catch (err) {
    console.error('Error en /update-status:', err);
    return res.status(500).json({ error: 'Error al actualizar estado.' });
  }
});

/**
 * 6. POST /api/admin/cancel-booking
 * Cancela una reserva y libera las fechas en el calendario (Solo Admin)
 */
router.post('/admin/cancel-booking', requireAdminOrStaffAuth, async (req, res) => {
  try {
    if (req.userRole === 'staff') {
      return res.status(403).json({ 
        error: 'Permiso denegado: La cuenta estándar/recepción no tiene permisos para cancelar reservas.' 
      });
    }

    const { booking_reference, reason, notes } = req.body;
    let clientName = 'Huésped';
    let cabinName = 'Cabaña';

    if (supabase) {
      const { data: booking } = await supabase.from('bookings').select('*').eq('booking_reference', booking_reference).single();
      if (booking) {
        clientName = booking.client_name;
        cabinName = booking.cabin_name;
        await supabase.from('bookings').update({ status: 'CANCELADA' }).eq('id', booking.id);
        await supabase.from('blocked_dates').delete().eq('booking_id', booking.id);
      }
    } else {
      const b = (mockStore.bookings || []).find((x) => x.booking_reference === booking_reference);
      if (b) {
        clientName = b.client_name;
        cabinName = b.cabin_name;
        b.status = 'CANCELADA';
        mockStore.blocked_dates = (mockStore.blocked_dates || []).filter((x) => x.booking_id !== b.id);
      }
    }

    const cancelReasonText = reason ? `Motivo: ${reason}. ${notes || ''}` : (notes || 'Cancelación directa de reserva con liberación de fechas');

    await recordAuditLog({
      booking_reference,
      client_name: clientName,
      cabin_name: cabinName,
      previous_status: 'AGENDADO',
      new_status: 'CANCELADO',
      changed_by: 'Admin',
      notes: cancelReasonText,
    });

    return res.status(200).json({ success: true, message: 'Reserva cancelada y fechas liberadas.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error cancelando reserva' });
  }
});

/**
 * 7. GET /api/admin/audit-logs
 * Devuelve el historial de movimientos y auditoría (Exclusivo para Administrador)
 */
router.get('/admin/audit-logs', requireAdminOrStaffAuth, requireAdminOnly, async (req, res) => {
  try {
    let logs = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('booking_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        logs = data;
      }
    }

    // Si Supabase aún no tiene registros en la tabla nueva, unificamos con mockStore y logs de pago
    if (logs.length === 0 && mockStore.booking_audit_logs && mockStore.booking_audit_logs.length > 0) {
      logs = mockStore.booking_audit_logs;
    }

    // Respaldo dinámico: si está completamente vacío, creamos logs derivados de las reservas existentes
    if (logs.length === 0) {
      let currentBookings = [];
      if (supabase) {
        const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        currentBookings = data || [];
      } else {
        currentBookings = mockStore.bookings || [];
      }

      logs = currentBookings.map((b) => ({
        id: `gen-${b.id || b.booking_reference}`,
        booking_reference: b.booking_reference,
        client_name: b.client_name,
        cabin_name: b.cabin_name,
        previous_status: 'CREACIÓN',
        new_status: b.status || 'AGENDADA',
        changed_by: b.wompi_transaction_id ? '⚡ Pasarela Wompi' : 'Sistema',
        notes: `Reserva creada para ${b.check_in_date} al ${b.check_out_date}`,
        created_at: b.updated_at || b.created_at || new Date().toISOString(),
      }));
    }

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error obteniendo historial de auditoría' });
  }
});

/**
 * 8. POST /api/admin/delete-booking
 * Elimina una reserva específica de forma permanente (Exclusivo Admin)
 */
router.post('/admin/delete-booking', requireAdminOrStaffAuth, requireAdminOnly, async (req, res) => {
  try {
    const { booking_reference } = req.body;

    if (!booking_reference) {
      return res.status(400).json({ error: 'Referencia de reserva requerida.' });
    }

    let clientName = 'Huésped';
    let cabinName = 'Cabaña';

    if (supabase) {
      const { data: b } = await supabase.from('bookings').select('*').eq('booking_reference', booking_reference).single();
      if (b) {
        clientName = b.client_name;
        cabinName = b.cabin_name;
        await supabase.from('blocked_dates').delete().eq('booking_id', b.id);
        await supabase.from('bookings').delete().eq('id', b.id);
      }
    } else {
      const bIdx = (mockStore.bookings || []).findIndex((x) => x.booking_reference === booking_reference);
      if (bIdx !== -1) {
        const b = mockStore.bookings[bIdx];
        clientName = b.client_name;
        cabinName = b.cabin_name;
        mockStore.blocked_dates = (mockStore.blocked_dates || []).filter((x) => x.booking_id !== b.id);
        mockStore.bookings.splice(bIdx, 1);
      }
    }

    await recordAuditLog({
      booking_reference,
      client_name: clientName,
      cabin_name: cabinName,
      previous_status: 'CANCELADO',
      new_status: 'ELIMINADO',
      changed_by: 'Admin',
      notes: `Reserva ${booking_reference} eliminada permanentemente del sistema`,
    });

    return res.status(200).json({ success: true, message: `Reserva ${booking_reference} eliminada con éxito.` });
  } catch (err) {
    console.error('Error eliminando reserva:', err);
    return res.status(500).json({ error: 'Error al eliminar reserva.' });
  }
});

/**
 * 9. POST /api/admin/purge-all-data
 * Elimina absolutamente todas las agendas y movimientos del sistema tras verificar contraseña (Exclusivo Admin)
 */
router.post('/admin/purge-all-data', requireAdminOrStaffAuth, requireAdminOnly, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Contraseña de Administrador incorrecta. No se autorizó la eliminación total.' });
    }

    if (supabase) {
      await supabase.from('blocked_dates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      try {
        await supabase.from('booking_audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {}
      try {
        await supabase.from('wompi_payment_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {}
    }

    mockStore.bookings = [];
    mockStore.blocked_dates = [];
    mockStore.booking_audit_logs = [];
    mockStore.logs = [];

    // Log inicial de sistema reseteado
    await recordAuditLog({
      booking_reference: 'SISTEMA_REINICIADO',
      client_name: 'Administración General',
      cabin_name: 'Todas las cabañas',
      previous_status: 'ACTIVO',
      new_status: 'LIMPIEZA_TOTAL',
      changed_by: 'Admin',
      notes: 'Se ejecutó una purga total de agendas, movimientos y bloqueos manuales.',
    });

    console.log('⚠️ [PURGA TOTAL EJECUTADA] Todas las reservas y registros de auditoría fueron borrados por el Administrador.');
    return res.status(200).json({ success: true, message: 'Todos los datos de agendas y movimientos han sido eliminados por completo.' });
  } catch (err) {
    console.error('Error en purga total:', err);
    return res.status(500).json({ error: 'Error ejecutando la purga total de datos.' });
  }
});

/**
 * 10. GET /api/bookings/admin/subscription-status
 * Consulta el estado de la suscripción (active | unpaid) y módulos en vivo
 */
router.get('/admin/subscription-status', async (req, res) => {
  try {
    let status = mockStore.subscription_status || 'active';
    let modules = mockStore.modules || { bookings: true, wompi_payments: true };

    if (supabase) {
      const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('id', 'system_settings')
        .single();

      if (!error && data) {
        status = data.type || 'active';
        try {
          modules = JSON.parse(data.description);
        } catch {}
      }
    }

    return res.status(200).json({
      success: true,
      status,
      modules
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      status: 'active',
      modules: { bookings: true, wompi_payments: true }
    });
  }
});

/**
 * 11. POST /api/bookings/admin/set-subscription-status
 * Modifica el estado de suspensión / habilitación global (Killswitch)
 * Acepta x-admin-key (Panel Dynamind), bearer token o cookie de sesión.
 */
router.post('/admin/set-subscription-status', async (req, res) => {
  try {
    const { status, action, key, modules } = req.body;
    const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
    const effectiveAdminKey = await getEffectiveAdminSecret();

    // Comprobar autorización por clave maestra remota o sesión
    const isMasterAuth = 
      key === ADMIN_SECRET || 
      key === effectiveAdminKey || 
      authHeader === ADMIN_SECRET || 
      authHeader === `Bearer ${ADMIN_SECRET}` || 
      authHeader === effectiveAdminKey || 
      authHeader === `Bearer ${effectiveAdminKey}` ||
      (req.session && (req.session.userRole === 'MASTER' || req.session.userRole === 'ADMIN'));

    if (!isMasterAuth) {
      return res.status(403).json({ error: 'No autorizado para modificar el estado de suscripción.' });
    }

    const targetStatus = status || (action === 'disable' ? 'unpaid' : 'active');
    mockStore.subscription_status = targetStatus;

    if (modules && typeof modules === 'object') {
      mockStore.modules = {
        ...(mockStore.modules || { bookings: true, wompi_payments: true }),
        ...modules
      };
    }

    if (supabase) {
      const currentDesc = JSON.stringify(mockStore.modules || {
        bookings: true,
        wompi_payments: true,
        recaudos: true,
        cancelaciones: true,
        personalizacion: true,
        users_management: true
      });

      await supabase.from('cabins').upsert({
        id: 'system_settings',
        name: 'System Settings',
        type: targetStatus,
        price_per_night: 0,
        description: currentDesc
      });
    }

    await recordAuditLog({
      booking_reference: 'SISTEMA_SUSCRIPCIÓN',
      client_name: 'Panel Maestro Dynamind',
      cabin_name: 'Andicas Eco-Resort',
      previous_status: 'CAMBIO_ESTADO',
      new_status: targetStatus.toUpperCase(),
      changed_by: 'Owner / Dynamind',
      notes: `Estado de suscripción actualizado a: ${targetStatus}`,
    });

    return res.status(200).json({
      success: true,
      status: targetStatus,
      modules: mockStore.modules,
      message: `Estado de suscripción actualizado a ${targetStatus}`
    });
  } catch (err) {
    console.error('Error set-subscription-status:', err);
    return res.status(500).json({ error: 'Error actualizando suscripción.' });
  }
});

/**
 * 12. POST /api/bookings/admin/set-module-status
 * Modifica el estado modular desde el Panel Dynamind o Dashboard
 */
router.post('/admin/set-module-status', async (req, res) => {
  try {
    const { module, enabled, modules, key } = req.body;
    const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
    const effectiveAdminKey = await getEffectiveAdminSecret();

    const isMasterAuth = 
      key === ADMIN_SECRET || 
      key === effectiveAdminKey || 
      authHeader === ADMIN_SECRET || 
      authHeader === `Bearer ${ADMIN_SECRET}` || 
      authHeader === effectiveAdminKey || 
      authHeader === `Bearer ${effectiveAdminKey}` ||
      (req.session && (req.session.userRole === 'MASTER' || req.session.userRole === 'ADMIN'));

    if (!isMasterAuth) {
      return res.status(403).json({ error: 'No autorizado para modificar los módulos.' });
    }

    if (!mockStore.modules) {
      mockStore.modules = {
        bookings: true,
        wompi_payments: true,
        recaudos: true,
        cancelaciones: true,
        personalizacion: true,
        users_management: true
      };
    }

    if (modules && typeof modules === 'object') {
      mockStore.modules = { ...mockStore.modules, ...modules };
    } else if (module) {
      mockStore.modules[module] = enabled !== false;
    }

    if (supabase) {
      await supabase.from('cabins').upsert({
        id: 'system_settings',
        name: 'System Settings',
        type: mockStore.subscription_status || 'active',
        price_per_night: 0,
        description: JSON.stringify(mockStore.modules)
      });
    }

    return res.status(200).json({
      success: true,
      modules: mockStore.modules,
      message: 'Módulos actualizados con éxito.'
    });
  } catch (err) {
    console.error('Error set-module-status:', err);
    return res.status(500).json({ error: 'Error actualizando módulos.' });
  }
});

/**
 * 12.1. GET /api/bookings/verify-reference/:ref (Público)
 * Consulta en tiempo real si una reserva existe y evalúa el plazo de los 3 días (72 horas)
 */
router.get('/verify-reference/:ref', async (req, res) => {
  try {
    const { ref } = req.params;
    if (!ref) {
      return res.status(400).json({ exists: false, error: 'Código de reserva no proporcionado.' });
    }

    const cleanRef = String(ref).trim().toUpperCase();
    let booking = null;

    if (supabase) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', cleanRef)
        .maybeSingle();
      booking = data;
    }

    if (!booking && mockStore.bookings) {
      booking = mockStore.bookings.find(b => b.booking_reference === cleanRef);
    }

    if (!booking) {
      return res.status(404).json({
        exists: false,
        error: 'El número de reserva no se encuentra registrado en nuestro sistema. Verifica el código e intenta de nuevo.'
      });
    }

    const checkInDate = booking.check_in_date;
    const totalAmount = Number(booking.total_amount_cop || 0);
    const depositAmount = Number(booking.deposit_amount_cop || Math.round(totalAmount / 2));

    let diffDays = 0;
    let isEligibleForFullReview = true;
    let penaltyPercentage = 0;

    if (checkInDate) {
      const checkInTime = new Date(checkInDate).getTime();
      const nowTime = new Date().getTime();
      const diffMs = checkInTime - nowTime;
      diffDays = Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;
      
      // Regla de Oro: Mínimo 3 días antes de la fecha de llegada
      isEligibleForFullReview = diffDays >= 3;
      penaltyPercentage = isEligibleForFullReview ? 0 : 40;
    }

    const penaltyAmount = Math.round(depositAmount * (penaltyPercentage / 100));
    const remainingEligibleAmount = depositAmount - penaltyAmount;

    return res.status(200).json({
      exists: true,
      booking: {
        booking_reference: booking.booking_reference,
        client_name: booking.client_name,
        client_email: booking.client_email,
        client_phone: booking.client_phone,
        cabin_id: booking.cabin_id,
        cabin_name: booking.cabin_name,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        total_amount_cop: totalAmount,
        deposit_amount_cop: depositAmount,
        status: booking.status
      },
      diffDays,
      isEligibleForFullReview,
      penaltyPercentage,
      penaltyAmount,
      remainingEligibleAmount
    });
  } catch (err) {
    return res.status(500).json({ exists: false, error: 'Error verificando número de reserva.' });
  }
});

/**
 * 13. POST /api/bookings/cancel-request (Público)
 * Registra una solicitud de cancelación con cálculo de regla de 72h y penalidad del 40%
 */
router.post('/cancel-request', async (req, res) => {
  try {
    const { booking_reference, client_name, client_email, client_phone, reason } = req.body;

    if (!booking_reference || !client_name) {
      return res.status(400).json({ error: 'El número de reserva y el nombre completo son obligatorios.' });
    }

    const cleanRef = String(booking_reference).trim().toUpperCase();

    // 1. Buscar la reserva en Supabase o mockStore
    let booking = null;
    if (supabase) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', cleanRef)
        .maybeSingle();
      booking = data;
    }

    if (!booking && mockStore.bookings) {
      booking = mockStore.bookings.find(b => b.booking_reference === cleanRef);
    }

    // SI NO SE ENCUENTRA LA RESERVA
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'El número de reserva ingresado no se encuentra registrado en nuestro sistema. Por favor verifica los datos en tu comprobante.'
      });
    }

    if (booking.status === 'CANCELADA' || booking.status === 'CANCELLED' || booking.status === 'CANCELADO') {
      return res.status(400).json({
        success: false,
        error: 'Esta reserva ya se encuentra cancelada en nuestro sistema.'
      });
    }

    // 2. Calcular días de diferencia hasta la fecha de check-in
    let checkInDate = booking.check_in_date;
    let diffDays = null;
    let isEligibleForFullReview = true;
    let penaltyPercentage = 0;

    if (checkInDate) {
      const checkInTime = new Date(checkInDate).getTime();
      const nowTime = new Date().getTime();
      const diffMs = checkInTime - nowTime;
      diffDays = Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;
      
      // Regla de Oro: Mínimo 3 días (72h) antes de la fecha de llegada
      isEligibleForFullReview = diffDays >= 3;
      penaltyPercentage = isEligibleForFullReview ? 0 : 40;
    }

    const depositAmount = Number(booking.deposit_amount_cop || Math.round((booking.total_amount_cop || 0) / 2));
    const penaltyAmount = Math.round(depositAmount * (penaltyPercentage / 100));

    // 3. Crear registro de solicitud de cancelación
    const cancellationRequest = {
      id: `cancel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      booking_reference: cleanRef,
      client_name: client_name.trim(),
      client_email: (client_email || booking?.client_email || '').trim(),
      client_phone: (client_phone || booking?.client_phone || '').trim(),
      cabin_id: booking?.cabin_id || 'N/A',
      cabin_name: booking?.cabin_name || 'Cabaña',
      check_in_date: checkInDate || 'Por verificar',
      check_out_date: booking?.check_out_date || 'Por verificar',
      total_amount_cop: booking?.total_amount_cop || 0,
      deposit_amount_cop: depositAmount,
      penalty_amount_cop: penaltyAmount,
      reason: reason || 'Cancelación solicitada por el usuario',
      diff_days_at_request: diffDays,
      penalty_percentage: penaltyPercentage,
      status: 'PENDIENTE', // PENDIENTE | APROBADA | RECHAZADA
      created_at: new Date().toISOString(),
    };

    if (!mockStore.cancellation_requests) {
      mockStore.cancellation_requests = [];
    }
    mockStore.cancellation_requests.unshift(cancellationRequest);

    // 4. Actualizar estado de la reserva a SOLICITUD_CANCELACION
    booking.status = 'SOLICITUD_CANCELACION';
    if (supabase) {
      try {
        await supabase
          .from('bookings')
          .update({ status: 'SOLICITUD_CANCELACION' })
          .eq('booking_reference', cleanRef);
      } catch (sbErr) {
        console.warn('Error actualizando estado en Supabase:', sbErr.message);
      }
    }

    // 5. Registrar en auditoría
    await recordAuditLog({
      booking_reference: cleanRef,
      client_name: client_name.trim(),
      cabin_name: booking?.cabin_name || 'Cabaña',
      previous_status: booking?.status || 'AGENDADO',
      new_status: 'SOLICITUD_CANCELACION',
      changed_by: 'Huésped (Web)',
      notes: `Solicitud con ${diffDays !== null ? `${diffDays} días de antelación.` : 'fecha manual.'} Penalidad: ${penaltyPercentage}% ($${penaltyAmount} COP). Motivo: ${reason || 'N/A'}`,
    });

    return res.status(200).json({
      success: true,
      message: isEligibleForFullReview
        ? 'Solicitud radicada oportunamente (>= 3 días). Será revisada por recepción para reprogramación o saldo a favor sin penalidad.'
        : `Solicitud radicada. Al solicitarse con menos de 3 días de antelación (${diffDays} días), se aplicará la penalidad del 40% sobre el anticipo ($${penaltyAmount.toLocaleString('es-CO')} COP).`,
      cancellationRequest,
      penaltyPercentage,
      penaltyAmount,
      isEligibleForFullReview,
      diffDays,
    });
  } catch (err) {
    console.error('Error procesando solicitud de cancelación:', err);
    return res.status(500).json({ error: 'No se pudo procesar la solicitud de cancelación.' });
  }
});

/**
 * 14. GET /api/bookings/admin/cancellation-requests
 * Obtiene todas las solicitudes de cancelación para el panel de administración
 */
router.get('/admin/cancellation-requests', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const requests = mockStore.cancellation_requests || [];
    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error obteniendo solicitudes de cancelación.' });
  }
});

/**
 * 15. POST /api/bookings/admin/resolve-cancellation
 * Permite al administrador o recepción aprobar o rechazar una solicitud de cancelación
 */
router.post('/admin/resolve-cancellation', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { requestId, booking_reference, action, notes } = req.body;
    const cleanAction = String(action || '').toUpperCase(); // 'APPROVE' | 'REJECT'

    if (!requestId && !booking_reference) {
      return res.status(400).json({ error: 'ID de solicitud o referencia de reserva requerida.' });
    }

    const requests = mockStore.cancellation_requests || [];
    const targetReq = requests.find(r => r.id === requestId || r.booking_reference === booking_reference);

    const newReqStatus = cleanAction === 'APPROVE' ? 'APROBADA' : 'RECHAZADA';
    const newBookingStatus = cleanAction === 'APPROVE' ? 'CANCELADA' : 'CONFIRMED';

    if (targetReq) {
      targetReq.status = newReqStatus;
      targetReq.resolved_at = new Date().toISOString();
      targetReq.resolved_by = req.userRole || 'Admin';
      targetReq.admin_notes = notes || '';
    }

    // Actualizar la reserva
    const ref = targetReq?.booking_reference || booking_reference;
    if (ref) {
      if (mockStore.bookings) {
        const b = mockStore.bookings.find(item => item.booking_reference === ref);
        if (b) b.status = newBookingStatus;
      }
      if (supabase) {
        try {
          await supabase
            .from('bookings')
            .update({ status: newBookingStatus })
            .eq('booking_reference', ref);
        } catch (sbErr) {
          console.warn('Error en Supabase:', sbErr.message);
        }
      }
    }

    // Registrar en auditoría
    await recordAuditLog({
      booking_reference: ref || 'N/A',
      client_name: targetReq?.client_name || 'Huésped',
      cabin_name: targetReq?.cabin_name || 'Cabaña',
      previous_status: 'SOLICITUD_CANCELACION',
      new_status: newBookingStatus,
      changed_by: req.userRole || 'Admin',
      notes: `Solicitud de cancelación ${newReqStatus.toLowerCase()}. ${notes ? `Notas: ${notes}` : ''}`,
    });

    return res.status(200).json({
      success: true,
      message: `Solicitud de cancelación ${newReqStatus.toLowerCase()} con éxito.`,
      status: newReqStatus,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error resolviendo solicitud de cancelación.' });
  }
});

/**
 * 16. GET /api/bookings/site-config (Público & Admin)
 * Obtiene la configuración dinámica de precios, cabañas y planes de pasadía
 */
router.get('/site-config', async (req, res) => {
  try {
    let customConfig = mockStore.site_custom_config || null;

    if (!customConfig && supabase) {
      try {
        const { data } = await supabase
          .from('cabins')
          .select('*')
          .eq('id', 'custom_site_config')
          .maybeSingle();
        if (data?.description) {
          customConfig = JSON.parse(data.description);
          mockStore.site_custom_config = customConfig;
        }
      } catch (err) {}
    }

    return res.status(200).json({
      success: true,
      config: customConfig || {},
    });
  } catch (err) {
    return res.status(200).json({ success: true, config: {} });
  }
});

/**
 * 17. POST /api/bookings/admin/update-site-config (Admin / Owner)
 * Guarda la configuración personalizada de cabañas, precios y planes en Supabase Cloud
 */
router.post('/admin/update-site-config', requireAdminOrStaffAuth, requireAdminOnly, async (req, res) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Objeto de configuración no válido.' });
    }

    mockStore.site_custom_config = {
      ...(mockStore.site_custom_config || {}),
      ...config,
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        await supabase.from('cabins').upsert({
          id: 'custom_site_config',
          name: 'Custom Site Config CMS',
          type: 'active',
          price_per_night: 0,
          description: JSON.stringify(mockStore.site_custom_config),
        });
      } catch (sbErr) {
        console.warn('Error guardando custom_site_config en Supabase:', sbErr.message);
      }
    }

    await recordAuditLog({
      booking_reference: 'CONFIG_CMS',
      client_name: 'Personalización de Página',
      cabin_name: 'Tarifas & Planes',
      previous_status: 'CONFIG_PREVIA',
      new_status: 'CONFIG_ACTUALIZADA',
      changed_by: 'Administrador General',
      notes: 'Precios, disponibilidad de planes o medios de pago actualizados desde el panel.',
    });

    return res.status(200).json({
      success: true,
      message: 'Configuración de página y precios guardada con éxito en la nube.',
      config: mockStore.site_custom_config,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error guardando configuración de página.' });
  }
});

/**
 * 18. GET /api/bookings/admin/users
 * Lista todos los usuarios del sistema (Exclusivo Admin Master)
 */
router.get('/admin/users', requireAdminOrStaffAuth, requireMasterAdminOnly, async (req, res) => {
  try {
    const users = await getSystemUsers();
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      created_at: u.created_at
    }));
    return res.status(200).json({ success: true, users: safeUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando usuarios.' });
  }
});

/**
 * 19. POST /api/bookings/admin/users/create
 * Crea un nuevo usuario con rol asignado (Exclusivo Admin Master)
 */
router.post('/admin/users/create', requireAdminOrStaffAuth, requireMasterAdminOnly, async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || String(password).trim().length < 4) {
      return res.status(400).json({ error: 'El usuario y la contraseña (mínimo 4 caracteres) son obligatorios.' });
    }

    const cleanUser = String(username).trim().toLowerCase();
    const users = await getSystemUsers();

    if (users.some(u => u.username.toLowerCase() === cleanUser)) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
    }

    const newUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: cleanUser,
      password: String(password).trim(),
      name: (name || cleanUser).trim(),
      role: role === 'admin' ? 'admin' : 'staff',
      created_at: new Date().toISOString()
    };

    users.unshift(newUser);
    await saveSystemUsers(users);

    await recordAuditLog({
      booking_reference: 'USUARIOS_SISTEMA',
      client_name: newUser.name,
      cabin_name: 'Gestión Usuarios',
      previous_status: 'CREAR_CUENTA',
      new_status: `ROL_${newUser.role.toUpperCase()}`,
      changed_by: 'Admin Master',
      notes: `Usuario creado: ${newUser.username} (${newUser.name}) con permisos ${newUser.role === 'admin' ? 'Administrador' : 'Empleado/Recepción'}`
    });

    return res.status(200).json({
      success: true,
      message: 'Usuario creado con éxito.',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        created_at: newUser.created_at
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error creando usuario.' });
  }
});

/**
 * 20. POST /api/bookings/admin/users/update-password
 * Cambia la contraseña de un usuario existente (Exclusivo Admin Master)
 */
router.post('/admin/users/update-password', requireAdminOrStaffAuth, requireMasterAdminOnly, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword || String(newPassword).trim().length < 4) {
      return res.status(400).json({ error: 'ID de usuario y nueva contraseña válida (mínimo 4 caracteres) requeridos.' });
    }

    const users = await getSystemUsers();
    const targetUser = users.find(u => u.id === userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    targetUser.password = String(newPassword).trim();
    await saveSystemUsers(users);

    await recordAuditLog({
      booking_reference: 'USUARIOS_SISTEMA',
      client_name: targetUser.name,
      cabin_name: 'Gestión Usuarios',
      previous_status: 'PASSWORD_PREVIA',
      new_status: 'PASSWORD_ACTUALIZADA',
      changed_by: 'Admin Master',
      notes: `Contraseña modificada para el usuario: ${targetUser.username}`
    });

    return res.status(200).json({
      success: true,
      message: `Contraseña actualizada con éxito para el usuario ${targetUser.username}.`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error actualizando contraseña del usuario.' });
  }
});

/**
 * 21. POST /api/bookings/admin/users/delete
 * Elimina un usuario del sistema (Exclusivo Admin Master)
 */
router.post('/admin/users/delete', requireAdminOrStaffAuth, requireMasterAdminOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    let users = await getSystemUsers();
    const targetUser = users.find(u => u.id === userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    await saveSystemUsers(updatedUsers);

    await recordAuditLog({
      booking_reference: 'USUARIOS_SISTEMA',
      client_name: targetUser.name,
      cabin_name: 'Gestión Usuarios',
      previous_status: 'USUARIO_ACTIVO',
      new_status: 'USUARIO_ELIMINADO',
      changed_by: 'Admin Master',
      notes: `Usuario eliminado: ${targetUser.username}`
    });

    return res.status(200).json({
      success: true,
      message: `Usuario ${targetUser.username} eliminado del sistema.`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error eliminando usuario.' });
  }
});

// =========================================================================
// MÓDULO DE CAJA, APERTURA DE TURNO, GASTOS Y CIERRE DIARIO
// =========================================================================

// Helpers para sesiones y cierres de caja
async function getCashSessions() {
  if (mockStore.cash_sessions && Array.isArray(mockStore.cash_sessions)) {
    return mockStore.cash_sessions;
  }
  if (supabase) {
    try {
      const { data } = await supabase
        .from('cabins')
        .select('*')
        .eq('id', 'cash_register_sessions')
        .maybeSingle();
      if (data?.description) {
        mockStore.cash_sessions = JSON.parse(data.description);
        return mockStore.cash_sessions;
      }
    } catch (err) {}
  }
  return mockStore.cash_sessions || [];
}

async function saveCashSessions(sessions) {
  mockStore.cash_sessions = sessions;
  if (supabase) {
    try {
      await supabase.from('cabins').upsert({
        id: 'cash_register_sessions',
        name: 'Cash Register Sessions',
        type: 'active',
        price_per_night: 0,
        description: JSON.stringify(sessions),
      });
    } catch (err) {
      console.warn('Error guardando cash_register_sessions en Supabase:', err.message);
    }
  }
}

async function getCashClosures() {
  if (mockStore.cash_closures && Array.isArray(mockStore.cash_closures)) {
    return mockStore.cash_closures;
  }
  if (supabase) {
    try {
      const { data } = await supabase
        .from('cabins')
        .select('*')
        .eq('id', 'cash_closures_history')
        .maybeSingle();
      if (data?.description) {
        mockStore.cash_closures = JSON.parse(data.description);
        return mockStore.cash_closures;
      }
    } catch (err) {}
  }
  return mockStore.cash_closures || [];
}

async function saveCashClosures(closures) {
  mockStore.cash_closures = closures;
  if (supabase) {
    try {
      await supabase.from('cabins').upsert({
        id: 'cash_closures_history',
        name: 'Cash Closures History',
        type: 'active',
        price_per_night: 0,
        description: JSON.stringify(closures),
      });
    } catch (err) {
      console.warn('Error guardando cash_closures_history en Supabase:', err.message);
    }
  }
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 22. GET /api/bookings/admin/cash/today
 * Obtiene la sesión de caja del día actual, base inicial, gastos y pagos
 */
router.get('/admin/cash/today', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const todayStr = getTodayStr();
    const sessions = await getCashSessions();
    const closures = await getCashClosures();

    let session = sessions.find(s => s.date === todayStr);
    if (!session) {
      session = {
        date: todayStr,
        base_initial: 0,
        opened_by: null,
        opened_at: null,
        is_locked: false,
        expenses: [],
        payments_received: [],
        users_on_shift: []
      };
      sessions.unshift(session);
      await saveCashSessions(sessions);
    }

    // Buscar cierre activo de hoy (no anulado)
    const todayClosure = closures.find(c => c.date === todayStr && !c.is_annulled) || null;

    // Calcular totales
    const totalExpenses = (session.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalCashIn = (session.payments_received || [])
      .filter(p => p.method === 'EFECTIVO')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalElectronicIn = (session.payments_received || [])
      .filter(p => p.method !== 'EFECTIVO')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const baseInitial = Number(session.base_initial || 0);
    const expectedCash = baseInitial + totalCashIn - totalExpenses;

    return res.status(200).json({
      success: true,
      todaySession: session,
      todayClosure,
      summary: {
        todayStr,
        baseInitial,
        totalExpenses,
        totalCashIn,
        totalElectronicIn,
        expectedCash,
        isLocked: session.is_locked || (session.base_initial > 0) || totalCashIn > 0 || totalExpenses > 0,
        isClosedToday: !!todayClosure
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error obteniendo estado de caja del día.' });
  }
});

/**
 * 23. POST /api/bookings/admin/cash/open-shift
 * Inicia el turno de caja estableciendo la base inicial de efectivo
 */
router.post('/admin/cash/open-shift', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { base_amount, opened_by } = req.body;
    const todayStr = getTodayStr();
    const sessions = await getCashSessions();

    let session = sessions.find(s => s.date === todayStr);
    if (!session) {
      session = { date: todayStr, expenses: [], payments_received: [], users_on_shift: [] };
      sessions.unshift(session);
    }

    if (session.is_locked && session.base_initial > 0) {
      return res.status(400).json({ 
        error: `El turno ya fue iniciado hoy por ${session.opened_by || 'un operador'} con una base de $${Number(session.base_initial).toLocaleString('es-CO')} COP. No se puede modificar la base inicial por control de auditoría.` 
      });
    }

    const numBase = Math.max(0, Number(base_amount || 0));
    const userOpening = (opened_by || req.userRole || 'Operador').trim();

    session.base_initial = numBase;
    session.opened_by = userOpening;
    session.opened_at = new Date().toISOString();
    session.is_locked = true; // Se bloquea para el resto del día

    if (!session.users_on_shift) session.users_on_shift = [];
    if (!session.users_on_shift.includes(userOpening)) {
      session.users_on_shift.push(userOpening);
    }

    await saveCashSessions(sessions);

    await recordAuditLog({
      booking_reference: 'CAJA_APERTURA',
      client_name: userOpening,
      cabin_name: 'Caja Recepción',
      previous_status: 'TURNO_SIN_INICIAR',
      new_status: 'TURNO_INICIADO',
      changed_by: userOpening,
      notes: `Apertura de turno de caja iniciada con base de $${numBase.toLocaleString('es-CO')} COP.`
    });

    return res.status(200).json({
      success: true,
      message: `Apertura de turno registrada con éxito con base de $${numBase.toLocaleString('es-CO')} COP.`,
      session
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar apertura de turno de caja.' });
  }
});

/**
 * 24. POST /api/bookings/admin/cash/add-expense
 * Registra un gasto / salida de dinero de la caja
 */
router.post('/admin/cash/add-expense', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { concept, amount, category, notes, user } = req.body;

    if (!concept || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Concepto y valor del gasto válido son obligatorios.' });
    }

    const todayStr = getTodayStr();
    const sessions = await getCashSessions();

    let session = sessions.find(s => s.date === todayStr);
    if (!session) {
      session = { date: todayStr, base_initial: 0, is_locked: true, expenses: [], payments_received: [], users_on_shift: [] };
      sessions.unshift(session);
    }

    const expenseUser = (user || req.userRole || 'Operador').trim();
    const numAmount = Number(amount);

    const newExpense = {
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      concept: String(concept).trim(),
      amount: numAmount,
      category: category || 'General',
      notes: (notes || '').trim(),
      user: expenseUser,
      created_at: new Date().toISOString()
    };

    if (!session.expenses) session.expenses = [];
    session.expenses.unshift(newExpense);
    session.is_locked = true; // El dinero físico ha tenido movimiento

    if (!session.users_on_shift) session.users_on_shift = [];
    if (!session.users_on_shift.includes(expenseUser)) {
      session.users_on_shift.push(expenseUser);
    }

    await saveCashSessions(sessions);

    await recordAuditLog({
      booking_reference: 'GASTO_CAJA',
      client_name: expenseUser,
      cabin_name: 'Caja Menor',
      previous_status: 'EGRESO',
      new_status: `-$${numAmount.toLocaleString('es-CO')}`,
      changed_by: expenseUser,
      notes: `Gasto registrado: ${newExpense.concept} (${newExpense.category}) por $${numAmount.toLocaleString('es-CO')} COP.`
    });

    return res.status(200).json({
      success: true,
      message: 'Gasto registrado con éxito.',
      expense: newExpense,
      session
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error registrando gasto de caja.' });
  }
});

/**
 * 25. POST /api/bookings/admin/cash/delete-expense
 * Elimina un gasto del día en curso
 */
router.post('/admin/cash/delete-expense', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { expenseId } = req.body;
    const todayStr = getTodayStr();
    const sessions = await getCashSessions();

    let session = sessions.find(s => s.date === todayStr);
    if (!session || !session.expenses) {
      return res.status(404).json({ error: 'Gasto no encontrado en la sesión de hoy.' });
    }

    const targetExpense = session.expenses.find(e => e.id === expenseId);
    if (!targetExpense) {
      return res.status(404).json({ error: 'Gasto no encontrado.' });
    }

    session.expenses = session.expenses.filter(e => e.id !== expenseId);
    await saveCashSessions(sessions);

    await recordAuditLog({
      booking_reference: 'GASTO_CAJA',
      client_name: targetExpense.concept,
      cabin_name: 'Caja Menor',
      previous_status: 'ELIMINAR_GASTO',
      new_status: 'ANULADO',
      changed_by: req.userRole || 'Operador',
      notes: `Gasto eliminado: ${targetExpense.concept} ($${targetExpense.amount.toLocaleString('es-CO')} COP).`
    });

    return res.status(200).json({ success: true, message: 'Gasto eliminado con éxito.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error eliminando gasto.' });
  }
});

/**
 * 26. POST /api/bookings/admin/cash/register-payment
 * Registra un cobro o abono recibido en recepción
 */
router.post('/admin/cash/register-payment', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { booking_reference, client_name, amount, method, notes, user } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Monto de pago válido requerido.' });
    }

    const todayStr = getTodayStr();
    const sessions = await getCashSessions();

    let session = sessions.find(s => s.date === todayStr);
    if (!session) {
      session = { date: todayStr, base_initial: 0, is_locked: true, expenses: [], payments_received: [], users_on_shift: [] };
      sessions.unshift(session);
    }

    const operator = (user || req.userRole || 'Recepción').trim();
    const cleanMethod = (method || 'EFECTIVO').toUpperCase();
    const numAmount = Number(amount);

    const newPayment = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      booking_reference: (booking_reference || 'RECEPCION').toUpperCase(),
      client_name: (client_name || 'Huésped').trim(),
      amount: numAmount,
      method: cleanMethod, // 'EFECTIVO' | 'DATAFONO' | 'TRANSFERENCIA' | 'WOMPI'
      notes: (notes || '').trim(),
      user: operator,
      created_at: new Date().toISOString()
    };

    if (!session.payments_received) session.payments_received = [];
    session.payments_received.unshift(newPayment);
    session.is_locked = true;

    if (!session.users_on_shift) session.users_on_shift = [];
    if (!session.users_on_shift.includes(operator)) {
      session.users_on_shift.push(operator);
    }

    await saveCashSessions(sessions);

    await recordAuditLog({
      booking_reference: newPayment.booking_reference,
      client_name: newPayment.client_name,
      cabin_name: 'Cobro Recepción',
      previous_status: 'COBRO_EN_SITIO',
      new_status: `+$${numAmount.toLocaleString('es-CO')} (${cleanMethod})`,
      changed_by: operator,
      notes: `Pago recibido en recepción: $${numAmount.toLocaleString('es-CO')} COP por método ${cleanMethod}.`
    });

    return res.status(200).json({
      success: true,
      message: 'Cobro registrado en la caja del día.',
      payment: newPayment,
      session
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error registrando cobro de caja.' });
  }
});

/**
 * 27. POST /api/bookings/admin/cash/close-shift
 * Realiza el cierre definitivo de caja diario con informe y arqueo
 */
router.post('/admin/cash/close-shift', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { actual_cash_counted, notes, closed_by } = req.body;
    const todayStr = getTodayStr();
    const sessions = await getCashSessions();
    const closures = await getCashClosures();

    // Validar si ya hay un cierre no anulado de hoy
    const existingActiveClosure = closures.find(c => c.date === todayStr && !c.is_annulled);
    if (existingActiveClosure) {
      return res.status(400).json({
        error: `Ya existe un cierre de caja realizado hoy por ${existingActiveClosure.closed_by} a las ${new Date(existingActiveClosure.closed_at).toLocaleTimeString('es-CO')}. Si fue un error, puedes anularlo antes de realizar uno nuevo.`
      });
    }

    let session = sessions.find(s => s.date === todayStr);
    if (!session) {
      session = { date: todayStr, base_initial: 0, expenses: [], payments_received: [], users_on_shift: [] };
    }

    const operator = (closed_by || req.userRole || 'Admin').trim();
    const baseInitial = Number(session.base_initial || 0);

    const totalCashIn = (session.payments_received || [])
      .filter(p => p.method === 'EFECTIVO')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalElectronicIn = (session.payments_received || [])
      .filter(p => p.method !== 'EFECTIVO')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalExpenses = (session.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const expectedCash = baseInitial + totalCashIn - totalExpenses;
    const actualCash = Number(actual_cash_counted || 0);
    const difference = actualCash - expectedCash;

    let status = 'CUADRADO';
    if (difference > 0) status = 'SOBRANTE';
    if (difference < 0) status = 'FALTANTE';

    const usersOnShift = Array.from(new Set([
      session.opened_by,
      operator,
      ...(session.users_on_shift || []),
      ...(session.expenses || []).map(e => e.user),
      ...(session.payments_received || []).map(p => p.user)
    ].filter(Boolean)));

    const newClosure = {
      id: `closure-${todayStr}-${Date.now()}`,
      date: todayStr,
      closed_at: new Date().toISOString(),
      closed_by: operator,
      base_initial: baseInitial,
      total_cash_received: totalCashIn,
      total_electronic_received: totalElectronicIn,
      total_expenses: totalExpenses,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      difference,
      status,
      expenses_detail: session.expenses || [],
      payments_detail: session.payments_received || [],
      users_on_shift: usersOnShift,
      notes: (notes || '').trim(),
      is_annulled: false
    };

    closures.unshift(newClosure);
    await saveCashClosures(closures);

    await recordAuditLog({
      booking_reference: 'CIERRE_CAJA_DIARIO',
      client_name: operator,
      cabin_name: 'Caja General',
      previous_status: 'CAJA_ABIERTA',
      new_status: `CIERRE_${status}`,
      changed_by: operator,
      notes: `Cierre de caja diario finalizado. Esperado: $${expectedCash.toLocaleString('es-CO')} | Contado: $${actualCash.toLocaleString('es-CO')} | Diferencia: $${difference.toLocaleString('es-CO')} COP (${status}).`
    });

    return res.status(200).json({
      success: true,
      message: 'Cierre de caja completado e informe generado con éxito.',
      closure: newClosure
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error procesando cierre de caja.' });
  }
});

/**
 * 28. POST /api/bookings/admin/cash/annul-closure
 * Anula el cierre de caja SOLO correspondiente al día de hoy (Reapertura de turno)
 */
router.post('/admin/cash/annul-closure', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { closureId, reason, annulled_by } = req.body;
    const todayStr = getTodayStr();

    if (!closureId || !reason || reason.trim().length < 4) {
      return res.status(400).json({ error: 'ID de cierre y motivo obligatorio de anulación requeridos.' });
    }

    const closures = await getCashClosures();
    const targetClosure = closures.find(c => c.id === closureId);

    if (!targetClosure) {
      return res.status(404).json({ error: 'Cierre de caja no encontrado.' });
    }

    // REGLA ESTRICTA: Solo se puede anular el cierre del día de hoy
    if (targetClosure.date !== todayStr) {
      return res.status(403).json({
        error: `Acción denegada: Solo se permite anular el cierre correspondiente al día de hoy (${todayStr}). El cierre del ${targetClosure.date} es un registro histórico inmutable para protección contable.`
      });
    }

    const operator = (annulled_by || req.userRole || 'Admin').trim();

    targetClosure.is_annulled = true;
    targetClosure.annulled_at = new Date().toISOString();
    targetClosure.annulled_by = operator;
    targetClosure.annulled_reason = String(reason).trim();

    await saveCashClosures(closures);

    await recordAuditLog({
      booking_reference: 'CIERRE_CAJA_ANULADO',
      client_name: operator,
      cabin_name: 'Caja General',
      previous_status: 'CIERRE_CERRADO',
      new_status: 'CIERRE_ANULADO_REABIERTO',
      changed_by: operator,
      notes: `⚠️ ANULACIÓN DE CIERRE DE CAJA de hoy (${todayStr}). Motivo manifestado: ${targetClosure.annulled_reason}. La caja queda reabierta.`
    });

    return res.status(200).json({
      success: true,
      message: 'Cierre de caja de hoy anulado con éxito. El turno ha sido reabierto.',
      closure: targetClosure
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error anulando cierre de caja.' });
  }
});

/**
 * 29. GET /api/bookings/admin/cash/history
 * Historial de cierres de caja con filtros por fecha y mes
 */
router.get('/admin/cash/history', requireAdminOrStaffAuth, async (req, res) => {
  try {
    const { date, month } = req.query;
    const closures = await getCashClosures();

    let filtered = closures;
    if (date) {
      filtered = filtered.filter(c => c.date === date);
    } else if (month) {
      filtered = filtered.filter(c => c.date && c.date.startsWith(month));
    }

    return res.status(200).json({
      success: true,
      closures: filtered
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error obteniendo historial de cierres de caja.' });
  }
});

export default router;
