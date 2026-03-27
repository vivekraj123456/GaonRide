import React, { useRef, useCallback } from 'react';

interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;
  glare?: boolean;
}

export const Tilt3D: React.FC<Tilt3DProps> = ({ children, className = '', style = {}, intensity = 12, glare = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

    if (glareRef.current) {
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      glareRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.2) 0%, transparent 60%)`;
      glareRef.current.style.opacity = '1';
    }
  }, [intensity]);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    if (glareRef.current) glareRef.current.style.opacity = '0';
    setTimeout(() => { if (el) el.style.transition = 'transform 0.1s ease-out'; }, 500);
  }, []);

  const handleEnter = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transition = 'transform 0.1s ease-out';
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, transformStyle: 'preserve-3d', willChange: 'transform' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onMouseEnter={handleEnter}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.3s',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

// Floating particles background (pure CSS, no Three.js)
export const ParticlesBg: React.FC = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 8,
    opacity: Math.random() * 0.3 + 0.05,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,204,0,${p.opacity + 0.2}), rgba(255,204,0,0))`,
            boxShadow: `0 0 ${p.size * 3}px rgba(255,204,0,${p.opacity})`,
            animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes particleFloat {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(-20px, 30px) scale(1.3); opacity: 0.7; }
          50% { transform: translate(15px, -25px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(-10px, 15px) scale(1.1); opacity: 0.6; }
          100% { transform: translate(25px, -15px) scale(1); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

// Animated gradient border wrapper
export const GradientBorder: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', padding: 2 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: 'conic-gradient(from 0deg, var(--primary), var(--accent), var(--orange), var(--accent), var(--primary))',
        animation: 'borderSpin 4s linear infinite',
        opacity: 0.6,
      }} />
      <div className={className} style={{ position: 'relative', borderRadius: 'inherit', background: 'white' }}>
        {children}
      </div>
      <style>{`
        @keyframes borderSpin {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const HeroBackdrop3D: React.FC<{
  className?: string;
  variant?: 'gold' | 'emerald' | 'sunset';
  motif?: 'home' | 'rides' | 'deliveries' | 'events' | 'partner' | 'contact';
}> = ({ className = '', variant = 'gold', motif }) => {
  const motifs = {
    home: [
      {
        className: 'motif-home-1',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M16 64L60 28l44 36" />
            <path d="M30 56v32h60V56" />
            <path d="M52 88V68h16v20" />
          </svg>
        ),
      },
      {
        className: 'motif-home-2 alt',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M20 80c12-18 30-28 50-28s38 10 50 28" />
            <circle cx="40" cy="80" r="6" />
            <circle cx="80" cy="80" r="6" />
            <path d="M60 52v28" />
          </svg>
        ),
      },
      {
        className: 'motif-home-3',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M24 70h72l-6-18H30l-6 18z" />
            <path d="M40 52l10-14h20l10 14" />
            <circle cx="40" cy="74" r="8" />
            <circle cx="80" cy="74" r="8" />
          </svg>
        ),
      },
    ],
    rides: [
      {
        className: 'motif-rides-1',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M20 70h80l-7-20H27l-7 20z" />
            <path d="M38 50l12-16h20l12 16" />
            <circle cx="38" cy="74" r="8" />
            <circle cx="82" cy="74" r="8" />
          </svg>
        ),
      },
      {
        className: 'motif-rides-2 alt',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M60 18c-16 0-28 12-28 28 0 22 28 56 28 56s28-34 28-56c0-16-12-28-28-28z" />
            <circle cx="60" cy="46" r="10" />
          </svg>
        ),
      },
      {
        className: 'motif-rides-3',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <circle cx="60" cy="60" r="26" />
            <path d="M60 34v18M60 86V68M34 60h18M86 60H68" />
            <circle cx="60" cy="60" r="6" />
          </svg>
        ),
      },
    ],
    deliveries: [
      {
        className: 'motif-deliveries-1',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <rect x="22" y="42" width="76" height="46" rx="6" />
            <path d="M22 58h76" />
            <path d="M46 42v46" />
          </svg>
        ),
      },
      {
        className: 'motif-deliveries-2 alt',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <rect x="18" y="54" width="52" height="24" rx="4" />
            <path d="M70 58h18l14 14v6H70z" />
            <circle cx="36" cy="82" r="6" />
            <circle cx="82" cy="82" r="6" />
          </svg>
        ),
      },
      {
        className: 'motif-deliveries-3',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M24 80c14-22 34-34 56-34" />
            <path d="M80 46l-8-8m8 8l-8 8" />
            <rect x="72" y="64" width="28" height="24" rx="4" />
          </svg>
        ),
      },
    ],
    events: [
      {
        className: 'motif-events-1',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M18 84L60 32l42 52" />
            <path d="M34 84l26-32 26 32" />
            <path d="M20 84h80" />
          </svg>
        ),
      },
      {
        className: 'motif-events-2 alt',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M70 30v46a12 12 0 1 1-10-12" />
            <path d="M70 30l22-6v44a12 12 0 1 1-10-12" />
          </svg>
        ),
      },
      {
        className: 'motif-events-3',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M60 26l8 18 20 2-14 14 4 20-18-10-18 10 4-20-14-14 20-2z" />
          </svg>
        ),
      },
    ],
    partner: [
      {
        className: 'motif-partner-1',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <circle cx="60" cy="42" r="16" />
            <path d="M28 92c6-18 20-28 32-28s26 10 32 28" />
          </svg>
        ),
      },
      {
        className: 'motif-partner-2 alt',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <circle cx="60" cy="60" r="28" />
            <text x="60" y="68" textAnchor="middle" fontSize="28" fontFamily="Outfit, sans-serif">₹</text>
          </svg>
        ),
      },
      {
        className: 'motif-partner-3',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M24 66l18 18 16-20 12 10 26-28" />
            <circle cx="42" cy="84" r="6" />
            <circle cx="84" cy="74" r="6" />
          </svg>
        ),
      },
    ],
    contact: [
      {
        className: 'motif-contact-1',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M40 26h40a8 8 0 0 1 8 8v52a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z" />
            <path d="M48 36h24" />
            <circle cx="60" cy="82" r="6" />
          </svg>
        ),
      },
      {
        className: 'motif-contact-2 alt',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M24 40h72v40H54l-18 14v-14H24z" />
          </svg>
        ),
      },
      {
        className: 'motif-contact-3',
        svg: (
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <path d="M60 18c-16 0-28 12-28 28 0 22 28 56 28 56s28-34 28-56c0-16-12-28-28-28z" />
            <circle cx="60" cy="46" r="10" />
          </svg>
        ),
      },
    ],
  } as const;

  const motifItems = motif ? motifs[motif] : [];

  return (
    <div className={`hero-bg hero-bg-3d ${className}`} data-variant={variant} aria-hidden="true">
      <div className="hero-3d-aurora" />
      <div className="hero-3d-grid" />
      <div className="hero-3d-orb orb-1" />
      <div className="hero-3d-orb orb-2" />
      <div className="hero-3d-orb orb-3" />
      <div className="hero-3d-ring" />
      <div className="hero-3d-sparkles" />
      {motifItems.length > 0 && (
        <div className="hero-3d-motifs" aria-hidden="true">
          {motifItems.map(item => (
            <div key={item.className} className={`hero-3d-motif ${item.className}`} aria-hidden="true">
              {item.svg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
