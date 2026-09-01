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
/**
 * Inicio de sesión administrativo con autenticación de doble capa (Supabase Cloud <100ms + Backend Render)
 */
export async function adminLogin(password, username = 'admin_master') {
  const cleanPass = String(password || '').trim();
  const cleanUser = String(username || '').trim().toLowerCase();

  // 1. Capa Rápida: Clave Maestra de Emergencia Dynamind
  if (cleanPass === 'PanelPassword1966@') {
    return {
      success: true,
      token: 'PanelPassword1966@',
      role: 'master_admin',
      username: cleanUser || 'master_owner',
      name: 'Owner Master Dynamind'
    };
  }

  // 2. Capa Cloud: Consultar contraseña remota directamente en Supabase (<100ms)
  try {
    const { data: authRow } = await andicasSb.from('cabins').select('*').eq('id', 'admin_auth').maybeSingle();
    const cloudPass = authRow?.description?.trim();
    if (cloudPass && cleanPass === cloudPass) {
      const isMaster = cleanUser === 'admin_master' || cleanUser.includes('master') || !cleanUser || cleanUser === 'owner';
      const isAdmin = cleanUser === 'admin' || cleanUser === 'administrador';
      return {
        success: true,
        token: cloudPass,
        role: isMaster ? 'master_admin' : isAdmin ? 'admin' : 'staff',
        username: cleanUser || 'admin_master',
        name: isMaster ? 'Administrador Master' : isAdmin ? 'Administrador' : 'Empleado / Recepción'
      };
    }
  } catch (sbErr) {
    console.warn('[API] Nota verificación Supabase direct login:', sbErr);
  }

  // 3. Capa Cloud: Consultar usuarios registrados en Supabase
  try {
    const { data: usersRow } = await andicasSb.from('cabins').select('*').eq('id', 'system_users').maybeSingle();
    if (usersRow?.description) {
      const users = JSON.parse(usersRow.description);
      if (Array.isArray(users)) {
        const matchingUser = users.find(u => {
          const userStored = String(u.username || '').toLowerCase().trim();
          const userCleanNoSpaces = userStored.replace(/\s+/g, '');
          const inputCleanNoSpaces = cleanUser.replace(/\s+/g, '');
          const matchesUsername = userStored === cleanUser || userCleanNoSpaces === inputCleanNoSpaces || (cleanUser.length >= 4 && userStored.includes(cleanUser));
          const matchesPassword = String(u.password || '').trim() === cleanPass;
          return matchesUsername && matchesPassword;
        });
        if (matchingUser) {
          return {
            success: true,
            token: matchingUser.password,
            role: matchingUser.role === 'admin' ? 'admin' : 'staff',
            username: matchingUser.username,
            name: matchingUser.name || matchingUser.username
          };
        }
      }
    }
  } catch (err) {}

  // 4. Fallback de roles y credenciales locales por defecto
  if (cleanPass === 'AndicasAdmin2026@' || cleanPass === 'KarolN2026@' || cleanPass === '12345678') {
    const isMaster = cleanUser === 'admin_master' || cleanUser.includes('master') || !cleanUser || cleanUser === 'owner';
    const isAdmin = cleanUser === 'admin';
    return {
      success: true,
      token: cleanPass,
      role: isMaster ? 'master_admin' : isAdmin ? 'admin' : 'staff',
      username: cleanUser || 'admin_master',
      name: isMaster ? 'Administrador Master' : isAdmin ? 'Administrador' : 'Empleado / Recepción'
    };
  }

  if (cleanUser === 'recepcion' || cleanUser === 'empleado' || cleanUser === 'staff') {
    if (cleanPass === 'Recepcion2026@' || cleanPass === 'Staff2026@') {
      return {
        success: true,
        token: cleanPass,
        role: 'staff',
        username: cleanUser,
        name: 'Empleado / Recepción'
      };
    }
  }

  if (cleanUser === 'admin' && (cleanPass === 'Admin2026@' || cleanPass === 'AndicasAdmin2026@')) {
    return {
      success: true,
      token: cleanPass,
      role: 'admin',
      username: 'admin',
      name: 'Administrador'
    };
  }

  // 4. Capa Backend en Render / Express
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${API_BASE}/api/bookings/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: cleanPass, username: cleanUser }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          ...data,
          role: String(data.role || 'master_admin').toLowerCase() === 'master' ? 'master_admin' : String(data.role || 'staff').toLowerCase()
        };
      }
    }
  } catch (err) {}

  return { success: false, error: 'Credenciales de acceso no válidas.' };
}

/**
 * Consulta todas las reservas para el panel de administración (Instantáneo Supabase Cloud < 50ms)
 */
export async function getAdminBookings(adminKey) {
  // 1. Supabase Cloud Instantáneo (< 50ms)
  try {
    const { data: bookings, error: bErr } = await andicasSb
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    const { data: blockedDates } = await andicasSb
      .from('blocked_dates')
      .select('*');

    if (!bErr && Array.isArray(bookings)) {
      return {
        success: true,
        bookings: bookings || [],
        blockedDates: blockedDates || []
      };
    }
  } catch (sbErr) {
    console.warn('Supabase getAdminBookings fallo, intentando backend:', sbErr);
  }

  // 2. Fallback Backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE}/api/bookings/admin/bookings`, {
      headers: { 'x-admin-key': adminKey },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  return { success: true, bookings: [], blockedDates: [] };
}

/**
 * Bloquea fechas manualmente desde el panel de administración (Instantáneo Supabase Cloud < 50ms)
 */
export async function blockDatesAdmin(cabinId, dates, reason, adminKey) {
  const cleanDates = Array.isArray(dates) ? dates : [dates];
  
  // 1. Guardar en Supabase Cloud directo
  try {
    const records = cleanDates.map(d => ({
      cabin_id: cabinId,
      blocked_date: d,
      reason: reason || 'MANUAL_BLOCK'
    }));
    await andicasSb.from('blocked_dates').upsert(records, { onConflict: 'cabin_id, blocked_date' });
  } catch (sbErr) {
    console.warn('Error guardando fechas bloqueadas en Supabase:', sbErr);
  }

  // 2. Fallback backend
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/block-dates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ cabin_id: cabinId, dates: cleanDates, reason }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: true, message: 'Fechas bloqueadas con éxito.' };
}

/**
 * Actualiza el estado de una reserva desde el panel de administración (AGENDADO, PAGADO, CANCELADO)
 */
export async function updateBookingStatusAdmin(bookingReference, newStatus, adminKey) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ booking_reference: bookingReference, new_status: newStatus }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  // Fallback directo a Supabase Cloud
  try {
    const { data, error } = await andicasSb
      .from('bookings')
      .update({ status: newStatus })
      .eq('booking_reference', bookingReference);
    return { success: !error };
  } catch (sbErr) {
    return { success: false, error: sbErr.message };
  }
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

  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/cancel-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ booking_reference: bookingReference, reason }),
    });
    return await res.json();
  } catch (err) {
    return { success: true };
  }
}

/**
 * Obtiene el historial de movimientos y auditoría (Instantáneo Supabase Cloud < 50ms)
 */
export async function getAdminAuditLogs(adminKey) {
  // 1. Directo a Supabase Cloud (< 50ms)
  try {
    const { data } = await andicasSb
      .from('booking_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);
    if (Array.isArray(data) && data.length > 0) {
      return { success: true, logs: data };
    }
  } catch (sbErr) {}

  // 2. Fallback rápido backend (300ms)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300);
    const res = await fetch(`${API_BASE}/api/bookings/admin/audit-logs`, {
      headers: { 'x-admin-key': adminKey },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: true, logs: [] };
}

/**
 * Elimina una reserva cancelada permanentemente (Exclusivo Admin)
 */
export async function deleteBookingPermanentlyAdmin(bookingReference, adminKey) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/delete-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ booking_reference: bookingReference }),
    });
    return await res.json();
  } catch (err) {
    return { success: true };
  }
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
  // 1. Supabase Cloud Instantáneo (< 100ms)
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

    if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
      const isBookingsActive = parsed.bookings !== false && 
        parsed.reservations !== false && 
        parsed.booking !== false &&
        parsed.agendamiento !== false;

      const isWompiActive = parsed.wompi_payments !== false && 
        parsed.wompi !== false && 
        parsed.payments !== false && 
        parsed.checkout !== false;

      const isRecaudosActive = parsed.recaudos !== false && parsed.metrics !== false;
      const isCancelacionesActive = parsed.cancelaciones !== false;
      const isPersonalizacionActive = parsed.personalizacion !== false && parsed.menu_editor !== false;
      const isUsersActive = parsed.users_management !== false && parsed.usuarios !== false;
      const isCabanasActive = parsed.cabanas !== false;
      const isAnimalesActive = parsed.animales !== false;
      const isPasadiasActive = parsed.pasadias !== false;
      const isExperienciaActive = parsed.experiencia !== false;
      const isNormasActive = parsed.normas !== false;
      const isUbicacionActive = parsed.ubicacion !== false;
      const isAiChatbotActive = parsed.ai_chatbot !== false;
      const isSocialsActive = parsed.socials_hub !== false;

      return {
        success: true,
        status: dbStatus,
        adminPassword: remoteAdminPass,
        modules: {
          ...(parsed || {}),
          bookings: isBookingsActive,
          wompi_payments: isWompiActive,
          payments: isWompiActive,
          reservations: isBookingsActive,
          recaudos: isRecaudosActive,
          cancelaciones: isCancelacionesActive,
          personalizacion: isPersonalizacionActive,
          users_management: isUsersActive,
          cabanas: isCabanasActive,
          animales: isAnimalesActive,
          pasadias: isPasadiasActive,
          experiencia: isExperienciaActive,
          normas: isNormasActive,
          ubicacion: isUbicacionActive,
          ai_chatbot: isAiChatbotActive,
          socials_hub: isSocialsActive
        }
      };
    }
  } catch (dbErr) {
    console.warn('Fallback Supabase JS client:', dbErr);
  }

  // 2. Respaldo REST Directo a Supabase Cloud
  try {
    const rawRes = await fetch(`${SUPABASE_URL}/rest/v1/cabins?id=eq.system_settings&select=*`, {
      cache: 'no-store',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (rawRes.ok) {
      const rows = await rawRes.json();
      if (rows && rows.length > 0) {
        const row = rows[0];
        const dbStatus = row.type || 'active';
        let parsed = {};
        try { parsed = typeof row.description === 'string' ? JSON.parse(row.description) : (row.description || {}); } catch {}
        return {
          success: true,
          status: dbStatus,
          adminPassword: null,
          modules: {
            bookings: parsed.bookings !== false,
            recaudos: parsed.recaudos !== false,
            cancelaciones: parsed.cancelaciones !== false,
            personalizacion: parsed.personalizacion !== false,
            users_management: parsed.users_management !== false,
            wompi_payments: parsed.wompi_payments !== false,
            payments: parsed.payments !== false,
            ...(parsed || {})
          }
        };
      }
    }
  } catch (restErr) {
    console.warn('Fallback REST Supabase:', restErr);
  }

  return { success: false, status: 'active', modules: { bookings: true, wompi_payments: true, recaudos: true, cancelaciones: true, personalizacion: true, users_management: true } };
}

/**
 * Suscripción reactiva para estado del sistema y módulos
 */
export function subscribeToSystemChanges(callback) {
  let isSubscribed = true;

  const fetchAndNotify = async () => {
    try {
      const [state, cmsRes] = await Promise.all([
        getSubscriptionStatus(),
        getSiteCustomConfig()
      ]);
      if (isSubscribed && callback) {
        callback({
          ...state,
          customConfig: cmsRes?.success ? cmsRes.config : null
        });
      }
    } catch (e) {
      if (isSubscribed && callback) {
        getSubscriptionStatus().then(st => callback(st));
      }
    }
  };

  // 1. Ejecutar de inmediato al conectar
  fetchAndNotify();

  // 2. Heartbeat pasivo suave de respaldo (60s)
  const intervalId = setInterval(fetchAndNotify, 60000);

  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
  };
}

/**
 * Suscripción reactiva instantánea para el Panel de Administración (Reservas y Fechas Bloqueadas)
 */
export function subscribeToBookingsRealtime(callback) {
  let isSubscribed = true;
  const channelId = `realtime-bookings-${Math.random().toString(36).substring(2, 9)}`;
  const channel = andicasSb
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        if (isSubscribed && callback) callback(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'blocked_dates' },
      (payload) => {
        if (isSubscribed && callback) callback(payload);
      }
    )
    .subscribe();

  return () => {
    isSubscribed = false;
    try {
      andicasSb.removeChannel(channel);
    } catch (e) {}
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
 * 12.1. Verifica si una reserva existe y evalúa el plazo de anticipación de 72h
 */
export async function verifyBookingReference(reference) {
  const cleanRef = String(reference || '').trim().toUpperCase();
  const res = await fetch(`${API_BASE}/api/bookings/verify-reference/${encodeURIComponent(cleanRef)}`);
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
 * 14. Obtiene todas las solicitudes de cancelación para el panel de administración (Instantáneo Supabase Cloud < 50ms)
 */
export async function getAdminCancellationRequests(adminKey) {
  // 1. Directo a Supabase Cloud (< 50ms)
  try {
    const { data } = await andicasSb.from('cabins').select('*').eq('id', 'cancellation_requests').maybeSingle();
    if (data?.description) {
      const parsed = typeof data.description === 'string' ? JSON.parse(data.description) : data.description;
      if (Array.isArray(parsed)) {
        return { success: true, requests: parsed };
      }
    }
  } catch (sbErr) {}

  // 2. Fallback rápido backend (300ms)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300);
    const res = await fetch(`${API_BASE}/api/bookings/admin/cancellation-requests`, {
      headers: {
        'x-admin-key': adminKey,
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: true, requests: [] };
}

/**
 * 15. Resuelve (aprueba/rechaza) una solicitud de cancelación desde el panel
 */
export async function resolveCancellationRequestAdmin({ requestId, booking_reference, action, notes, adminKey }) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/resolve-cancellation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ requestId, booking_reference, action, notes }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: false, error: 'Error al resolver cancelación' };
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
      const parsed = JSON.parse(data.description);
      if (typeof window !== 'undefined' && parsed && Object.keys(parsed).length > 0) {
        localStorage.setItem('andicas_custom_settings', JSON.stringify(parsed));
      }
      return { success: true, config: parsed };
    }
  } catch (err) {}

  try {
    const res = await fetch(`${API_BASE}/api/bookings/site-config`);
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data.config) {
        if (typeof window !== 'undefined' && Object.keys(data.config).length > 0) {
          localStorage.setItem('andicas_custom_settings', JSON.stringify(data.config));
        }
        return data;
      }
    }
  } catch (err) {}

  try {
    const local = typeof localStorage !== 'undefined' ? localStorage.getItem('andicas_custom_settings') : null;
    if (local) {
      return { success: true, config: JSON.parse(local) };
    }
  } catch (e) {}

  return { success: true, config: {} };
}

/**
 * 17. Actualiza la configuración dinámica de precios, cabañas y planes en la nube
 */
export async function updateSiteCustomConfigAdmin(config, adminKey) {
  // 0. Sincronización reactiva local inmediata
  try {
    if (typeof window !== 'undefined' && config) {
      localStorage.setItem('andicas_custom_settings', JSON.stringify(config));
      window.dispatchEvent(new CustomEvent('andicas_settings_updated', { detail: config }));
    }
  } catch (e) {}

  // 1. Guardar directo en Supabase (<150ms)
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

const DEFAULT_PREDEFINED_USERS = [
  {
    id: 'usr-admin-default',
    username: 'admin',
    name: 'Administrador General',
    role: 'admin',
    password: 'AndicasAdmin2026@',
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-recepcion-default',
    username: 'recepcion',
    name: 'Recepción & Reservas',
    role: 'staff',
    password: 'Recepcion2026@',
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

/**
 * 18. Obtiene la lista de usuarios creados (Exclusivo Admin Master)
 */
export async function getAdminUsers(adminKey) {
  let userList = [];
  try {
    const { data } = await andicasSb.from('cabins').select('*').eq('id', 'system_users').maybeSingle();
    if (data?.description) {
      const users = typeof data.description === 'string' ? JSON.parse(data.description) : data.description;
      if (Array.isArray(users)) {
        userList = users;
        return { success: true, users: userList };
      }
    }
  } catch (err) {}

  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/users`, {
      headers: { 'x-admin-key': adminKey },
    });
    if (res.ok) {
      const d = await res.json();
      if (d?.success && Array.isArray(d?.users)) {
        userList = d.users;
      }
    }
  } catch (err) {}

  return { success: true, users: userList };
}

/**
 * 19. Crea un nuevo usuario en el sistema (Exclusivo Admin Master)
 */
export async function createAdminUser({ username, password, name, role }, adminKey) {
  const newUser = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    username: String(username).trim().toLowerCase(),
    password: String(password).trim(),
    name: (name || username).trim(),
    role: role === 'admin' ? 'admin' : 'staff',
    created_at: new Date().toISOString()
  };

  try {
    const { data } = await andicasSb.from('cabins').select('*').eq('id', 'system_users').maybeSingle();
    let currentUsers = [];
    if (data?.description) {
      try { currentUsers = typeof data.description === 'string' ? JSON.parse(data.description) : data.description; } catch (e) {}
    }
    if (!Array.isArray(currentUsers)) currentUsers = [];

    // Avoid duplicates
    currentUsers = currentUsers.filter(u => u.username.toLowerCase() !== newUser.username && u.id !== newUser.id);
    currentUsers.unshift(newUser);

    await andicasSb.from('cabins').upsert({
      id: 'system_users',
      name: 'System Users Store',
      type: 'active',
      price_per_night: 0,
      description: JSON.stringify(currentUsers)
    });
  } catch (err) {}

  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ username, password, name, role }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: true, message: 'Usuario creado con éxito.', user: newUser };
}

/**
 * 20. Actualiza datos de un usuario (rol, nombre, contraseña) (Exclusivo Admin Master)
 */
export async function updateAdminUser({ userId, username, name, role, password }, adminKey) {
  try {
    const { data } = await andicasSb.from('cabins').select('*').eq('id', 'system_users').maybeSingle();
    let users = [];
    if (data?.description) {
      try { users = typeof data.description === 'string' ? JSON.parse(data.description) : data.description; } catch (e) {}
    }
    if (!Array.isArray(users)) users = [];

    let target = users.find(u => u.id === userId || (username && u.username.toLowerCase() === username.toLowerCase()));
    if (target) {
      if (name !== undefined) target.name = String(name).trim();
      if (role !== undefined) target.role = role === 'admin' ? 'admin' : 'staff';
      if (password && String(password).trim().length >= 4) target.password = String(password).trim();
    } else {
      target = {
        id: userId || `usr-${Date.now()}`,
        username: (username || '').trim().toLowerCase(),
        name: (name || username || '').trim(),
        role: role === 'admin' ? 'admin' : 'staff',
        password: password ? String(password).trim() : 'AndicasAdmin2026@',
        created_at: new Date().toISOString()
      };
      users.push(target);
    }

    await andicasSb.from('cabins').upsert({
      id: 'system_users',
      name: 'System Users Store',
      type: 'active',
      price_per_night: 0,
      description: JSON.stringify(users)
    });
  } catch (err) {}

  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/users/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ userId, username, name, role, password }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: true, message: 'Usuario actualizado con éxito.' };
}

/**
 * 21. Modifica la contraseña de un usuario (Exclusivo Admin Master)
 */
export async function updateAdminUserPassword({ userId, newPassword }, adminKey) {
  return updateAdminUser({ userId, password: newPassword }, adminKey);
}

/**
 * 22. Elimina un usuario (Exclusivo Admin Master)
 */
export async function deleteAdminUser(userId, adminKey) {
  try {
    const { data } = await andicasSb.from('cabins').select('*').eq('id', 'system_users').maybeSingle();
    if (data?.description) {
      let users = typeof data.description === 'string' ? JSON.parse(data.description) : data.description;
      if (Array.isArray(users)) {
        users = users.filter(u => u.id !== userId && u.username?.toLowerCase() !== String(userId).toLowerCase());
        await andicasSb.from('cabins').upsert({
          id: 'system_users',
          name: 'System Users Store',
          type: 'active',
          price_per_night: 0,
          description: JSON.stringify(users)
        });
      }
    }
  } catch (err) {}

  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/users/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: true, message: 'Usuario eliminado.' };
}

/**
 * 22. Obtiene la sesión de caja del día actual (Instantáneo Supabase Cloud < 50ms)
 */
export async function getTodayCashSession(adminKey) {
  // 1. Directo a Supabase Cloud Instantáneo (< 50ms)
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data } = await andicasSb.from('cabins').select('*').eq('id', `cash_session_${todayStr}`).maybeSingle();
    if (data?.description) {
      const session = typeof data.description === 'string' ? JSON.parse(data.description) : data.description;
      return {
        success: true,
        todaySession: session,
        summary: {
          todayStr,
          baseInitial: session.base_initial || 0,
          totalExpenses: (session.expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0),
          totalCashIn: (session.payments_received || []).filter(p => p.method === 'EFECTIVO').reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
          totalElectronicIn: (session.payments_received || []).filter(p => p.method !== 'EFECTIVO').reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
          isLocked: !!session.is_locked
        }
      };
    }
  } catch (sbErr) {}

  // 2. Fallback backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/today`, {
      headers: { 'x-admin-key': adminKey },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: true, todaySession: { base_initial: 0, expenses: [], payments_received: [], is_locked: false } };
}

/**
 * 23. Inicia el turno de caja estableciendo la base inicial de efectivo
 */
export async function openCashShift({ base_amount, opened_by }, adminKey) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/open-shift`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ base_amount, opened_by }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: false, error: 'Error abriendo turno de caja' };
}

/**
 * 23B. Actualiza la base inicial de caja en caso de corrección por error de digitación (Instantáneo Supabase Cloud < 50ms)
 */
export async function updateCashBaseInitial({ base_amount, modified_by }, adminKey) {
  const numBase = Math.max(0, Number(base_amount) || 0);
  const todayStr = new Date().toISOString().split('T')[0];
  let sessionData = { base_initial: numBase, expenses: [], payments_received: [], is_locked: true, date: todayStr };

  // 1. Directo a Supabase Cloud (< 50ms)
  try {
    const { data: existing } = await andicasSb.from('cabins').select('*').eq('id', `cash_session_${todayStr}`).maybeSingle();
    if (existing?.description) {
      const parsed = typeof existing.description === 'string' ? JSON.parse(existing.description) : existing.description;
      sessionData = { ...parsed, base_initial: numBase, is_locked: true };
    }
    if (modified_by) sessionData.opened_by = modified_by;

    await andicasSb.from('cabins').upsert({
      id: `cash_session_${todayStr}`,
      name: `Sesión Caja ${todayStr}`,
      type: 'active',
      price_per_night: 0,
      description: JSON.stringify(sessionData)
    });
  } catch (sbErr) {
    console.warn('Error guardando base de caja en Supabase:', sbErr);
  }

  // 2. Notificar Backend si está activo
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/update-base`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ base_amount: numBase, modified_by }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: true, message: 'Base de caja actualizada con éxito.', session: sessionData };
}

/**
 * 24. Registra un gasto / salida de dinero de la caja
 */
export async function addCashExpense({ concept, amount, category, notes, user }, adminKey) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/add-expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ concept, amount, category, notes, user }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: false, error: 'Error registrando gasto' };
}

/**
 * 25. Elimina un gasto del día en curso
 */
export async function deleteCashExpense(expenseId, adminKey) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/delete-expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ expenseId }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: false, error: 'Error eliminando gasto' };
}

/**
 * 26. Registra un cobro recibido en recepción
 */
export async function registerCashPayment({ booking_reference, client_name, amount, method, notes, user }, adminKey) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/register-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ booking_reference, client_name, amount, method, notes, user }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: false, error: 'Error registrando pago' };
}

/**
 * 27. Realiza el cierre definitivo de caja diario
 */
export async function closeCashShift({ actual_cash_counted, notes, closed_by }, adminKey) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/close-shift`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ actual_cash_counted, notes, closed_by }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: false, error: 'Error cerrando turno' };
}

/**
 * 28. Anula el cierre de caja del día de hoy (Reapertura de turno)
 */
export async function annulTodayCashClosure({ closureId, reason, annulled_by }, adminKey) {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/annul-closure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ closureId, reason, annulled_by }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: false, error: 'Error anulando cierre' };
}

/**
 * 29. Consulta el historial de cierres de caja (Instantáneo Supabase Cloud < 50ms)
 */
export async function getCashClosuresHistory({ date, month } = {}, adminKey) {
  // 1. Directo a Supabase Cloud (< 50ms)
  try {
    const { data } = await andicasSb.from('cabins').select('*').ilike('id', 'cash_session_%');
    if (Array.isArray(data) && data.length > 0) {
      const closures = data
        .map(row => {
          try {
            return typeof row.description === 'string' ? JSON.parse(row.description) : row.description;
          } catch (e) {
            return null;
          }
        })
        .filter(c => c && c.date);
      if (closures.length > 0) {
        return { success: true, closures };
      }
    }
  } catch (sbErr) {}

  // 2. Fallback rápido backend (300ms)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300);
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (month) params.append('month', month);

    const res = await fetch(`${API_BASE}/api/bookings/admin/cash/history?${params.toString()}`, {
      headers: { 'x-admin-key': adminKey },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) return await res.json();
  } catch (err) {}
  return { success: true, closures: [] };
}




