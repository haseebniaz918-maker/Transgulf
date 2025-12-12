import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Save, ZoomIn, ZoomOut, Type, Image as ImageIcon, 
    Wand2, X, ChevronLeft, ChevronRight, MousePointer2, 
    Hand, Pen, Eraser, Move, Trash2, Check, Plus, Undo2, Redo2,
    Bold, Italic, Palette
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
    getPdfPageText, TextItem, TextEditOperation, 
    ImageInsertOperation, AddedTextOperation, PathDrawingOperation,
    savePdfEdits, downloadBlob 
} from '../services/pdfUtils';
import { generateText } from '../services/geminiService';

// Fix for PDF.js
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

interface PdfEditorProps {
  file: File;
  onClose: () => void;
}

type EditorMode = 'select' | 'pan' | 'edit-text' | 'add-text' | 'image' | 'draw' | 'ai-fix';

interface AddedTextItem {
    id: string;
    text: string;
    x: number; // PDF Coords
    y: number; // PDF Coords
    size: number;
    color: string;
    isEditing: boolean;
}

// Helper to manage history
interface HistoryState {
    edits: Record<string, string>;
    addedTexts: AddedTextItem[];
    images: ImageInsertOperation[];
    drawings: PathDrawingOperation[];
}

export const PdfEditor: React.FC<PdfEditorProps> = ({ file, onClose }) => {
  // --- State ---
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [mode, setMode] = useState<EditorMode>('select'); // Start in select mode like Acrobat
  
  // Data State
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({}); 
  const [addedTexts, setAddedTexts] = useState<AddedTextItem[]>([]);
  const [images, setImages] = useState<ImageInsertOperation[]>([]);
  const [drawings, setDrawings] = useState<PathDrawingOperation[]>([]);

  // History Stack
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Interaction State
  const [activeId, setActiveId] = useState<string | null>(null); 
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Tool Settings
  const [penColor, setPenColor] = useState("#000000");
  const [penThickness, setPenThickness] = useState(2);
  const [textColor, setTextColor] = useState("#000000");
  const [textSize, setTextSize] = useState(16);

  // Status
  const [isRendering, setIsRendering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiProcessingId, setAiProcessingId] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfViewportRef = useRef<any>(null); 

  // --- History Management ---
  const pushHistory = useCallback(() => {
      const currentState: HistoryState = {
          edits: { ...edits },
          addedTexts: [...addedTexts],
          images: [...images],
          drawings: [...drawings]
      };
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  }, [edits, addedTexts, images, drawings, history, historyIndex]);

  const undo = () => {
      if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          setEdits(prevState.edits);
          setAddedTexts(prevState.addedTexts);
          setImages(prevState.images);
          setDrawings(prevState.drawings);
          setHistoryIndex(historyIndex - 1);
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          setEdits(nextState.edits);
          setAddedTexts(nextState.addedTexts);
          setImages(nextState.images);
          setDrawings(nextState.drawings);
          setHistoryIndex(historyIndex + 1);
      }
  };

  // Initialize History
  useEffect(() => {
      if (history.length === 0) {
          pushHistory();
      }
  }, []); // Run once on mount

  // --- Initialization ---
  useEffect(() => {
    const loadPdf = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setNumPages(pdf.numPages);
    };
    loadPdf();
  }, [file]);

  // --- Rendering ---
  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNum);
        
        const viewport = page.getViewport({ scale });
        pdfViewportRef.current = viewport;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          context.clearRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, viewport }).promise;
        }

        const textData = await getPdfPageText(file, pageNum - 1);
        setTextItems(textData.items);
      } catch (e) {
        console.error("Render error", e);
      } finally {
        setIsRendering(false);
      }
    };
    renderPage();
  }, [file, pageNum, scale]);

  // --- Coordinate Helpers ---
  const toCanvas = (pdfX: number, pdfY: number) => {
      if (!pdfViewportRef.current) return { x: 0, y: 0 };
      const [cx, cy] = pdfViewportRef.current.convertToViewportPoint(pdfX, pdfY);
      return { x: cx, y: cy };
  };

  const toPdf = (canvasX: number, canvasY: number) => {
      if (!pdfViewportRef.current) return { x: 0, y: 0 };
      const [px, py] = pdfViewportRef.current.convertToPdfPoint(canvasX, canvasY);
      return { x: px, y: py };
  };

  // --- Handlers ---

  const handleContainerClick = (e: React.MouseEvent) => {
      if (isDragging) return;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (mode === 'add-text') {
          const pdfCoords = toPdf(x, y);
          const newId = `added-text-${Date.now()}`;
          const newText = {
              id: newId,
              text: "Type here",
              x: pdfCoords.x,
              y: pdfCoords.y,
              size: textSize,
              color: textColor,
              isEditing: true
          };
          setAddedTexts(prev => [...prev, newText]);
          setActiveId(newId);
          setMode('select'); 
          pushHistory();
      } else if (mode === 'select' || mode === 'edit-text') {
          if (e.target === canvasRef.current) {
              setActiveId(null);
          }
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
          const viewport = pdfViewportRef.current;
          const pdfX = 50; 
          const pdfY = viewport ? (viewport.viewBox[3] / 2) : 400; 
          
          const newImg = {
              id: `img-${Date.now()}`,
              pageIndex: pageNum - 1,
              x: pdfX,
              y: pdfY,
              width: 200,
              height: 200,
              file: f
          };
          setImages(prev => [...prev, newImg]);
          setMode('select');
          setActiveId(newImg.id);
          pushHistory();
      }
  };

  const deleteActiveItem = () => {
      if (!activeId) return;
      if (activeId.startsWith('img-')) {
          setImages(prev => prev.filter(i => i.id !== activeId));
      } else if (activeId.startsWith('added-text-')) {
          setAddedTexts(prev => prev.filter(t => t.id !== activeId));
      } else if (activeId.startsWith('text-')) {
          // Deleting existing text means setting it to empty string
          setEdits(prev => ({ ...prev, [activeId]: "" }));
      }
      setActiveId(null);
      pushHistory();
  };

  // --- Drag Logic ---
  const handleDragStart = (e: React.MouseEvent, id: string, type: 'image' | 'text') => {
      if (mode !== 'select') return;
      e.stopPropagation();
      setActiveId(id);
      setIsDragging(true);
      
      const rect = canvasRef.current!.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      let itemX = 0, itemY = 0;
      
      if (type === 'image') {
          const img = images.find(i => i.id === id);
          if (img) {
             const tl = toCanvas(img.x, img.y + img.height);
             itemX = tl.x;
             itemY = tl.y;
          }
      } else {
          const txt = addedTexts.find(t => t.id === id);
          if (txt) {
              const c = toCanvas(txt.x, txt.y);
              itemX = c.x;
              itemY = c.y - (txt.size * scale);
          }
      }
      
      setDragStart({ x: clickX, y: clickY });
      setDragOffset({ x: clickX - itemX, y: clickY - itemY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging && activeId && mode === 'select') {
          const newCanvasX = x - dragOffset.x;
          const newCanvasY = y - dragOffset.y;
          
          setImages(prev => prev.map(img => {
              if (img.id === activeId) {
                  const heightPx = img.height * scale;
                  const blPdf = toPdf(newCanvasX, newCanvasY + heightPx);
                  return { ...img, x: blPdf.x, y: blPdf.y };
              }
              return img;
          }));

          setAddedTexts(prev => prev.map(txt => {
              if (txt.id === activeId) {
                  const baseLineY_Canvas = newCanvasY + (txt.size * scale);
                  const pt = toPdf(newCanvasX, baseLineY_Canvas);
                  return { ...txt, x: pt.x, y: pt.y };
              }
              return txt;
          }));
      }

      if (isDrawing && mode === 'draw') {
          setCurrentPath(prev => [...prev, { x, y }]);
      }
  };

  const handleMouseUp = () => {
      if (isDragging) {
          setIsDragging(false);
          pushHistory();
      }
      
      if (isDrawing) {
          setIsDrawing(false);
          if (currentPath.length > 2) {
              const pdfPath = currentPath.map(p => toPdf(p.x, p.y));
              setDrawings(prev => [...prev, {
                  pageIndex: pageNum - 1,
                  path: pdfPath,
                  color: penColor,
                  thickness: penThickness
              }]);
              pushHistory();
          }
          setCurrentPath([]);
      }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (mode === 'draw') {
          setIsDrawing(true);
          const rect = canvasRef.current!.getBoundingClientRect();
          setCurrentPath([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      } else if (mode === 'pan') {
          // implement pan if needed, or rely on scroll
      }
  };

  // --- Saving ---
  const handleSave = async () => {
      setIsSaving(true);
      try {
          const textOps: TextEditOperation[] = Object.entries(edits).map(([id, newText]) => {
              const item = textItems.find(i => i.id === id);
              if (!item) return null;
              return {
                  pageIndex: pageNum - 1,
                  originalItem: item,
                  newText
              };
          }).filter(Boolean) as TextEditOperation[];

          const pdfBytes = await savePdfEdits(
              file, 
              textOps, 
              addedTexts.map(t => ({
                  pageIndex: pageNum - 1,
                  x: t.x,
                  y: t.y,
                  text: t.text,
                  size: t.size,
                  color: t.color
              })), 
              images, 
              drawings
          );
          downloadBlob(pdfBytes, `edited_${file.name}`);
      } catch (e) {
          console.error("Save failed", e);
          alert("Failed to save changes.");
      } finally {
          setIsSaving(false);
      }
  };

  // --- Subcomponents ---

  const PropertyBar = () => {
      if (!activeId) return null;

      const isAddedText = activeId.startsWith('added-text-');
      const isExistingText = activeId.startsWith('text-');
      const isImage = activeId.startsWith('img-');

      if (!isAddedText && !isExistingText && !isImage) return null;

      return (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl p-2 flex items-center gap-3 z-50 animate-pop-in">
              {(isAddedText || isExistingText) && (
                  <>
                      <div className="flex items-center gap-2 border-r border-white/10 pr-3">
                          <button onClick={() => setTextSize(s => Math.max(8, s - 2))} className="p-1 hover:bg-white/10 rounded">-</button>
                          <span className="text-sm font-mono w-6 text-center">{textSize}</span>
                          <button onClick={() => setTextSize(s => Math.min(72, s + 2))} className="p-1 hover:bg-white/10 rounded">+</button>
                      </div>
                      <div className="flex items-center gap-2 border-r border-white/10 pr-3">
                          <input 
                            type="color" 
                            value={textColor} 
                            onChange={(e) => setTextColor(e.target.value)} 
                            className="w-6 h-6 rounded bg-transparent cursor-pointer"
                          />
                      </div>
                  </>
              )}
              <button 
                onClick={deleteActiveItem}
                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-md transition-colors"
                title="Delete"
              >
                  <Trash2 className="w-4 h-4" />
              </button>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col animate-fade-in select-none"
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
    >
      {/* 1. Top Toolbar */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0f172a] shadow-lg z-20">
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
            <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                <Wand2 className="w-4 h-4 text-[#00f3ff]" /> Editor
            </h2>
        </div>

        {/* Central Tools */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-md">
            <ToolBtn icon={MousePointer2} active={mode === 'select'} onClick={() => setMode('select')} title="Selection Tool (V)" />
            <ToolBtn icon={Hand} active={mode === 'pan'} onClick={() => setMode('pan')} title="Pan Tool (H)" />
            <div className="w-[1px] h-5 bg-white/10 mx-2"></div>
            <ToolBtn icon={Type} active={mode === 'edit-text'} onClick={() => { setMode('edit-text'); setActiveId(null); }} title="Edit Text" />
            <ToolBtn icon={Plus} active={mode === 'add-text'} onClick={() => { setMode('add-text'); setActiveId(null); }} title="Add Text" />
            <label className={`p-2 rounded-lg cursor-pointer transition-all ${mode === 'image' ? 'bg-[#00f3ff]/20 text-[#00f3ff]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
               <ImageIcon className="w-4 h-4" />
               <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <ToolBtn icon={Pen} active={mode === 'draw'} onClick={() => { setMode('draw'); setActiveId(null); }} title="Draw/Sign" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 mr-2">
                 <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-30"><Undo2 className="w-4 h-4"/></button>
                 <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-400 hover:text-white disabled:opacity-30"><Redo2 className="w-4 h-4"/></button>
             </div>
             <div className="hidden md:flex items-center gap-1 text-xs font-mono text-slate-500 bg-white/5 rounded-lg px-2 py-1">
                 <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))}><ZoomOut className="w-3 h-3"/></button>
                 <span className="w-8 text-center">{Math.round(scale * 100)}%</span>
                 <button onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="w-3 h-3"/></button>
             </div>

            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#00f3ff] hover:bg-[#00c2cc] text-black font-bold rounded-lg shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all text-sm"
            >
                {isSaving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">Save</span>
            </button>
        </div>
      </div>

      {/* 2. Secondary Toolbar (Contextual) */}
      {mode === 'draw' && (
          <div className="h-10 bg-[#1e293b] border-b border-white/5 flex items-center justify-center gap-4 z-10">
              <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Color:</span>
                  <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent" />
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Thickness:</span>
                  <input type="range" min="1" max="10" value={penThickness} onChange={(e) => setPenThickness(parseInt(e.target.value))} className="w-24 accent-[#00f3ff]" />
              </div>
          </div>
      )}

      {/* 3. Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative bg-[#0a0f1e]">
         <PropertyBar />

         {/* Canvas Scroller */}
         <div ref={containerRef} className={`flex-1 overflow-auto flex justify-center p-8 custom-scrollbar ${mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
              onMouseDown={handleMouseDown}
              onClick={handleContainerClick}
         >
            <div className="relative shadow-2xl transition-transform ease-out duration-75" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
                
                {/* Base PDF Layer */}
                <canvas ref={canvasRef} className="block bg-white" />
                
                {/* Layer 1: Existing Text (Overlay) */}
                {!isRendering && textItems.map((item) => {
                    const x = item.transform[4] * scale;
                    const y = (canvasRef.current!.height - (item.transform[5] * scale)) - (item.height * scale);
                    const w = item.width * scale;
                    const h = item.height * scale * 1.3; 
                    
                    const isDeleted = edits[item.id] === "";
                    const isModified = edits[item.id] !== undefined && edits[item.id] !== item.text;
                    const isSelected = activeId === item.id;

                    if (mode !== 'edit-text' && !isModified && !isDeleted) return null;

                    return (
                        <div
                            key={item.id}
                            className={`absolute transition-all group ${isSelected ? 'z-50' : 'z-10'}`}
                            style={{ left: x, top: y, width: w, height: h }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (mode === 'edit-text') setActiveId(item.id);
                            }}
                        >
                            {/* Visual Box for Adobe feel */}
                             <div className={`absolute inset-0 border pointer-events-none ${isSelected ? 'border-[#00f3ff] bg-[#00f3ff]/10' : 'border-transparent group-hover:border-slate-300'}`}>
                                {isSelected && (
                                    <>
                                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#00f3ff] border border-white"></div>
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00f3ff] border border-white"></div>
                                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#00f3ff] border border-white"></div>
                                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00f3ff] border border-white"></div>
                                    </>
                                )}
                             </div>

                             {isDeleted ? (
                                 <div className="w-full h-full relative">
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <div className="h-[1px] w-full bg-red-500"></div>
                                     </div>
                                 </div>
                             ) : (
                                <input 
                                    type="text"
                                    value={edits[item.id] ?? item.text}
                                    onChange={(e) => {
                                        setEdits(prev => ({...prev, [item.id]: e.target.value}));
                                        // Note: We don't push history on every keystroke, ideally on blur or debounced.
                                    }}
                                    onBlur={pushHistory}
                                    className="w-full h-full bg-transparent border-none focus:outline-none px-0.5 text-xs font-serif text-black cursor-text"
                                    style={{ fontSize: `${item.fontSize * scale}px` }}
                                />
                             )}
                        </div>
                    );
                })}

                {/* Layer 2: Added Text */}
                {addedTexts.map((txt) => {
                    const yCanvas = (canvasRef.current!.height - (txt.y * scale)) - (txt.size * scale);
                    const xCanvas = txt.x * scale;
                    const isSelected = activeId === txt.id;
                    
                    return (
                        <div
                           key={txt.id}
                           className={`absolute group cursor-move ${isSelected ? 'z-50' : 'z-30'}`}
                           style={{ 
                               left: xCanvas, 
                               top: yCanvas,
                               minWidth: 50
                           }}
                           onMouseDown={(e) => handleDragStart(e, txt.id, 'text')}
                           onClick={(e) => { e.stopPropagation(); setActiveId(txt.id); }}
                        >
                            <input 
                                value={txt.text}
                                onChange={(e) => setAddedTexts(prev => prev.map(t => t.id === txt.id ? { ...t, text: e.target.value } : t))}
                                onBlur={pushHistory}
                                className={`bg-transparent border p-1 transition-all ${isSelected ? 'border-[#00f3ff] bg-white/80 shadow-sm' : 'border-transparent hover:border-dashed hover:border-slate-400'}`}
                                style={{ 
                                    fontSize: `${txt.size * scale}px`, 
                                    color: txt.color,
                                    width: `${Math.max(txt.text.length + 1, 5)}ch`
                                }}
                            />
                            {isSelected && (
                                <>
                                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#00f3ff] border border-white"></div>
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00f3ff] border border-white"></div>
                                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#00f3ff] border border-white"></div>
                                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00f3ff] border border-white"></div>
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Layer 3: Images */}
                {images.filter(img => img.pageIndex === pageNum - 1).map((img) => {
                     const top = canvasRef.current!.height - ((img.y + img.height) * scale);
                     const left = img.x * scale;
                     const isSelected = activeId === img.id;
                     
                     return (
                         <div
                            key={img.id}
                            className={`absolute ${isSelected ? 'z-40' : 'z-20'} group cursor-move`}
                            style={{
                                left,
                                top,
                                width: img.width * scale,
                                height: img.height * scale
                            }}
                            onMouseDown={(e) => handleDragStart(e, img.id, 'image')}
                            onClick={(e) => { e.stopPropagation(); setActiveId(img.id); }}
                         >
                             <img src={URL.createObjectURL(img.file)} className="w-full h-full object-fill pointer-events-none" />
                             
                             {/* Selection Border & Handles */}
                             <div className={`absolute inset-0 border-2 transition-colors ${isSelected ? 'border-[#00f3ff]' : 'border-transparent group-hover:border-[#00f3ff]/30'}`}>
                                 {isSelected && (
                                     <>
                                         <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#00f3ff] border-2 border-white rounded-full"></div>
                                         <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#00f3ff] border-2 border-white rounded-full"></div>
                                         <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#00f3ff] border-2 border-white rounded-full"></div>
                                         <div 
                                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#00f3ff] border-2 border-white rounded-full cursor-se-resize"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                const startX = e.clientX;
                                                const startW = img.width;
                                                const startH = img.height;
                                                const onMove = (ev: MouseEvent) => {
                                                    const delta = (ev.clientX - startX) / scale;
                                                    setImages(prev => prev.map(i => i.id === img.id ? { ...i, width: Math.max(20, startW + delta), height: Math.max(20, startH + delta * (startH/startW)) } : i));
                                                };
                                                const onUp = () => {
                                                    window.removeEventListener('mousemove', onMove);
                                                    window.removeEventListener('mouseup', onUp);
                                                    pushHistory();
                                                };
                                                window.addEventListener('mousemove', onMove);
                                                window.addEventListener('mouseup', onUp);
                                            }}
                                         ></div>
                                     </>
                                 )}
                             </div>
                         </div>
                     );
                })}

                {/* Layer 4: Drawings */}
                <svg className="absolute inset-0 pointer-events-none z-50 overflow-visible" width="100%" height="100%">
                    {drawings.filter(d => d.pageIndex === pageNum - 1).map((d, i) => (
                        <path 
                           key={i}
                           d={`M ${d.path.map(p => {
                               const c = toCanvas(p.x, p.y);
                               return `${c.x} ${c.y}`;
                           }).join(' L ')}`}
                           stroke={d.color}
                           strokeWidth={d.thickness * scale}
                           fill="none"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           opacity="0.9"
                        />
                    ))}
                    {isDrawing && currentPath.length > 1 && (
                         <path 
                           d={`M ${currentPath.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                           stroke={penColor}
                           strokeWidth={penThickness * scale}
                           fill="none"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                        />
                    )}
                </svg>

            </div>
         </div>
      </div>

      {/* Pagination Footer */}
      <div className="h-10 border-t border-white/10 bg-[#0f172a] flex items-center justify-center gap-4 z-20">
        <button 
           disabled={pageNum <= 1}
           onClick={() => setPageNum(p => p - 1)}
           className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
        >
            <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <span className="text-xs font-mono text-slate-400">Page {pageNum} of {numPages}</span>
        <button 
           disabled={pageNum >= numPages}
           onClick={() => setPageNum(p => p + 1)}
           className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition-colors"
        >
            <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

// Helper Component for Tools
const ToolBtn = ({ icon: Icon, active, onClick, title }: any) => (
    <button 
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded-lg transition-all duration-200 ${
            active 
            ? 'bg-[#00f3ff] text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' 
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        }`}
    >
        <Icon className="w-5 h-5" />
    </button>
);