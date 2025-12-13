import React, { useState } from 'react';
import { Upload, ScanLine, X, Download, RefreshCw, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { generateEnhancedDocument, helperFileToBase64 } from '../services/geminiService';
import JSZip from 'jszip';

export const DocuScan: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
          setErrorMessage("Invalid file type. Please upload a valid image (JPG, PNG).");
          return;
      }
      setOriginalImage(file);
      setProcessedImages([]);
      setErrorMessage(null);
    }
  };

  const processDocument = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const base64 = await helperFileToBase64(originalImage);
      // AI detects ALL documents, crops, flattens, and returns array of base64 images
      const results = await generateEnhancedDocument(base64, originalImage.type);
      setProcessedImages(results);
    } catch (err: any) {
      setErrorMessage("Failed to enhance document. Ensure the image is clear.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (processedImages.length === 0) return;

    if (processedImages.length === 1) {
        // Single File Download - DIRECT RAW IMAGE
        const link = document.createElement('a');
        link.download = `DocuScan_Cropped_${Date.now()}.jpg`;
        link.href = `data:image/jpeg;base64,${processedImages[0]}`;
        link.click();
    } else {
        // Batch ZIP Download - DIRECT RAW IMAGES
        const zip = new JSZip();
        const folder = zip.folder("Scanned_Documents");
        
        processedImages.forEach((imgBase64, idx) => {
             folder?.file(`Document_${idx + 1}.jpg`, imgBase64, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `DocuScan_Batch_${Date.now()}.zip`;
        link.click();
    }
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
          Multi-document intelligence. Upload a photo containing multiple items (Passports, CNICs, Papers) and AI will separate, crop, and straighten each one individually with tight borders.
        </p>
      </div>

      {!originalImage ? (
         // Upload Area
         <div 
           className="w-full max-w-2xl h-80 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl flex flex-col items-center justify-center bg-slate-900/50 hover:bg-emerald-500/5 transition-all cursor-pointer group relative overflow-hidden"
           onClick={() => document.getElementById('doc-upload')?.click()}
         >
             {/* Animation BG */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <input id="doc-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/5">
               <Upload className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">Upload Scan Photo</h3>
            <p className="text-slate-500 relative z-10">Supports Multiple Documents in One Image</p>
            {errorMessage && <p className="text-red-400 text-sm mt-2 relative z-10">{errorMessage}</p>}
         </div>
      ) : (
         // Workspace
         <div className="w-full flex flex-col gap-12">
            
            {/* 1. Input Section */}
            <div className="w-full flex flex-col items-center">
                <div className="relative max-w-lg w-full bg-slate-900 p-2 rounded-2xl border border-white/10 shadow-xl">
                   <div className="absolute -top-3 -left-3 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">ORIGINAL</div>
                   <img src={URL.createObjectURL(originalImage)} className="w-full rounded-xl opacity-90" />
                   <button 
                     onClick={() => { setOriginalImage(null); setProcessedImages([]); }}
                     className="absolute top-4 right-4 bg-black/70 hover:bg-red-500 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                   >
                       <X className="w-4 h-4" />
                   </button>
                </div>
            </div>

            {/* 2. Process / Results Section */}
            <div className="w-full flex flex-col items-center gap-6">
                
                {processedImages.length === 0 ? (
                    // Processing State
                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-6 max-w-2xl w-full backdrop-blur-sm">
                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-6 py-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ScanLine className="w-6 h-6 text-emerald-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-white font-bold text-xl">Analyzing Scene...</h3>
                                    <p className="text-slate-400 text-sm">Separating distinct documents & correcting perspective</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-emerald-500/10 rounded-full">
                                    <Layers className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ready to Extract</h3>
                                    <p className="text-slate-400 text-sm">
                                        AI will identify if there is one or multiple documents, crop them tightly, and prepare them for export with professional margins.
                                    </p>
                                </div>
                                {errorMessage && (
                                    <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> {errorMessage}
                                    </div>
                                )}
                                <button 
                                    onClick={processDocument}
                                    className="px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-1"
                                >
                                    Start AI Scan
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    // Results Grid
                    <div className="w-full animate-slide-up space-y-8">
                         <div className="flex flex-col items-center">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <CheckCircle2 className="text-emerald-500" /> 
                                {processedImages.length} Document{processedImages.length > 1 ? 's' : ''} Extracted
                            </h2>
                            
                            {/* Actions Bar */}
                            <div className="flex gap-4 mb-8">
                                 <button 
                                    onClick={() => { setProcessedImages([]); setOriginalImage(null); }}
                                    className="px-6 py-3 border border-white/10 text-slate-300 hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2"
                                 >
                                    <RefreshCw className="w-4 h-4" /> Reset
                                 </button>
                                 <button 
                                    onClick={handleDownloadAll}
                                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
                                 >
                                    <Download className="w-4 h-4" /> 
                                    {processedImages.length > 1 ? 'Download All (ZIP)' : 'Download Document'}
                                 </button>
                            </div>
                         </div>

                         {/* Grid */}
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {processedImages.map((imgBase64, idx) => (
                                 <div key={idx} className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl hover:border-emerald-500/50 transition-colors group">
                                     <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                                         <span className="text-xs font-bold text-emerald-400 uppercase">Document #{idx + 1}</span>
                                         <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded">Raw Crop</span>
                                     </div>
                                     <div className="p-8 bg-[#f8fafc] flex items-center justify-center relative min-h-[300px]">
                                         <div className="relative shadow-xl">
                                            <img src={`data:image/png;base64,${imgBase64}`} className="w-full max-h-[300px] object-contain" />
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                         
                         <p className="text-center text-slate-500 text-sm mt-8">
                            Note: Downloads are raw AI crops with no extra margin.
                         </p>
                    </div>
                )}
            </div>
         </div>
      )}
    </div>
  );
};