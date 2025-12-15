import React, { useState } from 'react';
import { FileText, User, Upload, CheckCircle, ArrowRight, Download, RefreshCw, Smartphone, Mail, CreditCard, Landmark, AlertTriangle, Loader2 } from 'lucide-react';
import { validateNominationDetails } from '../services/geminiService';

const InputGroup = ({ label, icon, name, value, onChange, placeholder, error, success }: any) => (
  <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">{icon} {label}</span>
          {error && <span className="text-red-400 text-[10px] flex items-center gap-1"><AlertTriangle size={10}/> {error}</span>}
          {success && <span className="text-green-400 text-[10px] flex items-center gap-1"><CheckCircle size={10}/> Verified</span>}
      </label>
      <input 
         name={name}
         value={value}
         onChange={onChange}
         placeholder={placeholder}
         className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${error ? 'border-red-500' : 'border-white/10 focus:border-cyan-400'}`}
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
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState<Record<string, boolean>>({});

  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [generatedA4, setGeneratedA4] = useState<string | null>(null);

  const formatMobile = (val: string) => {
    // Remove non-digit characters
    const raw = val.replace(/\D/g, '');
    
    // Format: 0312 3456789 (4 digits + space + 7 digits)
    if (raw.length <= 4) return raw;
    return `${raw.slice(0, 4)} ${raw.slice(4, 11)}`;
  };

  const formatIBAN = (val: string) => {
      // Remove non-alphanumeric and convert to uppercase
      const raw = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      // Insert space every 4 characters
      const matches = raw.match(/.{1,4}/g);
      return matches ? matches.join(' ') : raw;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'mobile') {
        formattedValue = formatMobile(value);
    } else if (name === 'iban') {
        formattedValue = formatIBAN(value);
    }

    setFormData({ ...formData, [name]: formattedValue });
    
    // Clear validation status on change
    if (validationErrors[name]) setValidationErrors(prev => ({...prev, [name]: ''}));
    if (validationSuccess[name]) setValidationSuccess(prev => ({...prev, [name]: false}));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'front') setCnicFront(e.target.files[0]);
      else setCnicBack(e.target.files[0]);
    }
  };

  const validateFields = async () => {
      setIsValidating(true);
      setValidationErrors({});
      setValidationSuccess({});
      
      try {
        const result = await validateNominationDetails(formData.gmail, formData.bankName, formData.iban);
        
        const newErrors: Record<string, string> = {};
        const newSuccess: Record<string, boolean> = {};

        // Gmail
        if (!result.gmail.isValid) newErrors.gmail = result.gmail.message;
        else if (formData.gmail) newSuccess.gmail = true;

        // Bank Name (Auto-correct if needed)
        if (!result.bank.isValid) {
            newErrors.bankName = result.bank.message;
        } else {
            if (result.bank.correctedName !== formData.bankName && result.bank.correctedName) {
                setFormData(prev => ({ ...prev, bankName: result.bank.correctedName }));
            }
            if (formData.bankName) newSuccess.bankName = true;
        }

        // IBAN
        if (!result.iban.isValid) newErrors.iban = result.iban.message;
        else if (formData.iban) newSuccess.iban = true;

        setValidationErrors(newErrors);
        setValidationSuccess(newSuccess);

        return Object.keys(newErrors).length === 0;
      } catch (e) {
          console.error("Validation error", e);
          return true; // Proceed if AI fails, don't block user
      } finally {
          setIsValidating(false);
      }
  };

  const generateA4Page = async () => {
    if (!cnicFront || !cnicBack || !formData.name) return alert("Missing fields (Name, CNIC Images).");
    
    // Trigger validation
    const isValid = await validateFields();
    if (!isValid) {
        alert("Please fix the validation errors before generating.");
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 1240; canvas.height = 1754; // A4 @ 150 DPI approx
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Background
    ctx.fillStyle = 'white'; ctx.fillRect(0,0,1240,1754);
    
    // Header
    ctx.fillStyle = 'black'; 
    ctx.font = 'bold 50px Arial'; 
    ctx.textAlign = 'center';
    ctx.fillText('NOMINATION FORM', 620, 100);
    
    // Content Layout
    ctx.textAlign = 'left';
    ctx.font = '24px Arial';
    const lineHeight = 50;
    let startY = 200;

    // Helper for rows
    const drawRow = (label: string, value: string, y: number) => {
        ctx.font = 'bold 24px Arial';
        ctx.fillText(label, 100, y);
        ctx.font = '24px Arial';
        ctx.fillText(value || 'N/A', 400, y);
    };

    drawRow("Name:", formData.name, startY);
    drawRow("Father Name:", formData.fatherName, startY + lineHeight);
    drawRow("Mobile:", formData.mobile, startY + (lineHeight * 2));
    drawRow("Gmail:", formData.gmail, startY + (lineHeight * 3));
    drawRow("Bank Name:", formData.bankName, startY + (lineHeight * 4));
    drawRow("IBAN:", formData.iban, startY + (lineHeight * 5));
    
    // Images
    const imgY = startY + (lineHeight * 7);
    ctx.font = 'bold 24px Arial';
    ctx.fillText("CNIC Front:", 100, imgY - 20);
    ctx.fillText("CNIC Back:", 640, imgY - 20);

    const img1 = new Image(); img1.src = URL.createObjectURL(cnicFront);
    await new Promise(r => img1.onload = r);
    ctx.drawImage(img1, 100, imgY, 500, 315); // Standard Card Aspect Ratio
    
    const img2 = new Image(); img2.src = URL.createObjectURL(cnicBack);
    await new Promise(r => img2.onload = r);
    ctx.drawImage(img2, 640, imgY, 500, 315);

    // Footer
    ctx.font = 'italic 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Generated via Bhatti's AI Tools", 620, 1700);

    setGeneratedA4(canvas.toDataURL('image/jpeg'));
    setStep('preview');
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-12">
         <h1 className="text-5xl font-bold text-cyan-400 font-display flex items-center justify-center gap-4 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
             <FileText size={48} /> NOMINATION PORTAL
         </h1>
         <p className="text-slate-400 mt-2">Official Nomination Form Generator with AI Verification</p>
      </div>

      {step === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl flex flex-col gap-8 col-span-2">
                <div className="border-b border-white/10 pb-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-cyan-400" size={24} /> Candidate Information
                    </h3>
                    {isValidating && <span className="text-xs text-cyan-400 flex items-center gap-2"><Loader2 className="animate-spin" size={14}/> AI Validating...</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Full Name" icon={<User size={14}/>} name="name" value={formData.name} onChange={handleInputChange} placeholder="Muhammad Ali" />
                    <InputGroup label="Father Name" icon={<User size={14}/>} name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Ahmed Ali" />
                    
                    <InputGroup 
                        label="Mobile Number (03xx xxxxxxx)" 
                        icon={<Smartphone size={14}/>} 
                        name="mobile" 
                        value={formData.mobile} 
                        onChange={handleInputChange} 
                        placeholder="0300 1234567" 
                    />
                    
                    <InputGroup 
                        label="Gmail Address" 
                        icon={<Mail size={14}/>} 
                        name="gmail" 
                        value={formData.gmail} 
                        onChange={handleInputChange} 
                        placeholder="email@gmail.com" 
                        error={validationErrors.gmail}
                        success={validationSuccess.gmail}
                    />
                    
                    <InputGroup 
                        label="Bank Name" 
                        icon={<Landmark size={14}/>} 
                        name="bankName" 
                        value={formData.bankName} 
                        onChange={handleInputChange} 
                        placeholder="Meezan Bank" 
                        error={validationErrors.bankName}
                        success={validationSuccess.bankName}
                    />
                    
                    <InputGroup 
                        label="IBAN Number" 
                        icon={<CreditCard size={14}/>} 
                        name="iban" 
                        value={formData.iban} 
                        onChange={handleInputChange} 
                        placeholder="PK36 MEZN 1234 5678 ..." 
                        error={validationErrors.iban}
                        success={validationSuccess.iban}
                    />
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
                    disabled={isValidating}
                    className="w-full py-5 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-xl text-lg shadow-neon transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isValidating ? <Loader2 className="animate-spin"/> : <ArrowRight size={20} />}
                    {isValidating ? 'VALIDATING...' : 'GENERATE FORM'}
                </button>
            </div>
        </div>
      )}

      {step === 'preview' && generatedA4 && (
        <div className="flex flex-col items-center gap-8 animate-pop-in">
            <div className="bg-white p-2 rounded-xl shadow-2xl border-4 border-slate-900 overflow-hidden">
                <img src={generatedA4} className="max-w-full h-auto rounded-lg shadow-inner max-h-[70vh]" />
            </div>
            <div className="flex gap-4">
                <button onClick={() => setStep('form')} className="px-6 py-3 border border-white/10 rounded-xl text-white hover:bg-white/5 flex items-center gap-2 font-bold"><RefreshCw size={20}/> Edit</button>
                <button onClick={() => { const l = document.createElement('a'); l.href=generatedA4; l.download='nomination_form.jpg'; l.click(); }} className="px-8 py-3 bg-cyan-400 hover:bg-[#00c2cc] text-black rounded-xl font-bold shadow-neon flex items-center gap-2"><Download size={20}/> Download JPG</button>
            </div>
        </div>
      )}
    </div>
  );
};