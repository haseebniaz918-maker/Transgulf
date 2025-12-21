
import React, { useState, useRef } from 'react';
import { generateAdHtml } from '../services/geminiService';
import { imagesToPdf, downloadBlob } from '../services/pdfUtils';
import { 
    Plus, Trash2, Megaphone, Globe, Building, DollarSign, Download, Users, 
    HeartPulse, Bus, Home, Image as ImageIcon, Clock, CreditCard, MessageCircle, 
    Languages, Calendar, UserCheck, Sparkles, Car, ZoomIn, ZoomOut, Maximize2, 
    Loader2, AlertCircle, FileType, Check
} from 'lucide-react';

declare const html2canvas: any;

interface JobPosition {
    id: number;
    title: string;
    salary: string;
    count: string;
    dutyHours: string;
    accommodation: boolean;
    medical: boolean;
    transport: boolean;
    iqama: boolean;
    license: string;
}

const AdArchitectAnimation = () => (
    <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in text-center p-8">
        <div className="relative w-48 h-48 mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_var(--primary-color)]">
                {/* Character */}
                <circle cx="100" cy="80" r="50" fill="#fecaca" />
                <circle cx="85" cy="70" r="4" fill="#1e293b" className="animate-bounce" />
                <circle cx="115" cy="70" r="4" fill="#1e293b" className="animate-bounce" />
                <path d="M80 100 Q100 115 120 100" stroke="#1e293b" fill="none" strokeWidth="4" strokeLinecap="round" />
                {/* Floating Elements */}
                <g className="animate-float">
                    <rect x="20" y="40" width="30" height="40" rx="5" fill="var(--primary-color)" opacity="0.6" />
                    <circle cx="170" cy="50" r="15" fill="var(--primary-color)" opacity="0.4" />
                </g>
                {/* Hand and Pencil */}
                <g className="animate-writing" style={{ transformOrigin: '100px 150px' }}>
                    <path d="M120 110 L160 180" stroke="#fbbf24" strokeWidth="12" strokeLinecap="round" />
                    <circle cx="130" cy="120" r="15" fill="#fecaca" />
                </g>
            </svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-2">AI AD ARCHITECT</h2>
        <p className="text-primary font-mono text-xs tracking-[0.2em] animate-pulse">Selecting Template • Generating Hero Image • Designing Layout</p>
    </div>
);

export const AdsMaker: React.FC = () => {
  const [country, setCountry] = useState('');
  const [company, setCompany] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [language, setLanguage] = useState('English');
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(false);
  const [showInterviewMode, setShowInterviewMode] = useState(false);
  const [interviewMode, setInterviewMode] = useState('Delegation');
  const [showInterviewDate, setShowInterviewDate] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const [jobs, setJobs] = useState<JobPosition[]>([
      { id: 1, title: '', salary: '', count: '', dutyHours: '8', accommodation: true, medical: true, transport: true, iqama: true, license: '' }
  ]);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [previewScale, setPreviewScale] = useState(0.4);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!country.trim()) newErrors.country = "Country required";
    if (jobs.some(j => !j.title.trim())) newErrors.jobs = "All vacancies need a title";
    if (showInterviewDate && !interviewDate) newErrors.interviewDate = "Set interview date";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addJob = () => {
      setJobs([...jobs, { id: Date.now(), title: '', salary: '', count: '', dutyHours: '8', accommodation: true, medical: true, transport: true, iqama: true, license: '' }]);
  };

  const removeJob = (id: number) => setJobs(jobs.filter(j => j.id !== id));
  const updateJob = (id: number, field: keyof JobPosition, value: any) => setJobs(jobs.map(j => j.id === id ? { ...j, [field]: value } : j));

  const handleGenerate = async () => {
      if (!validate()) return;
      setIsGenerating(true);
      setGeneratedHtml(null);
      try {
          const html = await generateAdHtml({ 
              country, 
              company, 
              currency,
              language,
              showSecondaryPhone,
              showInterviewMode,
              interviewMode,
              showInterviewDate,
              interviewDate,
              jobs 
          }, customPrompt);
          setGeneratedHtml(html);
      } catch (e) { 
          alert("Error generating ad. Check API Key."); 
      } finally { setIsGenerating(false); }
  };

  const captureAdToImage = async (): Promise<File | null> => {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '-2000px';
      container.style.width = '1080px';
      container.style.height = '1080px';
      container.innerHTML = generatedHtml!;
      document.body.appendChild(container);

      await new Promise(r => setTimeout(r, 1000));

      try {
          const canvas = await html2canvas(container, {
              width: 1080, height: 1080, useCORS: true, backgroundColor: '#ffffff', scale: 1
          });
          document.body.removeChild(container);
          
          return new Promise((resolve) => {
              canvas.toBlob((blob: Blob) => {
                  if (blob) {
                      const file = new File([blob], "ad_capture.png", { type: "image/png" });
                      resolve(file);
                  } else resolve(null);
              }, 'image/png');
          });
      } catch (e) {
          document.body.removeChild(container);
          return null;
      }
  };

  const handleDownloadPdf = async () => {
      if (!generatedHtml) return;
      setIsExporting(true);
      try {
          const imageFile = await captureAdToImage();
          if (!imageFile) throw new Error("Capture failed");
          
          const pdfBytes = await imagesToPdf([imageFile]);
          downloadBlob(pdfBytes, `Ad_${country}_${Date.now()}.pdf`);
      } catch (e) {
          alert("PDF Export failed. Try PNG download instead.");
      } finally {
          setIsExporting(false);
      }
  };

  const handleDownloadPng = async () => {
    if (!generatedHtml) return;
    setIsExporting(true);
    const imageFile = await captureAdToImage();
    if (imageFile) {
        const url = URL.createObjectURL(imageFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ad_${country}_${Date.now()}.png`;
        link.click();
    }
    setIsExporting(false);
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto animate-fade-in pb-20">
       <div className="text-center">
           <h1 className="text-5xl font-black text-theme-text font-display flex items-center justify-center gap-3">
               <Megaphone size={40} className="text-primary animate-float"/> ADS <span className="text-primary">MAKER</span>
           </h1>
           <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">AI-DRIVEN HIGH FIDELITY CAMPAIGNS</p>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
           {/* LEFT: Inputs */}
           <div className="xl:col-span-5 flex flex-col gap-6">
               <div className="glass-card p-8 rounded-3xl flex flex-col gap-6 border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><Globe size={64}/></div>
                   <h3 className="text-theme-text font-black uppercase text-xs tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
                      <Sparkles size={14} className="text-primary"/> Campaign Matrix
                   </h3>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ad Language</label>
                           <select 
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none" 
                              value={language}
                              onChange={e => setLanguage(e.target.value)}
                           >
                               <option value="English">English</option>
                               <option value="Urdu">Urdu Only</option>
                               <option value="Both">Bilingual (EN/UR)</option>
                           </select>
                       </div>
                       <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Country</label>
                           <input 
                              className={`w-full bg-slate-900/50 border rounded-xl px-4 py-3 text-white focus:border-primary outline-none ${errors.country ? 'border-red-500' : 'border-white/10'}`} 
                              placeholder="e.g. Saudi Arabia" 
                              value={country} 
                              onChange={e => setCountry(e.target.value)} 
                           />
                           {errors.country && <span className="text-[9px] text-red-500 font-bold uppercase">{errors.country}</span>}
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Currency</label>
                           <select 
                               className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none"
                               value={currency}
                               onChange={e => setCurrency(e.target.value)}
                           >
                               <option value="SAR">SAR (Saudi)</option>
                               <option value="AED">AED (UAE)</option>
                               <option value="QAR">QAR (Qatar)</option>
                               <option value="OMR">OMR (Oman)</option>
                               <option value="KWD">KWD (Kuwait)</option>
                               <option value="USD">USD ($)</option>
                               <option value="PKR">PKR (Rs)</option>
                           </select>
                       </div>
                       <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company (Optional)</label>
                           <input 
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none" 
                              placeholder="e.g. Al-Bhatti Group" 
                              value={company} 
                              onChange={e => setCompany(e.target.value)} 
                           />
                       </div>
                   </div>
                   
                   <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Advanced Protocols</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <label className="flex items-center gap-3 bg-slate-900/30 p-4 rounded-2xl border border-white/5 cursor-pointer hover:border-primary/30 transition-all">
                                <input type="checkbox" checked={showInterviewMode} onChange={e => setShowInterviewMode(e.target.checked)} className="accent-primary w-5 h-5 rounded" />
                                <span className="flex-1 text-xs font-bold text-slate-300 flex items-center gap-2"><UserCheck size={14}/> Include Interview Type</span>
                                {showInterviewMode && (
                                    <select className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none" value={interviewMode} onChange={e => setInterviewMode(e.target.value)}>
                                        <option value="Delegation">Delegation</option>
                                        <option value="Online">Online</option>
                                    </select>
                                )}
                            </label>

                            <label className="flex items-center gap-3 bg-slate-900/30 p-4 rounded-2xl border border-white/5 cursor-pointer hover:border-primary/30 transition-all">
                                <input type="checkbox" checked={showInterviewDate} onChange={e => setShowInterviewDate(e.target.checked)} className="accent-primary w-5 h-5 rounded" />
                                <span className="flex-1 text-xs font-bold text-slate-300 flex items-center gap-2"><Calendar size={14}/> Interview Date</span>
                                {showInterviewDate && (
                                    <input type="date" className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
                                )}
                            </label>
                        </div>
                   </div>
               </div>

               <div className="glass-card p-8 rounded-3xl flex flex-col gap-4 border border-white/5">
                   <div className="flex items-center justify-between border-b border-white/5 pb-4">
                       <h3 className="text-theme-text font-black uppercase text-xs tracking-widest">Vacancies Registry</h3>
                       <button onClick={addJob} className="bg-primary/10 text-primary hover:bg-primary hover:text-black px-3 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center gap-2">
                          <Plus size={14}/> ADD POSITION
                       </button>
                   </div>

                   <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                       {jobs.map((job) => (
                           <div key={job.id} className="bg-slate-950 border border-white/5 p-5 rounded-2xl relative group hover:border-primary/40 transition-all">
                               <button onClick={() => removeJob(job.id)} className="absolute top-4 right-4 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                               <div className="flex flex-col gap-4">
                                   <input 
                                      className="bg-transparent border-b border-white/10 text-white font-black placeholder-slate-800 focus:border-primary outline-none pb-2 text-lg" 
                                      placeholder="JOB TITLE (e.g. HVAC SUPERVISOR)"
                                      value={job.title}
                                      onChange={(e) => updateJob(job.id, 'title', e.target.value.toUpperCase())}
                                   />
                                   <div className="grid grid-cols-3 gap-4">
                                       <div className="flex flex-col gap-1">
                                           <label className="text-[8px] font-black text-slate-600 uppercase">Salary</label>
                                           <div className="flex items-center gap-2 text-slate-300">
                                               <DollarSign size={12}/>
                                               <input className="bg-transparent text-xs font-bold outline-none flex-1" placeholder="2500" value={job.salary} onChange={(e) => updateJob(job.id, 'salary', e.target.value)} />
                                           </div>
                                       </div>
                                       <div className="flex flex-col gap-1">
                                           <label className="text-[8px] font-black text-slate-600 uppercase">Duty Hrs</label>
                                           <div className="flex items-center gap-2 text-slate-300">
                                               <Clock size={12}/>
                                               <input className="bg-transparent text-xs font-bold outline-none flex-1" placeholder="8" value={job.dutyHours} onChange={(e) => updateJob(job.id, 'dutyHours', e.target.value)} />
                                           </div>
                                       </div>
                                       <div className="flex flex-col gap-1">
                                           <label className="text-[8px] font-black text-slate-600 uppercase">Quantity</label>
                                           <div className="flex items-center gap-2 text-slate-300">
                                               <Users size={12}/>
                                               <input className="bg-transparent text-xs font-bold outline-none flex-1" placeholder="10" value={job.count} onChange={(e) => updateJob(job.id, 'count', e.target.value)} />
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       ))}
                       {errors.jobs && <span className="text-[10px] text-red-500 font-bold uppercase">{errors.jobs}</span>}
                   </div>
               </div>

               <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-primary">
                   <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                       <Sparkles size={14}/> AI Creative Prompt
                   </label>
                   <textarea 
                       value={customPrompt}
                       onChange={e => setCustomPrompt(e.target.value)}
                       placeholder="Describe the mood, background color, or specific artistic style..."
                       className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-primary outline-none h-24 resize-none text-sm placeholder-slate-800 font-mono"
                   />
               </div>

               <button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full py-6 bg-primary hover:bg-secondary text-black font-black rounded-3xl text-xl shadow-neon transition-all hover:-translate-y-1 disabled:opacity-20 flex items-center justify-center gap-4"
               >
                   {isGenerating ? <Loader2 className="animate-spin"/> : <Megaphone size={28}/>}
                   {isGenerating ? 'FORGING MASTERPIECE...' : 'GENERATE AI AD'}
               </button>
           </div>

           {/* RIGHT: Preview */}
           <div className="xl:col-span-7 flex flex-col items-center">
               <div className="w-full glass-card border-4 border-slate-900 rounded-[50px] overflow-hidden shadow-2xl relative flex flex-col min-h-[700px]">
                   
                   {isGenerating && <AdArchitectAnimation />}

                   <div className="bg-slate-900 p-6 border-b border-white/10 flex justify-between items-center z-10">
                        <div className="flex gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-500"></div>
                            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                            <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                 <Maximize2 size={12} /> 1080x1080 Square High-Fidelity
                             </div>
                             {generatedHtml && (
                                <div className="flex gap-4 border-l border-white/10 pl-4">
                                    <button onClick={() => setPreviewScale(s => Math.max(0.2, s - 0.1))} className="text-slate-500 hover:text-primary transition-all"><ZoomOut size={20}/></button>
                                    <span className="text-[10px] font-mono text-slate-600 self-center">{Math.round(previewScale*100)}%</span>
                                    <button onClick={() => setPreviewScale(s => Math.min(1.0, s + 0.1))} className="text-slate-500 hover:text-primary transition-all"><ZoomIn size={20}/></button>
                                </div>
                             )}
                        </div>
                   </div>

                   <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-10">
                       {generatedHtml ? (
                           <div 
                                style={{ 
                                    width: '1080px', 
                                    height: '1080px', 
                                    transform: `scale(${previewScale})`, 
                                    transformOrigin: 'center center',
                                    backgroundColor: 'white',
                                    boxShadow: '0 0 100px rgba(0,0,0,0.8)'
                                }}
                                className="transition-all duration-700 ease-out animate-pop-in"
                           >
                               <iframe 
                                  srcDoc={generatedHtml} 
                                  className="w-full h-full border-none pointer-events-none" 
                                  title="Ad Live Preview"
                               />
                           </div>
                       ) : !isGenerating && (
                           <div className="flex flex-col items-center justify-center text-slate-800 gap-6">
                               <Megaphone size={120} className="opacity-10 animate-float"/>
                               <div className="text-center">
                                   <p className="font-black text-2xl tracking-tighter uppercase">Waiting for Matrix Input</p>
                                   <p className="text-xs font-bold text-slate-600 mt-2">Complete the form to initiate generation</p>
                               </div>
                           </div>
                       )}
                   </div>
               </div>

               {generatedHtml && !isGenerating && (
                   <div className="flex gap-6 mt-10 w-full justify-center animate-slide-up">
                        <button 
                            onClick={handleDownloadPng}
                            disabled={isExporting}
                            className="px-10 py-5 bg-white text-black rounded-3xl font-black flex items-center gap-3 transition-all hover:-translate-y-2 hover:shadow-neon"
                        >
                            {isExporting ? <Loader2 className="animate-spin"/> : <ImageIcon size={24}/>} 
                            DOWNLOAD PNG IMAGE
                        </button>
                        <button 
                            onClick={handleDownloadPdf}
                            disabled={isExporting}
                            className="px-10 py-5 bg-primary text-black rounded-3xl font-black flex items-center gap-3 shadow-neon transition-all hover:-translate-y-2"
                        >
                            {isExporting ? <Loader2 className="animate-spin"/> : <FileType size={24}/>} 
                            DOWNLOAD AS PDF
                        </button>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};
