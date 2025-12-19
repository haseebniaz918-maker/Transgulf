import React, { useState, useEffect } from 'react';
import { Section } from '../types';
import { Zap, Grid, Fingerprint, FileText, QrCode, Database, Megaphone, Sun, Moon, ShieldCheck, Menu, X, ChevronRight } from 'lucide-react';

interface NavbarProps {
  currentSection: Section;
  onNavigate: (section: Section) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentSection, onNavigate }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-slate-950', 'text-slate-200');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('bg-white', 'text-slate-900');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navItems = [
    { id: Section.PDF_TOOLS, label: 'PDF Tools', icon: Grid },
    { id: Section.IDENTITY_LAB, label: 'Identity Lab', icon: Fingerprint },
    { id: Section.CV_FORGE, label: 'CV Forge', icon: FileText },
    { id: Section.NOMINATION, label: 'Nomination', icon: QrCode },
    { id: Section.ADS_MAKER, label: 'Ads Maker', icon: Megaphone },
    { id: Section.DATA_ENTRIES, label: 'Data Entries', icon: Database }, 
    { id: Section.VISA_MEDICAL_HUB, label: 'Visa & Medical', icon: ShieldCheck }, 
  ];

  return (
    <>
      <nav className="h-20 sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-8 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Zap size={28} className="text-gold fill-gold relative z-10" />
            <div className="absolute inset-0 bg-gold blur-xl opacity-40"></div>
          </div>
          <div className="text-xl font-bold font-display tracking-tight">
            <span className="text-slate-900 dark:text-white">BHATTI'S</span> <span className="text-cyan-500 dark:text-cyan-400">AI TOOLS</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-cyan-500 transition-all"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isMenuOpen ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30'}`}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={() => setIsMenuOpen(false)}></div>
          <div className={`absolute top-24 right-8 w-full max-w-sm bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl p-8 transform transition-all duration-500 ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
              <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-4">Workspace Selection</span>
                  {navItems.map((item) => {
                      const isActive = currentSection === item.id;
                      return (
                          <button
                              key={item.id}
                              onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
                              className={`flex items-center gap-4 p-5 rounded-[24px] transition-all group ${isActive ? 'bg-cyan-400 text-black shadow-neon' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                          >
                              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-black text-cyan-400' : 'bg-slate-800 text-slate-500 group-hover:text-cyan-400'}`}>
                                  <item.icon size={20} />
                              </div>
                              <span className="flex-1 text-left font-bold text-sm">{item.label}</span>
                              <ChevronRight size={16} className={`transition-all ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'}`} />
                          </button>
                      );
                  })}
              </div>
          </div>
      </div>
    </>
  );
};