import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Fingerprint, Download, RefreshCw, X, Camera, ArrowRight } from 'lucide-react';
import { generateIdentityPhoto, helperFileToBase64 } from '../services/geminiService';

export const IdentityLab: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const themeColor = "#ff00ff"; // Pink

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOriginalImage(e.target.files[0]);
      setGeneratedImageBase64(null);
    }
  };

  const processImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setScanProgress(0);

    // Simulate scanning progress visually while waiting
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 500);

    try {
      const base64 = await helperFileToBase64(originalImage);
      const resultBase64 = await generateIdentityPhoto(base64, originalImage.type);
      
      setScanProgress(100);
      clearInterval(progressInterval);
      
      // Small delay for smooth transition
      setTimeout(() => {
        setGeneratedImageBase64(resultBase64);
        setIsProcessing(false);
      }, 500);

    } catch (error) {
      console.error(error);
      alert("Failed to process image. Please try again.");
      setIsProcessing(false);
      clearInterval(progressInterval);
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
    <div className="w-full h-full flex flex-col p-6 md:p-12 max-w-7xl mx-auto animate-fade-in text-slate-100">
      
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-pink-500/10 border border-pink-500/30 mb-6 shadow-[0_0_30px_rgba(255,0,255,0.2)] animate-pulse">
          <Fingerprint className="w-10 h-10 text-[#ff00ff]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">
          IDENTITY <span className="text-[#ff00ff]" style={{ textShadow: '0 0 20px #ff00ff' }}>LAB</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          AI-powered professional identity enhancement. Upload a casual photo and let our Neural Engine transform it into a DSLR-quality passport photo with professional attire.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        
        {!originalImage ? (
          // Upload State
          <div 
            className="w-full max-w-xl h-96 border-2 border-dashed border-pink-500/30 rounded-3xl flex flex-col items-center justify-center bg-black/20 hover:bg-pink-500/5 transition-all cursor-pointer group hover:border-pink-500 hover:shadow-[0_0_20px_rgba(255,0,255,0.1)]"
            onClick={() => document.getElementById('upload-input')?.click()}
          >
            <input 
              id="upload-input" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <div className="w-20 h-20 rounded-full bg-[#1e293b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Upload className="w-10 h-10 text-[#ff00ff]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Photo</h3>
            <p className="text-slate-500">Drag & drop or click to browse</p>
          </div>
        ) : !generatedImageBase64 ? (
          // Processing / Preview State
          <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-slide-up">
            
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden border border-pink-500/30 shadow-2xl bg-black">
              <img 
                src={URL.createObjectURL(originalImage)} 
                alt="Original" 
                className="w-full h-full object-cover opacity-80" 
              />
              
              {/* Scanning Overlay */}
              {isProcessing && (
                 <div className="absolute inset-0 z-10">
                    <div className="absolute inset-0 bg-pink-500/10 animate-pulse"></div>
                    <div 
                      className="absolute left-0 w-full h-1 bg-[#ff00ff] shadow-[0_0_20px_#ff00ff] z-20"
                      style={{ 
                        top: `${scanProgress}%`,
                        transition: 'top 0.5s linear' 
                      }}
                    ></div>
                    <div className="absolute bottom-4 left-0 w-full text-center">
                        <span className="text-[#ff00ff] font-mono text-sm tracking-widest bg-black/50 px-3 py-1 rounded">
                           PROCESSING: {scanProgress}%
                        </span>
                    </div>
                 </div>
              )}

              <button 
                onClick={() => setOriginalImage(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-red-500 text-white p-2 rounded-full transition-colors z-30"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isProcessing && (
              <button 
                onClick={processImage}
                className="px-12 py-4 bg-[#ff00ff] hover:bg-[#d900d9] text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:shadow-[0_0_30px_rgba(255,0,255,0.6)] transition-all transform hover:-translate-y-1 flex items-center gap-3"
              >
                <Sparkles className="w-6 h-6 fill-black" />
                ENHANCE IDENTITY
              </button>
            )}

            {isProcessing && (
                <p className="text-pink-400 animate-pulse font-mono tracking-wide">Analysing facial features & structure...</p>
            )}
          </div>
        ) : (
          // Result State
          <div className="w-full max-w-6xl flex flex-col items-center gap-12 animate-pop-in">
             <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
                
                {/* Original */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-72 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                        <img 
                            src={URL.createObjectURL(originalImage)} 
                            alt="Original" 
                            className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0" 
                        />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                            <span className="text-xs text-white font-bold tracking-wider">ORIGINAL</span>
                        </div>
                    </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center text-pink-500">
                    <ArrowRight className="w-8 h-8 opacity-50" />
                </div>

                {/* Result */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-80 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#ff00ff] shadow-[0_0_30px_rgba(255,0,255,0.2)] group">
                        <img 
                            src={`data:image/png;base64,${generatedImageBase64}`} 
                            alt="Generated" 
                            className="w-full h-full object-cover" 
                        />
                         <div className="absolute top-4 left-4 bg-pink-500/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 shadow-lg">
                            <span className="text-xs text-white font-bold tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 fill-white" /> ENHANCED
                            </span>
                        </div>
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    </div>
                </div>
             </div>

             <div className="flex gap-4">
                 <button 
                    onClick={() => { setGeneratedImageBase64(null); setOriginalImage(null); }}
                    className="px-6 py-3 border border-pink-500/30 text-pink-500 hover:bg-pink-500/10 rounded-xl font-bold transition-all flex items-center gap-2"
                 >
                    <RefreshCw className="w-5 h-5" /> New Scan
                 </button>

                 <button 
                    onClick={handleDownload}
                    className="px-8 py-3 bg-[#ff00ff] hover:bg-[#d900d9] text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:shadow-[0_0_30px_rgba(255,0,255,0.6)] transition-all transform hover:-translate-y-1 flex items-center gap-2"
                 >
                    <Download className="w-5 h-5" /> Download Identity
                 </button>
             </div>
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