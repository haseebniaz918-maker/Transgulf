import React, { useState } from 'react';
import { ScanLine, Upload, Layers, Download, RefreshCw, X, AlertCircle, Sparkles, Crop } from 'lucide-react';
import { generateEnhancedDocument, helperFileToBase64 } from '../services/geminiService';

export const DocuScan: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [instruction, setInstruction] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const process = async () => {
      if (!image) return;
      setLoading(true);
      setResults([]);
      try {
          const base64 = await helperFileToBase64(image);
          const res = await generateEnhancedDocument(base64, image.type, instruction);
          setResults(res);
      } catch (e) { 
          alert("Scan Failed. Please try a clear image."); 
      }
      finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in flex flex-col items-center gap-8 max-w-5xl mx-auto pb-20">
        <div className="text-center">
            <h1 className="text-5xl font-bold text-white font-display mb-2">
                DocuScan <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-slate-400">
                Intelligent Document Extraction. Removes backgrounds, fixes perspective, and adds clean margins.
            </p>
        </div>
        
        {!image ? (
            <div 
                className="w-full max-w-2xl border-2 border-dashed border-cyan-400/30 rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-400/5 transition-all group"
                onClick={() => document.getElementById('scan-up')?.click()}
            >
                <input id="scan-up" type="file" className="hidden" accept="image/*" onChange={e => e.target.files && setImage(e.target.files[0])} />
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                     <Upload size={32} className="text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Upload Scan Source</h3>
                <p className="text-slate-400">Take a photo of a Passport, CNIC, or Paper Document</p>
            </div>
        ) : (
            <div className="w-full flex flex-col items-center gap-8 animate-slide-up">
                
                {/* Main Workflow */}
                <div className="flex flex-col md:flex-row gap-8 items-start w-full justify-center">
                    
                    {/* Source */}
                    <div className="relative group w-full max-w-sm rounded-2xl overflow-hidden border border-white/10">
                        <img src={URL.createObjectURL(image)} className="w-full object-cover" />
                        <button 
                            onClick={() => { setImage(null); setResults([]); }} 
                            className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <div className="glass-card p-4 rounded-xl flex flex-col gap-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Crop size={14} /> Focus Instruction (Optional)
                            </label>
                            <input 
                                value={instruction}
                                onChange={e => setInstruction(e.target.value)}
                                placeholder="e.g. 'The green passport only' or 'Top ID card'"
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 outline-none"
                            />
                        </div>

                        <button 
                            onClick={process} 
                            disabled={loading}
                            className="w-full py-4 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-xl shadow-neon transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : <ScanLine />}
                            {loading ? 'AI SCANNING...' : 'START EXTRACTION'}
                        </button>
                    </div>
                </div>
                
                {/* Results Grid */}
                {results.length > 0 && (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pop-in mt-8">
                        {results.map((r, i) => (
                            <div key={i} className="glass-card p-0 rounded-2xl overflow-hidden border border-cyan-400/50 shadow-neon-strong">
                                <div className="aspect-[3/4] md:aspect-auto bg-white flex items-center justify-center p-4">
                                     <img src={`data:image/png;base64,${r}`} className="max-w-full max-h-full shadow-lg" />
                                </div>
                                <div className="p-4 bg-slate-900">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles size={12}/> Enhanced
                                        </span>
                                        <span className="text-slate-500 text-xs">2cm Margin Added</span>
                                    </div>
                                    <button 
                                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors" 
                                        onClick={() => { const l=document.createElement('a'); l.href=`data:image/png;base64,${r}`; l.download=`scan_${i+1}.jpg`; l.click(); }}
                                    >
                                        <Download size={18} /> Download JPG
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};