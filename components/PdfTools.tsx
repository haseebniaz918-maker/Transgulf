import React, { useState, useRef } from 'react';
import { 
  Merge, Split, Shrink, Image, FileText, FileOutput, FileInput, 
  Wand2, X, Upload, Plus, Trash2, Zap
} from 'lucide-react';
import { mergePdfs, imagesToPdf, downloadBlob } from '../services/pdfUtils';
import { ToolDef } from '../types';

export const PdfTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="pb-20 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-2 font-display text-cyan-400 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
          PDF NEON TOOLS
        </h1>
        <p className="text-slate-400 text-lg">Powered by WebAssembly & Pro AI Models</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <div 
            key={tool.id} 
            onClick={() => handleToolClick(tool)} 
            className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:shadow-neon group flex flex-col gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-950 border border-cyan-400/20 flex items-center justify-center transition-all duration-300 group-hover:bg-cyan-400 group-hover:border-cyan-400">
              <tool.icon className="w-8 h-8 text-cyan-400 group-hover:text-black transition-colors" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{tool.title}</h3>
              <p className="text-sm text-slate-400">{tool.description}</p>
            </div>
          </div>
        ))}
      </div>

      {activeTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-cyan-400/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-400 rounded-xl shadow-neon">
                   <activeTool.icon size={24} className="text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-display">{activeTool.title}</h3>
                  <p className="text-xs text-cyan-400 font-bold tracking-widest uppercase">Active Workspace</p>
                </div>
              </div>
              <button onClick={() => setActiveTool(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-8 overflow-y-auto">
              {files.length === 0 ? (
                <div 
                  className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-400/5 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                    <Upload size={32} className="text-cyan-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Upload Files</h4>
                  <p className="text-slate-400 text-sm">Drag & drop or click to browse</p>
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
                <div className="flex flex-col gap-4">
                  {files.map((f, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-950/50 border border-white/10 rounded-xl">
                      <div className="flex items-center gap-4">
                        <FileText size={20} className="text-cyan-400" />
                        <div className="text-sm font-mono text-white">
                          {f.name} <span className="text-slate-500">({(f.size/1024/1024).toFixed(2)} MB)</span>
                        </div>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  
                  {['merge', 'pdf-to-img', 'img-to-pdf'].includes(activeTool.id) && (
                     <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border border-white/10 rounded-xl text-slate-300 hover:bg-white/5 hover:border-cyan-400 flex items-center justify-center gap-2 transition-all">
                       <Plus size={16} /> Add More Files
                     </button>
                  )}

                  {activeTool.id === 'ai-assist' && (
                    <textarea 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask AI about this document..."
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-400 focus:outline-none min-h-[8rem] resize-none"
                    />
                  )}

                  {isProcessing && (
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
                       <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                  )}

                  {resultMessage && (
                     <div className="p-4 bg-cyan-400/10 border border-cyan-400/50 rounded-xl text-cyan-400 text-sm flex items-center gap-2">
                        <Zap size={16} /> {resultMessage}
                     </div>
                  )}

                  <button 
                    onClick={() => processFiles()}
                    disabled={isProcessing}
                    className="w-full mt-4 py-4 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-xl shadow-neon transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? 'PROCESSING...' : 'START PROCESSING'} <Zap size={20} className="fill-black" />
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