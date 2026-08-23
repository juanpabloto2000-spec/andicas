import React, { useMemo } from 'react';

export default function AmbientFireflies({ count = 22, className = '' }) {
  // Generate stable deterministic particle properties
  const fireflies = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${(i * 19 + 7) % 96}%`,
      top: `${(i * 23 + 11) % 92}%`,
      size: `${3 + (i % 4) * 1.5}px`,
      duration: `${6 + (i % 6) * 1.8}s`,
      delay: `${(i % 7) * 0.9}s`,
      color: i % 3 === 0 ? 'rgba(216, 162, 50, 0.85)' : i % 3 === 1 ? 'rgba(83, 158, 67, 0.75)' : 'rgba(252, 212, 119, 0.9)',
      glow: i % 2 === 0 ? '0 0 12px rgba(216, 162, 50, 0.8)' : '0 0 10px rgba(83, 158, 67, 0.7)',
    }));
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden z-10 ${className}`} aria-hidden="true">
      {fireflies.map((fly) => (
        <span
          key={fly.id}
          className="absolute rounded-full animate-firefly"
          style={{
            left: fly.left,
            top: fly.top,
            width: fly.size,
            height: fly.size,
            backgroundColor: fly.color,
            boxShadow: fly.glow,
            animationDuration: fly.duration,
            animationDelay: fly.delay,
          }}
        />
      ))}
    </div>
  );
}
