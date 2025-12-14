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
                
                {/* Original */}
                <div className="relative w-72 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={URL.createObjectURL(originalImage)} className={`w-full h-full object-cover transition-all duration-700 ${isProcessing ? 'grayscale opacity-50' : ''}`} />
                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-xs font-bold text-white">ORIGINAL</div>
                    {isProcessing && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 shadow-[0_0_15px_#ff00ff] animate-slide-up"></div>
                    )}
                </div>

                <div className="hidden md:flex text-pink-400">
                    <ArrowRight size={32} />
                </div>

                {/* Result */}
                <div className="relative w-72 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-pink-500 shadow-neon-pink">
                    {isProcessing ? (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-pink-400 gap-4">
                            <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
                            <span className="text-sm font-bold tracking-widest animate-pulse">ENHANCING...</span>
                        </div>
                    ) : (
                        <>
                            <img src={`data:image/png;base64,${generatedImageBase64}`} className="w-full h-full object-cover" />
                            <div className="absolute top-4 left-4 bg-pink-500/90 px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                                <Sparkles size={12} className="fill-white" /> ENHANCED
                            </div>
                        </>
                    )}
                </div>
             </div>

             {!isProcessing && (
                 <div className="flex gap-4">
                     <button onClick={() => { setGeneratedImageBase64(null); setOriginalImage(null); }} className="px-6 py-3 border border-white/10 rounded-xl text-white hover:bg-white/5 flex items-center gap-2 font-bold transition-all">
                        <RefreshCw size={20} /> New Scan
                     </button>
                     <button onClick={handleDownload} className="px-8 py-3 bg-pink-500 hover:bg-pink-400 text-black rounded-xl font-bold shadow-neon-pink transition-all flex items-center gap-2">
                        <Download size={20} /> Download
                     </button>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};