import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Target, Layout, Loader2, Plus, Trash2, Shuffle, 
  Upload, Download, User, Briefcase, GraduationCap, FileText, Check, 
  RefreshCw, Sparkles, Wand2, MapPin, Calendar, CreditCard, Flag, 
  FileCheck, AlertTriangle, Eye, Image as ImageIcon, FileOutput, Pencil, Code,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { generateCvHtml, helperFileToBase64, validateProfileData, validateFieldWithAI, generateIdentityPhoto } from '../services/geminiService';

declare const html2pdf: any;
declare const html2canvas: any;

const NATIONALITIES = [
    "Pakistani", "Indian", "Bangladeshi", "American", "British", "Canadian", "Australian", "Emirati", "Saudi", "Qatari", 
    "Omani", "Kuwaiti", "Bahraini", "German", "French", "Italian", "Chinese", "Japanese", "Filipino", "Sri Lankan", 
    "Nepalese", "Malaysian", "Indonesian", "Turkish", "Iranian", "Afghan"
];

// Mickey Mouse Style Hand Writing Animation
const DraftingPreview = () => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity duration-500 animate-fade-in pointer-events-none">
        <div className="relative w-48 h-48 animate-bounce-slight">
             <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                 <defs>
                     <filter id="glow">
                         <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                         <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                     </filter>
                 </defs>
                 <circle cx="100" cy="100" r="90" fill="#1e293b" stroke="#00f3ff" strokeWidth="2" />
                 
                 {/* Paper Sheet */}
                 <rect x="60" y="50" width="80" height="100" fill="white" rx="5" />
                 
                 {/* Writing Lines */}
                 <line x1="70" y1="70" x2="130" y2="70" stroke="#ccc" strokeWidth="2" className="animate-[writing_1s_ease-in-out_infinite]" />
                 <line x1="70" y1="85" x2="130" y2="85" stroke="#ccc" strokeWidth="2" className="animate-[writing_1s_ease-in-out_infinite]" style={{animationDelay: '0.2s'}} />
                 <line x1="70" y1="100" x2="110" y2="100" stroke="#ccc" strokeWidth="2" className="animate-[writing_1s_ease-in-out_infinite]" style={{animationDelay: '0.4s'}} />

                 {/* Cartoon Hand with Pencil */}
                 <g className="animate-[writing_1s_ease-in-out_infinite] origin-center">
                    <path d="M120,120 Q140,100 160,120 T180,160 Q150,180 120,160 Z" fill="white" stroke="black" strokeWidth="3" />
                    <rect x="110" y="80" width="10" height="60" fill="#ffd700" stroke="black" transform="rotate(-45 115 110)" />
                    <polygon points="110,80 120,80 115,70" fill="black" transform="rotate(-45 115 110)" />
                 </g>
             </svg>
        </div>
        <p className="mt-4 text-cyan-400 font-bold tracking-widest uppercase text-sm animate-pulse">AI Drafting & Formatting...</p>
    </div>
);

const InputField = ({ label, name, value, onChange, type = "text", placeholder, className = "", error, onBlur, suggestion }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
        {label}
        {error && (
            <span className="text-red-400 text-[10px] flex items-center gap-1 bg-red-400/10 px-1 rounded animate-pulse">
                <AlertTriangle size={10} /> {error}
            </span>
        )}
    </label>
    <div className="relative">
        <input 
          name={name} 
          value={value} 
          onChange={onChange}
          onBlur={onBlur} 
          type={type} 
          placeholder={placeholder} 
          className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-slate-600 ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-400'}`} 
        />
        {suggestion && (
            <div className="absolute right-2 top-2.5 text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30 animate-fade-in z-20">
                Suggestion: {suggestion}
            </div>
        )}
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, className = "", onBlur }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <select 
      name={name} 
      value={value} 
      onChange={onChange}
      onBlur={onBlur}
      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none transition-colors appearance-none cursor-pointer" 
    >
        <option value="" className="bg-slate-900">Select {label}</option>
        {options.map((opt: string) => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, name, value, onChange, placeholder, className = "" }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <textarea 
      name={name} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none transition-colors min-h-[100px] resize-none placeholder:text-slate-600" 
    />
  </div>
);

export const CvForge: React.FC = () => {
  // --- State ---
  const [layoutSeed, setLayoutSeed] = useState(Math.floor(Math.random() * 10000));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Animation Triggers
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Data State
  const [jobRole, setJobRole] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  
  // Photo State
  const [photo, setPhoto] = useState<File | null>(null);
  const [enhancedPhotoBase64, setEnhancedPhotoBase64] = useState<string | null>(null);
  const [isEnhancingPhoto, setIsEnhancingPhoto] = useState(false);
  
  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '', 
    fatherName: '', 
    dob: '', 
    age: '', 
    gender: '', 
    maritalStatus: '', 
    nationality: '', 
    cnic: '', 
    passport: '', 
    passportIssue: '', 
    passportExpiry: '', 
    phone: '', 
    email: '', 
    address: ''
  });

  const [experience, setExperience] = useState([
    { id: 1, title: '', company: '', location: '', duration: '', details: '' }
  ]);

  const [education, setEducation] = useState([
    { id: 1, degree: '', school: '', year: '' }
  ]);

  const [skills, setSkills] = useState('');

  // --- Handlers ---

  // Trigger animation on key press anywhere in the container
  const handleKeyDown = () => {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500);
  };

  const handleMouseMove = () => {
      if (Math.random() > 0.9) { // Random flicker logic for "Alive" feel
        // Could implement subtle cursor effects here
      }
  };

  const calculateAge = (dob: string) => {
    if(!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleInputChange = (e: any) => {
      const { name, value } = e.target;
      
      handleKeyDown(); // Trigger animation

      if (name === 'jobRole') {
          setJobRole(value);
          return;
      }

      if (name === 'dob') {
         const calculatedAge = calculateAge(value);
         setPersonalInfo(prev => ({ ...prev, dob: value, age: calculatedAge }));
         validateField('dob', value);
         return;
      }

      // Specific formatting logic
      if (name === 'passport') {
          const upperVal = value.toUpperCase();
          setPersonalInfo(prev => ({ ...prev, passport: upperVal }));
      } 
      else if (name === 'phone') {
          // Format: 0312 3456789 (Space after 4th digit)
          const raw = value.replace(/\D/g, '');
          let formatted = raw;
          if (raw.length > 4) {
              formatted = `${raw.slice(0, 4)} ${raw.slice(4, 11)}`;
          }
          if (formatted.length <= 12) setPersonalInfo(prev => ({ ...prev, phone: formatted }));
      }
      else {
          setPersonalInfo(prev => ({ ...prev, [name]: value }));
      }

      // Clear simple errors on change
      if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: '' }));
      }
  };

  const validateField = async (name: string, value: string) => {
      if (!value) return;
      
      let result = { isValid: true, message: '', suggestion: '' };

      if (['cnic', 'passport', 'dob', 'passportIssue', 'passportExpiry'].includes(name)) {
          const typeMap: any = {
              'cnic': 'CNIC', 'passport': 'PASSPORT', 'dob': 'DOB',
              'passportIssue': 'DATE_ISSUE', 'passportExpiry': 'DATE_EXPIRY'
          };
          // @ts-ignore
          result = await validateFieldWithAI(value, typeMap[name]);
      } else if (name === 'email' || name === 'phone') {
          if (personalInfo.nationality) {
              const res = await validateProfileData(personalInfo.nationality, personalInfo.phone, personalInfo.email);
              if (name === 'email' && !res.emailValid) result = { isValid: false, message: res.emailMessage, suggestion: '' };
              if (name === 'phone' && !res.phoneValid) result = { isValid: false, message: res.phoneMessage, suggestion: '' };
          }
      }

      setErrors(prev => ({ ...prev, [name]: result.isValid ? '' : result.message }));
      setSuggestions(prev => ({ ...prev, [name]: result.suggestion || '' }));
  };

  // Experience Handlers
  const handleExpChange = (id: number, field: string, val: string) => {
    handleKeyDown();
    setExperience(experience.map(exp => exp.id === id ? { ...exp, [field]: val } : exp));
  };
  const addExp = () => setExperience([...experience, { id: Date.now(), title: '', company: '', location: '', duration: '', details: '' }]);
  const removeExp = (id: number) => setExperience(experience.filter(e => e.id !== id));

  // Education Handlers
  const handleEduChange = (id: number, field: string, val: string) => {
    handleKeyDown();
    setEducation(education.map(edu => edu.id === id ? { ...edu, [field]: val } : edu));
  };
  const addEdu = () => setEducation([...education, { id: Date.now(), degree: '', school: '', year: '' }]);
  const removeEdu = (id: number) => setEducation(education.filter(e => e.id !== id));

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setPhoto(file);
          
          // Immediate AI Processing
          setIsEnhancingPhoto(true);
          try {
              const base64 = await helperFileToBase64(file);
              const enhanced = await generateIdentityPhoto(base64, file.type);
              setEnhancedPhotoBase64(enhanced);
          } catch (error) {
              console.error("Photo enhancement failed", error);
              // Fallback to original if enhancement fails
              const base64 = await helperFileToBase64(file);
              setEnhancedPhotoBase64(base64);
          } finally {
              setIsEnhancingPhoto(false);
          }
      }
  };

  const handleShuffle = () => {
    const newSeed = Math.floor(Math.random() * 100000);
    setLayoutSeed(newSeed);
  };

  const generateCV = async () => {
    // Basic Client Validation
    if (Object.values(errors).some(e => e)) {
        alert("Please resolve validation errors in the form before generating.");
        return;
    }

    setIsGenerating(true);
    setActiveTab('preview');
    try {
        // Use the already enhanced photo if available, otherwise original
        let photoData = enhancedPhotoBase64;
        if (!photoData && photo) {
            photoData = await helperFileToBase64(photo);
        }

        const cvData = {
            layoutId: layoutSeed,
            jobRole: jobRole || "Professional",
            personalInfo,
            experience,
            education,
            skills,
            photoBase64: photoData
        };

        const html = await generateCvHtml(cvData, customInstruction);
        setPreviewHtml(html);
    } catch (e) {
        console.error(e);
        alert("Generation failed. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const getCleanFileName = () => `resume_${personalInfo.name.replace(/\s+/g, '_') || 'CV'}`;

  // Helper to create a printable element that is VISIBLE to html2canvas but hidden from user
  const createPrintElement = () => {
    if (!previewHtml) return null;
    const element = document.createElement('div');
    element.innerHTML = previewHtml;
    
    // Position fixed off-screen but valid for rendering
    Object.assign(element.style, {
        width: '210mm',
        minHeight: '297mm', // A4 Height
        backgroundColor: '#ffffff',
        color: '#000000',
        position: 'fixed',
        left: '0',
        top: '0',
        zIndex: '-9999',
        transform: 'none'
    });
    
    // Inject Styles to override any dark mode bleed
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        body, html, div, p, span, h1, h2, h3, h4, h5, h6, table, td, th { color: #000000; }
        .bg-slate-900, .bg-slate-950, .bg-black { background-color: #ffffff !important; color: #000000 !important; }
        .text-white, .text-slate-200, .text-slate-300, .text-slate-400 { color: #000000 !important; }
        img { max-width: 100%; object-fit: cover; }
    `;
    element.appendChild(style);
    return element;
  };

  const handleDownloadPdf = async () => {
    if (!previewHtml) return;
    setIsDownloading(true);

    const element = createPrintElement();
    if (!element) return;
    document.body.appendChild(element);

    // Wait for images to load inside the element
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    });
    await Promise.all(promises);

    const opt = {
      margin: 0,
      filename: `${getCleanFileName()}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          backgroundColor: '#ffffff',
          scrollY: 0,
          windowWidth: 794 // A4 width pixels approx
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch(e) {
        console.error("PDF Download Error", e);
        alert("Download failed. Please try again.");
    } finally {
        document.body.removeChild(element);
        setIsDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
      if (!previewHtml) return;
      setIsDownloading(true);

      const element = createPrintElement();
      if (!element) return;
      document.body.appendChild(element);

      try {
          // Use html2canvas with full scrolling
          const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              height: element.scrollHeight, // Capture full height
              windowHeight: element.scrollHeight
          });
          
          const link = document.createElement('a');
          link.download = `${getCleanFileName()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch(e) {
          console.error("Image Download Error", e);
      } finally {
          document.body.removeChild(element);
          setIsDownloading(false);
      }
  };

  const handleDownloadWord = () => {
      if (!previewHtml) return;
      setIsDownloading(true);

      // We need to inline styles for Word to see them properly.
      // This is a basic wrapper, but Gemini's "Table" based layout helps here.
      const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>CV</title>
        <style>
            body { font-family: Arial, sans-serif; background: white; color: black; }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 5px; }
            /* Ensure text contrast in Word */
            .text-white { color: black !important; } 
            .bg-slate-900 { background-color: #eee !important; color: black !important; }
        </style>
      </head><body>`;
      const footer = "</body></html>";
      
      const sourceHTML = header + previewHtml + footer;

      const blob = new Blob(['\ufeff', sourceHTML], {
          type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getCleanFileName()}.doc`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
  };

  const handleDownloadHtml = () => {
      if (!previewHtml) return;
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getCleanFileName()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div 
        className="flex flex-col gap-8 animate-fade-in pb-20 max-w-[1800px] mx-auto relative"
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
    >
        {/* Loading Overlay with Neon Animation */}
        {(isGenerating || isDownloading) && (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-500">
                 <div className="relative w-48 h-48 mb-8">
                     <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl animate-pulse"></div>
                     <div className="absolute inset-0 rounded-full border-t-4 border-r-4 border-cyan-400 shadow-[0_0_40px_rgba(0,243,255,0.4)] animate-[spin_3s_linear_infinite]"></div>
                     <div className="absolute inset-4 rounded-full border-b-4 border-l-4 border-pink-500 shadow-[0_0_40px_rgba(255,0,255,0.4)] animate-[spin_2s_linear_infinite_reverse]"></div>
                     <div className="absolute inset-8 rounded-full border-t-2 border-purple-400 animate-[spin_1.5s_linear_infinite]"></div>
                     <div className="absolute inset-0 m-auto w-20 h-20 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,243,255,0.2)]">
                         {isDownloading ? <Download className="w-8 h-8 text-cyan-400 animate-bounce" /> : <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />}
                     </div>
                 </div>
                 <h2 className="text-4xl font-bold text-white font-display tracking-wider animate-pulse flex items-center gap-3">
                    {isDownloading ? 'EXPORTING' : 'AI ARCHITECT'}
                 </h2>
                 <p className="text-slate-500 text-xs mt-4 uppercase tracking-widest">
                     {isDownloading ? 'Finalizing High-Res Output...' : 'Processing Neural Layouts...'}
                 </p>
            </div>
        )}

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-4">
            <h1 className="text-5xl font-bold text-cyan-400 font-display drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                CV FORGE PRO
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
                Enter your details and Target Role. The AI will <span className="text-cyan-400 font-bold">automatically generate</span> your Career Objective, Responsibilities, and Skills.
            </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Input Form */}
            <div className={`xl:col-span-5 flex flex-col gap-6 ${activeTab === 'preview' ? 'hidden xl:flex' : ''}`}>
                
                {/* 1. Target & AI Settings */}
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-cyan-400 relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                         <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                            <Target className="text-cyan-400" /> Target Role
                         </h3>
                         <div className="flex gap-2">
                             <button onClick={handleShuffle} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-white transition-colors bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/30 shadow-neon" title="Change Layout Structure">
                                 <Shuffle size={14} /> Layout Seed: {layoutSeed}
                             </button>
                         </div>
                    </div>
                    <div className="relative z-10">
                        <input 
                          name="jobRole"
                          value={jobRole} 
                          onChange={handleInputChange} 
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-4 text-xl font-bold text-white focus:border-cyan-400 focus:outline-none shadow-inner" 
                          placeholder="e.g. Senior Civil Engineer" 
                        />
                    </div>
                </div>

                {/* 2. Personal Info */}
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/10 pb-3">
                        <User className="text-cyan-400" size={20} /> Personal Information
                    </h3>
                    
                    {/* Photo & Name */}
                    <div className="flex items-center gap-4 mb-2">
                        <div className="relative w-24 h-24 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 group cursor-pointer shadow-lg">
                            {isEnhancingPhoto ? (
                                <Loader2 className="animate-spin text-cyan-400 w-8 h-8" />
                            ) : enhancedPhotoBase64 ? (
                                <img src={`data:image/jpeg;base64,${enhancedPhotoBase64}`} className="w-full h-full object-cover" />
                            ) : photo ? (
                                <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-slate-600" size={32} />
                            )}
                            
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={20} className="text-white" />
                            </div>
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} />
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            <InputField label="Full Name" name="name" value={personalInfo.name} onChange={handleInputChange} placeholder="Muhammad Ahmed" />
                            {isEnhancingPhoto && <span className="text-xs text-cyan-400 animate-pulse">Enhancing Photo (White BG, Suit)...</span>}
                            {enhancedPhotoBase64 && !isEnhancingPhoto && <span className="text-xs text-green-400 flex items-center gap-1"><Check size={12}/> AI Enhanced Photo Ready</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <InputField label="Father Name" name="fatherName" value={personalInfo.fatherName} onChange={handleInputChange} placeholder="Ahmed Ali" />
                         <InputField label="CNIC" name="cnic" value={personalInfo.cnic} onChange={handleInputChange} onBlur={() => validateField('cnic', personalInfo.cnic)} error={errors.cnic} suggestion={suggestions.cnic} placeholder="35202-1234567-1" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         <InputField label="DOB" name="dob" type="date" value={personalInfo.dob} onChange={handleInputChange} onBlur={() => validateField('dob', personalInfo.dob)} error={errors.dob} />
                         <InputField label="Age" name="age" type="number" value={personalInfo.age} onChange={handleInputChange} placeholder="Auto" />
                         <SelectField label="Gender" name="gender" value={personalInfo.gender} onChange={handleInputChange} options={["Male", "Female", "Other"]} />
                         <SelectField label="Marital Status" name="maritalStatus" value={personalInfo.maritalStatus} onChange={handleInputChange} options={["Single", "Married", "Divorced"]} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SelectField label="Nationality" name="nationality" value={personalInfo.nationality} onChange={handleInputChange} options={NATIONALITIES} />
                        <InputField label="Full Address" name="address" value={personalInfo.address} onChange={handleInputChange} placeholder="House 123, Street 4, Lahore" />
                    </div>

                    {/* Passport Section */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                           <Flag size={12} /> Passport Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <InputField 
                                label="Passport No" 
                                name="passport" 
                                value={personalInfo.passport} 
                                onChange={handleInputChange}
                                onBlur={() => validateField('passport', personalInfo.passport)}
                                placeholder="AB1234567"
                                error={errors.passport} 
                            />
                            <InputField label="Issue Date" name="passportIssue" type="date" value={personalInfo.passportIssue} onChange={handleInputChange} onBlur={() => validateField('passportIssue', personalInfo.passportIssue)} error={errors.passportIssue} />
                            <InputField label="Expiry Date" name="passportExpiry" type="date" value={personalInfo.passportExpiry} onChange={handleInputChange} onBlur={() => validateField('passportExpiry', personalInfo.passportExpiry)} error={errors.passportExpiry} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InputField 
                            label="Phone" 
                            name="phone" 
                            value={personalInfo.phone} 
                            onChange={handleInputChange} 
                            onBlur={() => validateField('phone', personalInfo.phone)}
                            placeholder="0312 3456789"
                            error={errors.phone}
                        />
                        <InputField 
                            label="Email" 
                            name="email" 
                            value={personalInfo.email} 
                            onChange={handleInputChange} 
                            onBlur={() => validateField('email', personalInfo.email)}
                            placeholder="email@example.com"
                            error={errors.email}
                        />
                    </div>
                </div>

                {/* 3. Experience */}
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Briefcase className="text-cyan-400" size={20} /> Experience
                        </h3>
                        <button onClick={addExp} className="text-cyan-400 hover:text-white flex items-center gap-1 text-xs font-bold transition-colors">
                            <Plus size={14} /> Add Role
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                        {experience.map((exp, idx) => (
                            <div key={exp.id} className="relative flex flex-col gap-3 p-4 bg-slate-900/50 rounded-xl border border-white/5 group hover:border-cyan-400/30 transition-colors">
                                <button onClick={() => removeExp(exp.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Job Title" value={exp.title} onChange={(e: any) => handleExpChange(exp.id, 'title', e.target.value)} placeholder="Senior Developer" />
                                    <InputField label="Company" value={exp.company} onChange={(e: any) => handleExpChange(exp.id, 'company', e.target.value)} placeholder="Tech Solutions" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Location (Important for AI)" value={exp.location} onChange={(e: any) => handleExpChange(exp.id, 'location', e.target.value)} placeholder="Dubai, UAE" />
                                    <InputField label="Duration" value={exp.duration} onChange={(e: any) => handleExpChange(exp.id, 'duration', e.target.value)} placeholder="2018 - 2022" />
                                </div>
                                <TextArea label="Details" value={exp.details} onChange={(e: any) => handleExpChange(exp.id, 'details', e.target.value)} placeholder="Leave empty for AI auto-write..." />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Education & Skills */}
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <GraduationCap className="text-cyan-400" size={20} /> Education
                        </h3>
                        <button onClick={addEdu} className="text-cyan-400 hover:text-white flex items-center gap-1 text-xs font-bold transition-colors">
                            <Plus size={14} /> Add School
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {education.map((edu) => (
                            <div key={edu.id} className="relative grid grid-cols-12 gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/5 group items-end">
                                <div className="col-span-4"><InputField label="Degree" value={edu.degree} onChange={(e: any) => handleEduChange(edu.id, 'degree', e.target.value)} placeholder="BS CS" /></div>
                                <div className="col-span-5"><InputField label="School" value={edu.school} onChange={(e: any) => handleEduChange(edu.id, 'school', e.target.value)} placeholder="University of Punjab" /></div>
                                <div className="col-span-2"><InputField label="Year" value={edu.year} onChange={(e: any) => handleEduChange(edu.id, 'year', e.target.value)} placeholder="2022" /></div>
                                <div className="col-span-1 flex justify-end pb-3">
                                    <button onClick={() => removeEdu(edu.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                             <span>Skills (Comma Separated)</span>
                             <span className="text-[10px] text-cyan-400 flex items-center gap-1"><Wand2 size={10}/> AI will auto-fill if empty</span>
                         </label>
                         <input 
                            value={skills} 
                            onChange={e => { setSkills(e.target.value); handleInputChange(e); }} 
                            placeholder="React, TypeScript, Node.js..." 
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none placeholder:text-slate-600" 
                         />
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Preview & Action */}
            <div className={`xl:col-span-7 flex flex-col gap-6 h-full ${activeTab === 'edit' ? 'hidden xl:flex' : ''}`}>
                
                {/* Action Bar */}
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between sticky top-24 z-20">
                     <div className="flex items-center gap-4">
                         <div className="xl:hidden">
                             <button onClick={() => setActiveTab('edit')} className="p-2 bg-slate-800 rounded-lg text-white">Edit</button>
                         </div>
                         <h3 className="text-white font-bold flex items-center gap-2">
                             <Layout className="text-cyan-400" /> Live Preview
                         </h3>
                     </div>

                     <div className="flex items-center gap-3">
                         {previewHtml && (
                             <div className="flex items-center gap-2 bg-slate-900 rounded-lg border border-white/10 px-2 py-1 mr-4">
                                 <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="p-1 hover:text-cyan-400"><ZoomOut size={16}/></button>
                                 <span className="text-xs font-mono w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                                 <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="p-1 hover:text-cyan-400"><ZoomIn size={16}/></button>
                             </div>
                         )}

                         <button 
                             onClick={() => generateCV()} 
                             disabled={isGenerating}
                             className="px-6 py-3 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-xl shadow-neon transition-all hover:-translate-y-1 flex items-center gap-2 disabled:opacity-50"
                         >
                             {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 className="fill-black" />} 
                             {previewHtml ? 'Regenerate' : 'Generate CV'}
                         </button>
                     </div>
                </div>

                {/* Preview Frame */}
                <div 
                    ref={previewRef} 
                    className="flex-1 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden relative min-h-[800px] shadow-2xl transition-all duration-500 flex items-center justify-center bg-dots"
                >
                    
                    {/* Live Drafting Animation overlay when typing OR Generating */}
                    {(isTyping || isGenerating) && !previewHtml && <DraftingPreview />}

                    {previewHtml ? (
                        <div className="w-full h-full overflow-auto custom-scrollbar flex justify-center bg-slate-800 p-8">
                            <div 
                                style={{ 
                                    transform: `scale(${zoomLevel})`, 
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.2s ease-out'
                                }}
                                className="shadow-2xl"
                            >
                                <iframe 
                                    srcDoc={previewHtml} 
                                    className="border-none bg-white animate-fade-in" 
                                    style={{ width: '210mm', height: '297mm' }}
                                    title="CV Preview" 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-6">
                            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center animate-pulse-slow">
                                <FileCheck size={48} className="opacity-50" />
                            </div>
                            <div className="text-center max-w-md px-6">
                                <h3 className="text-xl font-bold text-white mb-2">Ready to Build</h3>
                                <p>Fill in your details on the left and click "Generate CV". Our AI will architect a perfect resume for you.</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Floating Download Actions (only if preview exists) */}
                    {previewHtml && !isGenerating && (
                        <div className="absolute bottom-6 right-6 flex flex-col md:flex-row gap-3 animate-slide-up items-end md:items-center z-50">
                            {/* Mobile Edit Trigger / Quick Edit */}
                            <button 
                                onClick={() => setActiveTab('edit')} 
                                className="px-4 py-3 bg-slate-800/90 text-white rounded-full hover:bg-slate-700 backdrop-blur-md transition-colors flex items-center gap-2 border border-white/10"
                                title="Edit Data"
                            >
                                <Pencil size={18} /> Edit Data
                            </button>

                            <button 
                                onClick={() => setPreviewHtml(null)} 
                                className="p-3 bg-black/80 text-white rounded-full hover:bg-black backdrop-blur-md transition-colors"
                                title="Clear Preview"
                            >
                                <RefreshCw size={20} />
                            </button>
                            
                            {/* Download Options */}
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={handleDownloadPdf}
                                    className="px-6 py-3 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-full shadow-neon flex items-center gap-2 justify-center"
                                >
                                    <Download size={20} /> PDF (A4)
                                </button>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleDownloadImage}
                                        className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-full border border-white/10 flex items-center gap-2 justify-center text-sm"
                                    >
                                        <ImageIcon size={16} /> HD Image
                                    </button>
                                    <button 
                                        onClick={handleDownloadWord}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full flex items-center gap-2 justify-center text-sm shadow-lg"
                                    >
                                        <FileOutput size={16} /> MS Word
                                    </button>
                                    <button 
                                        onClick={handleDownloadHtml}
                                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-full flex items-center gap-2 justify-center text-sm shadow-lg"
                                    >
                                        <Code size={16} /> HTML
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-1 flex xl:hidden z-50">
                <button 
                    onClick={() => setActiveTab('edit')} 
                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'edit' ? 'bg-cyan-400 text-black' : 'text-slate-400'}`}
                >
                    Edit
                </button>
                <button 
                    onClick={() => setActiveTab('preview')} 
                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'preview' ? 'bg-cyan-400 text-black' : 'text-slate-400'}`}
                >
                    Preview
                </button>
            </div>
        </div>
    </div>
  );
};