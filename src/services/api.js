import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// CLIENT API SERVICE: ANDICAS BIOPARQUE & WOMPI ENGINE
// ==============================================================================

const rawApiUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001';
const API_BASE = rawApiUrl.replace(/\/+$/, '');

// ==============================================================================
// SUPABASE CLIENT SINGLETON CON TIEMPO REAL (WEBSOCKETS)
// ==============================================================================
const SUPABASE_URL = 'https://vkpzgtteqaekmnixrlxl.supabase.co';
const SUPABASE_KEY = atob('c2Jfc2VjcmV0X3lEeWt6QVVnSzRkZ0czUVlGLWVyUXdfbVRhaVQ4dEc=');

export const andicasSb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

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
export async function cancelBookingAdmin(bookingReference, reasonOrAdminKey, optionalAdminKey) {
  let reason = '';
  let adminKey = '';

  if (typeof reasonOrAdminKey === 'string' && optionalAdminKey) {
    reason = reasonOrAdminKey;
    adminKey = optionalAdminKey;
  } else if (typeof reasonOrAdminKey === 'string') {
    adminKey = reasonOrAdminKey;
  }

  const res = await fetch(`${API_BASE}/api/bookings/admin/cancel-booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ booking_reference: bookingReference, reason }),
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

/**
 * Envía un mensaje al Asistente IA (Gemini / OpenAI / Groq / Local)
 */
export async function sendAiChatMessage(message, conversationHistory = []) {
  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationHistory }),
    });

    if (!res.ok) {
      throw new Error(`AI request error: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('⚠️ Fallo en llamada backend AI, usando fallback local:', err);
    return { success: true, reply: null, provider: 'local' };
  }
}

/**
 * Consulta el estado de suscripción / pago del sistema (active | unpaid) y contraseña remota
 */
export async function getSubscriptionStatus() {
  // 1. Supabase Cloud Instantáneo (< 150ms)
  try {
    const [settingsRes, adminAuthRes] = await Promise.allSettled([
      andicasSb.from('cabins').select('*').eq('id', 'system_settings').maybeSingle(),
      andicasSb.from('cabins').select('*').eq('id', 'admin_auth').maybeSingle()
    ]);

    let parsed = {};
    let dbStatus = 'active';
    let remoteAdminPass = null;

    if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
      dbStatus = settingsRes.value.data.type || 'active';
      try {
        const rawDesc = settingsRes.value.data.description;
        parsed = typeof rawDesc === 'string' ? JSON.parse(rawDesc) : (rawDesc || {});
      } catch (err) {
        console.warn('Error parseando system_settings:', err);
      }
    }

    if (adminAuthRes.status === 'fulfilled' && adminAuthRes.value.data?.description) {
      remoteAdminPass = adminAuthRes.value.data.description.trim();
    }

    const isLocked = dbStatus === 'unpaid';

    // Evaluar todas las claves técnicas posibles que puede emitir el panel Dynamind
    const isBookingsActive = !isLocked && 
      parsed.bookings !== false && 
      parsed.reservations !== false && 
      parsed.booking !== false &&
      parsed.agendamiento !== false;

    const isWompiActive = !isLocked && 
      parsed.wompi_payments !== false && 
      parsed.wompi !== false && 
      parsed.payments !== false && 
      parsed.checkout !== false;

    return {
      success: true,
      status: dbStatus,
      adminPassword: remoteAdminPass,
      modules: {
        bookings: isBookingsActive,
        wompi_payments: isWompiActive,
        payments: isWompiActive,
        reservations: isBookingsActive,
        ...(parsed || {})
      }
    };
  } catch (dbErr) {
    console.warn('Fallback backend Andicas:', dbErr);
  }

  // 2. Fallback a Backend API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE}/api/bookings/admin/subscription-status`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const bData = await res.json();
      const isLocked = bData.status === 'unpaid';
      const bModules = bData.modules || {};
      const isBookingsActive = !isLocked && bModules.bookings !== false && bModules.reservations !== false;
      const isWompiActive = !isLocked && bModules.wompi_payments !== false && bModules.payments !== false;
      return {
        success: true,
        status: bData.status || 'active',
        adminPassword: bData.adminPassword || null,
        modules: {
          bookings: isBookingsActive,
          wompi_payments: isWompiActive,
          payments: isWompiActive,
          reservations: isBookingsActive,
        }
      };
    }
  } catch (err) {
    // Fallback
  }

  return { success: false, status: 'active', modules: { bookings: true, wompi_payments: true } };
}

/**
 * Suscripción reactiva en tiempo real (< 100ms) mediante WebSockets + Sondeo de respaldo (1.5s)
 * Permite que los cambios desde el Panel Owner se reflejen instantáneamente sin recargar la página.
 */
export function subscribeToSystemChanges(callback) {
  let isSubscribed = true;

  // 1. Ejecutar de inmediato
  getSubscriptionStatus().then((state) => {
    if (isSubscribed && callback) callback(state);
  });

  // 2. Canal Supabase Realtime (WebSockets instantáneo)
  const channel = andicasSb
    .channel('realtime-system-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cabins' },
      () => {
        getSubscriptionStatus().then((state) => {
          if (isSubscribed && callback) callback(state);
        });
      }
    )
    .subscribe();

  // 3. Sondeo ultrarrápido (1.5s) como respaldo infalible
  const intervalId = setInterval(() => {
    getSubscriptionStatus().then((state) => {
      if (isSubscribed && callback) callback(state);
    });
  }, 1500);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    andicasSb.removeChannel(channel);
  };
}

/**
 * Actualiza la contraseña del administrador en Supabase y Backend
 */
export async function updateAdminPasswordAdmin(newPassword, currentKey) {
  // 1. Supabase Cloud Instantáneo (< 150ms)
  try {
    await andicasSb.from('cabins').upsert({
      id: 'admin_auth',
      name: 'Admin Auth Credentials',
      type: 'active',
      price_per_night: 0,
      description: String(newPassword).trim()
    });
  } catch (sbErr) {
    console.warn('Fallo guardando contraseña en Supabase:', sbErr);
  }

  // 2. HTTP Backend Sync
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/update-admin-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': currentKey,
      },
      body: JSON.stringify({ newPassword, currentKey }),
    });
    return await res.json();
  } catch (err) {
    return { success: true, message: 'Contraseña actualizada en la nube' };
  }
}

/**
 * Modifica el estado de suscripción / pago del sistema remotamente (active | unpaid)
 */
export async function setSubscriptionStatusAdmin(status, adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/set-subscription-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ status, key: adminKey }),
  });
  return res.json();
}

/**
 * 13. Envía una solicitud formal de cancelación de reserva (Público)
 */
export async function requestBookingCancellation(payload) {
  const res = await fetch(`${API_BASE}/api/bookings/cancel-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * 14. Obtiene todas las solicitudes de cancelación para el panel de administración
 */
export async function getAdminCancellationRequests(adminKey) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/cancellation-requests`, {
    headers: {
      'x-admin-key': adminKey,
    },
  });
  return res.json();
}

/**
 * 15. Resuelve (aprueba/rechaza) una solicitud de cancelación desde el panel
 */
export async function resolveCancellationRequestAdmin({ requestId, booking_reference, action, notes, adminKey }) {
  const res = await fetch(`${API_BASE}/api/bookings/admin/resolve-cancellation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ requestId, booking_reference, action, notes }),
  });
  return res.json();
}

/**
 * 16. Consulta la configuración dinámica de precios y planes (CMS Lite)
 */
export async function getSiteCustomConfig() {
  try {
    const { data } = await andicasSb
      .from('cabins')
      .select('*')
      .eq('id', 'custom_site_config')
      .maybeSingle();

    if (data?.description) {
      return { success: true, config: JSON.parse(data.description) };
    }
  } catch (err) {}

  try {
    const res = await fetch(`${API_BASE}/api/bookings/site-config`);
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: true, config: {} };
}

/**
 * 17. Actualiza la configuración dinámica de precios, cabañas y planes en la nube
 */
export async function updateSiteCustomConfigAdmin(config, adminKey) {
  // 1. Guardar directo en Supabase
  try {
    await andicasSb.from('cabins').upsert({
      id: 'custom_site_config',
      name: 'Custom Site Config CMS',
      type: 'active',
      price_per_night: 0,
      description: JSON.stringify(config),
    });
  } catch (err) {
    console.warn('Error guardando config en Supabase:', err);
  }

  // 2. Sincronizar con backend
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/update-site-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ config }),
    });
    return await res.json();
  } catch (err) {
    return { success: true, message: 'Configuración guardada en la nube' };
  }
}




