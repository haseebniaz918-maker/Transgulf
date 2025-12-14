import React, { useState } from 'react';
import { FileText, User, CreditCard, Upload, CheckCircle, ArrowRight, Download, RefreshCw, Smartphone, Mail, Building, Hash } from 'lucide-react';

const InputGroup = ({ label, icon, name, value, onChange, placeholder }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon} {label}
      </label>
      <input 
         name={name}
         value={value}
         onChange={onChange}
         placeholder={placeholder}
         className="input-field"
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
    
    // Simple canvas gen logic (simplified for brevity, main logic remains)
    const canvas = document.createElement('canvas');
    canvas.width = 1240; canvas.height = 1754;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white'; ctx.fillRect(0,0,1240,1754);
    ctx.fillStyle = 'black'; ctx.font = 'bold 40px Arial'; ctx.fillText('NOMINATION FORM', 450, 100);
    
    // Draw Text Fields
    ctx.font = '24px Arial';
    ctx.fillText(`Name: ${formData.name}`, 100, 200);
    ctx.fillText(`Mobile: ${formData.mobile}`, 100, 250);
    
    // Draw Images
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
    <div className="animate-fade-in" style={{ maxWidth: '72rem', margin: '0 auto' }}>
      <div className="text-center" style={{ marginBottom: '3rem' }}>
         <h1 className="text-neon" style={{ fontSize: '2.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
             <FileText size={40} /> NOMINATION PORTAL
         </h1>
         <p className="text-muted">Official Nomination Form Generator</p>
      </div>

      {step === 'form' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User color="var(--color-cyan)" size={20} /> Personal Information
                    </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <InputGroup label="Full Name" icon={<User size={14}/>} name="name" value={formData.name} onChange={handleInputChange} placeholder="Muhammad Ali" />
                    <InputGroup label="Father Name" icon={<User size={14}/>} name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Ahmed Ali" />
                    <InputGroup label="Mobile Number" icon={<Smartphone size={14}/>} name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="0300-1234567" />
                    <InputGroup label="Gmail" icon={<Mail size={14}/>} name="gmail" value={formData.gmail} onChange={handleInputChange} placeholder="email@gmail.com" />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload color="var(--color-cyan)" size={20} /> Upload CNIC
                     </h3>
                     <div className="upload-box" style={{ padding: '1.5rem' }} onClick={() => document.getElementById('front-up')?.click()}>
                         <input id="front-up" type="file" onChange={(e) => handleFileChange(e, 'front')} className="hidden" accept="image/*" />
                         {cnicFront ? <div style={{ color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16}/> Front Uploaded</div> : <span className="text-muted">Upload Front</span>}
                     </div>
                     <div className="upload-box" style={{ padding: '1.5rem' }} onClick={() => document.getElementById('back-up')?.click()}>
                         <input id="back-up" type="file" onChange={(e) => handleFileChange(e, 'back')} className="hidden" accept="image/*" />
                         {cnicBack ? <div style={{ color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16}/> Back Uploaded</div> : <span className="text-muted">Upload Back</span>}
                     </div>
                </div>
                <button onClick={generateA4Page} className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }}>
                    GENERATE FORM <ArrowRight size={20} />
                </button>
            </div>
        </div>
      )}

      {step === 'preview' && generatedA4 && (
        <div className="animate-pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ background: 'white', padding: '0.5rem', borderRadius: '1rem', border: '4px solid #0f172a', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
                <img src={generatedA4} style={{ maxWidth: '100%', height: 'auto', borderRadius: '0.5rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep('form')} className="btn btn-secondary"><RefreshCw size={20}/> Edit</button>
                <button onClick={() => { const l = document.createElement('a'); l.href=generatedA4; l.download='form.jpg'; l.click(); }} className="btn btn-primary"><Download size={20}/> Download</button>
            </div>
        </div>
      )}
    </div>
  );
};