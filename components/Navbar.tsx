import React, { useState, useEffect } from 'react';
import { Section, ThemePalette } from '../types';
import { Zap, Grid, Fingerprint, FileText, QrCode, Database, Megaphone, Palette, Menu, X, ChevronRight } from 'lucide-react';

interface NavbarProps {
  currentSection: Section;
  onNavigate: (section: Section) => void;
}

const PALETTES: ThemePalette[] = [
  { 
    id: 'neon', 
    name: 'Cyber Neon', 
    primary: '#00f3ff', 
    secondary: '#00c2cc', 
    bg: '#020617', 
    text: '#f1f5f9' 
  },
  { 
    id: 'vintage-wedding', 
    name: 'Vintage Wedding', 
    primary: '#6B3F69', // Deep Purple
    secondary: '#8D5F8C', // Muted Purple
    bg: '#DDC3C3', // Vintage Beige/Pink
    text: '#2D182B' // High-contrast Deep Espresso
  },
];

export const Navbar: React.FC<NavbarProps> = ({ currentSection, onNavigate }) => {
  const [activePalette, setActivePalette] = useState<string>(() => localStorage.getItem('theme_palette') || 'neon');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  useEffect(() => {
    const palette = PALETTES.find(p => p.id === activePalette) || PALETTES[0];
    const root = document.documentElement;
    root.style.setProperty('--primary-color', palette.primary);
    root.style.setProperty('--secondary-color', palette.secondary);
    root.style.setProperty('--bg-color', palette.bg);
    root.style.setProperty('--text-color', palette.text);
    
    if (activePalette === 'vintage-wedding') {
      root.classList.add('light-theme');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light-theme');
      root.classList.add('dark');
    }
    
    localStorage.setItem('theme_palette', activePalette);
  }, [activePalette]);

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
      <nav className="h-20 sticky top-0 z-50 bg-theme-bg/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between px-8 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Zap size={28} className="text-primary fill-primary relative z-10 animate-glow" />
            <div className="absolute inset-0 bg-primary blur-xl opacity-40"></div>
          </div>
          <div className="text-xl font-bold font-display tracking-tight text-theme-text">
            <span>BHATTI'S</span> <span className="text-primary">AI TOOLS</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
                onClick={() => setShowPaletteMenu(!showPaletteMenu)}
                className="p-3 rounded-full bg-black/5 dark:bg-theme-bg border border-black/10 dark:border-white/10 text-theme-text hover:text-primary transition-all shadow-sm"
            >
                <Palette size={20} />
            </button>
            
            {showPaletteMenu && (
                <div className="absolute right-0 mt-3 w-48 glass-card rounded-2xl p-2 shadow-2xl z-50 animate-pop-in">
                    {PALETTES.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => { setActivePalette(p.id); setShowPaletteMenu(false); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/10 dark:hover:bg-white/10 ${activePalette === p.id ? 'bg-black/20 dark:bg-white/20' : ''}`}
                        >
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }}></div>
                            <span className="text-[10px] font-bold text-theme-text uppercase tracking-widest">{p.name}</span>
                        </button>
                    ))}
                </div>
            )}
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isMenuOpen ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-primary/10 text-primary border border-primary/30'}`}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-theme-bg/95 backdrop-blur-2xl" onClick={() => setIsMenuOpen(false)}></div>
          <div className={`absolute top-24 right-8 w-full max-w-sm glass-card border border-black/10 dark:border-white/10 rounded-[40px] shadow-2xl p-8 transform transition-all duration-500 ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
              <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-4 ml-4 text-theme-text">Workspace Selection</span>
                  {navItems.map((item) => {
                      const isActive = currentSection === item.id;
                      return (
                          <button
                              key={item.id}
                              onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
                              className={`flex items-center gap-4 p-5 rounded-[24px] transition-all group ${isActive ? 'bg-primary text-white dark:text-black shadow-neon' : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-theme-text'}`}
                          >
                              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-black/20 text-white dark:text-black' : 'bg-black/10 dark:bg-slate-800 text-slate-500 group-hover:text-primary'}`}>
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

// Dummy component for type consistency in navItems
const ShieldCheck = (props: any) => <FileText {...props} />;
