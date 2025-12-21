
import React, { useState } from 'react';
import { FileText, User, Upload, CheckCircle, ArrowRight, Download, RefreshCw, Smartphone, Mail, CreditCard, Landmark, AlertTriangle, Loader2, FileType, X, Image as ImageIcon } from 'lucide-react';
import { validateNominationDetails } from '../services/geminiService';

declare const html2pdf: any;

const InputGroup = ({ label, icon, name, value, onChange, placeholder, error, success }: any) => (
  <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-theme-text opacity-60 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">{icon} {label}</span>
          {error && <span className="text-red-600 dark:text-red-400 text-[10px] flex items-center gap-1"><AlertTriangle size={10}/> {error}</span>}
          {success && <span className="text-green-600 dark:text-green-400 text-[10px] flex items-center gap-1"><CheckCircle size={10}/> Verified</span>}
      </label>
      <input 
         name={name}
         value={value}
         onChange={onChange}
         placeholder={placeholder}
         className={`w-full bg-black/5 dark:bg-slate-900/50 border rounded-lg px-4 py-3 text-theme-text focus:outline-none transition-colors ${error ? 'border-red-500' : 'border-black/10 dark:border-white/10 focus:border-primary'}`}
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState<Record<string, boolean>>({});

  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [generatedA4, setGeneratedA4] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'front') setCnicFront(e.target.files[0]);
      else setCnicBack(e.target.files[0]);
    }
  };

  const validateFields = async () => {
      setIsValidating(true);
      try {
        const result = await validateNominationDetails(formData.gmail, formData.bankName, formData.iban);
        const newErrors: Record<string, string> = {};
        const newSuccess: Record<string, boolean> = {};

        if (!result.gmail.isValid) newErrors.gmail = result.gmail.message;
        else if (formData.gmail) newSuccess.gmail = true;

        if (!result.bank.isValid) newErrors.bankName = result.bank.message;
        else if (formData.bankName) newSuccess.bankName = true;

        if (!result.iban.isValid) newErrors.iban = result.iban.message;
        else if (formData.iban) newSuccess.iban = true;

        setValidationErrors(newErrors);
        setValidationSuccess(newSuccess);
        return Object.keys(newErrors).length === 0;
      } catch (e) {
          return true; 
      } finally {
          setIsValidating(false);
      }
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateA4Page = async () => {
    setIsGenerating(true);
    try {
      await validateFields();
      
      const canvas = document.createElement('canvas');
      canvas.width = 1240; // A4 Width at 150 DPI
      canvas.height = 1754; // A4 Height at 150 DPI
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Background
      ctx.fillStyle = 'white'; 
      ctx.fillRect(0, 0, 1240, 1754);
      
      // Header
      ctx.fillStyle = 'black'; 
      ctx.font = 'bold 50px Arial'; 
      ctx.textAlign = 'center';
      ctx.fillText('NOMINATION FORM', 620, 100);
      
      // Details Section
      ctx.textAlign = 'left'; 
      ctx.font = '24px Arial';
      let startY = 200;
      const drawField = (label: string, value: string) => {
          ctx.font = 'bold 24px Arial';
          ctx.fillText(`${label}:`, 100, startY);
          ctx.font = '24px Arial';
          ctx.fillText(value || 'N/A', 350, startY);
          startY += 50;
      };

      drawField('Name', formData.name);
      drawField("Father's Name", formData.fatherName);
      drawField('Gmail', formData.gmail);
      drawField('Bank Name', formData.bankName);
      drawField('IBAN', formData.iban);
      drawField('Mobile No', formData.mobile);

      // Draw Images
      const drawIdCard = async (file: File | null, yPos: number, label: string) => {
          if (!file) {
              ctx.strokeStyle = '#eee';
              ctx.strokeRect(100, yPos, 1040, 450);
              ctx.fillStyle = '#999';
              ctx.textAlign = 'center';
              ctx.font = 'italic 20px Arial';
              ctx.fillText(`[ ${label} Side Not Provided ]`, 620, yPos + 225);
              return;
          }
          try {
              const img = await loadImage(file);
              const maxWidth = 1040;
              const maxHeight = 500;
              let width = img.width;
              let height = img.height;

              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;

              const x = (1240 - width) / 2;
              ctx.drawImage(img, x, yPos, width, height);
          } catch (e) {
              console.error(`Failed to draw ${label}`, e);
          }
      };

      startY += 50;
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText('CNIC FRONT SIDE:', 100, startY);
      await drawIdCard(cnicFront, startY + 40, 'Front');

      startY += 620;
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText('CNIC BACK SIDE:', 100, startY);
      await drawIdCard(cnicBack, startY + 40, 'Back');

      setGeneratedA4(canvas.toDataURL('image/jpeg', 0.95));
      setStep('preview');
    } catch (err) {
      console.error(err);
      alert("Form generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedA4) return;
    setIsDownloading(true);
    const element = document.createElement('div');
    element.innerHTML = `<img src="${generatedA4}" style="width: 100%; display: block;" />`;
    Object.assign(element.style, { width: '210mm', position: 'fixed', top: '0', left: '-10000px', zIndex: '-1' });
    document.body.appendChild(element);

    try {
        const options = { 
            margin: 0, 
            filename: `Nomination_${formData.name || 'Candidate'}.pdf`, 
            html2canvas: { scale: 2, useCORS: true }, 
            jsPDF: { format: 'a4', orientation: 'portrait' } 
        };
        await html2pdf().set(options).from(element).save();
    } finally {
        document.body.removeChild(element);
        setIsDownloading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedA4) return;
    const link = document.createElement('a');
    link.href = generatedA4;
    link.download = `Nomination_${formData.name || 'Candidate'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-12">
         <h1 className="text-5xl font-bold text-primary font-display flex items-center justify-center gap-4 drop-shadow-[0_0_15px_rgba(var(--primary-color),0.4)]">
             <FileText size={48} /> NOMINATION PORTAL
         </h1>
         <p className="text-theme-text opacity-50 mt-2">Official Nomination Form Generator with AI Verification</p>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 z-[110] bg-theme-bg/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
           <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
           <h2 className="text-xl font-black text-theme-text tracking-widest animate-pulse">GENERATING DOCUMENT...</h2>
        </div>
      )}

      {step === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl flex flex-col gap-8 col-span-2">
                <div className="border-b border-black/5 dark:border-white/10 pb-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                        <User className="text-primary" size={24} /> Candidate Information
                    </h3>
                    {isValidating && <span className="text-xs text-primary flex items-center gap-2"><Loader2 className="animate-spin" size={14}/> AI Validating...</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Full Name" icon={<User size={14}/>} name="name" value={formData.name} onChange={handleInputChange} placeholder="Candidate Name" />
                    <InputGroup label="Father Name" icon={<User size={14}/>} name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Father Name" />
                    <InputGroup label="Mobile No" icon={<Smartphone size={14}/>} name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="0300 1234567" />
                    <InputGroup label="Gmail Address" icon={<Mail size={14}/>} name="gmail" value={formData.gmail} onChange={handleInputChange} placeholder="email@gmail.com" error={validationErrors.gmail} success={validationSuccess.gmail} />
                    <InputGroup label="Bank Name" icon={<Landmark size={14}/>} name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="e.g. Meezan Bank" error={validationErrors.bankName} success={validationSuccess.bankName} />
                    <InputGroup label="IBAN Number" icon={<CreditCard size={14}/>} name="iban" value={formData.iban} onChange={handleInputChange} placeholder="PK36 MEZN ..." error={validationErrors.iban} success={validationSuccess.iban} />
                </div>
            </div>

            <div className="flex flex-col gap-8">
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-6">
                     <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                        <Upload className="text-primary" size={24} /> Upload CNIC IDs
                     </h3>
                     <div className="flex flex-col gap-4">
                        <div className="relative group">
                            <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all" onClick={() => document.getElementById('front-up')?.click()}>
                                <input id="front-up" type="file" onChange={(e) => handleFileChange(e, 'front')} className="hidden" accept="image/*" />
                                {cnicFront ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-full h-24 rounded-lg overflow-hidden border border-primary/20 bg-black/10">
                                            <img src={URL.createObjectURL(cnicFront)} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-green-600 dark:text-green-400 flex items-center justify-center gap-2 font-bold text-xs"><CheckCircle size={14}/> Front ID Uploaded</div>
                                    </div>
                                ) : <span className="text-theme-text opacity-40 text-sm">Upload Front Side</span>}
                            </div>
                            {cnicFront && (
                                <button onClick={() => setCnicFront(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={14}/>
                                </button>
                            )}
                        </div>

                        <div className="relative group">
                            <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all" onClick={() => document.getElementById('back-up')?.click()}>
                                <input id="back-up" type="file" onChange={(e) => handleFileChange(e, 'back')} className="hidden" accept="image/*" />
                                {cnicBack ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-full h-24 rounded-lg overflow-hidden border border-primary/20 bg-black/10">
                                            <img src={URL.createObjectURL(cnicBack)} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-green-600 dark:text-green-400 flex items-center justify-center gap-2 font-bold text-xs"><CheckCircle size={14}/> Back ID Uploaded</div>
                                    </div>
                                ) : <span className="text-theme-text opacity-40 text-sm">Upload Back Side</span>}
                            </div>
                            {cnicBack && (
                                <button onClick={() => setCnicBack(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={14}/>
                                </button>
                            )}
                        </div>
                     </div>
                </div>
                <button 
                    onClick={generateA4Page} 
                    disabled={isGenerating || isValidating} 
                    className="w-full py-5 bg-primary hover:opacity-90 text-white dark:text-black font-bold rounded-xl text-lg shadow-neon transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                    {isGenerating ? <Loader2 className="animate-spin"/> : <ArrowRight size={20} />}
                    {isGenerating ? 'GENERATING...' : 'GENERATE NOMINATION'}
                </button>
            </div>
        </div>
      )}

      {step === 'preview' && generatedA4 && (
        <div className="flex flex-col items-center gap-8 animate-pop-in">
            <div className="bg-white p-2 rounded-xl shadow-2xl border-4 border-slate-900 overflow-hidden">
                <img src={generatedA4} className="max-w-full h-auto rounded-lg shadow-inner max-h-[70vh] border border-slate-200" />
            </div>
            <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => setStep('form')} className="px-6 py-3 border border-black/10 dark:border-white/10 rounded-xl text-theme-text hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 font-bold"><RefreshCw size={20}/> Edit Form</button>
                <button onClick={handleDownloadImage} className="px-8 py-3 bg-white border border-primary/30 hover:border-primary text-black dark:text-black rounded-xl font-bold shadow-md flex items-center gap-2 transition-all">
                    <ImageIcon size={20}/> Download JPG
                </button>
                <button onClick={handleDownloadPdf} disabled={isDownloading} className="px-8 py-3 bg-primary hover:opacity-90 text-white dark:text-black rounded-xl font-bold shadow-neon flex items-center gap-2 transition-all">
                    {isDownloading ? <Loader2 className="animate-spin"/> : <FileType size={20}/>} Download PDF
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
