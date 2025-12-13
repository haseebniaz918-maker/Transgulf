import React, { useState, useRef } from 'react';
import { Megaphone, Plus, Trash2, Download, RefreshCw, Briefcase, MapPin, Building2, Zap } from 'lucide-react';
import { generateAdHtml } from '../services/geminiService';

export const AdsMaker: React.FC = () => {
  const [country, setCountry] = useState('');
  const [company, setCompany] = useState('');
  const [jobs, setJobs] = useState<string[]>(['']);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleJobChange = (index: number, value: string) => {
    const newJobs = [...jobs];
    newJobs[index] = value;
    setJobs(newJobs);
  };

  const addJob = () => setJobs([...jobs, '']);
  const removeJob = (index: number) => setJobs(jobs.filter((_, i) => i !== index));

  const handleGenerate = async () => {
    if (!country || jobs.some(j => !j.trim())) {
      alert("Please fill in Country and at least one Job.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const html = await generateAdHtml({
        country,
        company,
        jobs: jobs.filter(j => j.trim())
      });
      setGeneratedHtml(html);
    } catch (e) {
      console.error(e);
      alert("Failed to generate ad.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
      if (!iframeRef.current) return;
      
      // We rely on html2canvas (bundled in html2pdf usually, or available via window)
      // Since html2pdf is in index.html, we can use it to capture the iframe content OR
      // simpler: just render the HTML into a temporary div and capture.
      
      const element = document.createElement('div');
      element.innerHTML = generatedHtml || "";
      element.style.width = '1080px'; // High res width
      element.style.height = '1920px'; // High res height (9:16)
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      document.body.appendChild(element);

      const opt = {
        margin: 0,
        filename: `Job_Ad_${country.replace(/\s/g,'_')}.jpeg`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1, useCORS: true }, // 1 scale because we sized div large
        jsPDF: { unit: 'px', format: [1080, 1920], orientation: 'portrait' }
      };

      if ((window as any).html2pdf) {
         // We cheat slightly: Generate PDF then save, or just use it to get image. 
         // Since html2pdf is for PDF, let's try to get image if possible, or just PDF.
         // The user asked for "Ads Making", usually Images. 
         // Standard html2pdf saves PDF. 
         // Let's stick to PDF for high quality vector text, which is professional.
         await (window as any).html2pdf().set(opt).from(element).save();
      }
      
      document.body.removeChild(element);
  };

  return (
    <div className="p-6 md:p-12 w-full max-w-[1600px] mx-auto animate-fade-in flex flex-col lg:flex-row gap-8 min-h-screen">
      
      {/* LEFT: Configuration */}
      <div className="flex-1 space-y-8 pb-20">
        <div className="mb-6">
          <h1 className="text-4xl font-display font-bold text-white flex items-center gap-3">
            <Megaphone className="text-[#00f3ff] w-10 h-10" /> 
            ADS <span className="text-[#00f3ff] drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]">MAKER</span>
          </h1>
          <p className="text-slate-400 mt-2">Create viral, professional vertical job ads (9:16) with AI-matched imagery for every vacancy.</p>
        </div>

        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f3ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="text-[#00f3ff]" /> Campaign Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Target Country *</label>
                    <div className="relative">
                        <input 
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="e.g. Saudi Arabia, UAE, UK"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-[#00f3ff] focus:outline-none transition-all"
                        />
                        <GlobeIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Company Name (Optional)</label>
                    <div className="relative">
                        <input 
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="e.g. Al-Futtaim Group"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-[#00f3ff] focus:outline-none transition-all"
                        />
                        <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Vacancies List
                    </label>
                    <button onClick={addJob} className="text-[#00f3ff] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors">
                        <Plus className="w-3 h-3" /> ADD JOB
                    </button>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {jobs.map((job, idx) => (
                        <div key={idx} className="flex gap-2 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="flex-1 relative">
                                <input 
                                    value={job}
                                    onChange={(e) => handleJobChange(idx, e.target.value)}
                                    placeholder={`Job Title #${idx + 1}`}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#00f3ff] focus:outline-none transition-colors"
                                />
                            </div>
                            <button 
                                onClick={() => removeJob(idx)}
                                disabled={jobs.length === 1}
                                className="p-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-6 bg-[#00f3ff] hover:bg-[#00c2cc] text-black font-extrabold text-xl tracking-widest rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            {isGenerating ? (
                <>
                   <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                   <span className="relative z-10">AI DESIGNING AD...</span>
                </>
            ) : (
                <>
                   <Zap className="w-6 h-6 fill-black relative z-10" />
                   <span className="relative z-10">GENERATE PROFESSIONAL AD</span>
                </>
            )}
        </button>
      </div>

      {/* RIGHT: Preview */}
      <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col items-center gap-6">
         <div className="w-full max-w-[360px] aspect-[9/16] bg-slate-900 border-4 border-[#00f3ff]/30 rounded-[30px] shadow-[0_0_40px_rgba(0,243,255,0.15)] overflow-hidden relative">
            {generatedHtml ? (
                <iframe 
                    ref={iframeRef}
                    srcDoc={generatedHtml}
                    className="w-full h-full border-none bg-white"
                    title="Ad Preview"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4 p-8 text-center bg-[#0a0f1e]">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                        <Megaphone className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm">Enter details and hit generate to see your AI-designed vertical ad here.</p>
                </div>
            )}
            
            {/* Notch Removed as requested */}
         </div>

         {generatedHtml && (
             <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors shadow-lg"
             >
                <Download className="w-5 h-5" /> Download Design
             </button>
         )}
      </div>
    </div>
  );
};

// Simple icon helper
const GlobeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);