import express from 'express';
import { supabase, mockStore } from '../config/supabase.js';
import { generateWompiIntegritySignature, verifyWompiWebhookSignature, getWompiPublicKey } from '../services/wompiService.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';

const router = express.Router();

// Precios de referencia de respaldo
const CABIN_PRICES = {
  'casa-del-arbol': { price: 920000, name: 'Nido Ancestral en el Dosel' },
  'palma-magica': { price: 880000, name: 'Santuario de las Palmas' },
  'cueva-del-sol': { price: 750000, name: 'Cueva Ancestral del Sol' },
  'mirador-del-valle': { price: 680000, name: 'Mirador Andino' },
  'glamping-estelar': { price: 620000, name: 'Domo Geodésico Estelar' },
  'cabana-familiar': { price: 980000, name: 'Refugio Familiar Quimbaya' },
  'nido-del-colibri': { price: 540000, name: 'Nido del Colibrí' },
  'torre-del-bosque': { price: 950000, name: 'Torre del Bosque Sagrado' },
  'suite-cascada': { price: 790000, name: 'Suite de la Cascada' },
  'eco-lodge-ancestral': { price: 720000, name: 'Eco-Lodge Ancestral' },
};

/**
 * 1. POST /api/wompi/create-checkout
 * Valida fechas, calcula monto del 50%, guarda la reserva pendiente y genera la firma SHA-256
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const {
      cabin_id,
      client_name,
      client_email,
      client_phone,
      check_in_date,
      check_out_date,
      guests_count = 2,
      notes = '',
      addons_cost = 0,
    } = req.body;

    if (!cabin_id || !client_name || !client_email || !client_phone || !check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para generar el checkout de Wompi.' });
    }

    // Calcular cantidad de noches
    const inDate = new Date(check_in_date);
    const outDate = new Date(check_out_date);
    const diffTime = outDate.getTime() - inDate.getTime();
    const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    if (diffTime <= 0) {
      return res.status(400).json({ error: 'La fecha de check-out debe ser posterior a la de check-in.' });
    }

    // Obtener precio oficial desde la base de datos o catálogo seguro (no confiar en el cliente)
    let pricePerNight = 850000;
    let cabinName = 'Cabaña Andicas';

    if (supabase) {
      const { data: cabinData } = await supabase.from('cabins').select('price_per_night, name').eq('id', cabin_id).single();
      if (cabinData) {
        pricePerNight = cabinData.price_per_night;
        cabinName = cabinData.name;
      } else if (CABIN_PRICES[cabin_id]) {
        pricePerNight = CABIN_PRICES[cabin_id].price;
        cabinName = CABIN_PRICES[cabin_id].name;
      }
    } else if (CABIN_PRICES[cabin_id]) {
      pricePerNight = CABIN_PRICES[cabin_id].price;
      cabinName = CABIN_PRICES[cabin_id].name;
    }

    // CÁLCULO SEGURO: Total (Noches + Adicionales) y Anticipo del 50%
    const totalAmountCop = (pricePerNight * nights) + Number(addons_cost || 0);
    const depositAmountCop = Math.round(totalAmountCop / 2);
    const remainingBalanceCop = totalAmountCop - depositAmountCop;
    const amountInCents = depositAmountCop * 100;

    // Generar Referencia Única de Reserva
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `AND-CAB-${Date.now().toString().slice(-4)}${randomSuffix}`;

    // Generar Firma de Integridad SHA-256 de Wompi
    const signature = generateWompiIntegritySignature(bookingReference, amountInCents, 'COP');
    const publicKey = getWompiPublicKey();

    const bookingPayload = {
      booking_reference: bookingReference,
      cabin_id,
      cabin_name: cabinName,
      client_name,
      client_email,
      client_phone,
      check_in_date,
      check_out_date,
      nights_count: nights,
      guests_count,
      total_amount_cop: totalAmountCop,
      deposit_amount_cop: depositAmountCop,
      remaining_balance_cop: remainingBalanceCop,
      status: 'PENDING_PAYMENT',
      notes,
      created_at: new Date().toISOString(),
    };

    // Guardar en Supabase o MockStore
    if (supabase) {
      const { error: insertError } = await supabase.from('bookings').insert([bookingPayload]);
      if (insertError) {
        console.error('Error insertando en Supabase:', insertError);
      }
    } else {
      mockStore.bookings.push({ id: `booking-${Date.now()}`, ...bookingPayload });
    }

    console.log(`📝 [Checkout Wompi Creado] Ref: ${bookingReference} | Cabaña: ${cabinName} | 50% Anticipo: $${depositAmountCop.toLocaleString('es-CO')} COP`);

    return res.status(200).json({
      success: true,
      booking_reference: bookingReference,
      public_key: publicKey,
      currency: 'COP',
      amount_in_cents: amountInCents,
      deposit_amount_cop: depositAmountCop,
      total_amount_cop: totalAmountCop,
      remaining_balance_cop: remainingBalanceCop,
      signature,
      cabin_name: cabinName,
      nights_count: nights,
    });
  } catch (err) {
    console.error('Error en /create-checkout:', err);
    return res.status(500).json({ error: 'Error interno al generar el checkout de reserva.' });
  }
});

/**
 * 2. POST /api/wompi/webhook
 * Endpoint que recibe la notificación oficial de Wompi cuando el pago es Aprobado
 */
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('🔔 [Wompi Webhook Recibido]:', JSON.stringify(event?.event || 'Evento Wompi'));

    // 1. Validar firma criptográfica del Webhook (en producción)
    const isSignatureValid = verifyWompiWebhookSignature(event);
    if (process.env.NODE_ENV === 'production' && !isSignatureValid) {
      console.warn('⚠️ [Wompi Webhook] Firma de evento no válida.');
      return res.status(401).json({ error: 'Firma de webhook inválida' });
    }

    const transaction = event?.data?.transaction;
    if (!transaction) {
      return res.status(200).json({ received: true, note: 'Evento sin transacción' });
    }

    const reference = transaction.reference;
    const status = transaction.status; // 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'
    const amountInCents = transaction.amount_in_cents;
    const paymentMethodType = transaction.payment_method_type || 'ONLINE';

    // 2. Buscar la reserva correspondiente
    let booking = null;
    if (supabase) {
      const { data } = await supabase.from('bookings').select('*').eq('booking_reference', reference).single();
      booking = data;
    } else {
      booking = mockStore.bookings.find((b) => b.booking_reference === reference);
    }

    if (!booking) {
      console.warn(`⚠️ [Wompi Webhook] No se encontró reserva para la referencia: ${reference}`);
      return res.status(200).json({ received: true, error: 'Reserva no encontrada' });
    }

    // 3. Si el pago fue APROBADO: Validar que el monto coincida exactamente con el 50% de la reserva
    if (status === 'APPROVED') {
      const expectedAmountInCents = Number(booking.deposit_amount_cop) * 100;

      if (amountInCents < expectedAmountInCents) {
        console.error(`❌ [Wompi Webhook] Alerta de seguridad: Monto pagado (${amountInCents}) menor al 50% requerido (${expectedAmountInCents})`);
        return res.status(400).json({ error: 'Monto pagado insuficiente' });
      }

      // Actualizar estado de la reserva a CONFIRMED
      const updateData = {
        status: 'CONFIRMED',
        wompi_transaction_id: transaction.id,
        wompi_payment_method: paymentMethodType,
        payment_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from('bookings').update(updateData).eq('booking_reference', reference);

        // Bloquear fechas en el calendario
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

        // Registrar log de auditoría
        await supabase.from('wompi_payment_logs').insert([{
          booking_reference: reference,
          wompi_transaction_id: transaction.id,
          amount_in_cents: amountInCents,
          status,
          raw_payload: event,
        }]);
      } else {
        Object.assign(booking, updateData);

        // Bloquear en mockStore
        const inDate = new Date(booking.check_in_date);
        const outDate = new Date(booking.check_out_date);
        for (let d = new Date(inDate); d < outDate; d.setDate(d.getDate() + 1)) {
          mockStore.blocked_dates.push({
            id: `b-${Date.now()}-${Math.random()}`,
            cabin_id: booking.cabin_id,
            blocked_date: d.toISOString().split('T')[0],
            reason: 'RESERVATION',
          });
        }
      }

      console.log(`🎉 [PAGO APROBADO & CONFIRMADO] Ref: ${reference} | 50% Verificado: $${booking.deposit_amount_cop.toLocaleString('es-CO')} COP`);

      // 4. Enviar correo de confirmación con Voucher al cliente
      await sendBookingConfirmationEmail(booking);
    }

    return res.status(200).json({ received: true, status });
  } catch (err) {
    console.error('Error en /wompi/webhook:', err);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }
});

/**
 * 3. GET /api/wompi/status/:reference
 * Consulta el estado actual de una reserva para el frontend
 */
router.get('/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    let booking = null;

    if (supabase) {
      const { data } = await supabase.from('bookings').select('*').eq('booking_reference', reference).single();
      booking = data;
    } else {
      booking = mockStore.bookings.find((b) => b.booking_reference === reference);
    }

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando estado' });
  }
});

/**
 * 4. POST /api/wompi/simulate-payment (Solo para pruebas locales)
 * Permite simular la aprobación de Wompi en desarrollo con un solo clic
 */
router.post('/simulate-payment', async (req, res) => {
  try {
    const { reference } = req.body;
    let booking = null;

    if (supabase) {
      const { data } = await supabase.from('bookings').select('*').eq('booking_reference', reference).single();
      booking = data;
    } else {
      booking = mockStore.bookings.find((b) => b.booking_reference === reference);
    }

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada para simulación' });
    }

    // Simular evento Wompi
    const mockWompiEvent = {
      event: 'transaction.updated',
      data: {
        transaction: {
          id: `WOMPI-SIM-${Date.now()}`,
          reference: booking.booking_reference,
          amount_in_cents: Number(booking.deposit_amount_cop) * 100,
          currency: 'COP',
          status: 'APPROVED',
          payment_method_type: 'NEQUI',
        }
      }
    };

    // Ejecutar lógica interna de confirmación
    const updateData = {
      status: 'CONFIRMED',
      wompi_transaction_id: mockWompiEvent.data.transaction.id,
      wompi_payment_method: 'NEQUI',
      payment_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Calcular las fechas a bloquear en el calendario
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

    if (supabase) {
      // 1. Actualizar reserva a CONFIRMED
      await supabase.from('bookings').update(updateData).eq('booking_reference', reference);

      // 2. Bloquear fechas en Supabase
      if (datesToBlock.length > 0) {
        await supabase.from('blocked_dates').upsert(datesToBlock, { onConflict: 'cabin_id, blocked_date' });
      }

      // 3. Registrar log de pago
      await supabase.from('wompi_payment_logs').insert([{
        booking_reference: reference,
        wompi_transaction_id: mockWompiEvent.data.transaction.id,
        amount_in_cents: Number(booking.deposit_amount_cop) * 100,
        status: 'APPROVED',
        raw_payload: mockWompiEvent,
      }]);
    } else {
      // Bloquear en mockStore
      datesToBlock.forEach((dt) => {
        if (!mockStore.blocked_dates.some((b) => b.cabin_id === dt.cabin_id && b.blocked_date === dt.blocked_date)) {
          mockStore.blocked_dates.push({ id: `b-${Date.now()}-${Math.random()}`, ...dt });
        }
      });
    }

    Object.assign(booking, updateData);

    console.log(`🎉 [SIMULACIÓN APROBADA] Ref: ${reference} | Fechas bloqueadas: ${datesToBlock.map(d=>d.blocked_date).join(', ')}`);

    // 4. Enviar correo transaccional
    const emailResult = await sendBookingConfirmationEmail(booking);

    return res.status(200).json({
      success: true,
      message: 'Simulación de pago del 50% aprobada, fechas agendadas y correo enviado.',
      booking,
      emailResult,
    });
  } catch (err) {
    console.error('Error en /simulate-payment:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
