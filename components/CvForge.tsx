import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Target, Layout, Loader2, Plus, Trash2, Shuffle, 
  Upload, Download, User, Briefcase, GraduationCap, FileText, Check, 
  RefreshCw, Sparkles, Wand2, MapPin, Calendar, CreditCard, Flag, 
  FileCheck, AlertTriangle, Eye, Image as ImageIcon, FileOutput, Pencil, Code,
  ZoomIn, ZoomOut, Phone, Mail, Home, Heart, ShieldCheck, UserCheck, X
} from 'lucide-react';
import { generateCvHtml, helperFileToBase64, generateIdentityPhoto, generateText, validateFieldWithAI, validateProfileData } from '../services/geminiService';

declare const html2pdf: any;
declare const html2canvas: any;

const NATIONALITIES = [
    "Pakistani", "Indian", "Bangladeshi", "American", "British", "Canadian", "Australian", "Emirati", "Saudi", "Qatari", 
    "Omani", "Kuwaiti", "Bahraini", "German", "French", "Italian", "Chinese", "Japanese", "Filipino", "Sri Lankan", 
    "Nepalese", "Malaysian", "Indonesian", "Turkish", "Iranian", "Afghan"
];

const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"];

// Subtle Cartoon Character Writing Animation
const WritingCharacter = ({ isTyping }: { isTyping: boolean }) => (
    <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 pointer-events-none ${isTyping ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'}`}>
        <div className="relative w-24 h-24">
             <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse"></div>
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                 {/* Cartoon Face */}
                 <circle cx="50" cy="40" r="30" fill="#fecaca" />
                 <circle cx="40" cy="35" r="3" fill="#1e293b" className={isTyping ? 'animate-bounce' : ''} />
                 <circle cx="60" cy="35" r="3" fill="#1e293b" className={isTyping ? 'animate-bounce' : ''} />
                 <path d="M40 50 Q50 60 60 50" stroke="#1e293b" fill="none" strokeWidth="2" strokeLinecap="round" />
                 {/* Hand and Pencil */}
                 <g className={isTyping ? 'animate-writing' : ''} style={{ transformOrigin: '50% 70%' }}>
                    <rect x="65" y="45" width="8" height="30" fill="#fbbf24" transform="rotate(-30 65 45)" />
                    <circle cx="70" cy="55" r="8" fill="#fecaca" />
                 </g>
             </svg>
             <div className="absolute -top-4 left-0 right-0 text-center">
                <span className="text-[10px] font-black text-cyan-400 uppercase bg-slate-950 px-2 py-0.5 rounded border border-cyan-400/30 whitespace-nowrap">Drafting...</span>
             </div>
        </div>
    </div>
);

const InputField = ({ label, name, value, onChange, type = "text", placeholder, className = "", error, onBlur, suggestion, isValidating }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center group/label">
        <span className="flex items-center gap-1">{label}</span>
        {isValidating && <Loader2 size={10} className="animate-spin text-cyan-400" />}
        {error && <span className="text-red-400 text-[10px] flex items-center gap-1 bg-red-400/10 px-1 rounded animate-pop-in"><AlertTriangle size={10} /> {error}</span>}
    </label>
    <div className="relative">
        <input 
          name={name} value={value} onChange={onChange} onBlur={onBlur} type={type} placeholder={placeholder} 
          className={`w-full bg-slate-100 dark:bg-slate-900/50 border rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${error ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-slate-200 dark:border-white/10 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,243,255,0.1)]'}`} 
        />
        {suggestion && !error && <div className="absolute right-2 top-2.5 text-[9px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30 z-20 animate-fade-in">{suggestion}</div>}
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, className = "", onBlur }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <select name={name} value={value} onChange={onChange} onBlur={onBlur} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-cyan-400 focus:outline-none appearance-none cursor-pointer">
        <option value="">Select {label}</option>
        {options.map((opt: string) => <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>)}
    </select>
  </div>
);

export const CvForge: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [zoomLevel, setZoomLevel] = useState(0.9);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '', fatherName: '', dob: '', age: '', gender: '', maritalStatus: '', nationality: 'Pakistani', cnic: '', passport: '', passportIssue: '', passportExpiry: '', phone: '', email: '', address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});

  const [experience, setExperience] = useState([{ id: 1, title: '', company: '', location: '', duration: '', details: '' }]);
  const [education, setEducation] = useState([{ id: 1, degree: '', school: '', year: '' }]);
  const [skills, setSkills] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [enhancedPhotoBase64, setEnhancedPhotoBase64] = useState<string | null>(null);

  const handleTypingEffect = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1200);
  };

  const validateField = async (field: string, value: string) => {
    if (!value) return;
    setIsValidating(prev => ({ ...prev, [field]: true }));
    try {
        if (field === 'email' || field === 'phone') {
            const res = await validateProfileData(personalInfo.nationality, personalInfo.phone, personalInfo.email);
            setErrors(prev => ({
                ...prev,
                email: res.emailValid ? '' : res.emailMessage,
                phone: res.phoneValid ? '' : res.phoneMessage
            }));
        } else {
            const res = await validateFieldWithAI(value, field.toUpperCase() as any);
            setErrors(prev => ({ ...prev, [field]: res.isValid ? '' : res.message }));
        }
    } finally {
        setIsValidating(prev => ({ ...prev, [field]: false }));
    }
  };

  const formatCNIC = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length <= 5) return raw;
    if (raw.length <= 13) return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    return `${raw.slice(0, 5)}-${raw.slice(5, 13)}-${raw.slice(13, 14)}`;
  };

  const formatPassport = (val: string) => {
      let v = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const alphas = v.replace(/[0-9]/g, '').slice(0, 2);
      const digits = v.replace(/[A-Z]/g, '').slice(0, 7);
      return alphas + digits;
  };

  const handleInputChange = (e: any) => {
      const { name, value } = e.target;
      handleTypingEffect();

      if (name === 'cnic') {
          const formatted = formatCNIC(value);
          if (formatted.length <= 16) setPersonalInfo(prev => ({ ...prev, cnic: formatted }));
          return;
      }
      if (name === 'passport') {
          const formatted = formatPassport(value);
          setPersonalInfo(prev => ({ ...prev, passport: formatted }));
          return;
      }
      setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const generateCV = async () => {
    setIsGenerating(true);
    setActiveTab('preview');
    try {
        const cvData = { 
            jobRole: "Professional Identity", 
            personalInfo, 
            experience, 
            education, 
            skills, 
            photoBase64: enhancedPhotoBase64 || (photo ? await helperFileToBase64(photo) : null) 
        };
        const html = await generateCvHtml(cvData);
        setPreviewHtml(html);
    } catch (e) { alert("Forge failed."); } finally { setIsGenerating(false); }
  };

  const handleDownloadPdf = async () => {
    if (!previewHtml) return;
    setIsDownloading(true);
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.innerHTML = previewHtml;
    document.body.appendChild(container);

    // Wait for internal resources
    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));
    await new Promise(r => setTimeout(r, 800));

    try {
        const opt = {
            margin: 0,
            filename: `cv_${personalInfo.name || 'architect'}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(container).save();
    } finally {
        document.body.removeChild(container);
        setIsDownloading(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!previewHtml) return;
    setIsDownloading(true);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.backgroundColor = 'white';
    container.innerHTML = previewHtml;
    document.body.appendChild(container);

    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));
    await new Promise(r => setTimeout(r, 800));

    try {
        const canvas = await html2canvas(container, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 794, 
            height: 1123
        });
        const link = document.createElement('a');
        link.download = `cv_${personalInfo.name || 'architect'}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    } finally {
        document.body.removeChild(container);
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in relative pb-20">
        <WritingCharacter isTyping={isTyping} />

        {(isGenerating || isDownloading) && (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
                 <Loader2 className="w-20 h-20 text-cyan-400 animate-spin mb-4" />
                 <h2 className="text-2xl font-bold text-white tracking-widest animate-pulse">
                    {isDownloading ? 'PREPARING DOCUMENT...' : 'AI FORGE IN PROGRESS...'}
                 </h2>
            </div>
        )}

        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white font-display">
                CV <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">FORGE</span> PRO
            </h1>
            <p className="text-slate-400 mt-2">Professional Identity Architect with AI Validation</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className={`xl:col-span-5 flex flex-col gap-6 ${activeTab === 'preview' ? 'hidden xl:flex' : ''}`}>
                
                <div className="glass-card p-6 rounded-3xl flex flex-col gap-6 border border-white/5">
                    <h3 className="text-slate-200 font-bold flex items-center gap-2 border-b border-white/5 pb-3 uppercase text-xs tracking-widest">
                        <UserCheck size={16} className="text-cyan-400" /> Basic Profile
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Full Name" name="name" value={personalInfo.name} onChange={handleInputChange} placeholder="Candidate Name" />
                        <InputField label="Father Name" name="fatherName" value={personalInfo.fatherName} onChange={handleInputChange} placeholder="Father Name" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Email Address" name="email" value={personalInfo.email} onChange={handleInputChange} onBlur={() => validateField('email', personalInfo.email)} error={errors.email} isValidating={isValidating.email} placeholder="example@mail.com" />
                        <InputField label="Phone Number" name="phone" value={personalInfo.phone} onChange={handleInputChange} onBlur={() => validateField('phone', personalInfo.phone)} error={errors.phone} isValidating={isValidating.phone} placeholder="03xx xxxxxxx" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="CNIC (5-8-1)" name="cnic" value={personalInfo.cnic} onChange={handleInputChange} onBlur={() => validateField('cnic', personalInfo.cnic)} error={errors.cnic} isValidating={isValidating.cnic} placeholder="12345-12345678-1" />
                        <InputField label="Passport (AA1234567)" name="passport" value={personalInfo.passport} onChange={handleInputChange} onBlur={() => validateField('passport', personalInfo.passport)} error={errors.passport} isValidating={isValidating.passport} placeholder="FB1234567" />
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl flex flex-col gap-6 border border-white/5">
                    <h3 className="text-slate-200 font-bold flex items-center gap-2 border-b border-white/5 pb-3 uppercase text-xs tracking-widest">
                        <Briefcase size={16} className="text-cyan-400" /> Experience & Skills
                    </h3>
                    <textarea 
                        value={skills}
                        onChange={e => { setSkills(e.target.value); handleTypingEffect(); }}
                        placeholder="List your key professional skills..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white focus:border-cyan-400 outline-none h-32 resize-none"
                    />
                </div>

                <button 
                    onClick={generateCV}
                    disabled={isGenerating || !personalInfo.name}
                    className="w-full py-5 bg-cyan-400 hover:bg-cyan-300 text-black font-black rounded-2xl shadow-neon transition-all hover:-translate-y-1 disabled:opacity-20"
                >
                    INITIATE AI FORGE
                </button>
            </div>

            <div className={`xl:col-span-7 flex flex-col gap-6 h-full ${activeTab === 'edit' ? 'hidden xl:flex' : ''}`}>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between sticky top-4 z-20">
                    <button onClick={() => setActiveTab('edit')} className="p-2 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-xs">
                        <X size={16} /> Close Preview
                    </button>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))}><ZoomOut size={16}/></button>
                        <span className="text-xs font-mono">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))}><ZoomIn size={16}/></button>
                    </div>
                </div>

                <div className="flex-1 bg-slate-900 border border-white/5 rounded-3xl overflow-hidden min-h-[800px] flex justify-center p-8 bg-dots relative">
                    {!previewHtml && !isGenerating && (
                        <div className="flex flex-col items-center justify-center text-slate-700">
                            <Sparkles size={64} className="opacity-10 mb-4" />
                            <p className="font-bold">Architect is Ready</p>
                        </div>
                    )}
                    
                    {previewHtml && (
                        <div className="w-full h-full flex justify-center">
                            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }} className="shadow-2xl bg-white origin-top">
                                <iframe srcDoc={previewHtml} className="w-[210mm] h-[297mm] border-none" />
                            </div>
                        </div>
                    )}

                    {previewHtml && (
                        <div className="absolute bottom-10 right-10 flex flex-col gap-3">
                             <button onClick={handleDownloadPdf} className="px-8 py-4 bg-cyan-400 text-black font-black rounded-2xl shadow-neon flex items-center gap-3 hover:-translate-y-1 transition-all">
                                <Download size={20}/> Download PDF (A4)
                             </button>
                             <button onClick={handleDownloadPng} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-2xl border border-white/10 flex items-center gap-3 hover:bg-slate-700 transition-all">
                                <ImageIcon size={20}/> Download PNG Image
                             </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};