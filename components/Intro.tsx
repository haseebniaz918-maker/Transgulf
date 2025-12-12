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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617] transition-all duration-700 ease-in-out ${
        stage === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow Effects */}
        <div className={`absolute -inset-20 rounded-full bg-[#00f3ff] opacity-10 blur-[100px] transition-all duration-1000 ${stage >= 1 ? 'scale-150 opacity-20' : 'scale-50 opacity-0'}`}></div>
        
        <div className="flex flex-col items-center">
          <h1 className={`text-6xl md:text-8xl font-display font-bold tracking-tighter transition-all duration-1000 transform flex gap-4 ${
            stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <span className="text-white">BHATTI'S</span>
            <span className="text-[#00f3ff]" style={{ textShadow: '0 0 30px rgba(0,243,255,0.5)' }}>AI</span>
          </h1>
          
          <div className="overflow-hidden mt-4">
             <p className={`text-slate-400 text-lg tracking-[0.3em] font-mono font-bold uppercase transition-all duration-700 delay-200 transform ${
               stage >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
             }`}>
               INITIALIZING SUITE
             </p>
          </div>
        </div>

        {/* Loading Line */}
        <div className="mt-12 h-1 w-48 bg-[#1e293b] rounded-full overflow-hidden relative">
          <div className={`absolute inset-0 bg-[#FFD700] transition-all duration-[1500ms] ease-out shadow-[0_0_10px_#FFD700] ${
            stage >= 2 ? 'w-full' : 'w-0'
          }`}></div>
        </div>
      </div>
    </div>
  );
};