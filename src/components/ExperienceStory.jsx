import React from 'react';
import { motion } from 'framer-motion';
import { CardStack } from './ui/card-stack';
import { attractions } from '../data/attractions';

export default function ExperienceStory({ customConfig = {} }) {
  const currentAttractions = (customConfig.attractions && Array.isArray(customConfig.attractions) && customConfig.attractions.length > 0)
    ? customConfig.attractions.filter(item => item.enabled !== false)
    : attractions;

  const stackItems = currentAttractions.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    imageSrc: item.image,
    tag: item.badge,
    highlights: Array.isArray(item.highlights) 
      ? item.highlights 
      : (typeof item.highlights === 'string' ? item.highlights.split(',').map(s => s.trim()) : []),
  }));

  return (
    <section id="experiencia" aria-labelledby="experiencia-heading" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Single Clean Master Header */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 id="experiencia-heading" className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-linen-100 leading-tight mb-4 uppercase">
            {customConfig.atraccionesSectionTitle ? (
              customConfig.atraccionesSectionTitle
            ) : (
              <>
                UN REFUGIO DE NATURALEZA &{' '}
                <span className="text-3d-gold">AVENTURA</span>
              </>
            )}
          </h2>

          <p className="text-linen-200 font-fredoka text-sm sm:text-base font-normal leading-relaxed max-w-2xl mx-auto">
            {customConfig.atraccionesSectionSubtitle || 'Inspirados en la armonía y sabiduría de la cultura ancestral Andica, hemos creado un ecosistema donde el descanso se funde con piscinas de roca natural, cavernas con cascada, miradores y senderos vivos.'}
          </p>
        </motion.div>

        {/* CardStack 3D Arrival - Visible Gliding Animation */}
        <motion.div
          initial={{ opacity: 0, y: 70, scale: 0.90 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ type: "spring", stiffness: 75, damping: 14, delay: 0.15 }}
          className="max-w-4xl mx-auto pt-2"
        >
          <CardStack
            items={stackItems}
            cardWidth={520}
            cardHeight={320}
            autoAdvance={true}
            intervalMs={3200}
            overlap={0.45}
            spreadDeg={38}
            showDots={true}
          />
        </motion.div>
      </div>
    </section>
  );
}
