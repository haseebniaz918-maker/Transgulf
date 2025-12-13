import React, { useState } from 'react';
import { Bot, Send, Sparkles, Image as ImageIcon, Copy, Check, ChevronRight, Download } from 'lucide-react';
import { generateText, generateImageDescription, helperFileToBase64 } from '../services/geminiService';
import { downloadTextFile } from '../services/pdfUtils';
import { Section } from '../types';

interface AiSectionProps {
  type: Section;
}

export const AiSection: React.FC<AiSectionProps> = ({ type }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const getTitle = () => {
    switch (type) {
      case Section.AI_WRITER: return "AI Smart Writer";
      case Section.IMAGE_TOOLS: return "Vision & Image Analysis";
      case Section.CODE_STUDIO: return "Code Logic Studio";
      default: return "AI Tools";
    }
  };

  const getDescription = () => {
    switch (type) {
      case Section.AI_WRITER: return "Generate professional emails, blogs, summaries, and creative stories instantly.";
      case Section.IMAGE_TOOLS: return "Upload an image to get a detailed description, OCR text extraction, or analysis.";
      case Section.CODE_STUDIO: return "Debug code, generate snippets, or explain complex logic in any language.";
      default: return "";
    }
  };

  const handleAction = async () => {
    if (!input && !selectedImage) return;
    setIsLoading(true);
    setOutput('');

    try {
      let res = '';
      if (type === Section.IMAGE_TOOLS && selectedImage) {
        const base64 = await helperFileToBase64(selectedImage);
        res = await generateImageDescription(base64, selectedImage.type);
      } else {
        const contextMap = {
          [Section.AI_WRITER]: "You are a professional copywriter and editor.",
          [Section.CODE_STUDIO]: "You are a senior software engineer. Provide code blocks and explanations.",
          [Section.CONVERTER]: "You are a data conversion expert.",
          [Section.PDF_TOOLS]: "",
          [Section.IMAGE_TOOLS]: "",
        };
        res = await generateText(input, contextMap[type]);
      }
      setOutput(res);
    } catch (e) {
      setOutput("An error occurred while communicating with the AI. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `omni-output-${timestamp}.txt`;
    downloadTextFile(output, filename);
  };

  return (
    <div className="p-6 md:p-12 h-full flex flex-col max-w-6xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center gap-3">
          <Sparkles className="text-blue-500 animate-pulse" />
          {getTitle()}
        </h2>
        <p className="text-slate-400 mt-2 max-w-2xl">{getDescription()}</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* Input Column */}
        <div className="flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="glass-panel rounded-2xl p-1 flex-1 flex flex-col min-h-[400px] transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 group">
            <div className="bg-slate-900/50 p-4 border-b border-white/5 flex items-center justify-between rounded-t-xl">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                 Input Parameters
              </span>
              {type === Section.IMAGE_TOOLS && (
                <label className="cursor-pointer text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border border-slate-700 hover:border-slate-500">
                  <ImageIcon className="w-3 h-3" />
                  {selectedImage ? 'Change Image' : 'Upload Image'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            if (!file.type.startsWith('image/')) {
                                alert("Please select a valid image file.");
                                return;
                            }
                            setSelectedImage(file);
                        }
                    }} 
                  />
                </label>
              )}
            </div>
            
            <div className="flex-1 p-4 flex flex-col gap-4">
               {type === Section.IMAGE_TOOLS && selectedImage && (
                 <div className="h-48 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border border-slate-700 relative group/img">
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="Preview" 
                      className="h-full w-full object-contain" 
                    />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                 </div>
               )}

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={type === Section.IMAGE_TOOLS ? "Add instructions (e.g., 'Describe the colors used')..." : "Enter your prompt here..."}
                className="flex-1 w-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none p-2 leading-relaxed"
              />
            </div>

            <div className="p-4 border-t border-white/5 bg-slate-900/30 rounded-b-xl">
              <button
                onClick={handleAction}
                disabled={isLoading || (!input && !selectedImage)}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                  isLoading
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    Generate Output <ChevronRight className="w-4 h-4 opacity-50" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Column */}
        <div className="glass-panel rounded-2xl flex flex-col min-h-[400px] animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="bg-slate-900/50 p-4 border-b border-white/5 flex items-center justify-between rounded-t-xl">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Result</span>
            {output && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleDownload}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800"
                  title="Download as .txt"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {output ? (
              <div className="prose prose-invert max-w-none animate-slide-up">
                {type === Section.CODE_STUDIO ? (
                   <div className="relative">
                     <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto border border-slate-800 text-sm font-mono text-blue-100">
                       <code>{output}</code>
                     </pre>
                   </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-300">{output}</p>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-700">
                <Sparkles className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-sm font-medium">AI response will appear here</p>
                <p className="text-xs mt-2 opacity-50">Ready to assist you</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};