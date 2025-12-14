import React, { useState } from 'react';
import { Upload, Sparkles, Fingerprint, Download, RefreshCw, X, AlertCircle, ArrowRight } from 'lucide-react';
import { generateIdentityPhoto, helperFileToBase64 } from '../services/geminiService';

export const IdentityLab: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
          setErrorMessage("Invalid file type.");
          return;
      }
      setOriginalImage(file);
      setGeneratedImageBase64(null);
      setErrorMessage(null);
    }
  };

  const processImage = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const base64 = await helperFileToBase64(originalImage);
      const resultBase64 = await generateIdentityPhoto(base64, originalImage.type);
      setGeneratedImageBase64(resultBase64);
    } catch (error: any) {
      setErrorMessage(error.message || "Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${generatedImageBase64}`;
    link.download = `identity_lab_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="text-center mb-12">
        <div className="inline-flex p-4 rounded-full bg-pink-500/10 border border-pink-500/30 mb-6 shadow-neon-pink">
          <Fingerprint size={40} className="text-pink-400" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 font-display">
          IDENTITY <span className="text-pink-400 drop-shadow-[0_0_20px_rgba(255,0,255,0.5)]">LAB</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          AI-powered professional identity enhancement. Upload a casual photo and get a DSLR-quality passport photo with professional attire.
        </p>
      </div>

      <div className="flex flex-col items-center min-h-[500px]">
        
        {!originalImage ? (
          <div 
            className="w-full max-w-2xl border-2 border-dashed border-pink-500/30 rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:border-pink-500 hover:bg-pink-500/5 transition-all group"
            onClick={() => document.getElementById('id-upload')?.click()}
          >
            <input id="id-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <Upload size={32} className="text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Photo</h3>
            <p className="text-slate-400">Drag & drop or click to browse</p>
          </div>
        ) : (!generatedImageBase64 && !isProcessing) ? (
          <div className="flex flex-col items-center gap-8 animate-slide-up w-full">
            <div className="relative w-full max-w-xs aspect-[3/4] rounded-2xl overflow-hidden border border-pink-500/30 shadow-2xl">
              <img src={URL.createObjectURL(originalImage)} className="w-full h-full object-cover" />
              <button onClick={() => setOriginalImage(null)} className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {errorMessage && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2">
                    <AlertCircle size={20} /> {errorMessage}
                </div>
            )}

            <button 
                onClick={processImage} 
                className="bg-pink-500 hover:bg-pink-400 text-black font-bold py-4 px-12 rounded-xl shadow-neon-pink transition-all hover:-translate-y-1 flex items-center gap-3 text-lg"
            >
                <Sparkles size={24} className="fill-black" /> ENHANCE IDENTITY
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12 w-full animate-pop-in">
             <div className="flex flex-wrap justify-center gap-8 md:gap-16 w-full items-center">
                
                {/* Original with Magic Animation */}
                <div className="relative w-72 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={URL.createObjectURL(originalImage)} className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'filter grayscale brightness-50 blur-sm' : ''}`} />
                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold text-white z-10">ORIGINAL</div>
                    
                    {/* MAGIC TRANSITION LAYER */}
                    {isProcessing && (
                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                            {/* Scanning Beam */}
                            <div className="absolute left-0 right-0 h-4 bg-pink-500/80 shadow-[0_0_50px_#ff00ff] animate-magic-scan mix-blend-screen"></div>
                            
                            {/* Particles */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            
                            {/* Magical Glow Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/0 via-pink-500/20 to-cyan-500/0 animate-pulse"></div>
                            
                            {/* Center Loader */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <Sparkles className="text-white w-20 h-20 animate-spin-slow drop-shadow-[0_0_20px_#ff00ff]" />
                                    <div className="absolute inset-0 animate-ping rounded-full bg-pink-500/30"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex text-pink-400">
                    {isProcessing ? <RefreshCw size={32} className="animate-spin" /> : <ArrowRight size={32} />}
                </div>

                {/* Result */}
                <div className="relative w-72 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-pink-500 shadow-neon-pink bg-slate-900 transition-all duration-1000">
                    {isProcessing ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-pink-400 gap-4 bg-black">
                             <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-transparent via-pink-900/20 to-transparent animate-pulse"></div>
                            <div className="text-sm font-bold tracking-widest animate-pulse z-10">APPLYING MAGIC...</div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full group">
                            <img src={`data:image/png;base64,${generatedImageBase64}`} className="w-full h-full object-cover animate-fade-in" />
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            <div className="absolute top-4 left-4 bg-pink-500/90 px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-lg">
                                <Sparkles size={12} className="fill-white" /> ENHANCED
                            </div>
                        </div>
                    )}
                </div>
             </div>

             {!isProcessing && (
                 <div className="flex gap-4 animate-slide-up">
                     <button onClick={() => { setGeneratedImageBase64(null); setOriginalImage(null); }} className="px-6 py-3 border border-white/10 rounded-xl text-white hover:bg-white/5 flex items-center gap-2 font-bold transition-all">
                        <RefreshCw size={20} /> New Scan
                     </button>
                     <button onClick={handleDownload} className="px-8 py-3 bg-pink-500 hover:bg-pink-400 text-black rounded-xl font-bold shadow-neon-pink transition-all flex items-center gap-2">
                        <Download size={20} /> Download Result
                     </button>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};