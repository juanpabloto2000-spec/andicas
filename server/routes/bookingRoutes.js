import express from 'express';
import { supabase, mockStore } from '../config/supabase.js';

const router = express.Router();
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'PanelPassword1966@';
const STAFF_SECRET = process.env.STAFF_SECRET_KEY || 'StaffAndicas2026!';

// Middleware para verificar clave de admin o staff
function requireAdminOrStaffAuth(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  if (authHeader === ADMIN_SECRET || authHeader === `Bearer ${ADMIN_SECRET}`) {
    req.userRole = 'admin';
    return next();
  }
  if (authHeader === STAFF_SECRET || authHeader === `Bearer ${STAFF_SECRET}`) {
    req.userRole = 'staff';
    return next();
  }
  return res.status(401).json({ error: 'Acceso no autorizado al panel administrativo.' });
}

// Middleware para restringir acciones exclusivas de administrador
function requireAdminOnly(req, res, next) {
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
 * Valida usuario y clave de acceso para rol Administrador (Total) o Estándar (Staff)
 */
router.post('/admin/login', (req, res) => {
  const { username = '', password = '' } = req.body;
  const cleanUser = String(username).trim().toLowerCase();

  const isAdminUser = !cleanUser || cleanUser === 'admin' || cleanUser === 'administrador';
  const isStaffUser = !cleanUser || cleanUser === 'recepcion' || cleanUser === 'staff' || cleanUser === 'estandar' || cleanUser === 'recepcionista';

  if (isAdminUser && password === ADMIN_SECRET) {
    return res.status(200).json({ 
      success: true, 
      token: ADMIN_SECRET, 
      role: 'admin',
      roleLabel: 'Administrador General (Acceso Total)'
    });
  }
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

export default router;
