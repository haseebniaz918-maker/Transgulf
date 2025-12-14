import React from 'react';
import { Section } from '../types';
import { Zap, Grid, Fingerprint, FileText, QrCode, Database, Megaphone } from 'lucide-react';

interface NavbarProps {
  currentSection: Section;
  onNavigate: (section: Section) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentSection, onNavigate }) => {
  const navItems = [
    { id: Section.PDF_TOOLS, label: 'PDF Tools', icon: Grid },
    { id: Section.IDENTITY_LAB, label: 'Identity Lab', icon: Fingerprint },
    { id: Section.CV_FORGE, label: 'CV Forge', icon: FileText },
    { id: Section.NOMINATION, label: 'Nomination', icon: QrCode },
    { id: Section.ADS_MAKER, label: 'Ads Maker', icon: Megaphone },
    { id: Section.DATA_ENTRIES, label: 'Data Entries', icon: Database }, 
  ];

  return (
    <nav className="h-20 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8">
      {/* Logo Section */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <Zap size={28} className="text-gold fill-gold relative z-10" />
          <div className="absolute inset-0 bg-gold blur-xl opacity-40"></div>
        </div>
        <div className="text-xl font-bold font-display tracking-tight">
          <span className="text-white">BHATTI'S</span> <span className="text-cyan-400">AI TOOLS</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-slate-900/80 p-1.5 rounded-full border border-white/5 overflow-x-auto max-w-[60vw]">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300 whitespace-nowrap
                ${isActive 
                  ? 'bg-cyan-400 text-black shadow-neon' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <item.icon size={16} className={isActive ? 'text-black' : 'currentColor'} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};