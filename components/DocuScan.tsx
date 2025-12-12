import React, { useState, useRef } from 'react';
import { Upload, ScanLine, X, Download, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateEnhancedDocument, helperFileToBase64 } from '../services/geminiService';

export const DocuScan: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImageBase64, setProcessedImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOriginalImage(e.target.files[0]);
      setProcessedImageBase64(null);
      setErrorMessage(null);
    }
  };

  const processDocument = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const base64 = await helperFileToBase64(originalImage);
      // AI cleans the doc (crops, flattens, whitens bg, enhances text)
      // The prompt now strictly enforces "NO MARGIN" output from AI.
      const cleanDocBase64 = await generateEnhancedDocument(base64, originalImage.type);
      setProcessedImageBase64(cleanDocBase64);
    } catch (err: any) {
      setErrorMessage("Failed to enhance document. Ensure the image is clear.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Downloads the image with a programmatic margin (approx 2cm)
  const downloadWithMargin = () => {
    if (!processedImageBase64) return;

    const img = new Image();
    img.src = `data:image/png;base64,${processedImageBase64}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 2cm margin simulation.
      // On A4 (210mm), 20mm is ~10%.
      // On Passport (125mm), 20mm is ~16%.
      // We'll use 15% to be safe and noticeable.
      const marginSize = img.width * 0.15; 

      canvas.width = img.width + (marginSize * 2);
      canvas.height = img.height + (marginSize * 2);

      // Fill White Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // No Drop Shadow - User requested "Scanned" look, usually flat.
      // But we can add a very faint one to separate from white if they print it.
      // Actually, standard scans don't have shadows. Let's keep it flat for professional look.
      
      // Draw Document Centered
      ctx.drawImage(img, marginSize, marginSize, img.width, img.height);

      // Download
      const link = document.createElement('a');
      link.download = `DocuScan_Enhanced_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-12 max-w-7xl mx-auto flex flex-col items-center animate-fade-in">
      
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <ScanLine className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight text-white">
          DocuScan <span className="text-emerald-500">AI</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Turn any photo into a perfect, flat-bed quality scan. AI automatically crops to the document edges, removes the background, and adds a precise 2cm margin.
        </p>
      </div>

      {!originalImage ? (
         // Upload Area
         <div 
           className="w-full max-w-2xl h-80 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl flex flex-col items-center justify-center bg-slate-900/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
           onClick={() => document.getElementById('doc-upload')?.click()}
         >
            <input id="doc-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Upload className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Document Photo</h3>
            <p className="text-slate-500">Supported: JPG, PNG</p>
         </div>
      ) : (
         // Workspace
         <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-center">
            
            {/* Input Preview */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 relative">
                   <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-1">Original Input</h3>
                   <img src={URL.createObjectURL(originalImage)} className="w-full rounded-lg opacity-80" />
                   
                   <button 
                     onClick={() => { setOriginalImage(null); setProcessedImageBase64(null); }}
                     className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white hover:bg-red-500 transition-colors"
                   >
                       <X className="w-4 h-4" />
                   </button>
                </div>
            </div>

            {/* Controls & Output */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                
                {/* Status / Action */}
                {!processedImageBase64 ? (
                    <div className="bg-slate-900 p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-4">
                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                                <div className="space-y-1">
                                    <h3 className="text-white font-bold text-lg">Scanning Document...</h3>
                                    <p className="text-slate-400 text-sm">Cropping edges & flattening perspective</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <ScanLine className="w-12 h-12 text-emerald-500 mb-2" />
                                <h3 className="text-xl font-bold text-white">Ready to Scan</h3>
                                <p className="text-slate-400 text-sm max-w-xs">
                                    AI will isolate the document from the background and clean it up.
                                </p>
                                {errorMessage && (
                                    <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> {errorMessage}
                                    </div>
                                )}
                                <button 
                                    onClick={processDocument}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
                                >
                                    Start AI Scan
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="animate-slide-up flex flex-col gap-6">
                         {/* Output Preview */}
                         <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                             <h3 className="text-xs font-bold text-emerald-500 uppercase mb-3 ml-1 flex items-center gap-2">
                                 <CheckCircle2 className="w-4 h-4" /> Enhanced Result
                             </h3>
                             
                             {/* The image here shows the "Margin" visually by adding padding to container */}
                             <div className="bg-white p-6 md:p-10 rounded shadow-inner flex items-center justify-center">
                                 <img src={`data:image/png;base64,${processedImageBase64}`} className="w-full shadow-2xl" />
                             </div>
                         </div>

                         {/* Actions */}
                         <div className="flex gap-4">
                             <button 
                                onClick={() => { setProcessedImageBase64(null); setOriginalImage(null); }}
                                className="px-6 py-4 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2"
                             >
                                <RefreshCw className="w-5 h-5" /> New
                             </button>
                             <button 
                                onClick={downloadWithMargin}
                                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
                             >
                                <Download className="w-5 h-5" /> Download with Margin
                             </button>
                         </div>
                         <p className="text-center text-xs text-slate-500">
                             Downloaded file includes a professional 2cm (approx) white margin.
                         </p>
                    </div>
                )}

            </div>
         </div>
      )}
    </div>
  );
};