# 🧩 03_CODIGO_COMPONENTES_COMPLEJOS.md
> **Repositorio de Componentes Clave & Código Complejo**
> *Implementaciones listas para producción con físicas 3D, partículas bioluminiscentes, carruseles de autor y cotizador instantáneo.*

---

## 📑 ÍNDICE DE COMPONENTES
1. [AmbientFireflies.jsx (Luciérnagas Bioluminiscentes)](#1-ambientfirefliesjsx)
2. [InteractiveTiltCard.jsx (Tarjeta 3D Tilt con Foco de Luz)](#2-interactivetiltcardjsx)
3. [CardStack.jsx (Coverflow 3D con Perspectiva y Arrastre)](#3-cardstackjsx)
4. [3d-carousel.jsx (Cilindro Rotacional 3D Continuo)](#4-3d-carouseljsx)
5. [image-auto-slider.jsx (Slider Continuo Infinito para Fauna)](#5-image-auto-sliderjsx)
6. [QuickBookingBar.jsx (Barra Flotante de Reserva y Cotización WhatsApp)](#6-quickbookingbarjsx)
7. [Preloader.jsx (Pantalla de Carga Cinemática sin Lag Móvil)](#7-preloaderjsx)

---

## 1. AmbientFireflies.jsx
> **Propósito:** Genera luciérnagas flotantes bioluminiscentes con movimiento orgánico por GPU para crear una atmósfera andina nocturna mágica.

```jsx
import React, { useMemo } from 'react';

export default function AmbientFireflies({ count = 22, className = '' }) {
  const fireflies = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2, // 2px a 6px
      duration: Math.random() * 8 + 6, // 6s a 14s
      delay: Math.random() * 5,
      opacity: Math.random() * 0.7 + 0.3,
      color: i % 3 === 0 ? 'rgba(252, 212, 119, 0.95)' : i % 3 === 1 ? 'rgba(216, 162, 50, 0.85)' : 'rgba(135, 215, 118, 0.85)',
      glow: i % 3 === 0 ? '0 0 12px rgba(252, 212, 119, 0.9)' : '0 0 10px rgba(83, 158, 67, 0.8)',
    }));
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden z-10 select-none ${className}`} aria-hidden="true">
      {fireflies.map((f) => (
        <span
          key={f.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: f.left,
            top: f.top,
            width: `${f.size}px`,
            height: `${f.size}px`,
            backgroundColor: f.color,
            boxShadow: f.glow,
            animation: `firefly ${f.duration}s ease-in-out ${f.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
```

*Clase CSS requerida en `index.css`:*
```css
@keyframes firefly {
  0% {
    transform: translate(0, 0) scale(0.8);
    opacity: 0.2;
  }
  50% {
    transform: translate(25px, -35px) scale(1.3);
    opacity: 0.9;
  }
  100% {
    transform: translate(-20px, -70px) scale(0.7);
    opacity: 0.15;
  }
}
```

---

## 2. InteractiveTiltCard.jsx
> **Propósito:** Tarjeta con perspectiva 3D interactiva que se inclina suavemente según la posición del cursor y proyecta un foco de luz radial (*spotlight glow*).

```jsx
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function InteractiveTiltCard({
  children,
  className = '',
  tiltIntensity = 10,
  spotlightColor = 'rgba(216, 162, 50, 0.18)',
  onClick,
  ...props
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothMouseX = useSpring(mouseX, { stiffness: 200, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(smoothMouseY, [0, 1], [tiltIntensity, -tiltIntensity]);
  const rotateY = useTransform(smoothMouseX, [0, 1], [-tiltIntensity, tiltIntensity]);

  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    mouseX.set(x);
    mouseY.set(y);
    setSpotlightPos({ x: (e.clientX - rect.left), y: (e.clientY - rect.top) });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative will-change-transform ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${spotlightPos.x}px ${spotlightPos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </motion.div>
  );
}
```

---

## 3. CardStack.jsx
> **Propósito:** Carrusel Coverflow 3D con perspectiva física profunda, rotación en Y, arrastre táctil elástico y pulso dorado en la tarjeta activa.

```jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CardStack({
  items = [],
  cardWidth = 520,
  cardHeight = 350,
  autoAdvance = true,
  intervalMs = 4200,
  onCardClick,
  className = "",
}) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [spacing, setSpacing] = useState(260);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setSpacing(150);
      else if (w < 1024) setSpacing(210);
      else setSpacing(280);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const next = useCallback(() => {
    if (count <= 1) return;
    setActive((prev) => (prev + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setActive((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (!autoAdvance || isHovered) return;
    const timer = setInterval(next, intervalMs);
    return () => clearInterval(timer);
  }, [autoAdvance, intervalMs, isHovered, next]);

  if (!count) return null;

  return (
    <div
      className={`relative select-none w-full max-w-6xl mx-auto px-4 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative mx-auto flex items-center justify-center py-6 overflow-hidden"
        style={{
          width: "100%",
          height: cardHeight + 60,
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="relative h-full w-full flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
          {items.map((item, i) => {
            let diff = i - active;
            if (diff > count / 2) diff -= count;
            if (diff < -count / 2) diff += count;

            const isActive = diff === 0;
            if (Math.abs(diff) > 2) return null;

            const x = diff * spacing;
            const z = isActive ? 0 : -90 * Math.abs(diff);
            const scale = isActive ? 1 : 0.82;
            const opacity = isActive ? 1 : 0.55;
            const rotateY = diff < 0 ? 34 : diff > 0 ? -34 : 0;
            const zIndex = 20 - Math.abs(diff);

            return (
              <motion.div
                key={item.id}
                className={`absolute rounded-3xl border overflow-hidden shadow-2xl bg-jade-950 will-change-transform transition-all duration-500 ${
                  isActive
                    ? "cursor-grab active:cursor-grabbing border-gold-400 shadow-gold-glow-lg ring-2 ring-gold-400/50 glow-gold-pulse"
                    : "cursor-pointer border-white/15 hover:border-gold-500/40 opacity-60 hover:opacity-85"
                }`}
                style={{
                  width: cardWidth,
                  maxWidth: "88vw",
                  height: cardHeight,
                  zIndex,
                  transformStyle: "preserve-3d",
                }}
                animate={{ x, z, scale, opacity, rotateY }}
                transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.8 }}
                onClick={() => (isActive && onCardClick ? onCardClick(item) : setActive(i))}
                drag={isActive ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 60) prev();
                  else if (info.offset.x < -60) next();
                }}
              >
                <div className="relative h-full w-full flex flex-col justify-end p-6 sm:p-8 overflow-hidden group">
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={item.imageSrc}
                      alt={item.title}
                      className={`h-full w-full object-cover transition-transform duration-700 pointer-events-none ${
                        isActive ? "scale-105 group-hover:scale-110" : "scale-100"
                      }`}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/60 to-black/20 pointer-events-none" />
                  <div className="relative z-10 space-y-2 text-left max-w-2xl">
                    <span className="text-[11px] font-cartoon font-bold text-gold-400 uppercase tracking-widest block drop-shadow">
                      {item.tag}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-linen-100 uppercase tracking-wide leading-tight drop-shadow-md">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-fredoka text-linen-200 leading-relaxed line-clamp-2 drop-shadow">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Flechas de Navegación con Rebote */}
        <motion.button
          whileHover={{ scale: 1.15, x: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-2 sm:left-6 z-30 p-3 rounded-full bg-jade-950/90 border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-jade-950 transition-colors shadow-gold-glow backdrop-blur-md cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15, x: 3 }}
          whileTap={{ scale: 0.9 }}
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-2 sm:right-6 z-30 p-3 rounded-full bg-jade-950/90 border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-jade-950 transition-colors shadow-gold-glow backdrop-blur-md cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Puntos Indicadores con Expansión Suave */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {items.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => setActive(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === active ? "w-10 bg-gold-gradient shadow-gold-glow scale-105" : "w-2.5 bg-white/25 hover:bg-white/50"
            }`}
            aria-label={`Ir a ${it.title}`}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 4. 3d-carousel.jsx (Cilindro Rotacional 3D)
> **Propósito:** Cilindro trigonométrico con cálculo dinámico de radio para rotar cabañas/tarjetas sin solapamiento y con física inercial de giro.

```jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";

export function ThreeDPhotoCarousel({ items = [], onItemClick }) {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const rotation = useMotionValue(0);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const [faceWidth, setFaceWidth] = useState(260);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setFaceWidth(210);
      else if (w < 1024) setFaceWidth(250);
      else setFaceWidth(280);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const count = items.length || 1;
  const anglePerItem = 360 / count;
  const radius = Math.max(280, Math.round(faceWidth / (2 * Math.tan(Math.PI / count))) + 15);

  // Auto-rotación suave
  useEffect(() => {
    let frame;
    const autoRotate = () => {
      if (!isDragging) rotation.set(rotation.get() - 0.10);
      frame = requestAnimationFrame(autoRotate);
    };
    frame = requestAnimationFrame(autoRotate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging, rotation]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    lastXRef.current = e.clientX;
    velocityRef.current = 0;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velocityRef.current = deltaX;
    rotation.set(rotation.get() + deltaX * 0.32);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(velocityRef.current) > 1) {
      controls.start({
        rotateY: rotation.get() + velocityRef.current * 7,
        transition: { type: "spring", stiffness: 70, damping: 22, mass: 0.1 },
      });
    }
  };

  return (
    <div
      className="relative w-full h-[480px] sm:h-[520px] flex items-center justify-center select-none overflow-hidden py-4 cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative flex items-center justify-center will-change-transform"
        style={{
          width: faceWidth,
          height: 380,
          transformStyle: "preserve-3d",
          rotateY: rotation,
        }}
        animate={controls}
      >
        {items.map((item, idx) => {
          const itemAngle = idx * anglePerItem;
          return (
            <div
              key={item.id || idx}
              className="absolute inset-0 rounded-2xl overflow-hidden border border-gold-500/40 shadow-2xl bg-jade-950/95"
              style={{
                width: faceWidth,
                height: 380,
                transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                backfaceVisibility: "hidden",
              }}
              onClick={() => onItemClick && onItemClick(item)}
            >
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover pointer-events-none" />
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-cartoon text-gold-400 uppercase tracking-wider block">{item.tag}</span>
                <h4 className="font-display text-lg font-black text-linen-100 uppercase">{item.name}</h4>
                <p className="text-xs font-fredoka text-linen-300 line-clamp-2">{item.desc}</p>
                <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs font-mono text-gold-300">
                  <span>{item.price}</span>
                  <span className="text-gold-400 font-bold">Ver Detalles →</span>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
```

---

## 5. image-auto-slider.jsx
> **Propósito:** Carrusel infinito continuo y suave (sin cortes ni saltos) para galería de fauna y atracciones.

```jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function ImageAutoSlider({ items = [], onItemClick }) {
  // Duplicar elementos para efecto de cinta sin fin
  const duplicatedItems = [...items, ...items];

  return (
    <div className="w-full overflow-hidden py-4 select-none relative">
      <motion.div
        className="flex gap-4 sm:gap-6 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            onClick={() => onItemClick && onItemClick(item)}
            className="w-64 sm:w-80 flex-shrink-0 rounded-2xl overflow-hidden glass-dark border border-white/10 hover:border-gold-500/50 transition-all duration-300 cursor-pointer group shadow-xl hover:-translate-y-1.5"
          >
            <div className="relative h-44 sm:h-52 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-transparent to-transparent" />
            </div>
            <div className="p-4 space-y-1">
              <span className="text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-wider block">
                {item.category || "Especie Protegida"}
              </span>
              <h4 className="font-display text-base sm:text-lg font-black text-linen-100 uppercase">
                {item.name}
              </h4>
              <p className="text-xs font-fredoka text-linen-300 line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
```

---

## 6. QuickBookingBar.jsx (Cotización Directa a WhatsApp)
> **Propósito:** Buscador rápido flotante en el Hero para cotizar pasadías, hospedaje y pasanocturnos con fecha, adultos y mascotas, abriendo WhatsApp con texto codificado automáticamente.

```jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Sun, Moon, Users, Send } from 'lucide-react';

const EXPERIENCES = [
  { id: 'cabana', title: 'Cabañas Luxury', phone: '573100000000', icon: Home },
  { id: 'pasadia', title: 'Pasadía de Aventura', phone: '573100000000', icon: Sun },
  { id: 'pasanoche', title: 'Pasanoche Mágico', phone: '573100000000', icon: Moon },
  { id: 'eventos', title: 'Grupos & Eventos', phone: '573100000000', icon: Users },
];

export default function QuickBookingBar() {
  const [selectedExp, setSelectedExp] = useState(EXPERIENCES[0]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [adults, setAdults] = useState(2);
  const [pets, setPets] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = `¡Hola Andicas Bioparque Temático! 🌿✨
Deseo verificar disponibilidad para mi visita:
📍 *Experiencia:* ${selectedExp.title}
📅 *Fecha:* ${selectedDate}
👥 *Personas:* ${adults}
🐾 *Mascotas:* ${pets > 0 ? `${pets} Mascota(s)` : 'Ninguna'}

¿Me podrían brindar información de disponibilidad y el proceso de reserva con el 50% de anticipo? Muchas gracias.`;

    const url = `https://wa.me/${selectedExp.phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="w-full max-w-5xl mx-auto rounded-2xl p-4 sm:p-5 bg-jade-950/95 border border-gold-600/40 shadow-2xl relative z-40"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
        {/* Selector de Experiencia */}
        <div className="space-y-1 text-left">
          <label className="text-xs font-cartoon font-bold text-gold-400 uppercase">Experiencia</label>
          <select
            value={selectedExp.id}
            onChange={(e) => setSelectedExp(EXPERIENCES.find((x) => x.id === e.target.value))}
            className="w-full bg-jade-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-fredoka text-linen-100"
          >
            {EXPERIENCES.map((exp) => (
              <option key={exp.id} value={exp.id}>{exp.title}</option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="space-y-1 text-left">
          <label className="text-xs font-cartoon font-bold text-gold-400 uppercase">Fecha de Visita</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-jade-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-fredoka text-linen-100"
          />
        </div>

        {/* Huéspedes */}
        <div className="space-y-1 text-left">
          <label className="text-xs font-cartoon font-bold text-gold-400 uppercase">Personas / Mascotas</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="30"
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
              className="w-1/2 bg-jade-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-fredoka text-linen-100"
              placeholder="Adultos"
            />
            <input
              type="number"
              min="0"
              max="5"
              value={pets}
              onChange={(e) => setPets(parseInt(e.target.value) || 0)}
              className="w-1/2 bg-jade-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-fredoka text-linen-100"
              placeholder="Mascotas"
            />
          </div>
        </div>

        {/* Botón CTA WhatsApp */}
        <button
          type="submit"
          className="w-full h-[46px] rounded-xl bg-gold-gradient hover:brightness-110 text-jade-950 font-cartoon font-bold text-sm uppercase flex items-center justify-center gap-2 shadow-gold-glow btn-shimmer cursor-pointer transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>Consultar WhatsApp</span>
        </button>
      </form>
    </motion.div>
  );
}
```

---

## 7. Preloader.jsx (Pantalla de Carga Optimizada)
> **Propósito:** Preloader suave de 1.4s que no satura la memoria GPU en móviles y se desvanece de forma limpia.

```jsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Preloader({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#051e1f] select-none pointer-events-auto touch-none overflow-hidden px-4"
      style={{
        background: 'radial-gradient(circle at center, #0a383a 0%, #062627 65%, #021213 100%)',
      }}
    >
      <motion.div
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-56 h-56 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-gold-500/25 via-gold-400/15 to-teal-400/20 filter blur-3xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-40 sm:w-56 md:w-64 h-auto flex items-center justify-center will-change-transform"
        >
          <img
            src="/logo sin fondo.png"
            alt="Logo Oficial"
            className="w-full h-auto object-contain filter drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        <div className="mt-7 w-28 sm:w-36 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className="w-1/2 h-full bg-gold-gradient rounded-full shadow-gold-glow"
          />
        </div>
      </div>
    </motion.div>
  );
}
```
