import React, { useState } from 'react';
import { FileText, Plus, Trash2, Zap, Briefcase, GraduationCap, User, Globe, Download, Camera, Image as ImageIcon, Sparkles, LayoutTemplate, CheckCircle2 } from 'lucide-react';
import { generateCvHtml, generateIdentityPhoto, helperFileToBase64 } from '../services/geminiService';

interface Education {
  degree: string;
  school: string;
  yearFrom: string;
  yearTo: string;
}

interface Experience {
  years: string;
  place: string;
  designation: string;
}

interface TemplateOption {
    id: string;
    name: string;
    description: string;
    color: string;
    preview: React.ReactNode;
}

const TEMPLATES: TemplateOption[] = [
    // --- ORIGINAL 6 ---
    {
        id: 'classic-harvard',
        name: 'The Harvard',
        description: 'Timeless Serif, Black & White',
        color: '#ffffff',
        preview: (
            <div className="w-full h-full bg-white text-black p-2 flex flex-col gap-1 font-serif">
                <div className="w-full text-center border-b border-black pb-1">
                    <div className="h-2 w-1/2 bg-black mx-auto mb-1"></div>
                    <div className="h-1 w-1/3 bg-gray-400 mx-auto"></div>
                </div>
                <div className="flex-1 flex flex-col gap-1 mt-1">
                    <div className="h-1 w-full bg-gray-200"></div>
                    <div className="h-1 w-3/4 bg-gray-200"></div>
                    <div className="h-1 w-full bg-gray-200"></div>
                </div>
            </div>
        )
    },
    {
        id: 'modern-silicon',
        name: 'Silicon Valley',
        description: 'Blue Accents, Clean Sans-Serif',
        color: '#2563eb',
        preview: (
            <div className="w-full h-full bg-white flex">
                <div className="w-1/3 bg-slate-100 h-full p-1 flex flex-col gap-1 border-r border-slate-200">
                     <div className="w-6 h-6 rounded-full bg-blue-500 mx-auto"></div>
                     <div className="w-full h-1 bg-gray-300 mt-2"></div>
                     <div className="w-full h-1 bg-gray-300"></div>
                </div>
                <div className="w-2/3 p-1 flex flex-col gap-1">
                     <div className="w-1/2 h-2 bg-black mb-2"></div>
                     <div className="w-full h-1 bg-gray-200"></div>
                     <div className="w-full h-1 bg-gray-200"></div>
                </div>
            </div>
        )
    },
    {
        id: 'executive-slate',
        name: 'Executive Slate',
        description: 'Corporate Grey, Authoritative',
        color: '#334155',
        preview: (
            <div className="w-full h-full bg-white flex flex-col">
                <div className="w-full h-1/4 bg-slate-700 p-1 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white/20"></div>
                    <div className="ml-2 w-1/2 h-2 bg-white/50"></div>
                </div>
                <div className="flex-1 p-1 flex gap-1">
                     <div className="w-2/3 h-full bg-gray-50 p-1">
                        <div className="w-full h-1 bg-gray-300 mb-1"></div>
                        <div className="w-full h-1 bg-gray-300"></div>
                     </div>
                     <div className="w-1/3 h-full">
                         <div className="w-full h-1 bg-slate-200"></div>
                     </div>
                </div>
            </div>
        )
    },
    {
        id: 'euro-minimalist',
        name: 'Euro Minimalist',
        description: 'Helvetica, Bold Grid, Airy',
        color: '#000000',
        preview: (
            <div className="w-full h-full bg-white p-2">
                 <div className="grid grid-cols-2 gap-2 h-full">
                     <div className="col-span-2 h-4 border-b-2 border-black mb-1"></div>
                     <div className="h-full border-r border-gray-200 pr-1">
                         <div className="w-full h-2 bg-black mb-2"></div>
                         <div className="w-full h-1 bg-gray-400"></div>
                     </div>
                     <div className="h-full pl-1">
                         <div className="w-full h-1 bg-gray-200 mb-1"></div>
                         <div className="w-full h-1 bg-gray-200"></div>
                     </div>
                 </div>
            </div>
        )
    },
    {
        id: 'creative-dark',
        name: 'Creative Dark',
        description: 'Dark Mode, Gold/Teal Accents',
        color: '#1a202c',
        preview: (
            <div className="w-full h-full bg-slate-900 p-2 flex flex-col gap-1">
                 <div className="flex items-center gap-2 border-b border-white/20 pb-1">
                     <div className="w-6 h-6 rounded-lg bg-teal-400"></div>
                     <div className="w-1/2 h-2 bg-white"></div>
                 </div>
                 <div className="flex-1 grid grid-cols-2 gap-2 mt-1">
                     <div className="bg-white/5 h-full rounded"></div>
                     <div className="bg-white/5 h-full rounded"></div>
                 </div>
            </div>
        )
    },
    {
        id: 'startup-vibrant',
        name: 'Startup Vibrant',
        description: 'Gradient Header, Modern Layout',
        color: '#8b5cf6',
        preview: (
            <div className="w-full h-full bg-white flex flex-col">
                 <div className="h-1/3 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 p-1">
                     <div className="w-8 h-8 rounded-full bg-white mx-auto mt-1"></div>
                 </div>
                 <div className="flex-1 p-1 flex justify-between">
                     <div className="w-1/4 h-full bg-gray-50"></div>
                     <div className="w-2/3 h-full flex flex-col gap-1">
                         <div className="w-full h-1 bg-gray-200"></div>
                         <div className="w-full h-1 bg-gray-200"></div>
                     </div>
                 </div>
            </div>
        )
    },

    // --- NEW 6 TEMPLATES ---

    {
        id: 'global-executive',
        name: 'Global Executive',
        description: 'C-Suite, Navy & Gold, Dense',
        color: '#0f172a',
        preview: (
            <div className="w-full h-full bg-white flex flex-col">
                <div className="w-full h-1/4 bg-slate-900 p-1 flex flex-col justify-center items-center border-b-2 border-yellow-600">
                    <div className="w-1/2 h-2 bg-white mb-1"></div>
                    <div className="w-1/3 h-1 bg-yellow-600"></div>
                </div>
                <div className="flex-1 flex">
                     <div className="w-2/3 h-full p-1 border-r border-gray-200">
                         <div className="w-full h-1 bg-gray-300 mb-1"></div>
                         <div className="w-full h-1 bg-gray-300 mb-1"></div>
                     </div>
                     <div className="w-1/3 h-full bg-slate-50 p-1">
                         <div className="w-full h-1 bg-gray-400"></div>
                     </div>
                </div>
            </div>
        )
    },
    {
        id: 'legal-professional',
        name: 'Legal Professional',
        description: 'Strict Formal, Single Column',
        color: '#000000',
        preview: (
            <div className="w-full h-full bg-white p-2 font-serif">
                 <div className="w-full text-center mb-2">
                     <div className="w-1/2 h-2 bg-black mx-auto"></div>
                 </div>
                 <div className="w-full h-px bg-black mb-1"></div>
                 <div className="space-y-1">
                     <div className="w-1/4 h-1 bg-black"></div>
                     <div className="w-full h-1 bg-gray-300"></div>
                     <div className="w-full h-1 bg-gray-300"></div>
                     <div className="w-1/4 h-1 bg-black mt-2"></div>
                     <div className="w-full h-1 bg-gray-300"></div>
                 </div>
            </div>
        )
    },
    {
        id: 'tech-modern',
        name: 'Tech / Developer',
        description: 'Monospace, Emerald, Grid',
        color: '#10b981',
        preview: (
            <div className="w-full h-full bg-white p-2 font-mono">
                 <div className="flex justify-between items-center mb-2 border-b-2 border-emerald-500 pb-1">
                     <div className="w-1/3 h-2 bg-black"></div>
                     <div className="w-4 h-4 rounded bg-emerald-500"></div>
                 </div>
                 <div className="grid grid-cols-2 gap-1">
                     <div className="col-span-2 h-8 bg-gray-100 mb-1"></div>
                     <div className="h-10 bg-gray-50 border border-gray-200"></div>
                     <div className="h-10 bg-gray-50 border border-gray-200"></div>
                 </div>
            </div>
        )
    },
    {
        id: 'nordic-clean',
        name: 'Nordic Clean',
        description: 'Minimal, Soft Grey, Circle Photo',
        color: '#94a3b8',
        preview: (
            <div className="w-full h-full bg-white p-2 flex gap-2">
                 <div className="w-1/3 flex flex-col items-center pt-2">
                     <div className="w-10 h-10 rounded-full bg-gray-200 mb-2"></div>
                     <div className="w-full h-1 bg-gray-300"></div>
                 </div>
                 <div className="w-2/3 pt-4">
                     <div className="w-3/4 h-3 bg-black mb-2"></div>
                     <div className="w-full h-1 bg-gray-200 mb-1"></div>
                     <div className="w-full h-1 bg-gray-200 mb-1"></div>
                     <div className="w-full h-1 bg-gray-200"></div>
                 </div>
            </div>
        )
    },
    {
        id: 'creative-portfolio',
        name: 'Creative Portfolio',
        description: 'Bold Type, 50/50 Split Header',
        color: '#f43f5e',
        preview: (
            <div className="w-full h-full bg-white flex flex-col">
                 <div className="h-1/3 w-full flex">
                     <div className="w-1/2 bg-black text-white flex items-center justify-center p-1">
                         <div className="w-full h-2 bg-white"></div>
                     </div>
                     <div className="w-1/2 bg-rose-500"></div>
                 </div>
                 <div className="flex-1 p-2 grid grid-cols-2 gap-2">
                      <div className="w-full h-1 bg-gray-300"></div>
                      <div className="w-full h-1 bg-gray-300"></div>
                      <div className="w-full h-1 bg-gray-300"></div>
                      <div className="w-full h-1 bg-gray-300"></div>
                 </div>
            </div>
        )
    },
    {
        id: 'medical-fellow',
        name: 'Medical / Academic',
        description: 'Clinical Blue, Left Bar Header',
        color: '#0284c7',
        preview: (
            <div className="w-full h-full bg-white flex flex-col">
                 <div className="flex h-1/4 border-b border-gray-300">
                      <div className="w-4 h-full bg-sky-600"></div>
                      <div className="flex-1 p-2 flex flex-col justify-center">
                          <div className="w-3/4 h-2 bg-black mb-1"></div>
                          <div className="w-1/2 h-1 bg-gray-400"></div>
                      </div>
                 </div>
                 <div className="flex-1 p-2">
                      <div className="w-full h-1 bg-gray-300 mb-1"></div>
                      <div className="w-full h-1 bg-gray-300 mb-1"></div>
                      <div className="w-3/4 h-1 bg-gray-300"></div>
                 </div>
            </div>
        )
    }
];

// Moved outside to prevent re-rendering/focus loss
const InputField = ({ label, name, value, onChange, type = "text" }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="bg-slate-900/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#00f3ff] focus:outline-none transition-colors"
      placeholder={`Enter ${label}`}
    />
  </div>
);

export const CvForge: React.FC = () => {
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    fatherName: '',
    religion: '',
    nationality: '',
    dob: '',
    cnic: '',
    passportNo: '',
    placeOfBirth: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    maritalStatus: '',
    address: '',
    phone: '',
    email: ''
  });

  const [education, setEducation] = useState<Education[]>([
    { degree: '', school: '', yearFrom: '', yearTo: '' }
  ]);

  const [experience, setExperience] = useState<Experience[]>([
    { years: '', place: '', designation: '' }
  ]);

  const [abroadExperience, setAbroadExperience] = useState<Experience[]>([
    { years: '', place: '', designation: '' }
  ]);

  const [photo, setPhoto] = useState<File | null>(null);
  const [enhancedPhotoBase64, setEnhancedPhotoBase64] = useState<string | null>(null);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic-harvard');

  // --- Handlers ---
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEduChange = (index: number, field: keyof Education, value: string) => {
    setEducation(prev => {
      const newEdu = [...prev];
      newEdu[index][field] = value;
      return newEdu;
    });
  };

  const handleExpChange = (index: number, field: keyof Experience, value: string, isAbroad: boolean) => {
    if (isAbroad) {
      setAbroadExperience(prev => {
        const newExp = [...prev];
        newExp[index][field] = value;
        return newExp;
      });
    } else {
      setExperience(prev => {
        const newExp = [...prev];
        newExp[index][field] = value;
        return newExp;
      });
    }
  };

  const addEdu = () => setEducation(prev => [...prev, { degree: '', school: '', yearFrom: '', yearTo: '' }]);
  const removeEdu = (index: number) => setEducation(prev => prev.filter((_, i) => i !== index));

  const addExp = (isAbroad: boolean) => {
    const emptyItem = { years: '', place: '', designation: '' };
    isAbroad 
      ? setAbroadExperience(prev => [...prev, emptyItem])
      : setExperience(prev => [...prev, emptyItem]);
  };

  const removeExp = (index: number, isAbroad: boolean) => {
    if (isAbroad) {
      setAbroadExperience(prev => prev.filter((_, i) => i !== index));
    } else {
      setExperience(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setPhoto(file);
          setIsPhotoProcessing(true);
          
          try {
              // Pre-process photo with AI
              const base64 = await helperFileToBase64(file);
              const processedImage = await generateIdentityPhoto(base64, file.type);
              setEnhancedPhotoBase64(processedImage);
          } catch (err) {
              console.error("Photo processing failed", err);
              // Fallback to original if AI fails
              const base64 = await helperFileToBase64(file);
              setEnhancedPhotoBase64(base64);
          } finally {
              setIsPhotoProcessing(false);
          }
      }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Filter out empty entries
      const cleanExperience = experience.filter(e => e.designation); 
      const cleanAbroad = abroadExperience.filter(e => e.designation);
      
      const payload = {
        personalInfo,
        photoBase64: enhancedPhotoBase64,
        education: education.filter(e => e.degree),
        experience: cleanExperience,
        abroadExperience: cleanAbroad,
        templateId: selectedTemplate,
        seed: Date.now() // Pass timestamp to ensure uniqueness
      };

      const htmlContent = await generateCvHtml(payload);

      // Create hidden element for html2pdf
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      // Strict constraints for single page
      // Reduced height to 292mm to prevent browser overflow triggering a 2nd page
      element.style.width = '210mm'; 
      element.style.height = '292mm'; 
      element.style.overflow = 'hidden';
      element.style.padding = '0';
      element.style.background = 'white';
      document.body.appendChild(element);

      const opt = {
        margin: 0,
        filename: `${personalInfo.name || 'CV'}_Professional.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if ((window as any).html2pdf) {
        await (window as any).html2pdf().set(opt).from(element).save();
      }
      
      document.body.removeChild(element);
    } catch (e) {
      console.error(e);
      alert("Failed to generate CV. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to format experience string
  const formatExpString = (exp: Experience) => {
    if (!exp.designation) return "---";
    const yrs = exp.years ? `${exp.years} Years` : 'Unknown duration';
    const pl = exp.place ? `in ${exp.place}` : '';
    return `${yrs} Experience as a ${exp.designation} ${pl}`;
  };

  return (
    <div className="p-6 md:p-12 w-full max-w-[1600px] mx-auto animate-fade-in flex flex-col lg:flex-row gap-8">
      
      {/* LEFT: Input Form */}
      <div className="flex-1 space-y-8 pb-20">
        <div className="mb-6">
          <h1 className="text-4xl font-display font-bold text-white flex items-center gap-3">
            <FileText className="text-[#00f3ff]" /> CV FORGE
          </h1>
          <p className="text-slate-400 mt-2">Enter your details. Our AI will enhance your photo, auto-generate content, and create a unique single-page design every time.</p>
        </div>

        {/* 1. Personal Info & Photo */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6">
              {/* Photo Upload Area */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="w-32 h-40 border-2 border-dashed border-white/20 rounded-xl overflow-hidden bg-black/30 relative group">
                      {enhancedPhotoBase64 ? (
                          <img src={`data:image/jpeg;base64,${enhancedPhotoBase64}`} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                             <User className="w-10 h-10" />
                          </div>
                      )}
                      
                      {isPhotoProcessing && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-[#00f3ff] text-xs font-bold animate-pulse">
                              <Sparkles className="w-6 h-6 mb-1" />
                              ENHANCING...
                          </div>
                      )}

                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoUpload} />
                      
                      <div className="absolute bottom-0 left-0 w-full bg-black/60 py-1 text-[10px] text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          Upload Photo
                      </div>
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-[120px] text-center">AI will auto-edit to suit/tie & white bg.</p>
              </div>

              {/* Text Fields */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                    <User className="w-5 h-5 text-[#00f3ff]" />
                    <h3 className="text-lg font-bold text-white">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Name" name="name" value={personalInfo.name} onChange={handleInfoChange} />
                    <InputField label="Father Name" name="fatherName" value={personalInfo.fatherName} onChange={handleInfoChange} />
                    <InputField label="Religion" name="religion" value={personalInfo.religion} onChange={handleInfoChange} />
                    <InputField label="Nationality" name="nationality" value={personalInfo.nationality} onChange={handleInfoChange} />
                    <InputField label="Date of Birth" name="dob" value={personalInfo.dob} onChange={handleInfoChange} type="date" />
                    <InputField label="CNIC No" name="cnic" value={personalInfo.cnic} onChange={handleInfoChange} />
                    <InputField label="Passport No" name="passportNo" value={personalInfo.passportNo} onChange={handleInfoChange} />
                    <InputField label="Place of Birth" name="placeOfBirth" value={personalInfo.placeOfBirth} onChange={handleInfoChange} />
                    <InputField label="Passport Issue Date" name="passportIssueDate" value={personalInfo.passportIssueDate} onChange={handleInfoChange} type="date" />
                    <InputField label="Passport Expiry Date" name="passportExpiryDate" value={personalInfo.passportExpiryDate} onChange={handleInfoChange} type="date" />
                    <InputField label="Marital Status" name="maritalStatus" value={personalInfo.maritalStatus} onChange={handleInfoChange} />
                    <InputField label="Phone Number" name="phone" value={personalInfo.phone} onChange={handleInfoChange} />
                    <div className="md:col-span-2">
                        <InputField label="Email" name="email" value={personalInfo.email} onChange={handleInfoChange} type="email" />
                    </div>
                    <div className="md:col-span-2">
                         <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Address</label>
                            <input
                            name="address"
                            value={personalInfo.address}
                            onChange={handleInfoChange}
                            className="bg-slate-900/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#00f3ff] focus:outline-none transition-colors"
                            placeholder="Full Residential Address"
                            />
                        </div>
                    </div>
                </div>
              </div>
          </div>
        </section>

        {/* 2. Education */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#00f3ff]" />
              <h3 className="text-lg font-bold text-white">Education</h3>
            </div>
            <button onClick={addEdu} className="p-2 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {education.map((edu, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-9 gap-3 items-end bg-black/20 p-4 rounded-xl">
                <div className="md:col-span-3">
                    <input placeholder="Degree Name" value={edu.degree} onChange={(e) => handleEduChange(idx, 'degree', e.target.value)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
                </div>
                <div className="md:col-span-3">
                    <input placeholder="School/University" value={edu.school} onChange={(e) => handleEduChange(idx, 'school', e.target.value)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
                </div>
                <div className="md:col-span-1">
                    <input placeholder="From" value={edu.yearFrom} onChange={(e) => handleEduChange(idx, 'yearFrom', e.target.value)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
                </div>
                <div className="md:col-span-1">
                    <input placeholder="To" value={edu.yearTo} onChange={(e) => handleEduChange(idx, 'yearTo', e.target.value)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
                </div>
                <div className="md:col-span-1 flex justify-end">
                    <button onClick={() => removeEdu(idx)} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Experience (Domestic) */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl">
           <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#00f3ff]" />
              <h3 className="text-lg font-bold text-white">Experience (Local)</h3>
            </div>
            <button onClick={() => addExp(false)} className="p-2 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-9 gap-3 items-end bg-black/20 p-4 rounded-xl">
                 <div className="md:col-span-1">
                    <input type="number" placeholder="Yrs" value={exp.years} onChange={(e) => handleExpChange(idx, 'years', e.target.value, false)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
                 </div>
                 <div className="md:col-span-4">
                    <input placeholder="Designation (e.g. Plumber)" value={exp.designation} onChange={(e) => handleExpChange(idx, 'designation', e.target.value, false)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
                 </div>
                 <div className="md:col-span-3">
                    <input placeholder="Place/Company" value={exp.place} onChange={(e) => handleExpChange(idx, 'place', e.target.value, false)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
                 </div>
                 <div className="md:col-span-1 flex justify-end">
                    <button onClick={() => removeExp(idx, false)} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

         {/* 4. Experience (Abroad) */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl">
           <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#FFD700]" />
              <h3 className="text-lg font-bold text-white">Experience (Abroad)</h3>
            </div>
            <button onClick={() => addExp(true)} className="p-2 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {abroadExperience.map((exp, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-9 gap-3 items-end bg-black/20 p-4 rounded-xl">
                 <div className="md:col-span-1">
                    <input type="number" placeholder="Yrs" value={exp.years} onChange={(e) => handleExpChange(idx, 'years', e.target.value, true)} className="w-full bg-transparent border-b border-white/10 focus:border-[#FFD700] outline-none py-2 text-sm text-white placeholder-slate-600" />
                 </div>
                 <div className="md:col-span-4">
                    <input placeholder="Designation" value={exp.designation} onChange={(e) => handleExpChange(idx, 'designation', e.target.value, true)} className="w-full bg-transparent border-b border-white/10 focus:border-[#FFD700] outline-none py-2 text-sm text-white placeholder-slate-600" />
                 </div>
                 <div className="md:col-span-3">
                    <input placeholder="Country/Company" value={exp.place} onChange={(e) => handleExpChange(idx, 'place', e.target.value, true)} className="w-full bg-transparent border-b border-white/10 focus:border-[#FFD700] outline-none py-2 text-sm text-white placeholder-slate-600" />
                 </div>
                 <div className="md:col-span-1 flex justify-end">
                    <button onClick={() => removeExp(idx, true)} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* RIGHT: Live Preview & Action */}
      <div className="w-full lg:w-[450px] flex-shrink-0">
        <div className="sticky top-24 space-y-6">
          
          {/* Template Selector (New) */}
           <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 bg-black/40 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-[#00f3ff]" />
                  <span className="text-sm font-bold text-white">Select Premium Template</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {TEMPLATES.map(tpl => (
                      <div 
                         key={tpl.id}
                         onClick={() => setSelectedTemplate(tpl.id)}
                         className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all duration-300 relative group hover:scale-[1.02] ${
                             selectedTemplate === tpl.id 
                             ? 'border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.3)] ring-1 ring-[#00f3ff]' 
                             : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                         }`}
                      >
                          {/* Mini Preview Rendering */}
                          <div className="h-24 w-full pointer-events-none">
                              {tpl.preview}
                          </div>
                          
                          {/* Label */}
                          <div className="p-2 bg-slate-900/90 border-t border-white/5">
                              <p className="text-[10px] font-bold text-white truncate">{tpl.name}</p>
                              <p className="text-[9px] text-slate-400 truncate">{tpl.description}</p>
                          </div>

                          {/* Checkmark */}
                          {selectedTemplate === tpl.id && (
                              <div className="absolute top-1 right-1 bg-[#00f3ff] text-black rounded-full p-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                              </div>
                          )}
                      </div>
                  ))}
              </div>
              <div className="p-2 text-center bg-black/20 text-[10px] text-slate-500 border-t border-white/5">
                  AI generates unique variations for every template style.
              </div>
           </div>

          {/* Action Button */}
           <button 
              onClick={handleGenerate}
              disabled={isGenerating || !personalInfo.name}
              className="w-full py-4 bg-gradient-to-r from-[#00f3ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
           >
              {isGenerating ? (
                  <>
                     <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                     <span>AI Architecting...</span>
                  </>
              ) : (
                  <>
                     <Zap className="w-5 h-5 fill-black" />
                     <span>Generate Unique CV</span>
                  </>
              )}
           </button>

           {/* Live Preview Card */}
           <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f3ff] via-[#ff00ff] to-[#00f3ff] animate-gradient-x"></div>
              
              <div className="p-6 bg-black/40 border-b border-white/5">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   Live Data Stream
                </h4>
              </div>

              <div className="p-6 font-mono text-sm space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 {enhancedPhotoBase64 && (
                     <div className="flex gap-4 items-center border-b border-white/5 pb-4">
                         <img src={`data:image/jpeg;base64,${enhancedPhotoBase64}`} className="w-12 h-16 object-cover rounded border border-white/20" />
                         <span className="text-xs text-green-400">Photo Enhanced & Ready</span>
                     </div>
                 )}
                 
                 {/* Personal Info Dump */}
                 <div className="space-y-2">
                    {Object.entries(personalInfo).map(([key, val]) => (
                        val && (
                            <div key={key} className="flex gap-2 break-all">
                                <span className="text-slate-500 capitalize min-w-[120px]">{key.replace(/([A-Z])/g, ' $1').trim()} :</span>
                                <span className="text-[#00f3ff]">{val}</span>
                            </div>
                        )
                    ))}
                 </div>

                 {/* Edu Dump */}
                 {education.some(e => e.degree) && (
                     <div className="pt-4 border-t border-white/5">
                         <h5 className="text-white font-bold mb-2">Education</h5>
                         {education.map((e, i) => e.degree && (
                             <div key={i} className="mb-2 text-slate-300 pl-4 border-l-2 border-white/10">
                                 <div>{e.degree}</div>
                                 <div className="text-xs text-slate-500">{e.school} ({e.yearFrom}-{e.yearTo})</div>
                             </div>
                         ))}
                     </div>
                 )}

                 {/* Exp Dump */}
                 {(experience.some(e => e.designation) || abroadExperience.some(e => e.designation)) && (
                     <div className="pt-4 border-t border-white/5">
                         <h5 className="text-white font-bold mb-2">Experience Lines</h5>
                         {experience.map((e, i) => e.designation && (
                             <div key={i} className="mb-2 text-[#ff00ff] text-xs leading-relaxed">
                                 {formatExpString(e)}
                             </div>
                         ))}
                          {abroadExperience.map((e, i) => e.designation && (
                             <div key={i} className="mb-2 text-[#FFD700] text-xs leading-relaxed">
                                 {formatExpString(e)} (Abroad)
                             </div>
                         ))}
                     </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};