import React, { useState } from 'react';
import { generateAdHtml } from '../services/geminiService';
import { Plus, Trash2, Megaphone, Globe, Building, DollarSign, Download, Users, HeartPulse, Bus, Home, Image as ImageIcon, Clock, CreditCard, MessageCircle, Languages, Calendar, UserCheck, Sparkles, Car, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

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
    license: string; // New field
}

export const AdsMaker: React.FC = () => {
  const [country, setCountry] = useState('');
  const [company, setCompany] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [language, setLanguage] = useState('English');
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(false);
  
  // New State for Interview & Custom Prompt
  const [showInterviewMode, setShowInterviewMode] = useState(false);
  const [interviewMode, setInterviewMode] = useState('Delegation'); // Delegation or Online
  const [showInterviewDate, setShowInterviewDate] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const [jobs, setJobs] = useState<JobPosition[]>([
      { id: 1, title: '', salary: '', count: '', dutyHours: '8', accommodation: true, medical: true, transport: true, iqama: true, license: '' }
  ]);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Preview Zoom State
  const [previewScale, setPreviewScale] = useState(0.4);

  const addJob = () => {
      setJobs([...jobs, { id: Date.now(), title: '', salary: '', count: '', dutyHours: '8', accommodation: true, medical: true, transport: true, iqama: true, license: '' }]);
  };

  const removeJob = (id: number) => {
      setJobs(jobs.filter(j => j.id !== id));
  };

  const updateJob = (id: number, field: keyof JobPosition, value: any) => {
      setJobs(jobs.map(j => j.id === id ? { ...j, [field]: value } : j));
  };

  const handleGenerate = async () => {
      if (!country || jobs.some(j => !j.title)) {
          alert("Please enter Country and Job Titles");
          return;
      }
      setIsGenerating(true);
      setGeneratedHtml(null); // Clear previous
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
          alert("Error generating ad"); 
      } 
      finally { setIsGenerating(false); }
  };

  const handleDownloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ad_${country}_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadImage = async () => {
      if (!generatedHtml) return;
      
      // Create a temporary container to render the HTML for capturing
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      // Strict dimensions for the capture
      container.style.width = '1080px';
      container.style.height = '1080px';
      container.innerHTML = generatedHtml;
      document.body.appendChild(container);

      // Wait for images to load
      const images = container.querySelectorAll('img');
      const promises = Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      });
      await Promise.all(promises);

      // Add slight delay for rendering
      await new Promise(r => setTimeout(r, 1000));

      try {
          const canvas = await html2canvas(container, {
              width: 1080,
              height: 1080,
              useCORS: true,
              backgroundColor: '#ffffff',
              scale: 1 // 1:1 scale for 1080p
          });
          
          const link = document.createElement('a');
          link.download = `ad_${country}_${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch (e) {
          console.error("Image export failed", e);
          alert("Failed to export image. Try downloading HTML instead.");
      } finally {
          document.body.removeChild(container);
      }
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto animate-fade-in pb-20">
       <div className="text-center">
           <h1 className="text-5xl font-bold text-cyan-400 font-display drop-shadow-[0_0_15px_rgba(0,243,255,0.4)] flex items-center justify-center gap-3">
               <Megaphone size={40} className="text-white"/> ADS MAKER <span className="text-xs bg-cyan-400 text-black px-2 py-1 rounded">PRO</span>
           </h1>
           <p className="text-slate-400 mt-2">Create High-Impact, Premium Recruitment Ads for Social Media</p>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
           {/* LEFT: Inputs */}
           <div className="xl:col-span-5 flex flex-col gap-6">
               <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
                   <h3 className="text-white font-bold border-b border-white/10 pb-2">Campaign Details</h3>
                   
                   {/* Language & Country */}
                   <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col gap-1">
                           <label className="text-xs font-bold text-slate-400 uppercase">Ad Language</label>
                           <div className="relative">
                               <select 
                                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-cyan-400 outline-none appearance-none" 
                                  value={language}
                                  onChange={e => setLanguage(e.target.value)}
                               >
                                   <option value="English">English</option>
                                   <option value="Urdu">Urdu Only</option>
                                   <option value="Both">English & Urdu</option>
                               </select>
                               <Languages size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                           </div>
                       </div>
                       <div className="flex flex-col gap-1">
                           <label className="text-xs font-bold text-slate-400 uppercase">Country</label>
                           <div className="relative">
                               <input 
                                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-cyan-400 outline-none" 
                                  placeholder="e.g. Saudi Arabia" 
                                  value={country} 
                                  onChange={e => setCountry(e.target.value)} 
                               />
                               <Globe size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                           </div>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col gap-1">
                           <label className="text-xs font-bold text-slate-400 uppercase">Currency</label>
                           <select 
                               className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 outline-none"
                               value={currency}
                               onChange={e => setCurrency(e.target.value)}
                           >
                               <option value="SAR">SAR (Saudi)</option>
                               <option value="AED">AED (UAE)</option>
                               <option value="QAR">QAR (Qatar)</option>
                               <option value="OMR">OMR (Oman)</option>
                               <option value="KWD">KWD (Kuwait)</option>
                               <option value="USD">USD ($)</option>
                               <option value="EUR">EUR (€)</option>
                               <option value="PKR">PKR (Rs)</option>
                           </select>
                       </div>
                       <div className="flex flex-col gap-1">
                           <label className="text-xs font-bold text-slate-400 uppercase">Company (Opt)</label>
                           <div className="relative">
                               <input 
                                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-cyan-400 outline-none" 
                                  placeholder="e.g. Group" 
                                  value={company} 
                                  onChange={e => setCompany(e.target.value)} 
                               />
                               <Building size={16} className="absolute left-3 top-3.5 text-slate-500"/>
                           </div>
                       </div>
                   </div>
                   
                   {/* Extra Options Toggles */}
                   <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                        {/* Interview Mode */}
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                checked={showInterviewMode} 
                                onChange={e => setShowInterviewMode(e.target.checked)} 
                                className="accent-cyan-400 w-5 h-5 rounded" 
                            />
                            <div className="flex-1">
                                <span className="text-sm font-bold text-white flex items-center gap-2"><UserCheck size={14} className="text-cyan-400"/> Interview Mode</span>
                            </div>
                            {showInterviewMode && (
                                <select 
                                    className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                                    value={interviewMode}
                                    onChange={e => setInterviewMode(e.target.value)}
                                >
                                    <option value="Delegation">Delegation</option>
                                    <option value="Online">Online</option>
                                </select>
                            )}
                        </div>

                        {/* Interview Date */}
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                checked={showInterviewDate} 
                                onChange={e => setShowInterviewDate(e.target.checked)} 
                                className="accent-cyan-400 w-5 h-5 rounded" 
                            />
                            <div className="flex-1">
                                <span className="text-sm font-bold text-white flex items-center gap-2"><Calendar size={14} className="text-cyan-400"/> Interview Date</span>
                            </div>
                            {showInterviewDate && (
                                <input 
                                    type="date"
                                    className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                                    value={interviewDate}
                                    onChange={e => setInterviewDate(e.target.value)}
                                />
                            )}
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                checked={showSecondaryPhone} 
                                onChange={e => setShowSecondaryPhone(e.target.checked)} 
                                className="accent-green-500 w-5 h-5 rounded" 
                            />
                            <div className="flex-1">
                                <span className="text-sm font-bold text-white flex items-center gap-2"><MessageCircle size={14} className="text-green-500"/> Add WhatsApp For Docs</span>
                            </div>
                        </div>
                   </div>
               </div>

               <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                   <div className="flex items-center justify-between border-b border-white/10 pb-2">
                       <h3 className="text-white font-bold">Vacancies</h3>
                       <button onClick={addJob} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-white font-bold"><Plus size={14}/> Add Job</button>
                   </div>

                   <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                       {jobs.map((job, idx) => (
                           <div key={job.id} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 relative group">
                               <button onClick={() => removeJob(job.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                               <div className="flex flex-col gap-3">
                                   <input 
                                      className="bg-transparent border-b border-white/10 text-white font-bold placeholder-slate-600 focus:border-cyan-400 outline-none pb-1" 
                                      placeholder="Job Title (e.g. Plumber)"
                                      value={job.title}
                                      onChange={(e) => updateJob(job.id, 'title', e.target.value)}
                                   />
                                   <div className="grid grid-cols-3 gap-4">
                                       <div className="flex items-center gap-2 col-span-1">
                                           <DollarSign size={14} className="text-green-400"/>
                                           <input 
                                              className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none" 
                                              placeholder="Salary"
                                              value={job.salary}
                                              onChange={(e) => updateJob(job.id, 'salary', e.target.value)}
                                           />
                                       </div>
                                       <div className="flex items-center gap-2 col-span-1">
                                           <Clock size={14} className="text-orange-400"/>
                                           <input 
                                              className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none" 
                                              placeholder="Duty Hrs"
                                              value={job.dutyHours}
                                              onChange={(e) => updateJob(job.id, 'dutyHours', e.target.value)}
                                           />
                                       </div>
                                       <div className="flex items-center gap-2 col-span-1">
                                           <Users size={14} className="text-blue-400"/>
                                           <input 
                                              className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none" 
                                              placeholder="Qty"
                                              value={job.count}
                                              onChange={(e) => updateJob(job.id, 'count', e.target.value)}
                                           />
                                       </div>
                                   </div>
                                   
                                   {/* License Dropdown */}
                                   <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-white/5">
                                        <Car size={14} className="text-yellow-400"/>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Driving License:</span>
                                        <select 
                                            className="bg-transparent text-xs text-white outline-none flex-1"
                                            value={job.license}
                                            onChange={e => updateJob(job.id, 'license', e.target.value)}
                                        >
                                            <option value="">Not Required</option>
                                            <option value="LTV">LTV Required</option>
                                            <option value="HTV">HTV Required</option>
                                            <option value="Valid">Valid License</option>
                                            <option value="Saudi">Saudi License</option>
                                            <option value="GCC">GCC License</option>
                                        </select>
                                   </div>

                                   {/* Benefits Checkboxes */}
                                   <div className="flex flex-wrap items-center gap-3 mt-1 pt-2 border-t border-white/5">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={job.accommodation} onChange={e => updateJob(job.id, 'accommodation', e.target.checked)} className="accent-cyan-400 w-4 h-4 rounded" />
                                            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Home size={10}/> Acc</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={job.medical} onChange={e => updateJob(job.id, 'medical', e.target.checked)} className="accent-cyan-400 w-4 h-4 rounded" />
                                            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><HeartPulse size={10}/> Med</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={job.transport} onChange={e => updateJob(job.id, 'transport', e.target.checked)} className="accent-cyan-400 w-4 h-4 rounded" />
                                            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Bus size={10}/> Trans</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={job.iqama} onChange={e => updateJob(job.id, 'iqama', e.target.checked)} className="accent-cyan-400 w-4 h-4 rounded" />
                                            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><CreditCard size={10}/> Iqama</span>
                                        </label>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Custom Prompt Box */}
               <div className="glass-card p-4 rounded-2xl flex flex-col gap-2">
                   <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                       <Sparkles size={12}/> Custom AI Instructions (Optional)
                   </label>
                   <textarea 
                       value={customPrompt}
                       onChange={e => setCustomPrompt(e.target.value)}
                       placeholder="e.g. 'Make the background blue', 'Add a red border', 'Change title font'..."
                       className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 outline-none h-20 resize-none text-sm placeholder-slate-600"
                   />
               </div>

               <button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full py-6 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-2xl text-xl shadow-neon transition-all hover:-translate-y-1 disabled:opacity-50"
               >
                   GENERATE AD
               </button>
           </div>

           {/* RIGHT: Preview (Scaled Viewport) */}
           <div className="xl:col-span-7 flex flex-col items-center sticky top-8">
               
               {/* Viewport Container */}
               <div className="w-full bg-slate-950 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                   
                   {/* Window Header */}
                   <div className="bg-slate-900 p-4 border-b border-white/10 flex justify-between items-center z-10">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full text-xs text-slate-400">
                             <Maximize2 size={12} /> 1080x1080px Preview
                        </div>
                        {generatedHtml && (
                            <div className="flex gap-2">
                                <button onClick={() => setPreviewScale(s => Math.max(0.2, s - 0.1))} className="p-1 hover:text-white text-slate-500"><ZoomOut size={16}/></button>
                                <button onClick={() => setPreviewScale(s => Math.min(1.0, s + 0.1))} className="p-1 hover:text-white text-slate-500"><ZoomIn size={16}/></button>
                            </div>
                        )}
                   </div>

                   {/* Scale Wrapper */}
                   <div className="w-full aspect-square bg-slate-900 relative overflow-hidden flex items-center justify-center">
                       {isGenerating ? (
                           <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center animate-fade-in">
                               <div className="relative w-32 h-32 mb-6">
                                    <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-full animate-ping"></div>
                                    <div className="absolute inset-4 border-4 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Megaphone size={32} className="text-cyan-400 animate-pulse" />
                                    </div>
                               </div>
                               <h2 className="text-2xl font-bold text-white tracking-widest animate-pulse text-center">CREATING AD...</h2>
                               <p className="text-cyan-400 mt-2 font-mono text-xs text-center px-8">DESIGNING LAYOUT • FETCHING YOUNG WORKFORCE IMAGES • APPLYING BRANDING</p>
                           </div>
                       ) : generatedHtml ? (
                           // The Transform Container
                           <div 
                                style={{ 
                                    width: '1080px', 
                                    height: '1080px', 
                                    transform: `scale(${previewScale})`, 
                                    transformOrigin: 'center center',
                                    backgroundColor: 'white',
                                    boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                                }}
                                className="transition-transform duration-300 ease-out"
                           >
                               <iframe 
                                  srcDoc={generatedHtml} 
                                  className="w-full h-full border-none" 
                                  title="Ad Preview"
                                  sandbox="allow-scripts"
                               />
                           </div>
                       ) : (
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-dots">
                               <Megaphone size={64} className="opacity-20 mb-4"/>
                               <p className="font-bold text-lg">Ad Workspace</p>
                               <p className="text-sm opacity-50">Generated Ads will appear here</p>
                           </div>
                       )}
                   </div>
               </div>

               {generatedHtml && !isGenerating && (
                   <div className="flex gap-4 mt-6 w-full justify-center">
                        <button 
                            onClick={handleDownloadImage}
                            className="px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl font-bold flex items-center gap-2 transition-all shadow-neon hover:-translate-y-1"
                        >
                            <ImageIcon size={20}/> Download High-Res (PNG)
                        </button>
                        <button 
                            onClick={handleDownloadHtml}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold flex items-center gap-2 transition-colors border border-white/10"
                        >
                            <Download size={20}/> Download HTML
                        </button>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};