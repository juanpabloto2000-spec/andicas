import express from 'express';
import { supabase, mockStore } from '../config/supabase.js';

const router = express.Router();
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'PanelPassword1966@';

// Middleware para verificar clave de admin
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];
  if (!authHeader || (authHeader !== ADMIN_SECRET && authHeader !== `Bearer ${ADMIN_SECRET}`)) {
    return res.status(401).json({ error: 'Acceso no autorizado al panel administrativo.' });
  }
  next();
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
      blockedDates = mockStore.blocked_dates
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
 * Valida la clave de acceso del administrador
 */
router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_SECRET) {
    return res.status(200).json({ success: true, token: ADMIN_SECRET });
  }
  return res.status(401).json({ error: 'Contraseña de administrador incorrecta.' });
});

/**
 * 3. GET /api/admin/bookings
 * Devuelve todas las reservas para el panel de administración
 */
router.get('/admin/bookings', requireAdminAuth, async (req, res) => {
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
      bookings = mockStore.bookings;
      blockedDates = mockStore.blocked_dates;
    }

    return res.status(200).json({
      success: true,
      bookings,
      blocked_dates: blockedDates,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al consultar reservas administrativas' });
  }
});

/**
 * 4. POST /api/admin/block-dates
 * Permite al administrador bloquear fechas manualmente (teléfono, mantenimiento)
 */
router.post('/admin/block-dates', requireAdminAuth, async (req, res) => {
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

    return res.status(200).json({ success: true, message: 'Fechas bloqueadas con éxito.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al bloquear fechas' });
  }
});

/**
 * 5. POST /api/admin/update-status
 * Actualiza el estado de una reserva (AGENDADA, PAGA, CANCELADA) y recalcula saldos y fechas
 */
router.post('/admin/update-status', requireAdminAuth, async (req, res) => {
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

    if (supabase) {
      const { data: booking, error: findError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', booking_reference)
        .single();

      if (findError || !booking) {
        return res.status(404).json({ error: 'Reserva no encontrada.' });
      }

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
      const b = mockStore.bookings.find((x) => x.booking_reference === booking_reference);
      if (!b) return res.status(404).json({ error: 'Reserva no encontrada.' });

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
        mockStore.blocked_dates = mockStore.blocked_dates.filter((x) => x.booking_id !== b.id);
      }
    }

    console.log(`🔄 [ESTADO ACTUALIZADO] Ref: ${booking_reference} ➔ ${normalizedStatus}`);
    return res.status(200).json({ success: true, message: `Estado actualizado a ${normalizedStatus}` });
  } catch (err) {
    console.error('Error en /update-status:', err);
    return res.status(500).json({ error: 'Error al actualizar estado.' });
  }
});

/**
 * 6. POST /api/admin/cancel-booking
 * Cancela una reserva y libera las fechas en el calendario
 */
router.post('/admin/cancel-booking', requireAdminAuth, async (req, res) => {
  try {
    const { booking_reference } = req.body;

    if (supabase) {
      const { data: booking } = await supabase.from('bookings').select('id').eq('booking_reference', booking_reference).single();
      if (booking) {
        await supabase.from('bookings').update({ status: 'CANCELADA' }).eq('id', booking.id);
        await supabase.from('blocked_dates').delete().eq('booking_id', booking.id);
      }
    } else {
      const b = mockStore.bookings.find((x) => x.booking_reference === booking_reference);
      if (b) {
        b.status = 'CANCELADA';
        mockStore.blocked_dates = mockStore.blocked_dates.filter((x) => x.booking_id !== b.id);
      }
    }

    return res.status(200).json({ success: true, message: 'Reserva cancelada y fechas liberadas.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error cancelando reserva' });
  }
});

export default router;
