import React, { useEffect, useState } from 'react';

interface IntroProps {
  onComplete: () => void;
}

export const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setTimeout(() => setStage(1), 500);
    setTimeout(() => setStage(2), 1200);
    setTimeout(() => setStage(3), 2500);
    setTimeout(onComplete, 3000);
  }, [onComplete]);

  if (stage === 3) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#020617',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.7s ease',
        opacity: stage === 3 ? 0 : 1,
        pointerEvents: stage === 3 ? 'none' : 'auto'
      }}
    >
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Glow Effects */}
        <div style={{
            position: 'absolute',
            inset: '-5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-cyan)',
            filter: 'blur(100px)',
            transition: 'all 1s',
            opacity: stage >= 1 ? 0.2 : 0,
            transform: stage >= 1 ? 'scale(1.5)' : 'scale(0.5)'
        }}></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          <h1 style={{
              fontSize: '4rem',
              fontWeight: 800,
              letterSpacing: '-0.05em',
              transition: 'all 1s',
              display: 'flex',
              gap: '1rem',
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? 'translateY(0)' : 'translateY(40px)',
              fontFamily: 'var(--font-display)'
          }}>
            <span style={{ color: 'white' }}>BHATTI'S</span>
            <span style={{ color: 'var(--color-cyan)', textShadow: '0 0 30px rgba(0,243,255,0.5)' }}>AI</span>
          </h1>
          
          <div style={{ overflow: 'hidden', marginTop: '1rem' }}>
             <p style={{
                 color: 'var(--text-muted)',
                 fontSize: '1.125rem',
                 letterSpacing: '0.3em',
                 fontFamily: 'monospace',
                 fontWeight: 700,
                 textTransform: 'uppercase',
                 transition: 'all 0.7s 0.2s',
                 transform: stage >= 1 ? 'translateY(0)' : 'translateY(100%)',
                 opacity: stage >= 1 ? 1 : 0
             }}>
               INITIALIZING SUITE
             </p>
          </div>
        </div>

        {/* Loading Line */}
        <div style={{
            marginTop: '3rem',
            height: '4px',
            width: '12rem',
            backgroundColor: '#1e293b',
            borderRadius: '99px',
            overflow: 'hidden',
            position: 'relative'
        }}>
          <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--color-gold)',
              transition: 'width 1.5s ease-out',
              boxShadow: '0 0 10px var(--color-gold)',
              width: stage >= 2 ? '100%' : '0%'
          }}></div>
        </div>
      </div>
    </div>
  );
};