import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Plus, Trash2, Zap, Briefcase, GraduationCap, User, Globe, Download, Sparkles, Target, AlertTriangle, Eraser, Layout, PenTool, ArrowRight, ZoomIn, ZoomOut, Move, Maximize2, Check, Loader2 } from 'lucide-react';
import { generateCvHtml, generateIdentityPhoto, helperFileToBase64, validateIdentityFormat } from '../services/geminiService';

interface Education {
  degree: string;
  school: string;
  yearFrom: string;
  yearTo: string;
  details?: string; 
}

interface Experience {
  years: string;
  place: string;
  designation: string;
  details?: string; 
}

// --- Data Constants ---
const RELIGIONS = ["Islam", "Christianity", "Hinduism", "Sikhism", "Buddhism", "Judaism", "Other"];
const MARITAL_STATUS = ["Single", "Married", "Divorced", "Widowed"];
const NATIONALITIES = ["Pakistan", "Saudi Arabia", "UAE", "United Kingdom", "USA", "Canada", "India", "Bangladesh", "Other"];

// Province & City Data
const PAKISTAN_LOCATIONS: Record<string, string[]> = {
  "Punjab": [
    "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sialkot", "Sargodha", "Bahawalpur", "Gujarat", 
    "Sheikhupura", "Jhelum", "Attock", "Sahiwal", "Okara", "Kasur", "Rahim Yar Khan", "Muzaffargarh", "Vehari"
  ],
  "Sindh": [
    "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpur Khas", "Jacobabad", "Shikarpur", "Khairpur"
  ],
  "Khyber Pakhtunkhwa": [
    "Peshawar", "Mardan", "Swat", "Abbottabad", "Mansehra", "Kohat", "Bannu", "D.I. Khan", "Haripur", "Nowshera"
  ],
  "Balochistan": [
    "Quetta", "Gwadar", "Turbat", "Khuzdar", "Chaman", "Sibi", "Zhob", "Loralai"
  ],
  "Islamabad": ["Islamabad"],
  "Azad Kashmir": ["Muzaffarabad", "Mirpur", "Rawalakot", "Kotli", "Bhimber"],
  "Gilgit-Baltistan": ["Gilgit", "Skardu", "Hunza", "Chilas"]
};

// --- Input Component ---
const InputField = ({ 
  label, name, value, onChange, type = "text", placeholder, error, maxLength, list, onVerify 
}: { 
  label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void, type?: string, placeholder?: string, error?: string, maxLength?: number, list?: string, onVerify?: () => void
}) => (
  <div className="flex flex-col gap-1 relative">
    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex justify-between">
      {label}
      {error && <span className="text-red-400 text-[10px] flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {error}</span>}
    </label>
    <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          list={list}
          className={`w-full bg-slate-900/50 border ${error ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-sm text-white focus:border-[#00f3ff] focus:outline-none transition-colors placeholder-slate-600`}
          placeholder={placeholder || `Enter ${label}`}
        />
        {onVerify && value && !error && (
            <button 
                onClick={onVerify} 
                className="absolute right-2 top-2 p-1 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] rounded-md text-[10px] font-bold transition-all border border-[#00f3ff]/30"
            >
                AI Check
            </button>
        )}
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, disabled = false }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[], disabled?: boolean }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="bg-slate-900/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#00f3ff] focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
    >
      <option value="" disabled>Select {label}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export const CvForge: React.FC = () => {
  const [jobRole, setJobRole] = useState(''); 
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    fatherName: '',
    religion: '',
    nationality: '',
    dob: '',
    cnic: '',
    passportNo: '',
    province: '', // Added Province
    placeOfBirth: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    maritalStatus: '',
    address: '',
    phone: '',
    email: ''
  });

  const [education, setEducation] = useState<Education[]>([
    { degree: '', school: '', yearFrom: '', yearTo: '', details: '' }
  ]);

  const [experience, setExperience] = useState<Experience[]>([
    { years: '', place: '', designation: '', details: '' }
  ]);

  const [abroadExperience, setAbroadExperience] = useState<Experience[]>([
    { years: '', place: '', designation: '', details: '' }
  ]);

  const [photo, setPhoto] = useState<File | null>(null);
  const [enhancedPhotoBase64, setEnhancedPhotoBase64] = useState<string | null>(null);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Preview State
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [userSuggestion, setUserSuggestion] = useState<string>('');
  
  // Animation & Scaling State
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- Persistence Logic ---
  useEffect(() => {
    // Load data from LocalStorage on mount
    const savedData = localStorage.getItem('cv_forge_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.jobRole) setJobRole(parsed.jobRole);
        if (parsed.personalInfo) setPersonalInfo(parsed.personalInfo);
        if (parsed.education) setEducation(parsed.education);
        if (parsed.experience) setExperience(parsed.experience);
        if (parsed.abroadExperience) setAbroadExperience(parsed.abroadExperience);
      } catch (e) {
        console.error("Failed to load saved CV data", e);
      }
    }
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    // Save data to LocalStorage on change (debounced implicitly by React state batching, but we can do it directly)
    if (isDataLoaded) {
      const dataToSave = {
        jobRole,
        personalInfo,
        education,
        experience,
        abroadExperience
      };
      localStorage.setItem('cv_forge_data', JSON.stringify(dataToSave));
    }
  }, [jobRole, personalInfo, education, experience, abroadExperience, isDataLoaded]);

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem('cv_forge_data');
      setJobRole('');
      setPersonalInfo({
        name: '', fatherName: '', religion: '', nationality: '', dob: '', cnic: '', 
        passportNo: '', province: '', placeOfBirth: '', passportIssueDate: '', passportExpiryDate: '', 
        maritalStatus: '', address: '', phone: '', email: ''
      });
      setEducation([{ degree: '', school: '', yearFrom: '', yearTo: '', details: '' }]);
      setExperience([{ years: '', place: '', designation: '', details: '' }]);
      setAbroadExperience([{ years: '', place: '', designation: '', details: '' }]);
      setEnhancedPhotoBase64(null);
      setPreviewHtml(null);
    }
  };

  // --- Scaling Logic ---
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        // A4 Width is approx 794px at 96 DPI (210mm)
        // We add some padding/margin awareness
        const targetWidth = 794; 
        const newScale = Math.min(containerWidth / targetWidth, 1);
        setBaseScale(newScale - 0.05); // slightly smaller to ensure borders visible
      }
    };

    const observer = new ResizeObserver(updateScale);
    if (previewContainerRef.current) {
      observer.observe(previewContainerRef.current);
    }
    window.addEventListener('resize', updateScale);
    updateScale(); // Initial call

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // --- Pan & Zoom Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
       e.preventDefault();
       const delta = e.deltaY > 0 ? 0.9 : 1.1;
       setZoomLevel(z => Math.min(Math.max(0.5, z * delta), 3));
    }
  };

  const startPan = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const doPan = (e: React.MouseEvent) => {
      if (isDragging) {
          setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
  };

  const endPan = () => setIsDragging(false);

  const resetView = () => {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
  };

  // --- Typing Animation Logic ---
  const handleAnyInput = () => {
      if (!previewHtml) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
          }, 1500);
      }
  };

  // --- Utility Logic ---
  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // --- Handlers ---
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    handleAnyInput();
    const { name, value } = e.target;
    let finalValue = value;
    let errorMsg = '';
    
    // Reset city if province changes
    if (name === 'province') {
        setPersonalInfo(prev => ({ ...prev, province: value, placeOfBirth: '' }));
        return;
    }

    // 1. CNIC Formatting
    if (name === 'cnic') {
        const digits = value.replace(/\D/g, '').slice(0, 13);
        if (digits.length > 12) finalValue = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
        else if (digits.length > 5) finalValue = `${digits.slice(0, 5)}-${digits.slice(5)}`;
        else finalValue = digits;
        if (value.length > 0 && digits.length < 13) errorMsg = "Incomplete CNIC";
    }

    // 2. Passport Formatting
    if (name === 'passportNo') {
        finalValue = value.toUpperCase().slice(0, 9);
        if (finalValue.length > 0 && !/^[A-Z]{1,2}\d{1,7}$/.test(finalValue)) errorMsg = "Invalid Format";
    }

    // 3. Phone Formatting
    if (name === 'phone') {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length > 4) finalValue = `${digits.slice(0, 4)} ${digits.slice(4)}`;
        else finalValue = digits;
    }

    // 4. Email Validation
    if (name === 'email') {
        finalValue = value;
        const validDomains = ['@gmail.com', '@icloud.com', '@yahoo.com', '@outlook.com', '@hotmail.com'];
        if (value.includes('@')) {
            const domain = value.substring(value.indexOf('@'));
            if (!validDomains.some(d => domain.endsWith(d))) errorMsg = "Must be Gmail, iCloud, Yahoo, etc.";
        }
    }

    // 5. Date Validation
    if (name === 'dob') {
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate > today) errorMsg = "Cannot be in future";
        else if (calculateAge(value) < 16) errorMsg = "Age too young for CV";
    }

    setErrors(prev => ({...prev, [name]: errorMsg}));
    setPersonalInfo(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleAiValidation = async (type: 'CNIC' | 'PASSPORT') => {
      const value = type === 'CNIC' ? personalInfo.cnic : personalInfo.passportNo;
      if (!value) return;
      
      const btn = document.activeElement as HTMLButtonElement;
      if (btn) btn.innerText = "...";

      const res = await validateIdentityFormat(value, type);
      
      if (!res.isValid) {
          setErrors(prev => ({ ...prev, [type === 'CNIC' ? 'cnic' : 'passportNo']: res.message }));
      } else {
          setErrors(prev => ({ ...prev, [type === 'CNIC' ? 'cnic' : 'passportNo']: '' }));
          alert(`${type} format is Valid!`);
      }
      if (btn) btn.innerText = "AI Check";
  };

  const handleEduChange = (index: number, field: keyof Education, value: string) => {
    handleAnyInput();
    let finalVal = value;
    let error = '';
    if (field === 'yearFrom' || field === 'yearTo') {
        finalVal = value.replace(/\D/g, '').slice(0, 4);
    }
    setEducation(prev => {
      const newEdu = [...prev];
      // @ts-ignore
      newEdu[index][field] = finalVal;
      return newEdu;
    });
  };

  const handleExpChange = (index: number, field: keyof Experience, value: string, isAbroad: boolean) => {
    handleAnyInput();
    let finalVal = value;
    if (field === 'years') finalVal = value.replace(/\D/g, '').slice(0, 2);
    
    if (isAbroad) {
      setAbroadExperience(prev => { 
          const newExp = [...prev]; 
          // @ts-ignore
          newExp[index][field] = finalVal; 
          return newExp; 
      });
    } else {
      setExperience(prev => { 
          const newExp = [...prev]; 
          // @ts-ignore
          newExp[index][field] = finalVal; 
          return newExp; 
      });
    }
  };

  const addEdu = () => setEducation(prev => [...prev, { degree: '', school: '', yearFrom: '', yearTo: '', details: '' }]);
  const removeEdu = (index: number) => setEducation(prev => prev.filter((_, i) => i !== index));

  const addExp = (isAbroad: boolean) => {
    const emptyItem = { years: '', place: '', designation: '', details: '' };
    isAbroad ? setAbroadExperience(prev => [...prev, emptyItem]) : setExperience(prev => [...prev, emptyItem]);
  };

  const removeExp = (index: number, isAbroad: boolean) => {
    isAbroad ? setAbroadExperience(prev => prev.filter((_, i) => i !== index)) : setExperience(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      handleAnyInput();
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setPhoto(file);
          setIsPhotoProcessing(true);
          try {
              const base64 = await helperFileToBase64(file);
              const processedImage = await generateIdentityPhoto(base64, file.type);
              setEnhancedPhotoBase64(processedImage);
          } catch (err) {
              const base64 = await helperFileToBase64(file);
              setEnhancedPhotoBase64(base64);
          } finally {
              setIsPhotoProcessing(false);
          }
      }
  };

  const validateForm = (): boolean => {
      // Check for empty required fields. If empty, user must use (--).
      const required = ['name', 'phone', 'address'];
      for (const field of required) {
          if (!personalInfo[field as keyof typeof personalInfo]?.trim()) {
              alert(`Field "${field.toUpperCase()}" cannot be empty. Use (--) if skipping.`);
              return false;
          }
      }
      return true;
  };

  const generateCV = async (overrideLayoutId?: number, suggestion: string = "") => {
      if (!validateForm()) return;

      setIsGenerating(true);
      setPreviewHtml(null); // Clear preview to trigger transition animation
      resetView();
      
      try {
        const cleanExperience = experience.filter(e => e.designation); 
        const cleanAbroad = abroadExperience.filter(e => e.designation);
        
        // Use provided layout or random
        const layoutId = overrideLayoutId || Math.floor(Math.random() * 5000) + 1;
        
        const payload = {
          jobRole,
          personalInfo,
          photoBase64: enhancedPhotoBase64,
          education: education.filter(e => e.degree),
          experience: cleanExperience,
          abroadExperience: cleanAbroad,
          layoutId,
          seed: Date.now() 
        };

        const htmlContent = await generateCvHtml(payload, suggestion);
        setPreviewHtml(htmlContent);

      } catch (e) {
        console.error(e);
        alert("Failed to generate CV. Please check your connection.");
      } finally {
        setIsGenerating(false);
      }
  };

  const handleShuffle = () => {
      const themes = [
        "Modern Silicon Valley Tech", 
        "Classic Harvard Academic", 
        "Bold Creative Agency", 
        "Executive Boardroom Professional", 
        "Minimalist Swiss Typography", 
        "Clean Start-up Founder",
        "European Standard (Europass Style)",
        "High-Contrast Brutalist"
      ];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      const newSeed = Math.floor(Math.random() * 100000);
      
      generateCV(newSeed, `Apply a '${randomTheme}' design style. Use the internet's best layout practices for this style.`);
  };

  const handleRefine = () => {
      if (!userSuggestion.trim()) return;
      generateCV(undefined, userSuggestion);
      setUserSuggestion('');
  };

  const handleDownloadPdf = async () => {
      if (!previewHtml) return;

      const element = document.createElement('div');
      element.innerHTML = previewHtml;
      // Force A4 Styles
      element.style.width = '210mm'; 
      element.style.height = '296mm'; // Slightly less than 297 to avoid overflow
      element.style.padding = '0';
      element.style.margin = '0 auto';
      element.style.overflow = 'hidden';
      element.style.background = 'white';
      
      document.body.appendChild(element);

      const opt = {
        margin: 0,
        filename: `${personalInfo.name.replace(/\s+/g, '_')}_CV.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if ((window as any).html2pdf) {
        await (window as any).html2pdf().set(opt).from(element).save();
      }
      document.body.removeChild(element);
  };

  return (
    <div className="p-6 md:p-12 w-full max-w-[1800px] mx-auto animate-fade-in flex flex-col xl:flex-row gap-8">
      
      {/* LEFT: Input Form */}
      <div className="flex-1 space-y-8 pb-20 max-w-4xl">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display font-bold text-white flex items-center gap-3">
                <FileText className="text-[#00f3ff]" /> CV FORGE <span className="text-xs bg-[#00f3ff] text-black px-2 py-0.5 rounded font-bold">PRO</span>
            </h1>
            <p className="text-slate-400 mt-2">Professional, AI-architected CVs. Supports 100+ Layouts.</p>
          </div>
          <button onClick={handleClearData} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
             <Eraser className="w-3 h-3" /> Clear Data
          </button>
        </div>

        {/* 0. Job Role (Target) */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden border-l-4 border-l-[#00f3ff]">
           <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-[#00f3ff]" />
              <h3 className="text-xl font-bold text-white">Target Position</h3>
           </div>
           <p className="text-xs text-slate-400 mb-2">This will be your main Title on the CV.</p>
           <input 
              value={jobRole}
              onChange={(e) => { handleAnyInput(); setJobRole(e.target.value); }}
              placeholder="e.g. Senior Civil Engineer..."
              className="w-full bg-slate-900 border border-white/20 rounded-xl p-4 text-lg text-white font-bold focus:border-[#00f3ff] outline-none"
           />
        </section>

        {/* 1. Personal Info */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="w-32 h-40 border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/30 relative group">
                      {enhancedPhotoBase64 ? (
                          <img src={`data:image/jpeg;base64,${enhancedPhotoBase64}`} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500"><User className="w-10 h-10" /></div>
                      )}
                      {isPhotoProcessing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-[#00f3ff] animate-pulse">ENHANCING...</div>}
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoUpload} />
                  </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Name" name="name" value={personalInfo.name} onChange={handleInfoChange} />
                  <InputField label="Father Name" name="fatherName" value={personalInfo.fatherName} onChange={handleInfoChange} />
                  <SelectField label="Religion" name="religion" value={personalInfo.religion} onChange={handleInfoChange} options={RELIGIONS} />
                  <SelectField label="Nationality" name="nationality" value={personalInfo.nationality} onChange={handleInfoChange} options={NATIONALITIES} />
                  <InputField label="Date of Birth" name="dob" value={personalInfo.dob} onChange={handleInfoChange} type="date" error={errors.dob} />
                  <InputField 
                    label="CNIC No" 
                    name="cnic" 
                    value={personalInfo.cnic} 
                    onChange={handleInfoChange} 
                    placeholder="XXXXX-XXXXXXX-X" 
                    maxLength={15} 
                    error={errors.cnic}
                    onVerify={() => handleAiValidation('CNIC')} 
                  />
                  <InputField 
                    label="Passport No" 
                    name="passportNo" 
                    value={personalInfo.passportNo} 
                    onChange={handleInfoChange} 
                    placeholder="AB1234567" 
                    maxLength={9} 
                    error={errors.passportNo}
                    onVerify={() => handleAiValidation('PASSPORT')}
                  />
                  
                  {/* Province Selection */}
                  <SelectField 
                    label="Province" 
                    name="province" 
                    value={personalInfo.province} 
                    onChange={handleInfoChange} 
                    options={Object.keys(PAKISTAN_LOCATIONS)} 
                  />

                  {/* City Datalist - Dependent on Province */}
                  <div>
                      <div className="flex flex-col gap-1 relative">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Place of Birth</label>
                        <select
                          name="placeOfBirth"
                          value={personalInfo.placeOfBirth}
                          onChange={handleInfoChange}
                          disabled={!personalInfo.province}
                          className="bg-slate-900/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#00f3ff] focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="" disabled>Select City</option>
                            {personalInfo.province && PAKISTAN_LOCATIONS[personalInfo.province]?.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                      </div>
                  </div>

                  <InputField label="Passport Issue" name="passportIssueDate" value={personalInfo.passportIssueDate} onChange={handleInfoChange} type="date" />
                  <InputField label="Passport Expiry" name="passportExpiryDate" value={personalInfo.passportExpiryDate} onChange={handleInfoChange} type="date" />
                  <SelectField label="Marital Status" name="maritalStatus" value={personalInfo.maritalStatus} onChange={handleInfoChange} options={MARITAL_STATUS} />
                  <InputField label="Phone" name="phone" value={personalInfo.phone} onChange={handleInfoChange} placeholder="03XX XXXXXXX" maxLength={12} />
                  <div className="md:col-span-2"><InputField label="Email" name="email" value={personalInfo.email} onChange={handleInfoChange} type="email" error={errors.email} /></div>
                  <div className="md:col-span-2"><InputField label="Address" name="address" value={personalInfo.address} onChange={handleInfoChange} /></div>
              </div>
          </div>
        </section>

        {/* 2. Education */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-white flex gap-2"><GraduationCap className="text-[#00f3ff]"/> Education</h3><button onClick={addEdu}><Plus className="text-[#00f3ff]"/></button></div>
          <div className="space-y-4">
            {education.map((edu, idx) => (
              <div key={idx} className="bg-black/20 p-4 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-9 gap-3">
                    <div className="md:col-span-3"><input placeholder="Degree" value={edu.degree} onChange={(e) => handleEduChange(idx, 'degree', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <div className="md:col-span-3"><input placeholder="School" value={edu.school} onChange={(e) => handleEduChange(idx, 'school', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <div className="md:col-span-2 flex gap-2"><input placeholder="From" value={edu.yearFrom} onChange={(e) => handleEduChange(idx, 'yearFrom', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /><input placeholder="To" value={edu.yearTo} onChange={(e) => handleEduChange(idx, 'yearTo', e.target.value)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <button onClick={() => removeEdu(idx)} className="md:col-span-1 text-red-500 flex justify-end"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <textarea 
                    placeholder="Optional: Details (Subjects, GPA, etc). Leave empty for AI to generate." 
                    value={edu.details || ''} 
                    onChange={(e) => handleEduChange(idx, 'details', e.target.value)}
                    className="w-full bg-slate-900/50 text-xs text-slate-300 p-2 rounded border border-white/5 focus:border-[#00f3ff] outline-none h-16 resize-none"
                  />
              </div>
            ))}
          </div>
        </section>

        {/* 3. Experience */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl">
           <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-white flex gap-2"><Briefcase className="text-[#00f3ff]"/> Experience (Local)</h3><button onClick={() => addExp(false)}><Plus className="text-[#00f3ff]"/></button></div>
           <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="bg-black/20 p-4 rounded-xl space-y-3">
                 <div className="grid grid-cols-1 md:grid-cols-9 gap-3">
                    <div className="md:col-span-1"><input placeholder="Yrs" value={exp.years} onChange={(e) => handleExpChange(idx, 'years', e.target.value, false)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <div className="md:col-span-4"><input placeholder="Designation" value={exp.designation} onChange={(e) => handleExpChange(idx, 'designation', e.target.value, false)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <div className="md:col-span-3"><input placeholder="Company" value={exp.place} onChange={(e) => handleExpChange(idx, 'place', e.target.value, false)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <button onClick={() => removeExp(idx, false)} className="md:col-span-1 text-red-500 flex justify-end"><Trash2 className="w-4 h-4" /></button>
                 </div>
                 <textarea 
                    placeholder="Optional: Manual Job Details. If you write here, AI will use THIS EXACT text instead of generating responsibilities." 
                    value={exp.details || ''} 
                    onChange={(e) => handleExpChange(idx, 'details', e.target.value, false)}
                    className="w-full bg-slate-900/50 text-xs text-slate-300 p-2 rounded border border-white/5 focus:border-[#00f3ff] outline-none h-20 resize-none"
                  />
              </div>
            ))}
           </div>
        </section>

         {/* 4. Experience (Abroad) */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl">
           <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-white flex gap-2"><Globe className="text-[#FFD700]"/> Experience (Abroad)</h3><button onClick={() => addExp(true)}><Plus className="text-[#FFD700]"/></button></div>
           <div className="space-y-4">
            {abroadExperience.map((exp, idx) => (
              <div key={idx} className="bg-black/20 p-4 rounded-xl space-y-3">
                 <div className="grid grid-cols-1 md:grid-cols-9 gap-3">
                    <div className="md:col-span-1"><input placeholder="Yrs" value={exp.years} onChange={(e) => handleExpChange(idx, 'years', e.target.value, true)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <div className="md:col-span-4"><input placeholder="Designation" value={exp.designation} onChange={(e) => handleExpChange(idx, 'designation', e.target.value, true)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <div className="md:col-span-3"><input placeholder="Company" value={exp.place} onChange={(e) => handleExpChange(idx, 'place', e.target.value, true)} className="w-full bg-transparent border-b border-white/10 text-white p-2" /></div>
                    <button onClick={() => removeExp(idx, true)} className="md:col-span-1 text-red-500 flex justify-end"><Trash2 className="w-4 h-4" /></button>
                 </div>
                 <textarea 
                    placeholder="Optional: Manual Job Details. If you write here, AI will use THIS EXACT text." 
                    value={exp.details || ''} 
                    onChange={(e) => handleExpChange(idx, 'details', e.target.value, true)}
                    className="w-full bg-slate-900/50 text-xs text-slate-300 p-2 rounded border border-white/5 focus:border-[#FFD700] outline-none h-20 resize-none"
                  />
              </div>
            ))}
           </div>
        </section>
      </div>

      {/* RIGHT: Live Preview & Action */}
      <div className="w-full xl:w-[600px] flex-shrink-0 flex flex-col gap-6 sticky top-24 h-fit">
        
        {/* Action Panel */}
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
             <button 
                onClick={() => generateCV()}
                disabled={isGenerating || !jobRole}
                className="w-full py-4 bg-[#00f3ff] hover:bg-[#00c2cc] text-black font-extrabold text-xl rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2"
             >
                {isGenerating ? <div className="animate-spin w-5 h-5 border-2 border-black rounded-full border-t-transparent"/> : <Zap className="w-6 h-6 fill-black"/>}
                GENERATE CV
             </button>

             {previewHtml && (
                 <>
                    <div className="flex gap-3">
                         <button onClick={handleShuffle} disabled={isGenerating} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                             <Layout className="w-5 h-5" /> Shuffle Layout
                         </button>
                         <button onClick={handleDownloadPdf} className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">
                             <Download className="w-5 h-5" /> Download PDF
                         </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                        <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">AI Refinement / Corrections</label>
                        <div className="flex gap-2">
                            <input 
                                value={userSuggestion}
                                onChange={(e) => setUserSuggestion(e.target.value)}
                                placeholder="e.g. Change header to blue, fix spelling..."
                                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#00f3ff] outline-none"
                            />
                            <button onClick={handleRefine} disabled={isGenerating || !userSuggestion} className="p-2 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] rounded-lg">
                                <Sparkles className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                 </>
             )}
        </div>

        {/* Live Preview Container with Advanced Scaling & Controls */}
        <div 
          ref={previewContainerRef}
          className="w-full bg-[#0a0f1e] rounded-xl shadow-2xl overflow-hidden relative border-4 border-[#0f172a] aspect-[210/297] group"
          onWheel={handleWheel}
          onMouseDown={startPan}
          onMouseMove={doPan}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
             {/* Interactive Controls Overlay */}
             {previewHtml && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                    <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.2))} className="p-2 text-white hover:bg-white/10 rounded" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.2))} className="p-2 text-white hover:bg-white/10 rounded" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={resetView} className="p-2 text-white hover:bg-white/10 rounded" title="Reset View"><Maximize2 className="w-4 h-4" /></button>
                </div>
             )}

             {previewHtml ? (
                 <div 
                    className="w-full h-full flex items-center justify-center bg-[#2c2f36]"
                 >
                     <div
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${baseScale * zoomLevel})`,
                            transformOrigin: 'center',
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                        }}
                     >
                        <iframe 
                            srcDoc={previewHtml}
                            className="border-none bg-white pointer-events-none" // pointer-events-none to allow drag on top
                            title="CV Preview"
                            style={{ 
                                width: '210mm', 
                                height: '297mm',
                                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                            }} 
                        />
                     </div>
                 </div>
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900/50 relative overflow-hidden pointer-events-none">
                     {/* Background Grid */}
                     <div className="absolute inset-0 opacity-10" 
                          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                     />
                     
                     {/* Skeleton Screen Loading State */}
                     {isGenerating ? (
                        <div className="w-[80%] h-[90%] bg-white rounded-lg shadow-2xl overflow-hidden relative flex flex-col p-6 animate-pop-in">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent z-10 animate-[shimmer_1.5s_infinite] translate-x-[-100%]"></div>
                            
                            {/* Skeleton Layout */}
                            <div className="flex gap-4 mb-6 border-b pb-6 border-slate-100">
                                <div className="w-20 h-20 bg-slate-100 rounded-full shrink-0"></div>
                                <div className="flex-1 flex flex-col justify-center gap-3">
                                    <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                                    <div className="h-2 bg-slate-100 rounded w-full"></div>
                                    <div className="h-2 bg-slate-100 rounded w-full"></div>
                                    <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                                </div>
                                
                                <div className="flex gap-6 mt-8">
                                    <div className="w-1/3 space-y-3">
                                        <div className="h-32 bg-slate-100 rounded"></div>
                                    </div>
                                    <div className="w-2/3 space-y-3">
                                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        <div className="h-2 bg-slate-100 rounded w-11/12"></div>
                                        <div className="h-2 bg-slate-100 rounded w-full"></div>
                                        <div className="mt-4 h-4 bg-slate-100 rounded w-full"></div>
                                        <div className="h-2 bg-slate-100 rounded w-10/12"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-6 left-6 flex items-center gap-2 text-[#00f3ff] text-xs font-bold tracking-widest z-20">
                                <Loader2 className="w-3 h-3 animate-spin" /> AI ARCHITECTING CV...
                            </div>
                        </div>
                     ) : (
                        // Empty State
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-4 relative group">
                                <div className="absolute inset-0 bg-[#00f3ff] blur-2xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                                <Layout className="w-16 h-16 text-slate-500 relative z-10" />
                            </div>
                            <p className="text-lg font-bold text-slate-500">Waiting for Input</p>
                            {isTyping && (
                                <div className="flex gap-1 mt-2 text-[#00f3ff] text-xs font-bold">
                                    GATHERING DATA...
                                </div>
                            )}
                        </div>
                     )}
                 </div>
             )}
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};