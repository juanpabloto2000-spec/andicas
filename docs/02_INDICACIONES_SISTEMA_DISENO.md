# 🎨 02_INDICACIONES_SISTEMA_DISENO.md
> **Manual Técnico de Arquitectura, Sistema de Diseño, Animaciones y Reglas Móvil**
> *Directrices exactas para estructurar, maquetar y animar el sitio web con estándar de ultra-lujo.*

---

## 📋 0. PROTOCOLO DE ANÁLISIS DE ENTRADA & PLAN DE IMPLEMENTACIÓN

Cuando se provea un sitio web o información de un negocio existente para rediseñar, el modelo debe generar primero un **Plan de Implementación** con este formato exacto:

```markdown
# 🗺️ Plan de Implementación: [Nombre del Parque / Negocio]

## 1. Mapeo de Información Extraída
- **Propuesta de Valor Principal:** (Ej. Ecoturismo de lujo, piscinas de roca natural, cabañas de autor).
- **Servicios & Tarifas Detectadas:** (Pasadías, Pasanoches, Planes Románticos, Mascotas, etc.).
- **Atracciones & Experiencias Clave:** (Lista de actividades a incluir en carruseles).
- **Fauna & Santuario:** (Especies a exhibir en el slider continuo).
- **Canal de Conversión Oficial:** (WhatsApp, cuentas bancarias, políticas de anticipo del 50%).

## 2. Matriz Modular de Secciones & Componentes
| # | Sección | Componente Asignado | Parámetros de Animación |
|---|---------|---------------------|--------------------------|
| 1 | Hero Principal | `Hero.jsx` + `QuickBookingBar.jsx` | Viñeta multicapa + Entrada resorte |
| 2 | Atracciones / Esencia | `ExperienceStory.jsx` + `CardStack.jsx` | Coverflow 3D + Inclinación Y |
| 3 | Aldea de Cabañas | `CabanasPage.jsx` + `3d-carousel.jsx` | Cilindro rotacional 3D |
| 4 | Cotizador de Planes | `PassPricing.jsx` + `InteractiveTiltCard.jsx` | Cascada Stagger + Pulso elástico (+/-) |
| 5 | Santuario Animal | `image-auto-slider.jsx` | Slider continuo infinito (35s) |
| 6 | Normas & Convivencia | Acordeón dividido de 2 columnas | Entrada coordinada (x: -50 y x: 50) |
| 7 | Ubicación & Bancos | `LocationAndBanking.jsx` | Botón copiar cuenta + Toast feedback |

## 3. Cronograma de Entrega Modular (1-2 secciones por turno)
- **Fase 1:** Fundación visual (Fondo, marca de agua, partículas, Navbar, Footer).
- **Fase 2:** Hero + Buscador Rápido WhatsApp.
- **Fase 3:** Carrusel 3D de Atracciones (Coverflow).
- **Fase 4:** Cilindro 3D de Cabañas + Catálogo.
- **Fase 5:** Cotizador Arma Tu Plan con cálculo en vivo.
- **Fase 6:** Santuario Animal + Normas en doble columna.
- **Fase 7:** Ubicación, Cuentas Bancarias y pruebas móviles finales.
```

---

## 🌈 1. SISTEMA DE DISEÑO & TOKENS DE COLOR

Configura `tailwind.config.js` con la paleta de identidad:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        jade: {
          950: '#041B1C', // Fondo más oscuro
          900: '#072E2F', // Fondo medio
          800: '#0B4A4B', // Teal principal
          700: '#115F60',
          600: '#187B7C',
          500: '#239B9C',
          400: '#3CC1C2',
          100: '#E0F5F5',
        },
        hoja: {
          900: '#23491B',
          800: '#346A29',
          700: '#418233',
          600: '#539E43', // Verde orgánico
          500: '#68BE56',
          400: '#87D776',
          100: '#EAF7E8',
        },
        madera: {
          950: '#381C09',
          900: '#522A0E',
          800: '#7A431D', // Marrón tierra / sombra 3D
          700: '#945325',
          600: '#B06530',
          500: '#CC7B40',
          100: '#F7EDE6',
        },
        gold: {
          900: '#5E430B',
          800: '#8A6213',
          700: '#B3801D',
          600: '#D8A232', // Oro Quimbaya
          500: '#F0BA4B',
          400: '#FCD477', // Oro brillante para textos 3D
          300: '#FDE4A4',
          100: '#FFF8E7',
        },
        linen: {
          100: '#FAF7F2', // Blanco lino principal
          200: '#F3EDE2',
          300: '#E6DCCF',
          400: '#C7B9A6',
          500: '#A4937E',
        },
        forest: '#051E1F',
      },
      fontFamily: {
        display: ['"Titan One"', '"Luckiest Guy"', 'cursive'],
        cartoon: ['"Luckiest Guy"', '"Titan One"', 'sans-serif'],
        fredoka: ['"Fredoka"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(216, 162, 50, 0.45)',
        'gold-glow-lg': '0 0 45px -5px rgba(216, 162, 50, 0.65)',
        'jade-glow': '0 0 30px -5px rgba(11, 74, 75, 0.6)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FCD477 0%, #D8A232 50%, #B3801D 100%)',
        'jade-gradient': 'linear-gradient(135deg, #187B7C 0%, #0B4A4B 50%, #072E2F 100%)',
      }
    },
  },
  plugins: [],
}
```

---

## ✍️ 2. TIPOGRAFÍA Y SOMBRAS 3D (Precolombinas / Cartoon)

Añade estas utilidades de sombreado en `src/index.css`:

```css
/* Sombras de texto 3D para títulos ancestrales */
.text-3d-gold {
  color: #FCD477;
  text-shadow: 3px 4px 0px #7A431D, 5px 7px 0px #041B1C;
}

.text-3d-white {
  color: #FAF7F2;
  text-shadow: 3px 4px 0px #072E2F, 5px 6px 0px #041B1C;
}

.text-3d-green {
  color: #87D776;
  text-shadow: 2px 3px 0px #23491B, 4px 5px 0px #041B1C;
}

/* Efecto Glassmorphism Jade */
.glass-dark {
  background: rgba(7, 46, 47, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(216, 162, 50, 0.3);
}

.glass-jade {
  background: rgba(11, 74, 75, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(216, 162, 50, 0.25);
}
```

---

## 🧹 3. REGLAS DE LIMPIEZA VISUAL (Anti-Clutter)

1. **Sin Sobretítulos Ruidosos:** No coloques textos diminutos con diamantes o estrellas (`✦ TEXTO CON ESTRELLAS ✦`) sobre los encabezados. Deja que los títulos `<h2>` con clase `font-display` y `.text-3d-gold` sean los protagonistas.
2. **Sin Píldoras Amontonadas:** Evita saturar los encabezados de sección con decenas de etiquetas o condiciones flotantes. Las condiciones (check-in, normas) van integradas de forma ordenada dentro de las tarjetas de contenido o en su propia sección.
3. **Respiración y Jerarquía:** Mantén márgenes generosos (`py-20 sm:py-28`), fondos limpios y contrastes nítidos.

---

## 🌌 4. CAPAS DE FONDO Y ATMÓSFERA MÁGICA

La estructura del fondo se compone de 3 capas fijas:

1. **Gradiente Base:** `bg-gradient-to-b from-[#062627] via-[#072E2F] to-[#041B1C]`.
2. **Marca de Agua Fija:** Logotipo oficial en PNG sin fondo en capa `fixed inset-0 pointer-events-none z-0` centrado con opacidad sutil `opacity-[0.06] sm:opacity-[0.07]`.
3. **Luciérnagas Ambientales (`AmbientFireflies.jsx`):** Partículas doradas y esmeralda con trayectoria sinusoidal suave y parpadeo de respiración por GPU.

---

## 🎬 5. FÍSICA Y REGLAS DE ANIMACIÓN (Framer Motion)

### Regla de Oro del Scroll Reveal (`amount: 0.15`)
- **NUNCA** uses márgenes positivos gigantes (como `margin: "150px 0px"`) en `whileInView`, ya que provocan que la animación termine antes de que el usuario vea el elemento.
- **SIEMPRE** usa:
  ```jsx
  viewport={{ once: true, amount: 0.15 }}
  ```
  Esto garantiza que el movimiento se ejecute **justo cuando el 15% del elemento entra en el campo visual del usuario**.

### Físicas de Resorte Cinematográficas
```jsx
// Para llegadas de tarjetas y contenedores:
transition={{ type: "spring", stiffness: 85, damping: 15 }}

// Para cascadas ordenadas (Arma Tu Plan, Métricas):
variants={{
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } }
}}
```

### Entradas Coordinadas de Lados Opuestos
- En secciones de dos columnas (como *Normas* o *Ubicación y Cuentas Bancarias*):
  - Columna izquierda entra con `initial={{ opacity: 0, x: -50 }}`.
  - Columna derecha entra con `initial={{ opacity: 0, x: 50 }}`.

### Efectos de Luz en Botones y Tarjetas
```css
/* Barrido de Brillo en Botones CTA */
@keyframes shimmer-sweep {
  0% { transform: translateX(-150%) skewX(-20deg); }
  100% { transform: translateX(250%) skewX(-20deg); }
}

.btn-shimmer {
  position: relative;
  overflow: hidden;
}
.btn-shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer-sweep 3.5s infinite ease-in-out;
  pointer-events: none;
}
```

---

## 📱 6. REGLAS CRÍTICAS PARA DISPOSITIVOS MÓVILES (Evitar Bugs)

1. **Protección contra Desbordamiento Horizontal:**
   - En `index.css`:
     ```css
     html, body, #root {
       width: 100%;
       max-width: 100vw;
       overflow-x: hidden;
       position: relative;
     }
     ```
2. **Título Hero en una Sola Línea:**
   - Para palabras largas (ej. *"NATURALEZA"*), usa `whitespace-nowrap inline-block` con tamaño responsivo calibrado (`text-[2.4rem] xs:text-[2.9rem] sm:text-6xl md:text-8xl lg:text-9xl`) para evitar que la última letra caiga en un segundo renglón.
3. **Pantalla de Carga (*Preloader*) Optimizada:**
   - **NO** uses `scale: 3.5` ni `filter: blur(18px)` en el unmount, pues saturan la GPU móvil.
   - Usa un desvanecimiento suave de opacidad (`opacity: 1 ➔ 0`) con `touch-none` en lugar de mutar `document.body.style.overflow`.
4. **Cuadrícula de Planes en 2 Columnas:**
   - En móvil, organiza los planes en `grid-cols-2 gap-2.5 sm:gap-5` para aprovechar el ancho sin forzar scroll infinito vertical.
