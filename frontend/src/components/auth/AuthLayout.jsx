import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function AuthLayout({ children }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 8;
    const y = (clientY / innerHeight - 0.5) * 8;
    mouseX.set(x);
    mouseY.set(y);
  };

  const springConfig = { damping: 40, stiffness: 90, mass: 1.2 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  return (
    <div 
      className="min-h-screen w-full relative flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#070B16', fontFamily: "'Inter', sans-serif" }}
      onMouseMove={handleMouseMove}
    >
      {/* === BACKGROUND LAYERS === */}

      {/* Layer 1: Large purple glow */}
      <div 
        className="absolute pointer-events-none animate-[pulse_15s_ease-in-out_infinite]"
        style={{
          top: '5%',
          left: '15%',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(123,47,247,0.20) 0%, transparent 70%)',
          filter: 'blur(220px)',
        }}
      />

      {/* Layer 2: Pink glow */}
      <div 
        className="absolute pointer-events-none animate-[pulse_15s_ease-in-out_infinite_reverse]"
        style={{
          bottom: '0%',
          right: '10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(247,37,133,0.16) 0%, transparent 70%)',
          filter: 'blur(180px)',
        }}
      />

      {/* Layer 3: Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(7,11,22,0.6) 100%)',
        }}
      />

      {/* Layer 4: Animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: i % 2 === 0 ? 'rgba(139,92,246,0.4)' : 'rgba(236,72,153,0.3)',
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Layer 5: Grain texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.7%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* === CARD === */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ x: smoothX, y: smoothY }}
        className="relative z-10"
      >
        {/* Subtle card float animation */}
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
        >
          {/* Gradient border wrapper */}
          <div 
            className="relative rounded-[28px] p-[1.5px] overflow-hidden"
            style={{
              boxShadow: '0 0 80px rgba(123,47,247,0.08), 0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Gradient border */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.6) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.04) 60%, rgba(247,37,133,0.6) 100%)',
              }}
            />

            {/* Bottom rainbow accent */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-[2px] z-20"
              style={{
                background: 'linear-gradient(90deg, #7B2FF7, #8B5CF6, #D946EF, #EC4899, #F72585)',
              }}
            />

            {/* Inner card */}
            <div
              className="relative rounded-[26.5px] overflow-hidden"
              style={{
                width: '500px',
                minHeight: '700px',
                backgroundColor: 'rgba(20, 22, 35, 0.72)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 0.5px rgba(255,255,255,0.03)',
                padding: '52px 44px 44px 44px',
              }}
            >
              {/* Top highlight line */}
              <div 
                className="absolute top-0 left-[20%] right-[20%] h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                }}
              />

              {children}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
