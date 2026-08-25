# 🍸 Guía de Implementación: Botón Flotante de Redes Sociales para Kal Discobar

Este paquete contiene todo el código, estilos y animaciones del **Botón Flotante de Redes Sociales** listo para copiar y pegar en tu proyecto **Kal Discobar**.

---

## 📁 Archivos Disponibles en la Carpeta Principal

1. **[`Boton_Flotante_Redes_KalDiscobar.jsx`](file:///c:/Users/juaxp/OneDrive/Escritorio/Quimbayas/Boton_Flotante_Redes_KalDiscobar.jsx)**:
   - Componente React 100% autocontenido (incluye todos los íconos vectoriales SVG sin dependencias externas pesadas).
   - Animaciones con física de resorte (*spring physics*) al hacer hover/clic.
   - Resplandores neón individuales para cada red social (*WhatsApp, Instagram, TikTok, Facebook, Llamada*).
   - Tooltips flotantes con efecto *glassmorphism*.

---

## 🚀 Paso a Paso para Instalar en "Kal Discobar"

### 1. Instalar la librería de animación (si aún no la tienes)
En la terminal de tu proyecto `kal discobar`, ejecuta:
```bash
npm install framer-motion
```

### 2. Copiar el archivo al proyecto
Copia el archivo `Boton_Flotante_Redes_KalDiscobar.jsx` dentro de la carpeta de componentes de Kal Discobar (por ejemplo en `src/components/BotonFlotanteKalDiscobar.jsx`).

### 3. Usarlo en tu `App.jsx` o Layout Principal
Importa y coloca el componente al final de tu archivo principal (justo antes de cerrar el `</div>` raíz):

```jsx
import React from 'react';
import BotonFlotanteKalDiscobar from './components/BotonFlotanteKalDiscobar';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0d0b14] text-white">
      {/* Contenido de tu web de Kal Discobar (Navbar, Eventos, Carta de Tragos, etc.) */}

      {/* 🍸 Botón Flotante de Redes y Reservas */}
      <BotonFlotanteKalDiscobar 
        whatsappNumber="573100000000"
        whatsappMessage="¡Hola Kal Discobar! 🍸 Quiero reservar una mesa para este fin de semana."
        instagramUrl="https://instagram.com/kaldiscobar"
        tiktokUrl="https://tiktok.com/@kaldiscobar"
        facebookUrl="https://facebook.com/kaldiscobar"
        phoneNumber="+573100000000"
      />
    </div>
  );
}
```

---

## 🎨 Paletas de Estilos y Personalización para Discoteca / Bar

Si deseas cambiar los colores del botón principal en `Boton_Flotante_Redes_KalDiscobar.jsx`, puedes reemplazar la línea del botón principal:

### Opción 1: Dorado VIP & Noche (Por Defecto)
```jsx
className="relative group w-14 h-14 rounded-full bg-gradient-to-br from-[#1F1C2C] via-[#928DAB]/20 to-[#0F0C20] text-[#FFD700] border-2 border-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.45)] hover:shadow-[0_0_35px_rgba(255,215,0,0.75)] flex items-center justify-center cursor-pointer backdrop-blur-lg"
```

### Opción 2: Cyberpunk / Neón Magenta & Cyan
```jsx
className="relative group w-14 h-14 rounded-full bg-gradient-to-br from-[#FF007F] to-[#7928CA] text-white border-2 border-[#00F2FE] shadow-[0_0_25px_rgba(255,0,127,0.6)] hover:shadow-[0_0_35px_rgba(0,242,254,0.8)] flex items-center justify-center cursor-pointer backdrop-blur-lg"
```

### Opción 3: Verde Neón / Emerald Night
```jsx
className="relative group w-14 h-14 rounded-full bg-gradient-to-br from-[#062627] to-[#041617] text-[#D8A232] border-2 border-[#D8A232] shadow-[0_0_25px_rgba(216,162,50,0.5)] hover:shadow-[0_0_35px_rgba(216,162,50,0.8)] flex items-center justify-center cursor-pointer backdrop-blur-lg"
```

---

## ⚙️ Propiedades Disponibles (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `whatsappNumber` | `string` | `"573001234567"` | Número internacional con código de país (sin el signo `+`) |
| `whatsappMessage` | `string` | Mensaje de bienvenida | Texto predeterminado que se abre en el chat de WhatsApp |
| `instagramUrl` | `string` | URL de Instagram | Enlace al perfil de Instagram |
| `tiktokUrl` | `string` | URL de TikTok | Enlace a la cuenta de TikTok |
| `facebookUrl` | `string` | URL de Facebook | Enlace a la fanpage de Facebook |
| `phoneNumber` | `string` | `"+573001234567"` | Número para marcación telefónica directa |
| `onCustomAction` | `function` | `null` | Función opcional para ejecutar eventos (ej: Analytics o modales) |
