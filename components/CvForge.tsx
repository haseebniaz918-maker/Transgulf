import React, { useState } from 'react';
import { FileText, Plus, Trash2, Zap, Briefcase, GraduationCap, User, Globe, Download, Camera, Image as ImageIcon, Sparkles, LayoutTemplate, CheckCircle2, Target } from 'lucide-react';
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

// Moved outside to prevent re-rendering/focus loss
const InputField = ({ label, name, value, onChange, type = "text", placeholder }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="bg-slate-900/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#00f3ff] focus:outline-none transition-colors"
      placeholder={placeholder || `Enter ${label}`}
    />
  </div>
);

export const CvForge: React.FC = () => {
  const [jobRole, setJobRole] = useState(''); // New State for Target Job
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
              const base64 = await helperFileToBase64(file);
              const processedImage = await generateIdentityPhoto(base64, file.type);
              setEnhancedPhotoBase64(processedImage);
          } catch (err) {
              console.error("Photo processing failed", err);
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
      const cleanExperience = experience.filter(e => e.designation); 
      const cleanAbroad = abroadExperience.filter(e => e.designation);
      
      const randomLayoutId = Math.floor(Math.random() * 100) + 1;
      
      const payload = {
        jobRole, // Passing the job role
        personalInfo,
        photoBase64: enhancedPhotoBase64,
        education: education.filter(e => e.degree),
        experience: cleanExperience,
        abroadExperience: cleanAbroad,
        layoutId: randomLayoutId,
        seed: Date.now() 
      };

      const htmlContent = await generateCvHtml(payload);

      // Create hidden element for html2pdf
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      
      // STRICT DIMENSIONS TO PREVENT PAGE 2
      element.style.width = '210mm'; 
      element.style.height = '296.5mm'; // Slightly less than 297 to avoid overflow trigger
      element.style.maxHeight = '296.5mm';
      element.style.padding = '0';
      element.style.margin = '0';
      element.style.overflow = 'hidden'; // Clip content
      element.style.background = 'white';
      element.style.color = 'black'; 
      document.body.appendChild(element);

      const opt = {
        margin: 0,
        filename: `${personalInfo.name.replace(/\s+/g, '_') || 'CV'}_Professional.pdf`,
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
            <FileText className="text-[#00f3ff]" /> CV FORGE <span className="text-xs bg-[#00f3ff] text-black px-2 py-0.5 rounded font-bold">MASTER CLASS</span>
          </h1>
          <p className="text-slate-400 mt-2">Enter your details. AI will auto-write your Objective, Responsibilities, and Skills based on the target post.</p>
        </div>

        {/* 0. Job Role (Target) */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden border-l-4 border-l-[#00f3ff]">
           <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-[#00f3ff]" />
              <h3 className="text-xl font-bold text-white">Target Position</h3>
           </div>
           <p className="text-sm text-slate-400 mb-4">What job are you applying for? AI will tailor the CV content to this role.</p>
           <input 
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Senior Civil Engineer, Crane Operator, Accountant..."
              className="w-full bg-slate-900 border border-white/20 rounded-xl p-4 text-lg text-white font-bold focus:border-[#00f3ff] focus:outline-none focus:shadow-[0_0_20px_rgba(0,243,255,0.2)] transition-all placeholder-slate-600"
           />
        </section>

        {/* 1. Personal Info & Photo */}
        <section className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6">
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
                  </div>
              </div>

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

        {/* 3. Experience */}
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
                    <input placeholder="Designation" value={exp.designation} onChange={(e) => handleExpChange(idx, 'designation', e.target.value, false)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
                 </div>
                 <div className="md:col-span-3">
                    <input placeholder="Company" value={exp.place} onChange={(e) => handleExpChange(idx, 'place', e.target.value, false)} className="w-full bg-transparent border-b border-white/10 focus:border-[#00f3ff] outline-none py-2 text-sm text-white placeholder-slate-600" />
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
          
           <button 
              onClick={handleGenerate}
              disabled={isGenerating || !personalInfo.name || !jobRole}
              className="w-full py-6 bg-gradient-to-r from-[#00f3ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xl rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
           >
              <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {isGenerating ? (
                  <>
                     <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                     <span className="relative z-10">Generative AI Processing...</span>
                  </>
              ) : (
                  <>
                     <Zap className="w-6 h-6 fill-black relative z-10" />
                     <span className="relative z-10">GENERATE CV</span>
                  </>
              )}
           </button>
           
           {!jobRole && (
               <p className="text-red-400 text-xs text-center animate-pulse">Please enter "Target Position" to enable generation.</p>
           )}

           <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f3ff] via-[#ff00ff] to-[#00f3ff] animate-gradient-x"></div>
              
              <div className="p-6 bg-black/40 border-b border-white/5">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   AI Data Stream
                </h4>
              </div>

              <div className="p-6 font-mono text-sm space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 {jobRole && (
                     <div className="flex gap-2 items-center text-[#00f3ff]">
                         <Target className="w-4 h-4" />
                         <span>Target: {jobRole}</span>
                     </div>
                 )}
                 {enhancedPhotoBase64 && (
                     <div className="flex gap-4 items-center border-b border-white/5 pb-4">
                         <img src={`data:image/jpeg;base64,${enhancedPhotoBase64}`} className="w-12 h-16 object-cover rounded border border-white/20" />
                         <span className="text-xs text-green-400">Photo Enhanced</span>
                     </div>
                 )}
                 <div className="space-y-2">
                    {Object.entries(personalInfo).map(([key, val]) => (
                        val && (
                            <div key={key} className="flex gap-2 break-all">
                                <span className="text-slate-500 capitalize min-w-[120px]">{key.replace(/([A-Z])/g, ' $1').trim()} :</span>
                                <span className="text-white">{val}</span>
                            </div>
                        )
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};