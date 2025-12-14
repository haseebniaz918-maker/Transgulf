import React, { useState, useRef, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Download, Briefcase, MapPin, Building2, Zap, Globe, Banknote, Users, RefreshCw, Sparkles, Command, Loader2 } from 'lucide-react';
import { generateAdHtml } from '../services/geminiService';

interface JobEntry {
  title: string;
  salary: string;
  count: string;
}

export const AdsMaker: React.FC = () => {
  const [country, setCountry] = useState('');
  const [company, setCompany] = useState('');
  const [customPrompt, setCustomPrompt] = useState(''); 
  const [jobs, setJobs] = useState<JobEntry[]>([{ title: '', salary: '', count: '' }]);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState("AI DESIGNING AD...");
  
  // Scaling State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Handle Resize for Smart Preview
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            // Target width is 1080px.
            const scale = containerWidth / 1080; 
            setScaleFactor(scale);
        }
    };
    
    // Initial calc
    handleResize();
    
    // Observer for container resize
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleJobChange = (index: number, field: keyof JobEntry, value: string) => {
    const newJobs = [...jobs];
    newJobs[index] = { ...newJobs[index], [field]: value };
    setJobs(newJobs);
  };

  const addJob = () => setJobs([...jobs, { title: '', salary: '', count: '' }]);
  const removeJob = (index: number) => setJobs(jobs.filter((_, i) => i !== index));

  const preloadImages = async (htmlContent: string) => {
      // regex to find all image srcs
      const regex = /<img[^>]+src="([^">]+)"/g;
      let match;
      const promises: Promise<void>[] = [];
      
      setLoadingText("RENDERING ACTION SHOTS...");

      while ((match = regex.exec(htmlContent)) !== null) {
          const src = match[1];
          const p = new Promise<void>((resolve) => {
              const img = new Image();
              img.src = src;
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Resolve anyway to not block
          });
          promises.push(p);
      }
      
      if (promises.length > 0) {
          await Promise.all(promises);
      }
  };

  const handleGenerate = async () => {
    if (!country || jobs.some(j => !j.title.trim())) {
      alert("Please fill in Country and at least one Job Title.");
      return;
    }
    
    setIsGenerating(true);
    setLoadingText("AI VISUALIZING JOBS...");
    setGeneratedHtml(null); 
    
    try {
      const html = await generateAdHtml({
        country,
        company,
        jobs: jobs.filter(j => j.title.trim())
      }, customPrompt);
      
      // Wait for images to actually load in browser memory before showing
      await preloadImages(html);
      
      setGeneratedHtml(html);
    } catch (e) {
      console.error(e);
      alert("Failed to generate ad. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
      if (!generatedHtml) return;
      
      // Create a temporary container for rendering
      const element = document.createElement('div');
      element.innerHTML = generatedHtml;
      element.style.width = '1080px'; 
      element.style.height = '1080px'; 
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '-9999px'; 
      element.style.zIndex = '-1';
      document.body.appendChild(element);

      try {
          // Double check images loaded (redundant safety)
          const images = element.querySelectorAll('img');
          await Promise.all(Array.from(images).map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(r => { img.onload = r; img.onerror = r; });
          }));
          
          if ((window as any).html2canvas) {
              const canvas = await (window as any).html2canvas(element, {
                  useCORS: true,
                  scale: 1, 
                  width: 1080,
                  height: 1080,
                  logging: false,
                  backgroundColor: '#ffffff',
                  allowTaint: true
              });

              const link = document.createElement('a');
              link.download = `Job_Ad_${country.replace(/\s/g,'_')}.jpg`;
              link.href = canvas.toDataURL('image/jpeg', 0.95);
              link.click();
          }
      } catch (err) {
          console.error("Download failed", err);
          alert("Failed to download image.");
      } finally {
          document.body.removeChild(element);
      }
  };

  return (
    <div className="p-6 md:p-12 w-full max-w-[1600px] mx-auto animate-fade-in flex flex-col lg:flex-row gap-8 min-h-screen">
      
      {/* LEFT: Configuration */}
      <div className="flex-1 space-y-8 pb-20">
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h1 className="text-4xl font-display font-bold text-white flex items-center gap-3">
            <Megaphone className="text-[#00f3ff] w-10 h-10 animate-pulse" /> 
            ADS <span className="text-[#00f3ff] drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]">MAKER</span>
          </h1>
          <p className="text-slate-400 mt-2">Create viral, professional square job ads (12:12) with <span className="text-[#00f3ff] font-bold">Action-Shot AI Imagery</span> for every vacancy.</p>
        </div>

        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-[#00f3ff]/30 transition-all duration-500 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f3ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <MapPin className="text-[#00f3ff]" /> Campaign Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-10">
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Target Country *</label>
                    <div className="relative group/input">
                        <input 
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="e.g. Saudi Arabia"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-[#00f3ff] focus:shadow-[0_0_20px_rgba(0,243,255,0.2)] focus:outline-none transition-all duration-300"
                        />
                        <Globe className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within/input:text-[#00f3ff] transition-colors duration-300" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Company Name (Side Header)</label>
                    <div className="relative group/input">
                        <input 
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="e.g. Al-Futtaim Group"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-[#00f3ff] focus:shadow-[0_0_20px_rgba(0,243,255,0.2)] focus:outline-none transition-all duration-300"
                        />
                        <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within/input:text-[#00f3ff] transition-colors duration-300" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Vacancies List
                    </label>
                    <button onClick={addJob} className="text-[#00f3ff] hover:text-white text-xs font-bold flex items-center gap-1 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_10px_rgba(0,243,255,0.4)] px-2 py-1 rounded">
                        <Plus className="w-3 h-3" /> ADD JOB
                    </button>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {jobs.map((job, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900/50 border border-white/5 rounded-xl animate-pop-in relative group/item hover:border-[#00f3ff]/20" style={{ animationDelay: `${idx * 100}ms` }}>
                             <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button onClick={() => removeJob(idx)} disabled={jobs.length === 1} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                             </div>

                             <div className="flex-1 space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold">JOB TITLE</label>
                                <div className="relative">
                                    <input 
                                        value={job.title}
                                        onChange={(e) => handleJobChange(idx, 'title', e.target.value)}
                                        placeholder="e.g. Electrician"
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 pl-8 text-sm text-white focus:border-[#00f3ff] focus:outline-none"
                                    />
                                    <Briefcase className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                </div>
                             </div>

                             <div className="w-full md:w-32 space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold">SALARY</label>
                                <div className="relative">
                                    <input 
                                        value={job.salary}
                                        onChange={(e) => handleJobChange(idx, 'salary', e.target.value)}
                                        placeholder="1600+200"
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 pl-8 text-sm text-white focus:border-[#00f3ff] focus:outline-none"
                                    />
                                    <Banknote className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                </div>
                             </div>

                             <div className="w-full md:w-24 space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold">COUNT</label>
                                <div className="relative">
                                    <input 
                                        value={job.count}
                                        onChange={(e) => handleJobChange(idx, 'count', e.target.value)}
                                        placeholder="50"
                                        type="number"
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 pl-8 text-sm text-white focus:border-[#00f3ff] focus:outline-none"
                                    />
                                    <Users className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Custom Prompt Area */}
            <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#00f3ff]" /> AI Custom Instruction (Optional)
                </label>
                <div className="relative">
                    <input 
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g. Make the background red, Add a '50% OFF' badge, Use futuristic fonts..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-[#00f3ff] focus:shadow-[0_0_20px_rgba(0,243,255,0.2)] focus:outline-none transition-all duration-300"
                    />
                    <Command className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                </div>
            </div>

        </section>

        <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-6 bg-[#00f3ff] hover:bg-[#00c2cc] text-black font-extrabold text-xl tracking-widest rounded-xl shadow-[0_0_25px_rgba(0,243,255,0.4)] hover:shadow-[0_0_50px_rgba(0,243,255,0.6)] transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group animate-slide-up"
            style={{ animationDelay: '300ms' }}
        >
            <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            {isGenerating ? (
                <>
                   <Loader2 className="w-6 h-6 animate-spin text-black" />
                   <span className="relative z-10 font-mono">{loadingText}</span>
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
      <div className="w-full lg:w-[600px] flex-shrink-0 flex flex-col items-center gap-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
         
         {/* PREVIEW BOX */}
         <div 
            ref={containerRef}
            className={`w-full max-w-[550px] aspect-square bg-slate-900 border-4 ${isGenerating ? 'border-[#00f3ff] shadow-[0_0_60px_rgba(0,243,255,0.3)] animate-pulse' : 'border-[#00f3ff]/30 shadow-[0_0_40px_rgba(0,243,255,0.15)]'} rounded-[30px] overflow-hidden relative transition-all duration-500 ease-in-out`}
         >
            {!isGenerating && generatedHtml ? (
                <div 
                    style={{ 
                        width: '1080px', 
                        height: '1080px', 
                        transform: `scale(${scaleFactor})`, 
                        transformOrigin: 'top left',
                        pointerEvents: 'none' // Prevent interaction issues when scaled
                    }}
                >
                    <iframe 
                        srcDoc={generatedHtml}
                        className="w-full h-full border-none bg-white"
                        title="Ad Preview"
                        scrolling="no"
                    />
                </div>
            ) : (
                <div className="w-full h-full bg-[#0a0f1e] relative overflow-hidden flex flex-col">
                    {isGenerating ? (
                        // SKELETON SCREEN FOR SQUARE AD
                        <div className="w-full h-full bg-white flex flex-col relative overflow-hidden p-8">
                            {/* Shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent z-10 animate-[shimmer_1.5s_infinite] translate-x-[-100%]"></div>
                            
                            {/* Header */}
                            <div className="h-32 bg-slate-100 rounded-xl mb-8 w-full"></div>
                            
                            {/* Grid Layout Skeleton */}
                            <div className="grid grid-cols-2 gap-6 flex-1">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3">
                                         <div className="w-full h-48 bg-slate-200 rounded-xl"></div>
                                         <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto"></div>
                                         <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto"></div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Footer */}
                            <div className="h-24 bg-slate-100 rounded-xl mt-8 w-full"></div>
                            
                             <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-2 text-[#00f3ff] text-xl font-bold tracking-widest z-20">
                                <Zap className="w-5 h-5 animate-pulse" /> {loadingText}
                            </div>
                        </div>
                    ) : (
                        // EMPTY STATE
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4 p-8 text-center">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#00f3ff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center relative z-10">
                               <Megaphone className="w-10 h-10 opacity-50 text-slate-400" />
                            </div>
                            <p className="text-lg relative z-10 font-medium max-w-[300px]">
                                Fill in the details to generate a <span className="text-[#00f3ff]">12:12 (1080px) Square Ad</span>.
                            </p>
                            <p className="text-xs text-slate-600 relative z-10">Images will be <b>Action Shots</b> (e.g. Plumber fixing pipe).</p>
                        </div>
                    )}
                </div>
            )}
         </div>

         {!isGenerating && generatedHtml && (
             <div className="flex gap-4 animate-pop-in">
                 <button 
                    onClick={() => setGeneratedHtml(null)}
                    className="flex items-center gap-2 px-6 py-4 border border-white/10 hover:bg-white/5 text-white font-bold rounded-full transition-all"
                 >
                    <RefreshCw className="w-5 h-5" /> New
                 </button>
                 <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                 >
                    <Download className="w-5 h-5" /> Download HD JPG
                 </button>
             </div>
         )}
      </div>

      <style>{`
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};