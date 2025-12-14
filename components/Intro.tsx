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
      className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-700 ${stage === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow Effects */}
        <div className={`absolute -inset-20 rounded-full bg-cyan-400 blur-[100px] transition-all duration-1000 ${stage >= 1 ? 'opacity-20 scale-150' : 'opacity-0 scale-50'}`}></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <h1 className={`text-6xl md:text-8xl font-display font-bold tracking-tighter flex gap-4 transition-all duration-1000 ${stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="text-white">BHATTI'S</span>
            <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(0,243,255,0.5)]">AI</span>
          </h1>
          
          <div className="overflow-hidden mt-4">
             <p className={`text-slate-400 text-lg md:text-xl font-mono font-bold tracking-[0.3em] uppercase transition-all duration-700 delay-200 ${stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
               INITIALIZING SUITE
             </p>
          </div>
        </div>

        {/* Loading Line */}
        <div className="mt-12 h-1 w-48 bg-slate-800 rounded-full overflow-hidden relative">
          <div className={`absolute inset-0 bg-gold shadow-[0_0_10px_#ffd700] transition-all duration-[1500ms] ease-out ${stage >= 2 ? 'w-full' : 'w-0'}`}></div>
        </div>
      </div>
    </div>
  );
};