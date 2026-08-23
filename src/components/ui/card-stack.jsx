"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  motion,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const CardStack = forwardRef(function CardStack(
  {
    items = [],
    initialIndex = 0,
    cardWidth = 520,
    cardHeight = 350,
    autoAdvance = true,
    intervalMs = 4200,
    pauseOnHover = true,
    enableDrag = true,
    showDots = true,
    renderCard,
    onCardClick,
    onChange,
    className,
  },
  ref
) {
  const count = items.length;
  const [active, setActive] = useState(
    Math.min(Math.max(0, initialIndex), count - 1)
  );
  const [isHovered, setIsHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [spacing, setSpacing] = useState(260);
  const timerRef = useRef(null);

  // Check window width for responsive side-card spacing
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setSpacing(150);
      } else if (w < 1024) {
        setSpacing(210);
      } else {
        setSpacing(280);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const next = useCallback(() => {
    if (count <= 1) return;
    setActive((prev) => {
      const nextIdx = (prev + 1) % count;
      onChange?.(nextIdx);
      return nextIdx;
    });
  }, [count, onChange]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setActive((prev) => {
      const prevIdx = (prev - 1 + count) % count;
      onChange?.(prevIdx);
      return prevIdx;
    });
  }, [count, onChange]);

  const setIndex = useCallback(
    (index) => {
      if (index >= 0 && index < count) {
        setActive(index);
        onChange?.(index);
      }
    },
    [count, onChange]
  );

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    next,
    prev,
    setIndex,
    getActiveIndex: () => active,
  }));

  // Auto-advance loop
  useEffect(() => {
    if (!autoAdvance || count <= 1 || (pauseOnHover && isHovered)) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(next, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoAdvance, intervalMs, count, isHovered, pauseOnHover, next]);

  if (!count) return null;

  return (
    <div
      className={cn("relative select-none w-full max-w-6xl mx-auto px-4", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Side-by-Side Coverflow Stage with Real Perspective */}
      <div
        className="relative mx-auto flex items-center justify-center py-6 overflow-hidden"
        style={{
          width: "100%",
          height: cardHeight + 60,
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        <div 
          className="relative h-full w-full flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((item, i) => {
            // Calculate shortest circular difference between index i and active
            let diff = i - active;
            if (diff > count / 2) diff -= count;
            if (diff < -count / 2) diff += count;

            const isActive = diff === 0;
            const isVisible = Math.abs(diff) <= 2;
            if (!isVisible) return null;

            // Geometry for 3D Angled Coverflow:
            // Side cards tilt inward (Left: +34deg, Right: -34deg, Center: 0deg straight)
            const x = diff * spacing;
            const z = isActive ? 0 : -90 * Math.abs(diff);
            const scale = isActive ? 1 : 0.82;
            const opacity = isActive ? 1 : 0.55;
            const rotateY = diff < 0 ? 34 : diff > 0 ? -34 : 0;
            const zIndex = 20 - Math.abs(diff);

            const dragProps = enableDrag && isActive
              ? {
                  drag: "x",
                  dragConstraints: { left: 0, right: 0 },
                  dragElastic: 0.5,
                  onDragEnd: (_, info) => {
                    if (reduceMotion) return;
                    const travel = info.offset.x;
                    const v = info.velocity.x;
                    if (travel > 60 || v > 300) prev();
                    else if (travel < -60 || v < -300) next();
                  },
                }
              : {};

            return (
              <motion.div
                key={item.id}
                className={cn(
                  "absolute rounded-3xl border overflow-hidden shadow-2xl bg-jade-950",
                  "will-change-transform select-none transition-all duration-500",
                  isActive
                    ? "cursor-grab active:cursor-grabbing border-gold-400 shadow-gold-glow-lg ring-2 ring-gold-400/50 glow-gold-pulse"
                    : "cursor-pointer border-white/15 hover:border-gold-500/40 opacity-60 hover:opacity-85"
                )}
                style={{
                  width: cardWidth,
                  maxWidth: "88vw",
                  height: cardHeight,
                  zIndex,
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  x,
                  z,
                  scale,
                  opacity,
                  rotateY,
                }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 24,
                  mass: 0.8,
                }}
                onClick={() => {
                  if (isActive && onCardClick) {
                    onCardClick(item);
                  } else {
                    setActive(i);
                  }
                }}
                {...dragProps}
              >
                <div className="h-full w-full">
                  {renderCard ? (
                    renderCard(item, { active: isActive })
                  ) : (
                    <DefaultCardView item={item} active={isActive} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Animated Navigation Arrows with Spring Bounce */}
        <motion.button
          whileHover={{ scale: 1.15, x: -3 }}
          whileTap={{ scale: 0.9 }}
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-2 sm:left-6 z-30 p-3 rounded-full bg-jade-950/90 border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-jade-950 transition-colors cursor-pointer shadow-gold-glow backdrop-blur-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15, x: 3 }}
          whileTap={{ scale: 0.9 }}
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-2 sm:right-6 z-30 p-3 rounded-full bg-jade-950/90 border border-gold-500/50 text-gold-400 hover:bg-gold-500 hover:text-jade-950 transition-colors cursor-pointer shadow-gold-glow backdrop-blur-md"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Dots Indicator with Smooth Expansion */}
      {showDots && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {items.map((it, idx) => {
            const on = idx === active;
            return (
              <button
                key={it.id}
                onClick={() => setActive(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer",
                  on ? "w-10 bg-gold-gradient shadow-gold-glow scale-105" : "w-2.5 bg-white/25 hover:bg-white/50"
                )}
                aria-label={`Ir a ${it.title}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

function DefaultCardView({ item, active }) {
  return (
    <div className="relative h-full w-full flex flex-col justify-end p-6 sm:p-8 overflow-hidden group">
      {/* Background Image with Zoom on Hover/Active */}
      <div className="absolute inset-0 overflow-hidden">
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt={item.title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-700 pointer-events-none",
              active ? "scale-105 group-hover:scale-110" : "scale-100"
            )}
            draggable={false}
          />
        ) : (
          <div className="h-full w-full bg-jade-950" />
        )}
      </div>

      {/* Dark Vignette Overlay for Crisp Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/60 to-black/20 pointer-events-none" />

      {/* Content with Smooth Upward Drift */}
      <div className="relative z-10 space-y-2 text-left max-w-2xl">
        {item.tag && (
          <span className="text-[11px] font-cartoon font-bold text-gold-400 uppercase tracking-widest block drop-shadow">
            {item.tag}
          </span>
        )}
        <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-linen-100 uppercase tracking-wide leading-tight drop-shadow-md">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-xs sm:text-sm font-fredoka text-linen-200 leading-relaxed line-clamp-2 drop-shadow">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default CardStack;
