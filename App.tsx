import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PdfTools } from './components/PdfTools';
import { Intro } from './components/Intro';
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
      
      <div 
        className="app-container" 
        style={{ 
            opacity: introComplete ? 1 : 0, 
            transition: 'opacity 1s ease-in-out',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}
      >
        <Navbar 
          currentSection={activeSection} 
          onNavigate={setActiveSection} 
        />
        
        <main style={{ position: 'relative', flex: 1 }}>
          {/* Ambient Background Glows */}
          <div style={{
            position: 'fixed',
            top: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(0, 243, 255, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }}></div>
          
          <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1, padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
            {renderContent()}
          </div>
        </main>

        <footer style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: 'var(--text-muted)', 
            fontSize: '0.875rem', 
            borderTop: '1px solid var(--border-light)',
            marginTop: 'auto'
        }}>
          &copy; 2024 Bhatti's AI Tools. All rights reserved.
        </footer>
      </div>
    </>
  );
}