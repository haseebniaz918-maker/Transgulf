import React, { useState } from 'react';
import { FileText, User, Upload, CheckCircle, ArrowRight, Download, RefreshCw, Smartphone, Mail } from 'lucide-react';

const InputGroup = ({ label, icon, name, value, onChange, placeholder }: any) => (
  <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          {icon} {label}
      </label>
      <input 
         name={name}
         value={value}
         onChange={onChange}
         placeholder={placeholder}
         className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none transition-colors"
      />
  </div>
);

export const Nomination: React.FC = () => {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    mobile: '',
    bankName: '',
    iban: '',
    gmail: ''
  });
  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [generatedA4, setGeneratedA4] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'front') setCnicFront(e.target.files[0]);
      else setCnicBack(e.target.files[0]);
    }
  };

  const generateA4Page = async () => {
    if (!cnicFront || !cnicBack || !formData.name) return alert("Missing fields.");
    
    const canvas = document.createElement('canvas');
    canvas.width = 1240; canvas.height = 1754;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white'; ctx.fillRect(0,0,1240,1754);
    ctx.fillStyle = 'black'; ctx.font = 'bold 40px Arial'; ctx.fillText('NOMINATION FORM', 450, 100);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Name: ${formData.name}`, 100, 200);
    ctx.fillText(`Mobile: ${formData.mobile}`, 100, 250);
    
    const img1 = new Image(); img1.src = URL.createObjectURL(cnicFront);
    await new Promise(r => img1.onload = r);
    ctx.drawImage(img1, 100, 400, 500, 300);
    
    const img2 = new Image(); img2.src = URL.createObjectURL(cnicBack);
    await new Promise(r => img2.onload = r);
    ctx.drawImage(img2, 640, 400, 500, 300);

    setGeneratedA4(canvas.toDataURL('image/jpeg'));
    setStep('preview');
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="text-center mb-12">
         <h1 className="text-5xl font-bold text-cyan-400 font-display flex items-center justify-center gap-4 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
             <FileText size={48} /> NOMINATION PORTAL
         </h1>
         <p className="text-slate-400 mt-2">Official Nomination Form Generator</p>
      </div>

      {step === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl flex flex-col gap-8 col-span-2">
                <div className="border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-cyan-400" size={24} /> Personal Information
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Full Name" icon={<User size={14}/>} name="name" value={formData.name} onChange={handleInputChange} placeholder="Muhammad Ali" />
                    <InputGroup label="Father Name" icon={<User size={14}/>} name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Ahmed Ali" />
                    <InputGroup label="Mobile Number" icon={<Smartphone size={14}/>} name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="0300-1234567" />
                    <InputGroup label="Gmail" icon={<Mail size={14}/>} name="gmail" value={formData.gmail} onChange={handleInputChange} placeholder="email@gmail.com" />
                </div>
            </div>

            <div className="flex flex-col gap-8">
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Upload className="text-cyan-400" size={24} /> Upload CNIC
                     </h3>
                     <div 
                        className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-400/5 transition-all" 
                        onClick={() => document.getElementById('front-up')?.click()}
                     >
                         <input id="front-up" type="file" onChange={(e) => handleFileChange(e, 'front')} className="hidden" accept="image/*" />
                         {cnicFront ? <div className="text-green-400 flex items-center justify-center gap-2 font-bold"><CheckCircle size={16}/> Front Uploaded</div> : <span className="text-slate-400 text-sm">Upload Front Side</span>}
                     </div>
                     <div 
                        className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-400/5 transition-all" 
                        onClick={() => document.getElementById('back-up')?.click()}
                     >
                         <input id="back-up" type="file" onChange={(e) => handleFileChange(e, 'back')} className="hidden" accept="image/*" />
                         {cnicBack ? <div className="text-green-400 flex items-center justify-center gap-2 font-bold"><CheckCircle size={16}/> Back Uploaded</div> : <span className="text-slate-400 text-sm">Upload Back Side</span>}
                     </div>
                </div>
                <button 
                    onClick={generateA4Page} 
                    className="w-full py-5 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-xl text-lg shadow-neon transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                    GENERATE FORM <ArrowRight size={20} />
                </button>
            </div>
        </div>
      )}

      {step === 'preview' && generatedA4 && (
        <div className="flex flex-col items-center gap-8 animate-pop-in">
            <div className="bg-white p-2 rounded-xl shadow-2xl border-4 border-slate-900">
                <img src={generatedA4} className="max-w-full h-auto rounded-lg shadow-inner" />
            </div>
            <div className="flex gap-4">
                <button onClick={() => setStep('form')} className="px-6 py-3 border border-white/10 rounded-xl text-white hover:bg-white/5 flex items-center gap-2 font-bold"><RefreshCw size={20}/> Edit</button>
                <button onClick={() => { const l = document.createElement('a'); l.href=generatedA4; l.download='form.jpg'; l.click(); }} className="px-8 py-3 bg-cyan-400 hover:bg-[#00c2cc] text-black rounded-xl font-bold shadow-neon flex items-center gap-2"><Download size={20}/> Download</button>
            </div>
        </div>
      )}
    </div>
  );
};