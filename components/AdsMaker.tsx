import React, { useState } from 'react';
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
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-fade-in pb-20">
       <div className="text-center">
           <h1 className="text-5xl font-bold text-cyan-400 font-display drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">ADS MAKER</h1>
       </div>

       <div className="flex flex-wrap gap-8">
           <div className="flex-1 min-w-[300px] flex flex-col gap-6">
               <div className="glass-card p-6 rounded-2xl">
                   <h3 className="text-white mb-4 font-bold">Details</h3>
                   <input 
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none" 
                      placeholder="Country" 
                      value={country} 
                      onChange={e => setCountry(e.target.value)} 
                   />
               </div>
               <button 
                  onClick={handleGenerate} 
                  className="w-full py-6 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-2xl text-xl shadow-neon transition-all hover:-translate-y-1"
               >
                   {isGenerating ? 'GENERATING...' : 'CREATE AD'}
               </button>
           </div>

           <div className="flex-1 min-w-[300px] flex justify-center">
               <div className="w-[500px] h-[500px] bg-slate-900 border border-white/10 flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl">
                   {generatedHtml ? <iframe srcDoc={generatedHtml} className="w-full h-full border-none" /> : <span className="text-slate-500">Ad Preview</span>}
               </div>
           </div>
       </div>
    </div>
  );
};