import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";

export function ThreeDPhotoCarousel({
  items = [],
  onItemClick,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const rotation = useMotionValue(0);
  const pointerStartRef = useRef({ x: 0, time: 0 });
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Responsive dimensions for exact geometric 3D cylinder
  const [faceWidth, setFaceWidth] = useState(260);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setFaceWidth(210);
      } else if (w < 1024) {
        setFaceWidth(250);
      } else {
        setFaceWidth(280);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const count = items.length || 1;
  
  // Exact trigonometric geometric cylinder radius so faces NEVER overlap
  const anglePerItem = 360 / count;
  const radius = Math.max(
    280, 
    Math.round(faceWidth / (2 * Math.tan(Math.PI / count))) + 15
  );

  // Auto slow continuous rotation when not dragging
  useEffect(() => {
    let animationFrame;
    const autoRotate = () => {
      if (!isDragging) {
        rotation.set(rotation.get() - 0.10);
      }
      animationFrame = requestAnimationFrame(autoRotate);
    };
    animationFrame = requestAnimationFrame(autoRotate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isDragging, rotation]);

  // Pointer drag event handlers for pure rotational spin around center axis
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
    // Pure rotational change, zero linear X displacement
    rotation.set(rotation.get() + deltaX * 0.32);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Add inertia spin on release
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
      {/* 3D Viewport Stage */}
      <div
        className="flex items-center justify-center w-full h-full pointer-events-none"
        style={{
          perspective: "1400px",
        }}
      >
        {/* Perfectly centered 3D cylinder root - Locked on axis */}
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
                <div className="w-full h-full rounded-2xl overflow-hidden glass-dark border border-gold-500/40 shadow-2xl relative group hover:border-gold-400 hover:shadow-gold-glow transition-all flex flex-col justify-end p-5 select-none">
                  {/* Photo with zoom on hover */}
                  <div className="absolute inset-0">
                    <img
                      src={item.image || item.gallery?.[0]}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/60 to-transparent pointer-events-none" />
                  </div>

                  {/* Bottom Text Content - Clean without cluttering top tags */}
                  <div className="relative z-10 space-y-1.5 text-left">
                    <h3 className="font-display text-lg sm:text-xl font-black text-linen-100 uppercase tracking-wide group-hover:text-gold-300 transition-colors leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs font-fredoka">
                      <span className="text-linen-300">{item.capacity}</span>
                      <span className="font-mono font-bold text-gold-400">{item.priceFormatted || `$${item.price?.toLocaleString('es-CO')} COP`}</span>
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
