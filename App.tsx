import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PdfTools } from './components/PdfTools';
import { Intro } from './components/Intro';
import { IdentityLab } from './components/IdentityLab';
import { CvForge } from './components/CvForge';
import { Nomination } from './components/Nomination';
import { AdsMaker } from './components/AdsMaker';
import { DataEntries } from './components/DataEntries';
import { VisaMedicalAssistant } from './components/VisaMedicalAssistant';
import { Section } from './types';

export default function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>(Section.PDF_TOOLS);

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
      case Section.VISA_MEDICAL_HUB:
        return <VisaMedicalAssistant />;
      default:
        return <PdfTools />;
    }
  };

  return (
    <>
      {!introComplete && <Intro onComplete={() => setIntroComplete(true)} />}
      
      <div 
        className={`min-h-screen flex flex-col transition-opacity duration-1000 ${introComplete ? 'opacity-100' : 'opacity-0'}`}
      >
        <Navbar 
          currentSection={activeSection} 
          onNavigate={setActiveSection} 
        />
        
        <main className="relative flex-1">
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-400/10 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen"></div>
          
          <div className="relative z-10 p-6 max-w-[1600px] mx-auto animate-fade-in">
            {renderContent()}
          </div>
        </main>

        <footer className="mt-auto border-t border-white/5 py-8 text-center text-sm text-slate-500">
          &copy; 2024 Bhatti's AI Tools. All rights reserved.
        </footer>
      </div>
    </>
  );
}