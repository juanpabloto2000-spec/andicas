import React, { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';

export function AnimatedCounter({ 
  to = 100, 
  prefix = '', 
  suffix = '', 
  duration = 2.4,
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, to, {
        duration: duration,
        ease: [0.22, 1, 0.36, 1], // fluid cubic-bezier for clear visible counting
        onUpdate: (latest) => {
          setDisplayValue(Math.floor(latest));
        }
      });
      return () => controls.stop();
    }
  }, [isInView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
