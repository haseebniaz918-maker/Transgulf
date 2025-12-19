import React, { useState, useRef } from 'react';
import { 
  Merge, Split, Shrink, Image, FileText, FileOutput, FileInput, 
  X, Upload, Plus, Trash2, Zap, PenTool, Check, CheckCircle, Loader2, FileType
} from 'lucide-react';
import { mergePdfs, imagesToPdf, downloadBlob } from '../services/pdfUtils';
import { convertPdfToWordHtml, helperFileToBase64 } from '../services/geminiService';
import { ToolDef } from '../types';
import { PdfEditor } from './PdfEditor';

export const PdfTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [conversionStep, setConversionStep] = useState(0); 
  const [convertedWordContent, setConvertedWordContent] = useState<string | null>(null);

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
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const processFiles = async () => {
    if (files.length === 0 || !activeTool) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      if (activeTool.id === 'pdf-to-word') {
          setConversionStep(1);
          await new Promise(r => setTimeout(r, 1000));
          setProgress(40);
          setConversionStep(2);
          const base64 = await helperFileToBase64(files[0]);
          const htmlContent = await convertPdfToWordHtml(base64);
          setProgress(80);
          setConversionStep(3);
          setConvertedWordContent(htmlContent);
          setConversionStep(4);
          setProgress(100);
      } else if (activeTool.id === 'merge') {
          const bytes = await mergePdfs(files);
          downloadBlob(bytes, 'merged.pdf');
          setResultMessage('Success!');
      }
      setProgress(100);
    } catch (err: any) {
      setResultMessage('Failed to process.');
    } finally {
      if (activeTool.id !== 'pdf-to-word') setIsProcessing(false);
    }
  };

  if (activeTool?.id === 'pdf-editor' && files.length > 0) {
      return <PdfEditor file={files[0]} onClose={() => { setActiveTool(null); setFiles([]); }} />;
  }

  return (
    <div className="pb-20 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-2 font-display text-cyan-400 drop-shadow-[0_0_15px_rgba(0,243,255,0.6)]">
          PDF NEON TOOLS
        </h1>
        <p className="text-slate-400 text-lg">High-Fidelity Document Processing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {tools.map((tool) => (
          <div 
            key={tool.id} 
            onClick={() => handleToolClick(tool)} 
            className="glass-card border-white/10 hover:border-cyan-400/60 hover:shadow-neon hover:scale-[1.03] transition-all p-6 cursor-pointer rounded-3xl group relative overflow-hidden"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-cyan-400/20 text-cyan-400 flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:shadow-neon group-hover:bg-cyan-400 group-hover:text-black">
              <tool.icon size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{tool.title}</h3>
            <p className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">{tool.description}</p>
          </div>
        ))}
      </div>

      {activeTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-3xl bg-slate-900 border border-cyan-400/20 rounded-[40px] shadow-2xl overflow-hidden animate-slide-up flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-cyan-400 rounded-2xl shadow-neon animate-pulse"><activeTool.icon size={24} className="text-black" /></div>
                 <h3 className="text-2xl font-bold text-white font-display">{activeTool.title}</h3>
              </div>
              <button onClick={() => { setActiveTool(null); setFiles([]); }} className="p-3 rounded-full hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"><X size={24}/></button>
            </div>
            
            <div className="p-10 flex flex-col gap-8">
              {files.length === 0 ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyan-400/20 rounded-[40px] p-20 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-400/5 transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 animate-neon-pulse opacity-5 pointer-events-none"></div>
                  <Upload size={64} className="text-slate-600 group-hover:text-cyan-400 mb-6 transition-all group-hover:scale-110" />
                  <h4 className="text-2xl font-bold text-white mb-2">Drag & Drop Files</h4>
                  <p className="text-slate-500">Supported Formats: PDF, DOCX, Images</p>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {files.map((f, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-950 border border-white/5 rounded-2xl animate-pop-in">
                       <div className="flex items-center gap-3">
                          <FileText size={20} className="text-cyan-400" />
                          <span className="text-sm font-bold text-white">{f.name}</span>
                       </div>
                       <button onClick={() => removeFile(i)} className="text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="w-full space-y-2 animate-fade-in mt-4">
                       <div className="flex justify-between text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                          <span className="animate-pulse">Active Matrix Processing...</span>
                          <span>{progress}%</span>
                       </div>
                       <div className="h-4 bg-slate-950 rounded-full border border-cyan-400/20 overflow-hidden relative shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.6)] animate-pulse transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                       </div>
                    </div>
                  )}

                  <button 
                    onClick={processFiles} 
                    disabled={isProcessing}
                    className="w-full py-5 bg-cyan-400 hover:bg-cyan-300 text-black font-black rounded-2xl shadow-neon transition-all hover:-translate-y-1 disabled:opacity-20 mt-4 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                    {isProcessing ? 'SYSTEM PROCESSING...' : 'EXECUTE TOOL'}
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