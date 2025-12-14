import React, { useState } from 'react';
import { Megaphone, MapPin, Building2, Briefcase, Plus, Trash2, Sparkles, Command, Loader2, Download, RefreshCw } from 'lucide-react';
import { generateAdHtml } from '../services/geminiService';

export const AdsMaker: React.FC = () => {
  const [country, setCountry] = useState('');
  const [jobs, setJobs] = useState([{ title: '', salary: '', count: '' }]);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
      setIsGenerating(true);
      try {
          const html = await generateAdHtml({ country, jobs, company: 'Agency' });
          setGeneratedHtml(html);
      } catch (e) { alert("Error"); } 
      finally { setIsGenerating(false); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
       <div className="text-center">
           <h1 className="text-neon" style={{ fontSize: '3rem', fontWeight: 700 }}>ADS MAKER</h1>
       </div>

       <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
           <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div className="card">
                   <h3 style={{ color: 'white', marginBottom: '1rem' }}>Details</h3>
                   <input className="input-field" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
               </div>
               <button onClick={handleGenerate} className="btn btn-primary" style={{ padding: '1.5rem' }}>
                   {isGenerating ? 'GENERATING...' : 'CREATE AD'}
               </button>
           </div>

           <div style={{ flex: 1, minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
               <div style={{ width: '500px', height: '500px', background: '#0a0f1e', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {generatedHtml ? <iframe srcDoc={generatedHtml} style={{ width: '100%', height: '100%', border: 'none' }} /> : <span className="text-muted">Ad Preview</span>}
               </div>
           </div>
       </div>
    </div>
  );
};