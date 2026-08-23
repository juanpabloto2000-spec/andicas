# 🌀 05_GUIA_ANIMACION_ROTACION_3D_Y_CARRITO.md
> **Guía Técnica de Animación, Rotación 3D Cilíndrica y Carrito a la Derecha**
> *Manual exacto con matemáticas trigonométricas, control de inercia y maquetación de checkout/resumen a la derecha.*

---

## 🧭 1. ARQUITECTURA DEL CARRITO / RESUMEN A LA DERECHA

Para que el carrito de compras / cotizador quede **fijo a la derecha en Desktop** y **ordenado al fondo en Móvil** sin desfasarse nunca a la izquierda, usa la estructura de cuadrícula de 12 columnas:

```jsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto">
  {/* IZQUIERDA (8 Columnas): Catálogo o Tarjetas de Planes */}
  <div className="lg:col-span-8 w-full">
    {/* Contenido de planes / productos */}
  </div>

  {/* DERECHA (4 Columnas): Carrito / Resumen de Compra Fijo */}
  <div className="lg:col-span-4 w-full lg:sticky lg:top-28">
    <div className="rounded-2xl glass-dark border border-gold-600/40 p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Encabezado del Carrito */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 text-gold-400">
        <h3 className="font-display text-lg font-black text-linen-100 uppercase">
          TU RESUMEN
        </h3>
      </div>

      {/* Lista de Items Seleccionados */}
      {/* Totales y Botón a WhatsApp */}
    </div>
  </div>
</div>
```

---

## 🎠 2. CÓDIGO COMPLETO: CARRUSEL CILÍNDRICO 3D CON ROTACIÓN CONTINUA E INERCIA

Este es el código exacto y probado con todas las matemáticas y físicas necesarias:

```jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";

export function ThreeDPhotoCarousel({ items = [], onItemClick }) {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const rotation = useMotionValue(0);
  const pointerStartRef = useRef({ x: 0, time: 0 });
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const hasMovedRef = useRef(false);

  // 1. Ancho dinámico por tarjeta según la pantalla
  const [faceWidth, setFaceWidth] = useState(260);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setFaceWidth(210);      // Móvil
      else if (w < 1024) setFaceWidth(250); // Tablet
      else setFaceWidth(280);              // Desktop
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const count = items.length || 1;

  // 2. FÓRMULA TRIGONOMÉTRICA DEL RADIO (Evita que las caras se solapen o deformen)
  const anglePerItem = 360 / count;
  const radius = Math.max(
    280,
    Math.round(faceWidth / (2 * Math.tan(Math.PI / count))) + 15
  );

  // 3. AUTO-ROTACIÓN CONTINUA (60 FPS sin saltos)
  useEffect(() => {
    let animationFrame;
    const autoRotate = () => {
      if (!isDragging) {
        rotation.set(rotation.get() - 0.10); // Velocidad de giro ambiental
      }
      animationFrame = requestAnimationFrame(autoRotate);
    };
    animationFrame = requestAnimationFrame(autoRotate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isDragging, rotation]);

  // 4. CONTROL DE ARRASTRE TÁCTIL / MOUSE (Drag & Throw)
  const handlePointerDown = (e) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    pointerStartRef.current = { x: e.clientX, time: Date.now() };
    lastXRef.current = e.clientX;
    velocityRef.current = 0;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastXRef.current;
    if (Math.abs(e.clientX - pointerStartRef.current.x) > 5) {
      hasMovedRef.current = true;
    }
    lastXRef.current = e.clientX;
    velocityRef.current = deltaX;
    // Multiplicador 0.32 para una sensibilidad natural
    rotation.set(rotation.get() + deltaX * 0.32);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Inercia de giro elástica al soltar (Física de resorte)
    if (Math.abs(velocityRef.current) > 1) {
      controls.start({
        rotateY: rotation.get() + velocityRef.current * 7,
        transition: {
          type: "spring",
          stiffness: 70,
          damping: 22,
          mass: 0.1,
        },
      });
    }
  };

  return (
    <div
      className="relative w-full h-[480px] sm:h-[520px] flex items-center justify-center select-none overflow-hidden py-4 cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Escenario con perspectiva 3D profunda */}
      <div
        className="flex items-center justify-center w-full h-full pointer-events-none"
        style={{ perspective: "1400px" }}
      >
        {/* Raíz del cilindro que gira sobre el eje Y */}
        <motion.div
          style={{
            width: `${faceWidth}px`,
            height: "360px",
            position: "relative",
            transformStyle: "preserve-3d",
            rotateY: rotation,
          }}
          animate={controls}
        >
          {items.map((item, i) => {
            const angle = i * anglePerItem;

            return (
              <div
                key={item.id || i}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto p-1"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                }}
                onClick={() => {
                  if (!hasMovedRef.current && onItemClick) {
                    onItemClick(item);
                  }
                }}
              >
                {/* Tarjeta Visual de Cabaña */}
                <div className="w-full h-full rounded-2xl overflow-hidden glass-dark border border-gold-500/40 shadow-2xl relative group hover:border-gold-400 hover:shadow-gold-glow transition-all flex flex-col justify-end p-5 select-none">
                  {/* Foto de Fondo */}
                  <div className="absolute inset-0">
                    <img
                      src={item.image || item.gallery?.[0]}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/60 to-transparent pointer-events-none" />
                  </div>

                  {/* Textos y Precios */}
                  <div className="relative z-10 space-y-1.5 text-left">
                    <h3 className="font-display text-lg sm:text-xl font-black text-linen-100 uppercase tracking-wide group-hover:text-gold-300 transition-colors leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs font-fredoka">
                      <span className="text-linen-300">{item.capacity}</span>
                      <span className="font-mono font-bold text-gold-400">
                        {item.priceFormatted || `$${item.price?.toLocaleString('es-CO')} COP`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

export default ThreeDPhotoCarousel;
```

---

## 🔑 3. EXPLICACIÓN DE LAS 4 CLAVES DE ÉXITO

1. **La Perspectiva del Contenedor (`perspective: 1400px`):**  
   Debe colocarse en el contenedor padre y tener `pointer-events-none` para que el mouse no interfiera con el giro general.
2. **El Eje Central 3D (`transformStyle: preserve-3d`):**  
   El elemento `<motion.div>` central rota sobre su propio centro (`rotateY: rotation`), mientras que cada tarjeta interior se empuja hacia afuera con `translateZ(${radius}px)`.
3. **El Radio Trigonométrico:**  
   $$\text{Radio} = \frac{\text{AnchoCara}}{2 \cdot \tan(\pi / N)} + 15$$  
   Esto asegura que sin importar si tienes 4, 8 o 12 cabañas, las tarjetas formen un polígono regular perfecto sin cruzarse.
4. **Diferenciación entre Clic y Arrastre (`hasMovedRef`):**  
   Si el usuario arrastra más de 5px, se activa `hasMovedRef.current = true`, evitando que al soltar el dedo se abra accidentalmente el modal de la cabaña.
