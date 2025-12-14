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
    <nav className="navbar">
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Zap size={28} color="#FFD700" fill="#FFD700" />
          <div style={{ position: 'absolute', inset: 0, background: '#FFD700', filter: 'blur(12px)', opacity: 0.4 }}></div>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
          <span style={{ color: 'white' }}>BHATTI'S</span> <span style={{ color: 'var(--color-cyan)' }}>AI TOOLS</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={16} color={isActive ? 'black' : 'currentColor'} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};