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

// Middleware para verificar clave de admin, staff o estado de cuenta suspendida
async function requireAdminOrStaffAuth(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  const effectiveAdminKey = await getEffectiveAdminSecret();

  // Si el sistema está configurado globalmente como 'unpaid'
  if (mockStore.subscription_status === 'unpaid') {
    req.userRole = 'unpaid';
    return next();
  }

  if (
    authHeader === effectiveAdminKey || 
    authHeader === `Bearer ${effectiveAdminKey}` ||
    authHeader === ADMIN_SECRET || 
    authHeader === `Bearer ${ADMIN_SECRET}`
  ) {
    req.userRole = 'admin';
    return next();
  }
  if (authHeader === STAFF_SECRET || authHeader === `Bearer ${STAFF_SECRET}`) {
    req.userRole = 'staff';
    return next();
  }
  if (authHeader === UNPAID_SECRET || authHeader === `Bearer ${UNPAID_SECRET}` || authHeader === 'UNPAID_TOKEN_LOCKOUT') {
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
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido: Esta acción requiere permisos de Administrador.' });
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
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('blocked_date, reason')
        .eq('cabin_id', cabinId);

      if (!error && data) {
        blockedDates = data.map((d) => d.blocked_date);
      }
    } else {
      blockedDates = (mockStore.blocked_dates || [])
        .filter((b) => b.cabin_id === cabinId)
        .map((b) => b.blocked_date);
    }

    return res.status(200).json({
      success: true,
      cabin_id: cabinId,
      blocked_dates: blockedDates,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando disponibilidad' });
  }
});

/**
 * 2. POST /api/admin/login
 * Valida usuario y clave de acceso para rol Administrador, Estándar (Staff) o Usuario Oculto (Suspendido)
 */
router.post('/admin/login', async (req, res) => {
  const { username = '', password = '' } = req.body;
  const cleanUser = String(username).trim().toLowerCase();
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

  const isAdminUser = !cleanUser || cleanUser === 'admin' || cleanUser === 'administrador';
  const isStaffUser = !cleanUser || cleanUser === 'recepcion' || cleanUser === 'staff' || cleanUser === 'estandar' || cleanUser === 'recepcionista';
  const isUnpaidUser = cleanUser === 'unpaid' || cleanUser === 'bloqueado' || cleanUser === 'nopago' || cleanUser === 'suspendido';

  // 1. Usuario Oculto / Clave de Suspensión por Falta de Pago
  if ((isUnpaidUser || !cleanUser || isAdminUser || isStaffUser) && password === UNPAID_SECRET) {
    return res.status(200).json({
      success: true,
      token: UNPAID_SECRET,
      role: 'unpaid',
      roleLabel: 'No se registró pago'
    });
  }

  // 2. Administrador General (Verifica clave efectiva de Supabase o env)
  if (isAdminUser && (password === effectiveAdminKey || password === ADMIN_SECRET)) {
    return res.status(200).json({ 
      success: true, 
      token: password, 
      role: 'admin',
      roleLabel: 'Administrador General (Acceso Total)'
    });
  }

  // 3. Recepción / Staff
  if (isStaffUser && password === STAFF_SECRET) {
    return res.status(200).json({ 
      success: true, 
      token: STAFF_SECRET, 
      role: 'staff',
      roleLabel: 'Usuario Estándar / Recepción'
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

    const { booking_reference } = req.body;
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

    await recordAuditLog({
      booking_reference,
      client_name: clientName,
      cabin_name: cabinName,
      previous_status: 'AGENDADA',
      new_status: 'CANCELADA',
      changed_by: 'Admin',
      notes: 'Cancelación directa de reserva con liberación de fechas',
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
 */
router.post('/admin/set-subscription-status', requireAdminOrStaffAuth, requireAdminOnly, async (req, res) => {
  try {
    const { status, action } = req.body;
    const targetStatus = status || (action === 'disable' ? 'unpaid' : 'active');

    mockStore.subscription_status = targetStatus;

    if (supabase) {
      const currentDesc = JSON.stringify(mockStore.modules || { bookings: true, wompi_payments: true });
      await supabase.from('cabins').upsert({
        id: 'system_settings',
        name: 'System Settings',
        type: targetStatus,
        price_per_night: 0,
        description: currentDesc
      });
    }

    await recordAuditLog({
      booking_reference: 'SISTEMA_SUBSCRIPCIÓN',
      client_name: 'Panel Maestro Dynamind',
      cabin_name: 'Andicas Eco-Resort',
      previous_status: 'CAMBIO_ESTADO',
      new_status: targetStatus.toUpperCase(),
      changed_by: 'Owner',
      notes: `Estado de suscripción actualizado a: ${targetStatus}`,
    });

    return res.status(200).json({
      success: true,
      status: targetStatus,
      message: `Estado de suscripción actualizado a ${targetStatus}`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error actualizando suscripción.' });
  }
});

/**
 * 12. POST /api/bookings/admin/set-module-status
 * Modifica el estado modular (Agendamiento de Citas & Verificación Wompi)
 */
router.post('/admin/set-module-status', requireAdminOrStaffAuth, requireAdminOnly, async (req, res) => {
  try {
    const { module, enabled, modules } = req.body;

    if (!mockStore.modules) {
      mockStore.modules = { bookings: true, wompi_payments: true };
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
    return res.status(500).json({ error: 'Error actualizando módulos.' });
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

    // 2. Calcular días de diferencia hasta la fecha de check-in
    let checkInDate = booking?.check_in_date;
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
      deposit_amount_cop: booking?.deposit_amount_cop || 0,
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
    if (booking) {
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
    }

    // 5. Registrar en auditoría
    await recordAuditLog({
      booking_reference: cleanRef,
      client_name: client_name.trim(),
      cabin_name: booking?.cabin_name || 'Cabaña',
      previous_status: booking?.status || 'PAGA',
      new_status: 'SOLICITUD_CANCELACION',
      changed_by: 'Huésped (Web)',
      notes: `Solicitud con ${diffDays !== null ? `${diffDays} días de antelación.` : 'fecha manual.'} Penalidad calculada: ${penaltyPercentage}%. Motivo: ${reason || 'N/A'}`,
    });

    return res.status(200).json({
      success: true,
      message: isEligibleForFullReview
        ? 'Solicitud recibida oportunamente (>= 3 días). Será revisada por recepción para trámite o reprogramación.'
        : 'Solicitud recibida. Al haberse solicitado con menos de 3 días de antelación, aplica una penalidad del 40% según nuestras políticas.',
      cancellationRequest,
      penaltyPercentage,
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

export default router;
