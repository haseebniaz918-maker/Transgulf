import React, { useState, useRef } from 'react';
import { 
  Zap, Target, Layout, Loader2, Plus, Trash2, Shuffle, 
  Upload, Download, User, Briefcase, GraduationCap, FileText, Check, 
  RefreshCw, Sparkles, Wand2
} from 'lucide-react';
import { generateCvHtml, helperFileToBase64 } from '../services/geminiService';

const InputField = ({ label, name, value, onChange, type = "text", placeholder, className = "" }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <input 
      name={name} 
      value={value} 
      onChange={onChange} 
      type={type} 
      placeholder={placeholder} 
      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none transition-colors" 
    />
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
      className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none transition-colors min-h-[100px] resize-none" 
    />
  </div>
);

export const CvForge: React.FC = () => {
  // --- State ---
  const [layoutSeed, setLayoutSeed] = useState(Math.floor(Math.random() * 10000));
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // Data State
  const [jobRole, setJobRole] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '', title: '', email: '', phone: '', address: '', linkedin: '', about: ''
  });

  const [experience, setExperience] = useState([
    { id: 1, title: '', company: '', duration: '', details: '' }
  ]);

  const [education, setEducation] = useState([
    { id: 1, degree: '', school: '', year: '' }
  ]);

  const [skills, setSkills] = useState('');

  // --- Handlers ---

  const handleInfoChange = (e: any) => setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  
  // Experience Handlers
  const handleExpChange = (id: number, field: string, val: string) => {
    setExperience(experience.map(exp => exp.id === id ? { ...exp, [field]: val } : exp));
  };
  const addExp = () => setExperience([...experience, { id: Date.now(), title: '', company: '', duration: '', details: '' }]);
  const removeExp = (id: number) => setExperience(experience.filter(e => e.id !== id));

  // Education Handlers
  const handleEduChange = (id: number, field: string, val: string) => {
    setEducation(education.map(edu => edu.id === id ? { ...edu, [field]: val } : edu));
  };
  const addEdu = () => setEducation([...education, { id: Date.now(), degree: '', school: '', year: '' }]);
  const removeEdu = (id: number) => setEducation(education.filter(e => e.id !== id));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setPhoto(e.target.files[0]);
      }
  };

  const handleShuffle = () => {
    const newSeed = Math.floor(Math.random() * 10000);
    setLayoutSeed(newSeed);
    if (previewHtml) {
        generateCV(newSeed); // Regenerate immediately if preview is active
    }
  };

  const generateCV = async (seedOverride?: number) => {
    setIsGenerating(true);
    setActiveTab('preview');
    try {
        let photoBase64 = null;
        if (photo) {
            photoBase64 = await helperFileToBase64(photo);
        }

        const cvData = {
            layoutId: seedOverride || layoutSeed,
            jobRole: jobRole || personalInfo.title || "Professional",
            personalInfo,
            experience,
            education,
            skills,
            photoBase64
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

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-4">
            <h1 className="text-5xl font-bold text-cyan-400 font-display drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                CV FORGE PRO
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
                AI-Architected Professional Resumes. Fill in your details, choose a style, and let the AI build a perfect CV.
            </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Input Form */}
            <div className={`xl:col-span-5 flex flex-col gap-6 ${activeTab === 'preview' ? 'hidden xl:flex' : ''}`}>
                
                {/* 1. Target & AI Settings */}
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-white font-bold flex items-center gap-2">
                            <Target className="text-cyan-400" /> Target Role
                         </h3>
                         <button onClick={handleShuffle} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-white transition-colors" title="Change Layout Style">
                             <Shuffle size={14} /> Seed: {layoutSeed}
                         </button>
                    </div>
                    <input 
                      value={jobRole} 
                      onChange={e => setJobRole(e.target.value)} 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-4 text-xl font-bold text-white focus:border-cyan-400 focus:outline-none" 
                      placeholder="e.g. Senior Civil Engineer" 
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Sparkles size={12}/> Custom AI Instruction (Optional)</label>
                        <input 
                            value={customInstruction}
                            onChange={e => setCustomInstruction(e.target.value)}
                            placeholder="e.g. 'Make it sound executive', 'Focus on leadership'..."
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-cyan-400 focus:outline-none"
                        />
                    </div>
                </div>

                {/* 2. Personal Info */}
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <h3 className="text-white font-bold flex items-center gap-2 border-b border-white/10 pb-3">
                        <User className="text-cyan-400" size={20} /> Personal Information
                    </h3>
                    
                    <div className="flex items-center gap-4 mb-2">
                        <div className="relative w-20 h-20 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 group cursor-pointer">
                            {photo ? (
                                <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-slate-600" size={32} />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={20} className="text-white" />
                            </div>
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} />
                        </div>
                        <div className="flex-1">
                            <InputField label="Full Name" name="name" value={personalInfo.name} onChange={handleInfoChange} placeholder="John Doe" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Job Title" name="title" value={personalInfo.title} onChange={handleInfoChange} placeholder="Software Engineer" />
                        <InputField label="Phone" name="phone" value={personalInfo.phone} onChange={handleInfoChange} placeholder="+92 300 1234567" />
                        <InputField label="Email" name="email" value={personalInfo.email} onChange={handleInfoChange} placeholder="john@example.com" />
                        <InputField label="Location" name="address" value={personalInfo.address} onChange={handleInfoChange} placeholder="Lahore, Pakistan" />
                    </div>
                    <InputField label="LinkedIn / Portfolio" name="linkedin" value={personalInfo.linkedin} onChange={handleInfoChange} placeholder="linkedin.com/in/johndoe" />
                    <TextArea label="Professional Summary" name="about" value={personalInfo.about} onChange={handleInfoChange} placeholder="Briefly describe your professional background..." />
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
                            <div key={exp.id} className="relative flex flex-col gap-3 p-4 bg-slate-900/50 rounded-xl border border-white/5 group">
                                <button onClick={() => removeExp(exp.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Job Title" value={exp.title} onChange={(e: any) => handleExpChange(exp.id, 'title', e.target.value)} placeholder="Senior Developer" />
                                    <InputField label="Company" value={exp.company} onChange={(e: any) => handleExpChange(exp.id, 'company', e.target.value)} placeholder="Tech Solutions Inc." />
                                </div>
                                <InputField label="Duration" value={exp.duration} onChange={(e: any) => handleExpChange(exp.id, 'duration', e.target.value)} placeholder="Jan 2020 - Present" />
                                <TextArea label="Details (Bullet points)" value={exp.details} onChange={(e: any) => handleExpChange(exp.id, 'details', e.target.value)} placeholder="- Led a team of 5 developers..." />
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
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Skills (Comma Separated)</label>
                         <input 
                            value={skills} 
                            onChange={e => setSkills(e.target.value)} 
                            placeholder="React, TypeScript, Node.js, Project Management, Leadership" 
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none" 
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
                         <button 
                            onClick={() => handleShuffle()} 
                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
                            title="Shuffle Layout Seed"
                         >
                             <Shuffle size={20} />
                         </button>
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
                <div className="flex-1 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden relative min-h-[800px] shadow-2xl">
                    {previewHtml ? (
                        <iframe srcDoc={previewHtml} className="w-full h-full border-none bg-white" title="CV Preview" />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-6">
                            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center animate-pulse-slow">
                                <FileText size={48} className="opacity-50" />
                            </div>
                            <div className="text-center max-w-md px-6">
                                <h3 className="text-xl font-bold text-white mb-2">Ready to Build</h3>
                                <p>Fill in your details on the left and click "Generate CV" to create a professional resume instantly.</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Floating Download Actions (only if preview exists) */}
                    {previewHtml && (
                        <div className="absolute bottom-6 right-6 flex gap-3 animate-slide-up">
                            <button 
                                onClick={() => setPreviewHtml(null)} 
                                className="p-3 bg-black/80 text-white rounded-full hover:bg-black backdrop-blur-md transition-colors"
                                title="Clear Preview"
                            >
                                <RefreshCw size={20} />
                            </button>
                            <button 
                                onClick={() => {
                                    const blob = new Blob([previewHtml], { type: 'text/html' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `resume_${personalInfo.name.replace(/\s+/g, '_') || 'generated'}.html`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }} 
                                className="px-6 py-3 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-full shadow-neon flex items-center gap-2"
                            >
                                <Download size={20} /> Download HTML
                            </button>
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