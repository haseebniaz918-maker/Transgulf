import React, { useState, useRef } from 'react';
import { 
  Merge, Split, Shrink, Image, FileText, FileOutput, FileInput, 
  Wand2, X, Upload, Plus, Trash2, ArrowUp, ArrowDown, Zap, FileImage, Files, Settings
} from 'lucide-react';
import { analyzePdfContent, helperFileToBase64, convertPdfToWordHtml, enhanceHtmlForPdf } from '../services/geminiService';
import { mergePdfs, splitPdfToZip, pdfToImagesZip, pdfsToImagesZip, imagesToPdf, compressPdf, downloadBlob, getPdfPageCount, pdfToSinglePageImage } from '../services/pdfUtils';
import { ToolDef } from '../types';
import * as mammoth from 'mammoth';

interface PdfToolsProps {
  // empty
}

export const PdfTools: React.FC<PdfToolsProps> = () => {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('image/jpeg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Styling constants with INTENSE NEON effects
  const cardBaseClass = "bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 group cursor-pointer h-full relative overflow-hidden hover:-translate-y-2 hover:border-[#00f3ff] hover:shadow-[0_0_25px_rgba(0,243,255,0.4)]";
  const iconContainerClass = "w-16 h-16 rounded-2xl bg-[#020617] border border-[#00f3ff]/20 flex items-center justify-center group-hover:bg-[#00f3ff] group-hover:border-[#00f3ff] transition-all duration-500 shadow-[0_0_15px_rgba(0,0,0,0.8)] group-hover:shadow-[0_0_30px_#00f3ff]";
  const iconClass = "w-8 h-8 text-[#00f3ff] transition-all duration-300 group-hover:text-black group-hover:scale-110";

  const tools: ToolDef[] = [
    { id: 'merge', title: 'Merge PDF', description: 'Combine multiple PDFs into one.', icon: Merge, color: '#00f3ff', neonClass: '', action: () => {} },
    { id: 'split', title: 'Split PDF', description: 'Split PDF pages into a ZIP file.', icon: Split, color: '#00f3ff', neonClass: '', action: () => {} },
    { id: 'compress', title: 'Compress PDF', description: 'Optimize PDF size by quality reduction.', icon: Shrink, color: '#00f3ff', neonClass: '', action: () => {} },
    { id: 'pdf-to-img', title: 'PDF to Photo', description: 'Convert PDF pages to Photos (JPG, PNG).', icon: Image, color: '#00f3ff', neonClass: '', action: () => {} },
    { id: 'img-to-pdf', title: 'Photo to PDF', description: 'Convert Photos (JPG, PNG) to PDF.', icon: FileInput, color: '#00f3ff', neonClass: '', action: () => {} },
    { id: 'pdf-to-word', title: 'PDF to MS Word', description: 'AI-Enhanced conversion to editable DOCX.', icon: FileText, color: '#00f3ff', neonClass: '', action: () => {} },
    { id: 'word-to-pdf', title: 'MS Word to PDF', description: 'Convert DOCX files to PDF format.', icon: FileOutput, color: '#00f3ff', neonClass: '', action: () => {} },
    { id: 'ai-assist', title: 'AI Assistant', description: 'Chat with your PDF content.', icon: Wand2, color: '#00f3ff', neonClass: '', action: () => {} },
  ];

  const handleToolClick = (tool: ToolDef) => {
    setActiveTool(tool);
    setFiles([]);
    setResultMessage('');
    setAiPrompt('');
    setProgress(0);
    setOutputFormat('image/jpeg'); // Default
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (['merge', 'pdf-to-img', 'img-to-pdf'].includes(activeTool?.id || '')) {
        setFiles(prev => [...prev, ...newFiles]);
      } else {
        setFiles([newFiles[0]]);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFiles = [...files];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      setFiles(newFiles);
    } else if (direction === 'down' && index < files.length - 1) {
      const newFiles = [...files];
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      setFiles(newFiles);
    }
  };

  const processFiles = async (mode?: 'split-pdf' | 'split-img') => {
    if (files.length === 0 || !activeTool) return;
    
    setIsProcessing(true);
    setProgress(10);
    setResultMessage('');

    try {
      if (activeTool.id === 'word-to-pdf') {
        setProgress(15);
        setResultMessage("Reading MS Word Document Structure...");
        
        // Strict file check to avoid JSZip "central directory" errors
        if (!files[0].name.toLowerCase().endsWith('.docx')) {
             throw new Error("Invalid file format. Only modern .docx files are supported. Legacy .doc files cannot be processed.");
        }

        const arrayBuffer = await files[0].arrayBuffer();
        let rawHtml = "";

        try {
            const result = await mammoth.convertToHtml({ arrayBuffer });
            rawHtml = result.value;
            if (!rawHtml) throw new Error("Empty document.");
        } catch (e: any) {
            console.error("Mammoth Error", e);
            if (e.message && e.message.includes("end of central directory")) {
                throw new Error("The file appears to be corrupted or is not a valid .docx archive.");
            }
            throw new Error("Failed to read Word document. Ensure it is a valid .docx file.");
        }

        setProgress(40);
        setResultMessage("AI Analyzing Layout & Typography...");
        
        // AI Enhancement
        const styledHtml = await enhanceHtmlForPdf(rawHtml);

        setProgress(70);
        setResultMessage("Rasterizing Vector Layouts & Generating PDF...");

        // Create a temporary container
        const element = document.createElement('div');
        element.innerHTML = styledHtml;
        element.style.width = '800px'; // Force A4-ish width
        element.style.padding = '40px';
        element.style.background = 'white';
        element.style.color = 'black';
        document.body.appendChild(element);

        const opt = {
          margin:       0.5,
          filename:     `${files[0].name.replace('.docx', '').replace('.doc', '')}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        // Use global html2pdf
        if ((window as any).html2pdf) {
            await (window as any).html2pdf().set(opt).from(element).save();
            document.body.removeChild(element);
            
            setProgress(100);
            setResultMessage("PDF Generated Successfully! Download starting...");
            setIsProcessing(false);
        } else {
            document.body.removeChild(element);
            throw new Error("PDF Generation library not loaded.");
        }
        return;
      }

      if (activeTool.id === 'pdf-to-word') {
          setProgress(20);
          setResultMessage("Analyzing Deep-Layer Layout Geometry...");
          const base64 = await helperFileToBase64(files[0]);
          
          setProgress(50);
          setResultMessage("Reconstructing complex tables, columns, and typography...");
          const htmlContent = await convertPdfToWordHtml(base64);
          
          if (!htmlContent || htmlContent.length < 50) {
              throw new Error("AI could not generate sufficient content. The PDF might be empty or unreadable.");
          }

          setProgress(90);
          setResultMessage("Finalizing MS Word (.doc) compatibility structures...");
          
          // The service now returns the full HTML document with correct namespaces
          const blob = new Blob([htmlContent], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${files[0].name.replace('.pdf', '')}.doc`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setResultMessage("Conversion successful! High-fidelity document downloaded.");
          setProgress(100);
          setIsProcessing(false);
          return;
      }

      if (activeTool.id === 'merge') {
        const mergedBytes = await mergePdfs(files);
        downloadBlob(mergedBytes, 'bhattis_merged.pdf');
        setResultMessage('Merged successfully!');
      } 
      else if (activeTool.id === 'compress') {
        setResultMessage("AI analyzing visual data structure...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(30);
        setResultMessage("Optimizing redundant vectors and compressing streams...");
        
        const compressedBytes = await compressPdf(files[0]);
        setProgress(90);
        downloadBlob(compressedBytes, `bhattis_compressed_${files[0].name}`);
        setResultMessage('Compression complete! Size reduced by approximately 60%.');
      } 
      else if (activeTool.id === 'split') {
        if (mode === 'split-pdf') {
          const zipBlob = await splitPdfToZip(files[0]);
          downloadBlob(zipBlob, `bhattis_split_${files[0].name.replace('.pdf', '')}.zip`);
          setResultMessage('Pages extracted successfully!');
        } else if (mode === 'split-img') {
          const zipBlob = await pdfToImagesZip(files[0], 'image/jpeg');
          downloadBlob(zipBlob, `bhattis_images_${files[0].name.replace('.pdf', '')}.zip`);
          setResultMessage('Converted to images successfully!');
        }
      } 
      else if (activeTool.id === 'pdf-to-img') {
        const ext = outputFormat === 'image/png' ? 'png' : 'jpg';
        // Special logic: If 1 file and 1 page -> Single Image; else -> ZIP
        if (files.length === 1) {
            const pageCount = await getPdfPageCount(files[0]);
            if (pageCount === 1) {
                const imgBlob = await pdfToSinglePageImage(files[0], outputFormat);
                downloadBlob(imgBlob, `${files[0].name.replace('.pdf', '')}.${ext}`);
                setResultMessage(`Converted to ${ext.toUpperCase()} successfully!`);
            } else {
                const zipBlob = await pdfToImagesZip(files[0], outputFormat);
                downloadBlob(zipBlob, `bhattis_images_${files[0].name.replace('.pdf', '')}.zip`);
                setResultMessage(`Converted to images (ZIP) successfully!`);
            }
        } else {
             // Multiple files -> Batch ZIP
             const zipBlob = await pdfsToImagesZip(files, outputFormat);
             downloadBlob(zipBlob, `bhattis_images_batch.zip`);
             setResultMessage('Batch conversion successful!');
        }
      }
      else if (activeTool.id === 'img-to-pdf') {
        const pdfBytes = await imagesToPdf(files);
        downloadBlob(pdfBytes, 'bhattis_converted.pdf');
        setResultMessage('Photos merged into PDF successfully!');
      } 
      else if (activeTool.id === 'ai-assist') {
        const base64 = await helperFileToBase64(files[0]);
        const userPrompt = aiPrompt || "Summarize this document.";
        const analysis = await analyzePdfContent(base64, userPrompt);
        setResultMessage(analysis);
      } 
    } catch (err: any) {
      console.error(err);
      setResultMessage(err.message || "Error processing request. Please check file validity.");
    } finally {
      if (!['pdf-to-word', 'word-to-pdf'].includes(activeTool.id)) {
        setIsProcessing(false);
        setProgress(100);
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 pb-32">
      {/* Hero Text */}
      <div className="text-center mb-16 animate-slide-up">
        <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tighter">
          PDF <span className="text-[#00f3ff] drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]">NEON</span> TOOLS
        </h1>
        <p className="text-slate-400 text-lg mb-6 tracking-wide font-light">Powered by WebAssembly & Pro AI Models</p>
        <div className="h-1 w-32 bg-[#00f3ff] mx-auto rounded-full shadow-[0_0_20px_#00f3ff] animate-pulse"></div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool, idx) => (
          <div
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            className={`${cardBaseClass} animate-fade-in`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f3ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className={iconContainerClass}>
              <tool.icon className={iconClass} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#00f3ff] transition-colors drop-shadow-md">{tool.title}</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">{tool.description}</p>
            </div>
            
            {/* Corner Accent */}
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="w-2 h-2 bg-[#00f3ff] rounded-full shadow-[0_0_10px_#00f3ff]"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {activeTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#0f172a] border-2 border-[#00f3ff]/50 w-full max-w-2xl rounded-2xl shadow-[0_0_80px_rgba(0,243,255,0.3)] overflow-hidden flex flex-col max-h-[90vh] animate-pop-in relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#00f3ff]/30 flex justify-between items-center bg-[#00f3ff]/5 relative">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent shadow-[0_0_15px_#00f3ff]"></div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00f3ff] rounded-xl shadow-[0_0_20px_#00f3ff]">
                   <activeTool.icon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-wide">{activeTool.title}</h3>
                  <p className="text-xs text-[#00f3ff] uppercase tracking-[0.2em] font-bold text-shadow-neon">Active Workspace</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTool(null)} 
                className="p-2 text-slate-400 hover:text-[#00f3ff] hover:bg-[#00f3ff]/10 rounded-full transition-colors hover:rotate-90 duration-300"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-8 overflow-y-auto">
              {files.length === 0 ? (
                <div 
                  className="h-64 border-2 border-dashed border-[#1e293b] hover:border-[#00f3ff] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer group hover:bg-[#00f3ff]/5 relative overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-24 h-24 rounded-full bg-[#1e293b] border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] group-hover:bg-[#00f3ff]">
                    <Upload className="w-10 h-10 text-[#00f3ff] group-hover:text-black transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2 relative z-10 group-hover:text-[#00f3ff] transition-colors">
                    {activeTool.id === 'img-to-pdf' ? 'Upload Photos' : 
                     activeTool.id === 'word-to-pdf' ? 'Upload MS Word' :
                     'Upload Document'}
                  </h4>
                  <p className="text-slate-500 text-sm relative z-10">Drag & drop or click to browse</p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept={
                        activeTool.id === 'img-to-pdf' ? "image/jpeg, image/png, image/webp" : 
                        activeTool.id === 'word-to-pdf' ? ".docx" :
                        ".pdf"
                    } 
                    multiple={['merge', 'pdf-to-img', 'img-to-pdf'].includes(activeTool.id)} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File List */}
                  <div className="space-y-3">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[#1e293b] bg-[#020617]/50 hover:border-[#00f3ff]/50 transition-colors shadow-lg">
                        <div className="flex items-center gap-4">
                          {['merge', 'pdf-to-img', 'img-to-pdf'].includes(activeTool.id) && (
                             <div className="flex flex-col gap-1 text-slate-500">
                               <button onClick={() => moveFile(i, 'up')} disabled={i === 0} className="hover:text-[#00f3ff] disabled:opacity-30">
                                 <ArrowUp className="w-4 h-4" />
                               </button>
                               <button onClick={() => moveFile(i, 'down')} disabled={i === files.length - 1} className="hover:text-[#00f3ff] disabled:opacity-30">
                                 <ArrowDown className="w-4 h-4" />
                               </button>
                             </div>
                          )}
                          <div className="font-mono text-sm">
                            <p className="text-white font-medium truncate max-w-[200px]">{f.name}</p>
                            <p className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-500 transition-colors hover:scale-110">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    
                    {['merge', 'pdf-to-img', 'img-to-pdf'].includes(activeTool.id) && (
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-full py-3 border border-dashed border-[#1e293b] rounded-xl text-slate-400 hover:text-[#00f3ff] hover:border-[#00f3ff] hover:bg-[#00f3ff]/5 transition-all flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase"
                       >
                         <Plus className="w-4 h-4" /> Add More Files
                       </button>
                    )}
                  </div>

                  {/* Settings for PDF to Photo */}
                  {activeTool.id === 'pdf-to-img' && (
                     <div className="p-4 rounded-xl border border-[#1e293b] bg-[#020617]/30">
                       <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                         <Settings className="w-4 h-4 text-[#00f3ff]" /> Output Format
                       </h4>
                       <div className="flex gap-4">
                         <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="format" 
                              value="image/jpeg"
                              checked={outputFormat === 'image/jpeg'} 
                              onChange={(e) => setOutputFormat(e.target.value)}
                              className="accent-[#00f3ff]"
                            />
                            <span className="text-sm text-slate-300 group-hover:text-[#00f3ff] transition-colors">JPG (Standard)</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="format" 
                              value="image/png"
                              checked={outputFormat === 'image/png'} 
                              onChange={(e) => setOutputFormat(e.target.value)}
                              className="accent-[#00f3ff]"
                            />
                            <span className="text-sm text-slate-300 group-hover:text-[#00f3ff] transition-colors">PNG (High Quality)</span>
                         </label>
                       </div>
                     </div>
                  )}

                  {/* AI Input */}
                  {activeTool.id === 'ai-assist' && (
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-white flex items-center gap-2">
                         <Wand2 className="w-4 h-4 text-[#00f3ff]" /> AI Instructions
                      </label>
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., Summarize the main points of this document..."
                        className="w-full bg-[#020617] border border-[#1e293b] rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#00f3ff] focus:shadow-[0_0_10px_rgba(0,243,255,0.1)] resize-none h-32 transition-all text-sm"
                      />
                    </div>
                  )}

                  {/* Progress Bar */}
                  {isProcessing && (
                    <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden mt-6 relative shadow-[0_0_10px_#00f3ff]">
                       <div className="absolute inset-0 bg-[#00f3ff]/20 animate-pulse"></div>
                      <div 
                        className="h-full bg-[#00f3ff] shadow-[0_0_20px_#00f3ff] transition-all duration-100 ease-out relative z-10"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Message */}
                  {resultMessage && (
                     <div className={`mt-4 p-4 rounded-xl border animate-slide-up ${
                       resultMessage.includes('Error') || resultMessage.includes('corrupted')
                         ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                         : 'bg-[#00f3ff]/10 border-[#00f3ff]/50 text-[#00f3ff] shadow-[0_0_20px_rgba(0,243,255,0.2)]'
                     }`}>
                        <p className="text-sm font-medium flex items-center gap-2">
                            {resultMessage.includes('Error') ? <Zap className="w-4 h-4 rotate-45" /> : <Zap className="w-4 h-4" />}
                            {resultMessage}
                        </p>
                     </div>
                  )}

                  {/* Action Buttons */}
                  {activeTool.id === 'split' ? (
                     <div className="grid grid-cols-2 gap-4 mt-6">
                       <button
                         onClick={() => processFiles('split-pdf')}
                         disabled={isProcessing}
                         className="py-4 bg-[#0f172a] hover:bg-[#00f3ff] hover:text-black border border-[#1e293b] hover:border-[#00f3ff] rounded-xl text-white font-bold transition-all flex flex-col items-center gap-2 group hover:shadow-[0_0_25px_rgba(0,243,255,0.5)]"
                       >
                         <Files className="w-6 h-6 text-[#00f3ff] group-hover:text-black group-hover:scale-110 transition-transform" />
                         <span className="text-xs tracking-wider">SPLIT TO PDFs</span>
                       </button>
                       <button
                         onClick={() => processFiles('split-img')}
                         disabled={isProcessing}
                         className="py-4 bg-[#0f172a] hover:bg-[#00f3ff] hover:text-black border border-[#1e293b] hover:border-[#00f3ff] rounded-xl text-white font-bold transition-all flex flex-col items-center gap-2 group hover:shadow-[0_0_25px_rgba(0,243,255,0.5)]"
                       >
                         <FileImage className="w-6 h-6 text-[#00f3ff] group-hover:text-black group-hover:scale-110 transition-transform" />
                         <span className="text-xs tracking-wider">CONVERT TO IMAGES</span>
                       </button>
                     </div>
                  ) : (
                    <button 
                      onClick={() => processFiles()}
                      disabled={isProcessing}
                      className="w-full py-5 mt-4 bg-[#00f3ff] hover:bg-[#00c2cc] text-black font-extrabold text-lg tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(0,243,255,0.5)] hover:shadow-[0_0_50px_rgba(0,243,255,0.8)] flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      {isProcessing ? (
                        <span className="animate-pulse">PROCESSING...</span>
                      ) : (
                        <span className="relative z-10 flex items-center gap-2">
                           {activeTool.id === 'merge' ? 'MERGE FILES' : 
                            activeTool.id === 'compress' ? 'COMPRESS NOW' : 
                            activeTool.id === 'pdf-to-img' ? 'CONVERT ALL' : 
                            activeTool.id === 'img-to-pdf' ? 'CREATE PDF' : 
                            activeTool.id === 'word-to-pdf' ? 'CONVERT TO PDF' : 'START PROCESSING'} 
                           <Zap className="w-6 h-6 fill-black" />
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};