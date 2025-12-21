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
        <div className="inline-flex p-4 rounded-full bg-primary/10 border border-primary/30 mb-6 shadow-neon">
          <Fingerprint size={40} className="text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-theme-text mb-4 font-display">
          IDENTITY <span className="text-primary drop-shadow-[0_0_20px_rgba(var(--primary-color),0.5)]">LAB</span>
        </h1>
        <p className="text-theme-text opacity-60 max-w-2xl mx-auto text-lg">
          AI-powered professional identity enhancement. Upload a casual photo and get a DSLR-quality passport photo with professional attire.
        </p>
      </div>

      <div className="flex flex-col items-center min-h-[500px]">
        
        {!originalImage ? (
          <div 
            className="w-full max-w-2xl border-2 border-dashed border-primary/30 rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
            onClick={() => document.getElementById('id-upload')?.click()}
          >
            <input id="id-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <Upload size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-theme-text mb-2">Upload Photo</h3>
            <p className="text-theme-text opacity-50">Drag & drop or click to browse</p>
          </div>
        ) : (!generatedImageBase64 && !isProcessing) ? (
          <div className="flex flex-col items-center gap-8 animate-slide-up w-full">
            <div className="relative w-full max-w-xs aspect-[3/4] rounded-2xl overflow-hidden border border-primary/30 shadow-2xl">
              <img src={URL.createObjectURL(originalImage)} className="w-full h-full object-cover" />
              <button onClick={() => setOriginalImage(null)} className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {errorMessage && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 rounded-xl flex items-center gap-2">
                    <AlertCircle size={20} /> {errorMessage}
                </div>
            )}

            <button 
                onClick={processImage} 
                className="bg-primary hover:opacity-90 text-white dark:text-black font-bold py-4 px-12 rounded-xl shadow-neon transition-all hover:-translate-y-1 flex items-center gap-3 text-lg"
            >
                <Sparkles size={24} className="fill-current" /> ENHANCE IDENTITY
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12 w-full animate-pop-in">
             <div className="flex flex-wrap justify-center gap-8 md:gap-16 w-full items-center">
                
                <div className="relative w-72 aspect-[3/4] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 group">
                    <img src={URL.createObjectURL(originalImage)} className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'filter grayscale brightness-50 blur-sm' : ''}`} />
                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold text-white z-10">ORIGINAL</div>
                    
                    {isProcessing && (
                        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                            <div className="absolute left-0 right-0 h-4 bg-primary shadow-neon animate-magic-scan mix-blend-screen"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <Sparkles className="text-white w-20 h-20 animate-spin-slow drop-shadow-[0_0_20px_var(--primary-color)]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex text-primary">
                    {isProcessing ? <RefreshCw size={32} className="animate-spin" /> : <ArrowRight size={32} />}
                </div>

                <div className="relative w-72 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary shadow-neon bg-white dark:bg-slate-900 transition-all duration-1000">
                    {isProcessing ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-primary gap-4 bg-black/5 dark:bg-black">
                            <div className="text-sm font-bold tracking-widest animate-pulse z-10 uppercase">Applying Magic...</div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full group">
                            <img src={`data:image/png;base64,${generatedImageBase64}`} className="w-full h-full object-cover animate-fade-in" />
                            <div className="absolute top-4 left-4 bg-primary px-3 py-1 rounded-lg text-xs font-bold text-white dark:text-black flex items-center gap-1 shadow-lg">
                                <Sparkles size={12} className="fill-current" /> ENHANCED
                            </div>
                        </div>
                    )}
                </div>
             </div>

             {!isProcessing && (
                 <div className="flex gap-4 animate-slide-up">
                     <button onClick={() => { setGeneratedImageBase64(null); setOriginalImage(null); }} className="px-6 py-3 border border-black/10 dark:border-white/10 rounded-xl text-theme-text hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 font-bold transition-all">
                        <RefreshCw size={20} /> New Scan
                     </button>
                     <button onClick={handleDownload} className="px-8 py-3 bg-primary hover:opacity-90 text-white dark:text-black rounded-xl font-bold shadow-neon transition-all flex items-center gap-2">
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
