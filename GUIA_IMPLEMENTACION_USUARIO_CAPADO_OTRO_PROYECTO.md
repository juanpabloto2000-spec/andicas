# 🔒 Guía Maestra: Implementación de Usuario Oculto Capado y Bloqueo por Falta de Pago (Para Cualquier Proyecto)

> **Instrucción de uso:** Copia y pega todo el contenido de este documento en el chat de tu IA (o pásaselo a tu desarrollador) en tu otro proyecto. Esta guía contiene toda la lógica técnica de frontend, backend y diseño sin que tengas que volver a explicar nada.

---

## 🎯 Objetivo de la Característica
Implementar un sistema de **Usuario Oculto Capado / Bloqueo por Falta de Pago** que permita:
1. **Tener un usuario oculto en el login:** No debe aparecer ningún botón ni selector para este usuario en la pantalla de inicio de sesión.
2. **Bloqueo total del panel administrativo (Dashboard):** Si este usuario inicia sesión o si el estado se apaga remotamente, la pantalla se bloquea por completo mostrando **"No se registró pago."** con cero permisos (sin métricas, sin tablas, sin acciones), teniendo únicamente el botón para **"Cerrar Sesión"**.
3. **Bloqueo de la web pública (Landing Page):** Cuando el estado esté en falta de pago, la página pública se bloquea con un **candado gigante** y el mensaje **"Falta de Pago"**.
4. **Control Remoto desde API:** Endpoints en el backend para poder activar (`active`) o desactivar (`unpaid`) la web desde otro dashboard externo en Vercel.

---

## 📁 1. Variables de Entorno (`.env`)

Agrega estas variables al archivo `.env` del proyecto:
```env
# Claves de acceso del panel
ADMIN_SECRET_KEY=TuClaveAdmin123!
STAFF_SECRET_KEY=TuClaveStaff123!
UNPAID_SECRET_KEY=NoPagoProyecto2026!
```

---

## 💻 2. Backend (Node.js / Express / Next.js API Routes)

Coloca esta lógica en tus rutas de autenticación y panel administrativo:

```javascript
// ==============================================================================
// 1. CONFIGURACIÓN Y VARIABLES
// ==============================================================================
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'TuClaveAdmin123!';
const STAFF_SECRET = process.env.STAFF_SECRET_KEY || 'TuClaveStaff123!';
const UNPAID_SECRET = process.env.UNPAID_SECRET_KEY || 'NoPagoProyecto2026!';

// Almacén en memoria o base de datos del estado de la suscripción
let systemSubscriptionStatus = 'active'; // 'active' o 'unpaid'

// ==============================================================================
// 2. MIDDLEWARE DE AUTORIZACIÓN CON VERIFICACIÓN DE PAGO
// ==============================================================================
function requireAuth(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];

  // Si el sistema está globalmente apagado por falta de pago:
  if (systemSubscriptionStatus === 'unpaid') {
    req.userRole = 'unpaid';
    return next();
  }

  if (authHeader === ADMIN_SECRET || authHeader === `Bearer ${ADMIN_SECRET}`) {
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
  return res.status(401).json({ error: 'Acceso no autorizado.' });
}

// Middleware para bloquear acciones de escritura si está capado/unpaid
function requireAdminOnly(req, res, next) {
  if (req.userRole === 'unpaid') {
    return res.status(403).json({ error: 'Acceso restringido: No se registró pago del servicio.' });
  }
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Requiere permisos de Administrador.' });
  }
  next();
}

// ==============================================================================
// 3. ENDPOINT DE LOGIN (SOPORTE DE USUARIO OCULTO)
// ==============================================================================
router.post('/api/admin/login', (req, res) => {
  const { username = '', password = '' } = req.body;
  const cleanUser = String(username).trim().toLowerCase();

  // Si el sistema está apagado globalmente
  if (systemSubscriptionStatus === 'unpaid') {
    return res.status(200).json({
      success: true,
      token: 'UNPAID_TOKEN_LOCKOUT',
      role: 'unpaid',
      roleLabel: 'No se registró pago'
    });
  }

  const isAdminUser = !cleanUser || cleanUser === 'admin' || cleanUser === 'administrador';
  const isStaffUser = !cleanUser || cleanUser === 'recepcion' || cleanUser === 'staff';
  const isUnpaidUser = cleanUser === 'unpaid' || cleanUser === 'bloqueado' || cleanUser === 'nopago';

  // 1. Usuario Oculto / Contraseña de Bloqueo
  if ((isUnpaidUser || !cleanUser || isAdminUser || isStaffUser) && password === UNPAID_SECRET) {
    return res.status(200).json({
      success: true,
      token: UNPAID_SECRET,
      role: 'unpaid',
      roleLabel: 'No se registró pago'
    });
  }

  // 2. Administrador
  if (isAdminUser && password === ADMIN_SECRET) {
    return res.status(200).json({ 
      success: true, 
      token: ADMIN_SECRET, 
      role: 'admin',
      roleLabel: 'Administrador General'
    });
  }

  // 3. Staff / Recepción
  if (isStaffUser && password === STAFF_SECRET) {
    return res.status(200).json({ 
      success: true, 
      token: STAFF_SECRET, 
      role: 'staff',
      roleLabel: 'Usuario Estándar'
    });
  }

  return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
});

// ==============================================================================
// 4. ENDPOINTS DE CONTROL REMOTO DESDE OTRO PROYECTO EN VERCEL
// ==============================================================================

// Consultar estado actual (Público)
router.get('/api/admin/subscription-status', (req, res) => {
  return res.status(200).json({
    success: true,
    status: systemSubscriptionStatus,
    message: systemSubscriptionStatus === 'unpaid' ? 'No se registró pago.' : 'Servicio activo.'
  });
});

// Modificar estado remotamente (Requiere clave maestra)
router.post('/api/admin/set-subscription-status', (req, res) => {
  const { status, key } = req.body;
  const authHeader = req.headers['x-admin-key'] || req.headers['authorization'];

  if (key !== ADMIN_SECRET && authHeader !== ADMIN_SECRET && authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(403).json({ error: 'No autorizado.' });
  }

  systemSubscriptionStatus = (status === 'unpaid' || status === 'inactive') ? 'unpaid' : 'active';

  return res.status(200).json({
    success: true,
    status: systemSubscriptionStatus,
    message: systemSubscriptionStatus === 'unpaid' ? 'Bloqueado por falta de pago.' : 'Servicio reactivado.'
  });
});
```

---

## 🎨 3. Frontend: Componente de Bloqueo de la Web Pública (`PublicLockoutScreen.jsx`)

Crea el archivo `src/components/PublicLockoutScreen.jsx`:

```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function PublicLockoutScreen({ onGoToAdmin }) {
  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-b from-[#150404] via-[#200707] to-[#0d0202] text-white flex items-center justify-center p-4 select-none backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-black/85 border-2 border-red-500/70 shadow-[0_0_60px_rgba(239,68,68,0.4)] text-center space-y-6"
      >
        {/* Candado con Resplandor Rojo */}
        <div className="relative w-24 h-24 rounded-full bg-red-950/90 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_35px_rgba(239,68,68,0.65)]">
          <Lock className="w-12 h-12 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border border-black flex items-center justify-center shadow-md">
            <AlertTriangle className="w-3.5 h-3.5 text-black" />
          </span>
        </div>

        <div className="space-y-3">
          <span className="px-4 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs uppercase tracking-widest font-black inline-block">
            Servicio Deshabilitado
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-red-400 uppercase tracking-wide">
            Falta de Pago.
          </h1>
          <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            El acceso a esta página web y a todos sus servicios ha sido suspendido temporalmente debido a la falta de registro de pago de la suscripción o desarrollo.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-left space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-red-300 uppercase tracking-wider font-bold">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>Aviso al Administrador</span>
          </div>
          <p className="text-xs text-gray-400 leading-normal">
            Para reactivar este sitio web, por favor regularice el pago correspondiente con su proveedor de desarrollo.
          </p>
        </div>

        {onGoToAdmin && (
          <button
            onClick={onGoToAdmin}
            className="text-xs text-gray-500 hover:text-red-300 transition-colors cursor-pointer"
          >
            Acceso a panel administrativo →
          </button>
        )}
      </motion.div>
    </div>
  );
}
```

---

## 🛡️ 4. Frontend: Pantalla Capada del Panel Admin (`AdminDashboard.jsx`)

En tu componente de Dashboard (`AdminDashboard.jsx`), maneja el estado `userRole === 'unpaid'`:

```jsx
// Si el usuario es 'unpaid' (capado) o el sistema está suspendido:
if (userRole === 'unpaid') {
  return (
    <div className="min-h-screen bg-[#150404] text-white flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-black/80 border-2 border-red-500 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400">
          <Ban className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-red-500/20 text-red-300 text-xs uppercase font-black">
            Acceso Suspendido
          </span>
          <h1 className="text-3xl font-black text-red-400 uppercase">
            No se registró pago.
          </h1>
          <p className="text-sm text-gray-300">
            El acceso a las funciones de este panel administrativo se encuentra deshabilitado. No cuenta con permisos para ver datos ni realizar modificaciones.
          </p>
        </div>

        {/* ÚNICA ACCIÓN: Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-red-700 hover:bg-red-600 text-white font-bold uppercase cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
```

---

## ⚡ 5. Integración en `App.jsx`

En tu archivo raíz `App.jsx`, verifica el estado al iniciar la aplicación:

```jsx
import React, { useState, useEffect } from 'react';
import PublicLockoutScreen from './components/PublicLockoutScreen';

export default function App() {
  const [isSiteLocked, setIsSiteLocked] = useState(false);

  useEffect(() => {
    // Consultar estado de suscripción al backend
    fetch('/api/admin/subscription-status')
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'unpaid') {
          setIsSiteLocked(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      {/* Si está bloqueado y no estamos en la ruta del admin, mostrar candado */}
      {isSiteLocked && !window.location.hash.includes('admin') && (
        <PublicLockoutScreen onGoToAdmin={() => window.location.hash = '#/admin'} />
      )}

      {/* Resto de tu aplicación normal */}
    </div>
  );
}
```
