# 🌿 GUÍA MAESTRA DE INTEGRACIÓN: CONTROL MODULAR, CONTRASEÑAS REMOTAS Y REACTIVIDAD EN TIEMPO REAL
### *Andicas Bioparque Temático & Eco-Resort (Quimbayas) ⟷ Panel Dynamind Master*

---

## 📌 1. RESUMEN Y ARQUITECTURA DE DOBLE CAPA CLOUD

Para lograr un control remoto instantáneo (< 150 ms) y sin fallos desde el **Panel de Owner (Dynamind)** sobre la web en producción (**Vercel**) y local, se implementó una **arquitectura de sincronización dual**:

```mermaid
graph TD
    A[Panel Maestro Dynamind<br>UserManagement.jsx] -->|1. Direct Upsert < 150ms| B[(Supabase PostgreSQL Cloud)]
    A -->|2. HTTP POST Fallback| C[Backend Render Node.js]
    B -->|Polling Reactivo cada 1.5s| D[Frontend Vercel / Local<br>andicas.vercel.app]
    C -->|Persistencia| B
```

### ¿Por qué esta arquitectura es infalible?
1. **Independencia de Servidores en Reposo:** Si Render se encuentra dormido (cold start de 50s en plan gratuito), la orden se guarda directamente en Supabase PostgreSQL Cloud en menos de 150 ms.
2. **Respuesta Instantánea Global:** Vercel consulta directamente a Supabase Cloud, reflejando el cambio de estado en vivo en cualquier dispositivo sin demoras.

---

## 🎛️ 2. MÓDULOS ACTIVOS EN PANEL DE OWNER

En el Panel de Owner (`portafolio/src/components/admin/UserManagement.jsx`):

### A. Módulos de KAL DISCOBAR (`kal-discobar`):
| Módulo | Clave Técnica | Función en la Plataforma |
| :--- | :--- | :--- |
| **📊 Métricas & Caja** | `metrics` | Controla el balance diario, ingresos, gráficas y arqueo de caja. |
| **🛎️ Pedidos & Mesas** | `orders` | Controla comandas en vivo, mesas 1-15, pedidos para llevar y facturas. |
| **📋 Configuración de Menú** | `menu_editor` | Controla la edición de productos, precios, fotos, categorías y temas. |
| **🍾 Inventario & Botellas** | `inventory` | Controla la 4ta pestaña de stock por botellas, copas/ml y entradas de mercancía. |

### B. Módulos de ANDICAS / QUIMBAYAS (`andicas-bioparque`):
| Módulo | Clave Técnica | Función en la Plataforma |
| :--- | :--- | :--- |
| **📅 Agendamiento de Citas & Reservas** | `bookings` | Controla el motor de reservas de cabañas, pasadías y pasanoches. Al deshabilitarse, muestra pantalla de bloqueo y redirige a atención manual por WhatsApp/Recepción. |
| **💳 Verificación de Pagos Wompi** | `wompi_payments` | Controla la pasarela de pagos en línea (Bancolombia, PSE, Tarjetas y Nequi). Al deshabilitarse, bloquea el botón Wompi y habilita el pago por consignación bancaria directa. |

---

## 🔐 3. GESTIÓN REMOTA DE CONTRASEÑA DE ADMINISTRADOR

Desde el Panel de Owner (`UserManagement.jsx`), el Owner puede cambiar la contraseña con la que el administrador ingresa a `/#/dsb` en Andicas:

### Flujo de Escritura en Dynamind:
1. El Owner ingresa la nueva clave en la tarjeta **"Cambiar Contraseña de Administrador (Cliente)"**.
2. Escribe directamente en Supabase Cloud de Andicas (`cabins` fila `id = 'admin_auth'`) con `description = nuevaClave`.
3. Envía `POST /api/bookings/admin/update-admin-password` al backend en Render.

---

## 🚨 4. VENTANA EMERGENTE INMUTABLE DE "SESIÓN CERRADA"

Cuando el Owner cambia la contraseña de administración mientras el cliente tiene el Dashboard abierto:
* **Detección Instantánea (< 1.5s):** El sondeo detecta que la clave remota difiere de la contraseña con la que se inició sesión.
* **Aparición de la Ventana Emergente:** Se superpone un modal modal (`z-[999999]`) con fondo oscuro difuminado (`backdrop-blur-md`).
* **Seguridad Estricta:**
  * ❌ **NO tiene botón de cerrar (X).**
  * ❌ **NO se puede cerrar haciendo clic afuera.**
  * ✅ **ÚNICO BOTÓN:** **"Salir del Dashboard"**, el cual limpia la sesión local y redirige al usuario de forma limpia a la página principal.

```jsx
{/* MODAL INMUTABLE DE SESIÓN CERRADA */}
{showSessionClosedModal && (
  <div className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-full max-w-md bg-[#130d10] border-2 border-red-500 rounded-3xl p-7 text-white text-center space-y-6 shadow-[0_0_80px_rgba(239,68,68,0.4)]"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
        <Lock className="w-8 h-8 animate-bounce" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] uppercase font-black tracking-widest inline-block">
          Aviso de Seguridad
        </span>
        <h2 className="text-2xl font-black text-white uppercase tracking-wide">
          Sesión Cerrada
        </h2>
        <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
          La contraseña de administración ha sido modificada por el propietario. Tu sesión activa ha finalizado por motivos de seguridad.
        </p>
      </div>

      <button
        type="button"
        onClick={handleExitDashboard}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-600/30"
      >
        Salir del Dashboard
      </button>
    </motion.div>
  </div>
)}
```

---

## ⚡ 5. LECCIONES CLAVE DE REACTIVIDAD Y ESTABILIDAD (SIN BUGS NI RESETEOS)

### 1. Evitar Claves Dinámicas en el Login (`AdminLogin`):
* **Problema:** Si se usa `key={`admin-login-${authVersion}`}`, cada vez que el sondeo de 1.5s consulta el servidor, React destruye y vuelve a montar el formulario, **borrando el texto que el usuario está escribiendo en el input de contraseña**.
* **Solución:** Renderizar `<AdminLogin />` de forma estática y estable sin keys dinámicas.

### 2. Notificaciones Condicionales en el Store:
* En `setModules` y `setSubscriptionStatus`, comparar siempre el valor actual con el nuevo antes de llamar a `notify()`. Si el valor es idéntico, no emitir notificación para evitar re-renderizaciones innecesarias.

### 3. Preservación de Contraseña al "Restablecer por Defecto":
* Cuando se restablece la base de datos o el dashboard a valores iniciales de fábrica, se deben borrar reservas, comandas y registros operacionales, pero **mantener intacta la contraseña activa del administrador** en `localStorage` y Supabase.

---

## 🗄️ 6. CONVENCIONES DE LA BASE DE DATOS SUPABASE

* **URL de Supabase:** `https://vkpzgtteqaekmnixrlxl.supabase.co`
* **Tabla Utilizada:** `public.cabins`
* **Fila de Configuración Modular y Killswitch:** `id = 'system_settings'`
* **Fila de Contraseña de Administrador:** `id = 'admin_auth'`

### Estructura de registros en `cabins`:

#### 1. Fila de Configuración (`id = 'system_settings'`):
* `id`: `'system_settings'`
* `name`: `'System Settings'`
* `type`: `'active'` (Normal) o `'unpaid'` (Killswitch / Bloqueo Total)
* `price_per_night`: `0`
* `description`: JSON string con los módulos, ej: `{"bookings":true,"wompi_payments":true}`

#### 2. Fila de Credenciales (`id = 'admin_auth'`):
* `id`: `'admin_auth'`
* `name`: `'Admin Auth Credentials'`
* `type`: `'active'`
* `price_per_night`: `0`
* `description`: Contraseña activa en texto, ej: `'MiNuevaClave2026@'`

---

## 📝 7. CÓDIGO CLAVE PARA CONSULTAR Y MODIFICAR

### Lectura en Frontend (`src/services/api.js`):
```javascript
export async function getSubscriptionStatus() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const andicasKey = atob('c2Jfc2VjcmV0X3lEeWt6QVVnSzRkZ0czUVlGLWVyUXdfbVRhaVQ4dEc=');
    const andicasSb = createClient('https://vkpzgtteqaekmnixrlxl.supabase.co', andicasKey);

    const [settingsRes, adminAuthRes] = await Promise.allSettled([
      andicasSb.from('cabins').select('*').eq('id', 'system_settings').maybeSingle(),
      andicasSb.from('cabins').select('*').eq('id', 'admin_auth').maybeSingle()
    ]);

    let parsed = { bookings: true, wompi_payments: true };
    let dbStatus = 'active';
    let remoteAdminPass = null;

    if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
      dbStatus = settingsRes.value.data.type || 'active';
      try { parsed = JSON.parse(settingsRes.value.data.description); } catch {}
    }

    if (adminAuthRes.status === 'fulfilled' && adminAuthRes.value.data?.description) {
      remoteAdminPass = adminAuthRes.value.data.description.trim();
    }

    const isLocked = dbStatus === 'unpaid';
    return {
      success: true,
      status: dbStatus,
      adminPassword: remoteAdminPass,
      modules: {
        bookings: !isLocked && parsed.bookings !== false,
        wompi_payments: !isLocked && parsed.wompi_payments !== false && parsed.payments !== false,
        payments: !isLocked && parsed.wompi_payments !== false && parsed.payments !== false
      }
    };
  } catch (err) {
    console.warn('Fallback backend:', err);
  }
  return { success: false, status: 'active', modules: { bookings: true, wompi_payments: true } };
}
```

### Escritura desde Panel Dynamind (`portafolio/src/components/admin/UserManagement.jsx`):

#### A. Actualizar Módulos y Killswitch:
```javascript
const andicasKey = atob('c2Jfc2VjcmV0X3lEeWt6QVVnSzRkZ0czUVlGLWVyUXdfbVRhaVQ4dEc=');
const andicasSb = createClient('https://vkpzgtteqaekmnixrlxl.supabase.co', andicasKey);

await andicasSb.from('cabins').upsert({
  id: 'system_settings',
  name: 'System Settings',
  type: activeSite.status || 'active',
  price_per_night: 0,
  description: JSON.stringify(updatedFeatures)
});
```

#### B. Actualizar Contraseña de Administrador:
```javascript
await andicasSb.from('cabins').upsert({
  id: 'admin_auth',
  name: 'Admin Auth Credentials',
  type: 'active',
  price_per_night: 0,
  description: cleanPass
});
```

---

## 🔒 8. ROLES Y CLAVES MAESTRAS

* **Clave Administrador (Acceso total):** Modificable remotamente desde Dynamind (por defecto `PanelPassword1966@`).
* **Clave Recepción / Staff (Solo lectura y agendamiento):** `StaffAndicas2026!`
* **Clave Suspensión por Pago:** `NoPagoAndicas2026!`
* **Ruta de Acceso al Dashboard:** `/#/dsb` o `/#/admin`

---

## ✅ 9. REPOSITORIOS Y DESPLIEGUES
* **Panel Dynamind:** `https://github.com/juanpabloto2000-spec/portafolio.git`
* **Andicas Quimbayas:** `https://github.com/juanpabloto2000-spec/andicas.git`
* **Web Producción:** `https://andicas.vercel.app`
