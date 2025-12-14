import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PdfTools } from './components/PdfTools';
import { Intro } from './components/Intro';
import { AiSection } from './components/AiSection';
import { IdentityLab } from './components/IdentityLab';
import { CvForge } from './components/CvForge';
import { Nomination } from './components/Nomination';
import { AdsMaker } from './components/AdsMaker';
import { DataEntries } from './components/DataEntries';
import { Section } from './types';

export default function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>(Section.PDF_TOOLS);

  // Render the appropriate component based on section
  const renderContent = () => {
    switch (activeSection) {
      case Section.PDF_TOOLS:
        return <PdfTools />;
      case Section.IDENTITY_LAB:
        return <IdentityLab />;
      case Section.CV_FORGE:
        return <CvForge />;
      case Section.NOMINATION:
        return <Nomination />;
      case Section.ADS_MAKER:
        return <AdsMaker />;
      case Section.DATA_ENTRIES:
        return <DataEntries />;
      default:
        return <PdfTools />;
    }
  };

  return (
    <>
      {!introComplete && <Intro onComplete={() => setIntroComplete(true)} />}
      
      <div className={`min-h-screen bg-[#020617] text-slate-100 transition-opacity duration-1000 ${introComplete ? 'opacity-100' : 'opacity-0'}`}>
        <Navbar 
          currentSection={activeSection} 
          onNavigate={setActiveSection} 
        />
        
        <main className="relative">
          {/* Ambient Background Glows */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00f3ff]/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
          
          <div className="relative z-10 animate-fade-in">
            {renderContent()}
          </div>
        </main>

        <footer className="text-center py-8 text-slate-600 text-sm border-t border-white/5 mt-auto">
          &copy; 2024 Bhatti's AI Tools. All rights reserved.
        </footer>
      </div>
    </>
  );
}