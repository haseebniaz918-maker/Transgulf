import React from 'react';
import { Section } from '../types';
import { Zap, Command, Box, Layers } from 'lucide-react';

interface SidebarProps {
  currentSection: Section;
  onNavigate: (section: Section) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate }) => {
  return (
    <div className="w-20 md:w-24 flex-shrink-0 bg-black/30 backdrop-blur-2xl border-r border-white/5 flex flex-col h-screen z-20 relative shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
      <div className="h-24 flex flex-col items-center justify-center border-b border-white/5">
        <div className="w-12 h-12 rounded-xl bg-black/50 border border-neon-cyan/50 shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center justify-center animate-pulse-glow">
          <Command className="text-neon-cyan w-6 h-6" />
        </div>
      </div>

      <nav className="flex-1 py-8 flex flex-col items-center gap-6">
        <button
          className="relative group flex flex-col items-center justify-center p-3 w-16 h-16 rounded-2xl transition-all duration-300 bg-black/40 border border-neon-pink/50 shadow-[0_0_10px_rgba(255,0,255,0.2)]"
        >
          <div className="absolute inset-0 bg-neon-pink/10 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <Layers className="w-6 h-6 text-neon-pink relative z-10" />
          <span className="text-[10px] font-bold text-neon-pink mt-1 relative z-10">TOOLS</span>
        </button>

        <div className="w-8 h-[1px] bg-slate-800/50 my-2"></div>

        <button className="group p-3 rounded-xl hover:bg-white/5 transition-all opacity-50 hover:opacity-100">
           <Box className="w-5 h-5 text-slate-400 group-hover:text-white" />
        </button>
      </nav>

      <div className="p-4 flex flex-col items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-neon-lime shadow-[0_0_8px_#0aff00] animate-flicker"></div>
        <span className="text-[9px] text-neon-lime font-mono tracking-widest opacity-80">ONLINE</span>
      </div>
    </div>
  );
};