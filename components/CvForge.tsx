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

const DraftingPreview = () => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity duration-500 animate-fade-in pointer-events-none">
        <div className="relative w-48 h-48 animate-bounce-slight">
             <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                 <circle cx="100" cy="100" r="90" fill="#1e293b" stroke="var(--primary-color)" strokeWidth="2" />
                 <rect x="60" y="50" width="80" height="100" fill="white" rx="5" />
                 <line x1="70" y1="70" x2="130" y2="70" stroke="#ccc" strokeWidth="2" className="animate-[writing_1s_ease-in-out_infinite]" />
                 <line x1="70" y1="85" x2="130" y2="85" stroke="#ccc" strokeWidth="2" className="animate-[writing_1s_ease-in-out_infinite]" style={{animationDelay: '0.2s'}} />
                 <g className="animate-[writing_1s_ease-in-out_infinite] origin-center">
                    <path d="M120,120 Q140,100 160,120 T180,160 Q150,180 120,160 Z" fill="white" stroke="black" strokeWidth="3" />
                    <rect x="110" y="80" width="10" height="60" fill="#ffd700" stroke="black" transform="rotate(-45 115 110)" />
                 </g>
             </svg>
        </div>
        <p className="mt-4 text-primary font-bold tracking-widest uppercase text-sm animate-pulse">AI Drafting & Formatting...</p>
    </div>
);

const WritingCharacter = ({ isTyping }: { isTyping: boolean }) => (
    <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 pointer-events-none ${isTyping ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'}`}>
        <div className="relative w-24 h-24">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                 <circle cx="50" cy="40" r="30" fill="#fecaca" />
                 <circle cx="40" cy="35" r="3" fill="#1e293b" className={isTyping ? 'animate-bounce' : ''} />
                 <circle cx="60" cy="35" r="3" fill="#1e293b" className={isTyping ? 'animate-bounce' : ''} />
                 <path d="M40 50 Q50 60 60 50" stroke="#1e293b" fill="none" strokeWidth="2" strokeLinecap="round" />
                 <g className={isTyping ? 'animate-writing' : ''} style={{ transformOrigin: '50% 70%' }}>
                    <rect x="65" y="45" width="8" height="30" fill="#fbbf24" transform="rotate(-30 65 45)" />
                    <circle cx="70" cy="55" r="8" fill="#fecaca" />
                 </g>
             </svg>
             <div className="absolute -top-4 left-0 right-0 text-center">
                <span className="text-[10px] font-black text-primary uppercase bg-theme-bg px-2 py-0.5 rounded border border-primary/30 whitespace-nowrap">Drafting...</span>
             </div>
        </div>
    </div>
);

const InputField = ({ label, name, value, onChange, type = "text", placeholder, className = "", error, onBlur, suggestion, onEnhance, isEnhancing, isValidating }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center group/label">
        <span className="flex items-center gap-1">
            {label}
            {onEnhance && (
                <button 
                    onClick={(e) => { e.preventDefault(); onEnhance(); }} 
                    disabled={isEnhancing}
                    className="opacity-0 group-hover/label:opacity-100 transition-opacity text-primary hover:text-secondary p-0.5 disabled:opacity-50"
                    title="AI Enhance/Rewrite"
                >
                    {isEnhancing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                </button>
            )}
        </span>
        {isValidating && <Loader2 size={10} className="animate-spin text-primary" />}
        {error && <span className="text-red-400 text-[10px] flex items-center gap-1 bg-red-400/10 px-1 rounded animate-pop-in"><AlertTriangle size={10} /> {error}</span>}
    </label>
    <div className="relative">
        <input 
          name={name} value={value} onChange={onChange} onBlur={onBlur} type={type} placeholder={placeholder} 
          className={`w-full bg-slate-100 dark:bg-slate-900/50 border rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 ${error ? 'border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-primary'}`} 
        />
        {suggestion && !error && <div className="absolute right-2 top-2.5 text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30 z-20 animate-fade-in">Suggestion: {suggestion}</div>}
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, className = "", onBlur }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <select name={name} value={value} onChange={onChange} onBlur={onBlur} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-primary focus:outline-none appearance-none cursor-pointer">
        <option value="">Select {label}</option>
        {options.map((opt: string) => <option key={opt} value={opt} className="dark:bg-slate-900">{opt}</option>)}
    </select>
  </div>
);

export const CvForge: React.FC = () => {
  const [layoutSeed, setLayoutSeed] = useState(Math.floor(Math.random() * 10000));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [zoomLevel, setZoomLevel] = useState(0.8);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  
  const [jobRole, setJobRole] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
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
  const [isEnhancingPhoto, setIsEnhancingPhoto] = useState(false);
  const [isEnhancingField, setIsEnhancingField] = useState<string | null>(null);

  const handleKeyDown = () => {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1200);
  };

  const calculateAge = (dobString: string) => {
    if(!dobString) return '';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age.toString();
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

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length <= 4) return raw;
    return `${raw.slice(0, 4)} ${raw.slice(4, 11)}`;
  };

  const formatPassport = (val: string) => {
      let v = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const alphas = v.replace(/[0-9]/g, '').slice(0, 2);
      const digits = v.replace(/[A-Z]/g, '').slice(0, 7);
      return alphas + digits;
  };

  const handleInputChange = (e: any) => {
      const { name, value } = e.target;
      handleKeyDown();
      
      if (name === 'jobRole') { setJobRole(value); return; }
      if (name === 'dob') {
         setPersonalInfo(prev => ({ ...prev, dob: value, age: calculateAge(value) }));
         return;
      }
      if (name === 'cnic') {
          const formatted = formatCNIC(value);
          if (formatted.length <= 16) setPersonalInfo(prev => ({ ...prev, cnic: formatted }));
          return;
      }
      if (name === 'phone') {
          const formatted = formatPhone(value);
          if (formatted.length <= 12) setPersonalInfo(prev => ({ ...prev, phone: formatted }));
          return;
      }
      if (name === 'passport') {
          const formatted = formatPassport(value);
          setPersonalInfo(prev => ({ ...prev, passport: formatted }));
          return;
      }
      setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const enhanceField = async (id: string, currentValue: string) => {
      if (!currentValue) return;
      setIsEnhancingField(id);
      try {
          const prompt = `Act as a professional CV architect. Enhance/Rewrite this text for a professional resume (return ONLY the enhanced text): "${currentValue}"`;
          const result = await generateText(prompt);
          
          if (id === 'jobRole') setJobRole(result);
          else if (id.startsWith('personal-')) {
              const field = id.replace('personal-', '');
              setPersonalInfo(prev => ({ ...prev, [field]: result }));
          } else if (id.startsWith('exp-')) {
              const [_, expId, field] = id.split('-');
              setExperience(prev => prev.map(e => e.id === Number(expId) ? { ...e, [field]: result } : e));
          } else if (id.startsWith('edu-')) {
              const [_, eduId, field] = id.split('-');
              setEducation(prev => prev.map(e => e.id === Number(eduId) ? { ...e, [field]: result } : e));
          } else if (id === 'skills') {
              setSkills(result);
          }
      } catch (e) {
          console.error("Enhancement failed", e);
      } finally {
          setIsEnhancingField(null);
      }
  };

  const autoFillExpDetails = async (id: number) => {
      const exp = experience.find(e => e.id === id);
      if (!exp || !exp.title) return alert("Enter job title first.");
      setIsEnhancingField(`exp-${id}-details`);
      try {
          const prompt = `Act as a Professional Resume Architect. Write 3 high-impact professional achievement bullet points for the role "${exp.title}" at "${exp.company || 'a company'}". Target Role: ${jobRole}. Return ONLY bullet points starting with '•'.`;
          const result = await generateText(prompt);
          setExperience(prev => prev.map(e => e.id === id ? { ...e, details: result } : e));
      } finally {
          setIsEnhancingField(null);
      }
  };

  const autoFillSkills = async () => {
      setIsEnhancingField('skills');
      try {
          const context = `Target Role: ${jobRole}, Experience: ${experience.map(e => e.title).join(', ')}`;
          const prompt = `Act as a career consultant. Suggest a comma-separated list of the top 12 most relevant technical and soft skills for a candidate with this profile: ${context}. Return ONLY the skills.`;
          const result = await generateText(prompt);
          setSkills(result);
      } finally {
          setIsEnhancingField(null);
      }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const file = e.target.files[0];
          setPhoto(file);
          setIsEnhancingPhoto(true);
          try {
              const base64 = await helperFileToBase64(file);
              const enhanced = await generateIdentityPhoto(base64, file.type);
              setEnhancedPhotoBase64(enhanced);
          } catch (error) {
              const base64 = await helperFileToBase64(file);
              setEnhancedPhotoBase64(base64);
          } finally { setIsEnhancingPhoto(false); }
      }
  };

  const generateCV = async () => {
    setIsGenerating(true);
    setActiveTab('preview');
    try {
        const cvData = { 
            layoutId: layoutSeed, 
            jobRole: jobRole || "Professional", 
            personalInfo, 
            experience, 
            education, 
            skills, 
            photoBase64: enhancedPhotoBase64 || (photo ? await helperFileToBase64(photo) : null) 
        };
        const html = await generateCvHtml(cvData, customInstruction);
        setPreviewHtml(html);
    } catch (e) { alert("Generation failed."); } finally { setIsGenerating(false); }
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

  const addExp = () => setExperience([...experience, { id: Date.now(), title: '', company: '', location: '', duration: '', details: '' }]);
  const removeExp = (id: number) => setExperience(experience.filter(e => e.id !== id));
  const addEdu = () => setEducation([...education, { id: Date.now(), degree: '', school: '', year: '' }]);
  const removeEdu = (id: number) => setEducation(education.filter(e => e.id !== id));

  return (
    <div className="flex flex-col gap-8 animate-fade-in relative pb-20 max-w-[1800px] mx-auto">
        <WritingCharacter isTyping={isTyping} />

        {(isGenerating || isDownloading) && (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
                 <Loader2 className="w-20 h-20 text-primary animate-spin mb-4" />
                 <h2 className="text-2xl font-bold text-white tracking-widest animate-pulse">
                    {isDownloading ? 'PREPARING DOCUMENT...' : 'AI FORGE IN PROGRESS...'}
                 </h2>
            </div>
        )}

        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-theme-text font-display flex items-center justify-center gap-3">
                <FileText size={48} className="text-primary" /> CV <span className="text-primary drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">FORGE</span> PRO
            </h1>
            <p className="text-slate-400 mt-2">Professional Identity Architect with AI Validation</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className={`xl:col-span-5 flex flex-col gap-6 ${activeTab === 'preview' ? 'hidden xl:flex' : ''}`}>
                
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-primary">
                    <InputField 
                        label="Target Job Role" 
                        name="jobRole" 
                        value={jobRole} 
                        onChange={handleInputChange} 
                        onEnhance={() => enhanceField('jobRole', jobRole)}
                        isEnhancing={isEnhancingField === 'jobRole'}
                        placeholder="e.g. Senior Project Manager" 
                    />
                </div>

                <div className="glass-card p-6 rounded-3xl flex flex-col gap-6 border border-white/5">
                    <h3 className="text-slate-200 font-bold flex items-center gap-2 border-b border-white/5 pb-3 uppercase text-xs tracking-widest">
                        <UserCheck size={16} className="text-primary" /> Basic Profile
                    </h3>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 group cursor-pointer shadow-md">
                            {isEnhancingPhoto ? <Loader2 className="animate-spin text-primary" /> : enhancedPhotoBase64 ? <img src={`data:image/jpeg;base64,${enhancedPhotoBase64}`} className="w-full h-full object-cover" /> : <User className="text-slate-400" size={32} />}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={20} className="text-white" /></div>
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} />
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            <InputField label="Full Name" name="name" value={personalInfo.name} onChange={handleInputChange} onEnhance={() => enhanceField('personal-name', personalInfo.name)} isEnhancing={isEnhancingField === 'personal-name'} />
                            <InputField label="Father Name" name="fatherName" value={personalInfo.fatherName} onChange={handleInputChange} onEnhance={() => enhanceField('personal-fatherName', personalInfo.fatherName)} isEnhancing={isEnhancingField === 'personal-fatherName'} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Email Address" name="email" value={personalInfo.email} onChange={handleInputChange} onBlur={() => validateField('email', personalInfo.email)} error={errors.email} isValidating={isValidating.email} placeholder="example@mail.com" />
                        <InputField label="Phone Number" name="phone" value={personalInfo.phone} onChange={handleInputChange} onBlur={() => validateField('phone', personalInfo.phone)} error={errors.phone} isValidating={isValidating.phone} placeholder="03xx xxxxxxx" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="CNIC (5-8-1)" name="cnic" value={personalInfo.cnic} onChange={handleInputChange} onBlur={() => validateField('cnic', personalInfo.cnic)} error={errors.cnic} isValidating={isValidating.cnic} placeholder="12345-1234567-1" />
                        <InputField label="Passport (AA1234567)" name="passport" value={personalInfo.passport} onChange={handleInputChange} onBlur={() => validateField('passport', personalInfo.passport)} error={errors.passport} isValidating={isValidating.passport} placeholder="FB1234567" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Date of Birth" name="dob" type="date" value={personalInfo.dob} onChange={handleInputChange} />
                        <InputField label="Age" name="age" type="number" value={personalInfo.age} onChange={handleInputChange} placeholder="Auto" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <SelectField label="Gender" name="gender" value={personalInfo.gender} onChange={handleInputChange} options={GENDERS} />
                        <SelectField label="Marital Status" name="maritalStatus" value={personalInfo.maritalStatus} onChange={handleInputChange} options={MARITAL_STATUSES} />
                    </div>

                    <SelectField label="Nationality" name="nationality" value={personalInfo.nationality} onChange={handleInputChange} options={NATIONALITIES} />
                    
                    <InputField label="Residential Address" name="address" value={personalInfo.address} onChange={handleInputChange} onEnhance={() => enhanceField('personal-address', personalInfo.address)} isEnhancing={isEnhancingField === 'personal-address'} placeholder="Current address" />
                </div>

                <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 border border-white/5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-slate-200 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                            <Briefcase size={16} className="text-primary" /> Work Experience
                        </h3>
                        <button onClick={addExp} className="text-primary flex items-center gap-1 text-xs font-bold hover:text-secondary transition-colors"><Plus size={14} /> Add Role</button>
                    </div>
                    {experience.map((exp) => (
                        <div key={exp.id} className="relative flex flex-col gap-3 p-4 bg-slate-900/50 rounded-xl border border-white/5 group hover:border-primary transition-all">
                            <button onClick={() => removeExp(exp.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                            <InputField label="Job Title" value={exp.title} onChange={(e: any) => setExperience(prev => prev.map(item => item.id === exp.id ? { ...item, title: e.target.value } : item))} onEnhance={() => enhanceField(`exp-${exp.id}-title`, exp.title)} isEnhancing={isEnhancingField === `exp-${exp.id}-title`} />
                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="Company" value={exp.company} onChange={(e: any) => setExperience(prev => prev.map(item => item.id === exp.id ? { ...item, company: e.target.value } : item))} />
                                <InputField label="Duration" value={exp.duration} onChange={(e: any) => setExperience(prev => prev.map(item => item.id === exp.id ? { ...item, duration: e.target.value } : item))} placeholder="e.g. 2020 - Present" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                                    Details
                                    <button onClick={() => autoFillExpDetails(exp.id)} disabled={isEnhancingField === `exp-${exp.id}-details`} className="text-primary hover:text-secondary flex items-center gap-1 text-[10px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                        {isEnhancingField === `exp-${exp.id}-details` ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI Architect Write
                                    </button>
                                </label>
                                <textarea value={exp.details} onChange={(e: any) => setExperience(prev => prev.map(item => item.id === exp.id ? { ...item, details: e.target.value } : item))} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white h-24 resize-none focus:border-primary outline-none" placeholder="Impact-driven bullet points..." />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-card p-6 rounded-3xl flex flex-col gap-4 border border-white/5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-slate-200 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                            <GraduationCap size={16} className="text-primary" /> Education
                        </h3>
                        <button onClick={addEdu} className="text-primary flex items-center gap-1 text-xs font-bold"><Plus size={14} /> Add Education</button>
                    </div>
                    {education.map((edu) => (
                        <div key={edu.id} className="relative flex flex-col gap-3 p-4 bg-slate-900/50 rounded-xl border border-white/5 group">
                            <button onClick={() => removeEdu(edu.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                            <InputField label="Degree / Diploma" value={edu.degree} onChange={(e: any) => setEducation(prev => prev.map(item => item.id === edu.id ? { ...item, degree: e.target.value } : item))} onEnhance={() => enhanceField(`edu-${edu.id}-degree`, edu.degree)} isEnhancing={isEnhancingField === `edu-${edu.id}-degree`} />
                            <div className="grid grid-cols-2 gap-3">
                                <InputField label="School / University" value={edu.school} onChange={(e: any) => setEducation(prev => prev.map(item => item.id === edu.id ? { ...item, school: e.target.value } : item))} onEnhance={() => enhanceField(`edu-${edu.id}-school`, edu.school)} isEnhancing={isEnhancingField === `edu-${edu.id}-school`} />
                                <InputField label="Completion Year" value={edu.year} onChange={(e: any) => setEducation(prev => prev.map(item => item.id === edu.id ? { ...item, year: e.target.value } : item))} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-card p-6 rounded-2xl flex flex-col gap-2 border border-white/5">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                         Professional Skills
                         <button onClick={autoFillSkills} disabled={isEnhancingField === 'skills'} className="text-primary hover:text-secondary flex items-center gap-1 text-[10px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                             {isEnhancingField === 'skills' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10}/>} AI Architect Skills
                         </button>
                     </label>
                     <textarea value={skills} onChange={e => { setSkills(e.target.value); handleKeyDown(); }} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white h-24 resize-none focus:border-primary outline-none" placeholder="Core competencies..." />
                </div>

                <button 
                    onClick={generateCV}
                    disabled={isGenerating || !personalInfo.name}
                    className="w-full py-5 bg-primary hover:bg-secondary text-black font-black rounded-2xl shadow-neon transition-all hover:-translate-y-1 disabled:opacity-20"
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

                <div className="flex-1 bg-slate-900 border border-white/5 rounded-3xl overflow-hidden min-h-[800px] flex justify-center p-8 bg-dots relative shadow-inner">
                    {(isTyping || isGenerating) && !previewHtml && <DraftingPreview />}
                    
                    {previewHtml ? (
                        <div className="w-full h-full flex justify-center">
                            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }} className="shadow-2xl bg-white origin-top">
                                <iframe srcDoc={previewHtml} className="w-[210mm] h-[297mm] border-none" />
                            </div>
                        </div>
                    ) : !isGenerating && (
                        <div className="flex flex-col items-center justify-center text-slate-700">
                            <Sparkles size={64} className="opacity-10 mb-4" />
                            <p className="font-bold">Architect is Ready</p>
                        </div>
                    )}

                    {previewHtml && (
                        <div className="absolute bottom-10 right-10 flex flex-col gap-3">
                             <button onClick={handleDownloadPdf} className="px-8 py-4 bg-primary text-black font-black rounded-2xl shadow-neon flex items-center gap-3 hover:-translate-y-1 transition-all">
                                <Download size={20}/> Download PDF (A4)
                             </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};