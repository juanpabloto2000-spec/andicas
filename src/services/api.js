// ==============================================================================
// CLIENT API SERVICE: ANDICAS BIOPARQUE & WOMPI ENGINE
// ==============================================================================

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = rawApiUrl.replace(/\/+$/, '');

/**
 * Consulta las fechas ocupadas/bloqueadas de una cabaña
 */
export async function getCabinAvailability(cabinId) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/availability/${cabinId}`);
    const data = await res.json();
    return data.blocked_dates || [];
  } catch (err) {
    console.error('Error obteniendo disponibilidad:', err);
    return [];
  }
}

/**
 * Crea una orden de checkout en el backend con la firma de Wompi
 */
export async function createWompiCheckout(bookingData) {
  const res = await fetch(`${API_BASE}/api/wompi/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'No se pudo generar la orden de pago');
  }
  return data;
}

/**
 * Abre el Checkout Oficial de Wompi (Widget o Redirección)
 */
export function openWompiWidget({
  publicKey,
  currency = 'COP',
  amountInCents,
  reference,
  signature,
  clientEmail,
  clientName,
  clientPhone,
  onComplete,
}) {
  // 1. Cargar el script de Wompi Widget si no existe
  if (!window.WidgetCheckout) {
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      initWidget();
    };
    document.body.appendChild(script);
  } else {
    initWidget();
  }

  function initWidget() {
    try {
      const checkout = new window.WidgetCheckout({
        currency,
        amountInCents,
        reference,
        publicKey,
        signature: {
          integrity: signature,
        },
        customerData: {
          email: clientEmail,
          fullName: clientName,
          phoneNumber: clientPhone ? clientPhone.replace(/\s+/g, '') : '',
          phoneNumberPrefix: '+57',
        },
      });

      checkout.open((result) => {
        const transaction = result?.transaction;
        console.log('Resultado Wompi Widget:', transaction);
        if (onComplete) {
          onComplete(transaction);
        }
      });
    } catch (err) {
      console.error('Error al inicializar Wompi Widget:', err);
      // Fallback a redirección si el widget no abre
      const wompiUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=${currency}&amount-in-cents=${amountInCents}&reference=${reference}&signature:integrity=${signature}&customer-data:email=${encodeURIComponent(clientEmail)}&customer-data:full-name=${encodeURIComponent(clientName)}`;
      window.open(wompiUrl, '_blank');
    }
  }
}

/**
 * Simula pago de Wompi para pruebas locales instantáneas
 */
export async function simulatePayment(reference) {
  const res = await fetch(`${API_BASE}/api/wompi/simulate-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  });
  return res.json();
}

/**
 * Login del Administrador o Recepción / Estándar
 */
export async function adminLogin(password, username = 'admin') {
  const res = await fetch(`${API_BASE}/api/bookings/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, username }),
  });
  return res.json();
}

/**
 * Consulta todas las reservas para el panel de administración
 */
export async function getAdminBookings(adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/bookings`, {
    headers: { 'x-admin-key': adminKey },
  });
  return res.json();
}

/**
 * Bloquea fechas manualmente desde el panel de administración
 */
export async function blockDatesAdmin(cabinId, dates, reason, adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/block-dates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ cabin_id: cabinId, dates, reason }),
  });
  return res.json();
}

/**
 * Actualiza el estado de una reserva desde el panel de administración (AGENDADA, PAGA, CANCELADA)
 */
export async function updateBookingStatusAdmin(bookingReference, newStatus, adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/update-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ booking_reference: bookingReference, new_status: newStatus }),
  });
  return res.json();
}

/**
 * Cancela una reserva desde el panel de administración
 */
export async function cancelBookingAdmin(bookingReference, adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/cancel-booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ booking_reference: bookingReference }),
  });
  return res.json();
}

/**
 * Obtiene el historial de movimientos y auditoría (Exclusivo para Administrador)
 */
export async function getAdminAuditLogs(adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/audit-logs`, {
    headers: { 'x-admin-key': adminKey },
  });
  return res.json();
}

/**
 * Elimina una reserva cancelada permanentemente (Exclusivo Admin)
 */
export async function deleteBookingPermanentlyAdmin(bookingReference, adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/delete-booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ booking_reference: bookingReference }),
  });
  return res.json();
}

/**
 * Purga todos los datos de agendas y movimientos con contraseña de admin (Exclusivo Admin)
 */
export async function purgeAllDataAdmin(password, adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/purge-all-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ password }),
  });
  return res.json();
}
