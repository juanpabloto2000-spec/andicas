# 🔐 Guía de Integración: Control Remoto de Estado de Pago & Bloqueo de Sitio

Esta guía contiene la documentación técnica y los códigos de integración para que desde **tu otro proyecto / dashboard en Vercel** puedas apagar o reactivar este sitio web (**Andicas**) con un solo clic.

---

## ⚡ ¿Cómo Funciona el Bloqueo Remoto?

Cuando cambias el estado del sitio a `"unpaid"` (Sin Pago):
1. **Página Web Pública:** Se bloquea completamente con una pantalla oscura y un **candado brillante** con el mensaje *"Falta de Pago. El acceso a esta página web ha sido suspendido temporalmente..."*.
2. **Panel Administrativo (`/dsb`):** Bloquea todas las funciones, métricas, agendas y movimientos. Muestra en grande el mensaje: *"No se registró pago."* y solo permite cerrar sesión.
3. **Reactivación Inmediata:** Al enviar el estado `"active"`, tanto la página web como el panel se restablecen al instante sin necesidad de reiniciar el servidor.

---

## 📡 Endpoints de la API de Andicas

* **URL del Backend en Producción (Render):**
  `https://tu-backend-andicas.onrender.com` (o `http://localhost:3001` en pruebas locales).

* **Clave de Control Maestro (`x-admin-key`):**
  `PanelPassword1966@` *(Configurable en la variable `ADMIN_SECRET_KEY` del backend)*.

---

### 1. Cambiar Estado del Sitio (Apagar / Encender)

* **Método:** `POST`
* **Ruta:** `/api/bookings/admin/set-subscription-status`
* **Headers:**
  ```http
  Content-Type: application/json
  x-admin-key: PanelPassword1966@
  ```

#### A. Para APAGAR / BLOQUEAR la página (Falta de Pago):
```json
{
  "status": "unpaid",
  "key": "PanelPassword1966@"
}
```

#### B. Para ENCENDER / REACTIVAR la página (Normal):
```json
{
  "status": "active",
  "key": "PanelPassword1966@"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "status": "unpaid",
  "message": "Sistema bloqueado: Pantalla configurada en 'No se registró pago.'"
}
```

---

### 2. Consultar Estado Actual de la Suscripción

* **Método:** `GET`
* **Ruta:** `/api/bookings/admin/subscription-status`

**Respuesta:**
```json
{
  "success": true,
  "status": "active",
  "message": "Servicio activo."
}
```

---

## 💻 Código de Integración para tu Otro Proyecto en Vercel (React / Next.js)

Puedes copiar este componente o función directamente en tu otro dashboard:

```jsx
import React, { useState } from 'react';

const ANDICAS_API_URL = "https://tu-backend-andicas.onrender.com"; // Reemplaza por la URL de Render
const ADMIN_MASTER_KEY = "PanelPassword1966@";

export default function AndicasSiteControl() {
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);

  // Función para cambiar el estado de Andicas remotamente
  const handleToggleStatus = async (newStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`${ANDICAS_API_URL}/api/bookings/admin/set-subscription-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_MASTER_KEY,
        },
        body: JSON.stringify({
          status: newStatus,
          key: ADMIN_MASTER_KEY,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
        alert(newStatus === 'unpaid' 
          ? '🚫 Sitio Andicas APAGADO por Falta de Pago.' 
          : '✅ Sitio Andicas REACTIVADO con Éxito.'
        );
      } else {
        alert('Error: ' + (data.error || 'No se pudo cambiar el estado'));
      }
    } catch (err) {
      alert('Error de conexión con el backend de Andicas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #ccc', maxWidth: '400px' }}>
      <h3>Control de Acceso: Andicas Bioparque</h3>
      <p>Estado actual: <strong>{status === 'active' ? '🟢 Activo' : '🔴 Bloqueado (Falta de Pago)'}</strong></p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button 
          onClick={() => handleToggleStatus('active')}
          disabled={loading}
          style={{ backgroundColor: '#10B981', color: 'white', padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          Reactivar Sitio (Pago OK)
        </button>

        <button 
          onClick={() => handleToggleStatus('unpaid')}
          disabled={loading}
          style={{ backgroundColor: '#EF4444', color: 'white', padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          Bloquear por Falta de Pago
        </button>
      </div>
    </div>
  );
}
```

---

## 🛠️ Comandos Rápidos cURL (Para Terminal)

### 🔴 Bloquear el Sitio:
```bash
curl -X POST https://tu-backend-andicas.onrender.com/api/bookings/admin/set-subscription-status \
  -H "Content-Type: application/json" \
  -H "x-admin-key: PanelPassword1966@" \
  -d '{"status":"unpaid","key":"PanelPassword1966@"}'
```

### 🟢 Reactivar el Sitio:
```bash
curl -X POST https://tu-backend-andicas.onrender.com/api/bookings/admin/set-subscription-status \
  -H "Content-Type: application/json" \
  -H "x-admin-key: PanelPassword1966@" \
  -d '{"status":"active","key":"PanelPassword1966@"}'
```
