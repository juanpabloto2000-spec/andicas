import React from 'react';

export function ImageAutoSlider({ 
  items = [], 
  onItemClick, 
  activeId,
  className = ""
}) {
  // If items provided, duplicate for seamless infinite loop
  const duplicatedItems = [...items, ...items];

  return (
    <div className={`w-full relative overflow-hidden py-4 ${className}`}>
      <style>{`
        @keyframes scroll-infinite-slider {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-slider-track {
          display: flex;
          gap: 1.25rem;
          width: max-content;
          animation: scroll-infinite-slider 28s linear infinite;
        }

        .infinite-slider-track:hover {
          animation-play-state: paused;
        }

        .slider-mask {
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }
      `}</style>

      {/* Masked container */}
      <div className="slider-mask w-full max-w-7xl mx-auto overflow-hidden">
        <div className="infinite-slider-track py-2">
          {duplicatedItems.map((item, index) => {
            const isSelected = activeId && item.id === activeId;
            return (
              <div
                key={`${item.id}-${index}`}
                onClick={() => onItemClick && onItemClick(item)}
                className={`group flex-shrink-0 w-44 sm:w-56 h-56 sm:h-64 rounded-2xl overflow-hidden glass-card border cursor-pointer transition-all duration-300 relative select-none hover-lift ${
                  isSelected
                    ? 'border-gold-400 shadow-gold-glow scale-105 ring-2 ring-gold-400/50'
                    : 'border-white/10 hover:border-gold-400 hover:shadow-gold-glow'
                }`}
              >
                {/* Animal Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                  loading="lazy"
                />

                {/* Dark Gradient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-jade-950 via-jade-950/30 to-transparent" />

                {/* Top Species Tag */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 border border-gold-500/30 text-[9px] font-cartoon font-bold text-gold-300 uppercase tracking-wider backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  ★ {item.species || 'Especie Protegida'}
                </div>

                {/* Bottom Character Info */}
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <span className="text-[10px] font-cartoon font-bold text-gold-400 uppercase tracking-wider block leading-tight">
                    {item.role}
                  </span>
                  <h4 className="font-cartoon text-base sm:text-lg font-bold text-linen-100 uppercase group-hover:text-gold-300 transition-colors leading-snug">
                    {item.name}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ImageAutoSlider;
