import React, { useState, useRef } from 'react';
import { 
  Merge, Split, Shrink, Image, FileText, FileOutput, FileInput, 
  X, Upload, Plus, Trash2, Zap, PenTool, Check
} from 'lucide-react';
import { mergePdfs, imagesToPdf, downloadBlob } from '../services/pdfUtils';
import { ToolDef } from '../types';
import { PdfEditor } from './PdfEditor';

export const PdfTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools: ToolDef[] = [
    { id: 'merge', title: 'Merge PDF', description: 'Combine multiple PDFs into one.', icon: Merge, color: '#00f3ff', neonClass: 'shadow-neon', action: () => {} },
    { id: 'split', title: 'Split PDF', description: 'Split PDF pages into a ZIP file.', icon: Split, color: '#00f3ff', neonClass: 'shadow-neon', action: () => {} },
    { id: 'compress', title: 'Compress PDF', description: 'Optimize PDF size by quality reduction.', icon: Shrink, color: '#00f3ff', neonClass: 'shadow-neon', action: () => {} },
    { id: 'pdf-to-img', title: 'PDF to Photo', description: 'Convert PDF pages to Photos (JPG, PNG).', icon: Image, color: '#00f3ff', neonClass: 'shadow-neon', action: () => {} },
    { id: 'img-to-pdf', title: 'Photo to PDF', description: 'Convert Photos (JPG, PNG) to PDF.', icon: FileInput, color: '#00f3ff', neonClass: 'shadow-neon', action: () => {} },
    { id: 'pdf-to-word', title: 'PDF to MS Word', description: 'AI-Enhanced conversion to editable DOCX.', icon: FileText, color: '#00f3ff', neonClass: 'shadow-neon', action: () => {} },
    { id: 'word-to-pdf', title: 'MS Word to PDF', description: 'Convert DOCX files to PDF format.', icon: FileOutput, color: '#00f3ff', neonClass: 'shadow-neon', action: () => {} },
    { id: 'pdf-editor', title: 'PDF Editor', description: 'Edit text, sign, and insert images.', icon: PenTool, color: '#00f3ff', neonClass: 'shadow-neon', action: () => {} },
  ];

  const handleToolClick = (tool: ToolDef) => {
    setActiveTool(tool);
    setFiles([]);
    setResultMessage('');
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      const validFiles: File[] = [];
      
      const isImageMode = activeTool?.id === 'img-to-pdf';
      const isWordMode = activeTool?.id === 'word-to-pdf';

      newFiles.forEach(f => {
          if (isImageMode && f.type.startsWith('image/')) validFiles.push(f);
          else if (isWordMode && f.name.toLowerCase().endsWith('.docx')) validFiles.push(f);
          else if (!isImageMode && !isWordMode && f.type === 'application/pdf') validFiles.push(f);
      });

      if (validFiles.length > 0) {
        if (['merge', 'pdf-to-img', 'img-to-pdf'].includes(activeTool?.id || '')) {
          setFiles(prev => [...prev, ...validFiles]);
        } else {
          setFiles([validFiles[0]]);
        }
      }
    }
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const processFiles = async () => {
    if (files.length === 0 || !activeTool) return;
    setIsProcessing(true);
    setProgress(10);
    setResultMessage('');

    try {
      if (activeTool.id === 'merge') {
        const mergedBytes = await mergePdfs(files);
        downloadBlob(mergedBytes, 'merged.pdf');
        setResultMessage('Merged successfully!');
      } else if (activeTool.id === 'img-to-pdf') {
        const pdfBytes = await imagesToPdf(files);
        downloadBlob(pdfBytes, 'photos.pdf');
        setResultMessage('Converted successfully!');
      }
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setResultMessage(err.message || "Error processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  // If Editor is active and file selected, render editor full screen
  if (activeTool?.id === 'pdf-editor' && files.length > 0) {
      return <PdfEditor file={files[0]} onClose={() => { setActiveTool(null); setFiles([]); }} />;
  }

  return (
    <div className="pb-20 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-2 font-display text-cyan-400 drop-shadow-[0_0_15px_rgba(0,243,255,0.6)] animate-pulse-slow">
          PDF NEON TOOLS
        </h1>
        <p className="text-slate-400 text-lg">Powered by WebAssembly & Pro AI Models</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {tools.map((tool) => {
          const isActive = activeTool?.id === tool.id;
          return (
            <div 
              key={tool.id} 
              onClick={() => handleToolClick(tool)} 
              className={`
                relative bg-slate-900/60 backdrop-blur-md border rounded-2xl p-6 cursor-pointer flex flex-col gap-4 overflow-hidden group
                transition-all duration-300 ease-out transform
                ${isActive 
                  ? 'border-cyan-400 bg-slate-800/90 shadow-[0_0_40px_rgba(0,243,255,0.5)] scale-105 ring-2 ring-cyan-400 z-10' 
                  : 'border-white/10 hover:scale-105 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,243,255,0.25)]'
                }
              `}
            >
              <div className={`
                w-14 h-14 rounded-xl border flex items-center justify-center transition-all duration-300 relative z-10
                ${isActive 
                  ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_25px_rgba(0,243,255,0.8)] text-black scale-110' 
                  : 'bg-slate-950 border-cyan-400/30 text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] group-hover:text-cyan-300 group-hover:scale-110'
                }
              `}>
                <tool.icon className={`w-8 h-8 transition-colors duration-300 ${isActive ? 'text-black' : 'text-cyan-400 group-hover:text-cyan-900'}`} />
              </div>
              
              <div className="relative z-10">
                <h3 className={`text-xl font-bold mb-1 transition-colors duration-300 ${isActive ? 'text-cyan-300' : 'text-white group-hover:text-cyan-200'}`}>
                  {tool.title}
                </h3>
                <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{tool.description}</p>
              </div>

              {/* Background Glow for Hover */}
              <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
            </div>
          );
        })}
      </div>

      {activeTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in duration-300">
          <div 
            className="w-full max-w-3xl bg-slate-900 border border-cyan-400/30 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,243,255,0.15)] flex flex-col max-h-[90vh] animate-slide-up transform transition-all duration-500"
            style={{ animationDuration: '0.5s' }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-900 to-cyan-950/40 relative overflow-hidden">
               {/* Header decorative glow */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-cyan-400 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.6)] animate-pulse-slow">
                   <activeTool.icon size={24} className="text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-display tracking-tight drop-shadow-lg">{activeTool.title}</h3>
                  <p className="text-xs text-cyan-400 font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#00f3ff]"></span>
                    Active Workspace
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setActiveTool(null); setFiles([]); }}
                // Fix: Close functionality
                onMouseDown={() => { setActiveTool(null); setFiles([]); }}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all duration-300 hover:rotate-90 hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] relative z-10"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content Area */}
            <div className="p-8 overflow-y-auto custom-scrollbar bg-gradient-to-b from-slate-900 to-slate-950 relative">
              {files.length === 0 ? (
                <div 
                  className="group relative border-2 border-dashed border-white/20 hover:border-cyan-400 rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 hover:bg-cyan-400/5 overflow-hidden hover:shadow-[inset_0_0_20px_rgba(0,243,255,0.05)] hover:scale-[1.01]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {/* Pulse Effect Background */}
                  <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>

                  <div className="w-24 h-24 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-cyan-400 group-hover:shadow-[0_0_40px_rgba(0,243,255,0.5)] transition-all duration-500 relative z-10">
                    <Upload size={40} className="text-slate-400 group-hover:text-cyan-400 transition-colors duration-300" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2 relative z-10 group-hover:text-cyan-400 transition-colors duration-300">
                    Upload Files
                  </h4>
                  <p className="text-slate-400 text-sm relative z-10 max-w-xs leading-relaxed group-hover:text-slate-300 transition-colors">
                    Drag & drop your files here or click to browse. Supported formats: PDF, JPG, PNG, DOCX.
                  </p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept={activeTool.id === 'img-to-pdf' ? "image/*" : activeTool.id === 'word-to-pdf' ? ".docx" : ".pdf"} 
                    multiple={['merge', 'pdf-to-img', 'img-to-pdf'].includes(activeTool.id)} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-fade-in">
                  {/* File List */}
                  {files.map((f, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-800/50 border border-white/5 rounded-xl hover:border-cyan-400/50 hover:bg-slate-800 transition-all duration-300 group hover:shadow-[0_0_15px_rgba(0,243,255,0.1)]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-white/5 group-hover:border-cyan-400/50 transition-colors group-hover:shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                            <FileText size={20} className="text-cyan-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-cyan-100 transition-colors">{f.name}</span>
                            <span className="text-xs text-slate-500 font-mono">{(f.size/1024/1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(i)} 
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  
                  {['merge', 'pdf-to-img', 'img-to-pdf'].includes(activeTool.id) && (
                     <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-400/5 flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,243,255,0.1)]"
                     >
                       <Plus size={18} /> Add More Files
                     </button>
                  )}

                  {isProcessing && (
                    <div className="w-full mt-6 animate-fade-in">
                       <div className="flex justify-between text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">
                          <span className="animate-pulse">Processing...</span>
                          <span>{progress}%</span>
                       </div>
                       <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30 relative shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 transition-all duration-300 relative shadow-[0_0_20px_#00f3ff] animate-pulse"
                            style={{ width: `${progress}%` }}
                          >
                             <div className="absolute inset-0 bg-white/30 animate-[pulse_1s_infinite]"></div>
                             <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[4px] animate-ping"></div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Result Message */}
                  {resultMessage && (
                     <div className="p-4 bg-cyan-400/10 border border-cyan-400/40 rounded-xl text-cyan-400 text-sm font-bold flex items-center gap-3 animate-pop-in shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                        <div className="p-1 bg-cyan-400 rounded-full text-black shadow-[0_0_10px_#00f3ff]"><Check size={12} strokeWidth={4} /></div>
                        {resultMessage}
                     </div>
                  )}

                  {/* Action Button */}
                  <button 
                    onClick={() => processFiles()}
                    disabled={isProcessing}
                    className={`
                        w-full mt-4 py-4 bg-cyan-400 text-black font-bold rounded-xl text-lg tracking-wide
                        shadow-[0_0_25px_rgba(0,243,255,0.4)] hover:shadow-[0_0_50px_rgba(0,243,255,0.7)] 
                        hover:bg-[#00e0ee] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none
                        transition-all duration-300 flex items-center justify-center gap-3
                        group relative overflow-hidden
                    `}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    {isProcessing ? 'PROCESSING...' : activeTool.id === 'pdf-editor' ? 'OPEN EDITOR' : 'START PROCESSING'} 
                    <Zap size={22} className={`fill-black transition-transform duration-300 ${!isProcessing && 'group-hover:scale-110 group-hover:rotate-12'}`} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};