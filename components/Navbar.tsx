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
    { id: Section.DATA_ENTRIES, label: 'Data Entries', icon: Database }, // Updated
  ];

  return (
    <nav className="h-20 border-b border-white/10 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
      {/* Logo Section */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Zap className="w-8 h-8 text-[#FFD700] fill-[#FFD700]" />
          <div className="absolute inset-0 bg-[#FFD700] blur-lg opacity-40"></div>
        </div>
        <div className="font-display font-bold text-2xl tracking-wide">
          <span className="text-white">BHATTI'S</span> <span className="text-[#00f3ff]">AI TOOLS</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="hidden lg:flex items-center gap-2 bg-[#0f172a] p-1.5 rounded-full border border-white/5 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap
                ${isActive 
                  ? 'bg-[#00f3ff] text-black shadow-[0_0_20px_rgba(0,243,255,0.3)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-black' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Mobile Menu Icon (Placeholder) */}
      <div className="lg:hidden">
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <Grid className="w-5 h-5 text-white"/>
        </div>
      </div>
    </nav>
  );
};