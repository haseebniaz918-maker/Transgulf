import React, { useState } from 'react';
import { QrCode, Upload, ArrowRight, Download, CreditCard, User, Mail, Smartphone, Building, Hash, CheckCircle, RefreshCw, FileText } from 'lucide-react';

// Moved outside to prevent re-rendering/focus loss on input change
const InputGroup = ({ label, icon, name, value, onChange, placeholder }: any) => (
  <div className="flex flex-col gap-2">
      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
          {icon} {label}
      </label>
      <input 
         name={name}
         value={value}
         onChange={onChange}
         placeholder={placeholder}
         className="bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:border-[#00f3ff] focus:outline-none focus:shadow-[0_0_15px_rgba(0,243,255,0.1)] transition-all"
      />
  </div>
);

export const Nomination: React.FC = () => {
  // Started directly at 'form' instead of 'qr'
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
    if (!cnicFront || !cnicBack) {
      alert("Please upload both CNIC Front and Back images.");
      return;
    }
    if (!formData.name || !formData.fatherName || !formData.mobile || !formData.bankName || !formData.iban || !formData.gmail) {
      alert("Please fill in all fields.");
      return;
    }

    const canvas = document.createElement('canvas');
    // A4 Size at 150 DPI (approx 1240 x 1754 px)
    const WIDTH = 1240;
    const HEIGHT = 1754;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Draw Header
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NOMINATION FORM DETAILS', WIDTH / 2, 80);
    
    // Header Line
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(WIDTH - 100, 100);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // 3. Draw User Details (2 Column Grid)
    const col1X = 80;
    const col2X = 640; // Midpoint + padding
    let currentY = 160;
    const labelOffset = 35;
    const rowSpacing = 90;

    // Helper to draw field
    const drawField = (label: string, value: string, x: number, y: number) => {
        // Label
        ctx.fillStyle = '#666666'; 
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(label.toUpperCase(), x, y);
        
        // Value
        ctx.fillStyle = '#000000'; 
        ctx.font = '28px Courier New'; 
        ctx.fillText(value, x, y + labelOffset);

        // Underline
        ctx.beginPath();
        ctx.moveTo(x, y + labelOffset + 10);
        ctx.lineTo(x + 500, y + labelOffset + 10);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#CCCCCC';
        ctx.stroke();
    };

    // Row 1
    drawField("Full Name", formData.name, col1X, currentY);
    drawField("Father Name", formData.fatherName, col2X, currentY);
    currentY += rowSpacing;

    // Row 2
    drawField("Mobile Number", formData.mobile, col1X, currentY);
    drawField("Gmail Address", formData.gmail, col2X, currentY);
    currentY += rowSpacing;

    // Row 3
    drawField("Bank Name", formData.bankName, col1X, currentY);
    drawField("IBAN / Account", formData.iban, col2X, currentY);
    currentY += rowSpacing + 20; // Extra gap after text

    // 4. Draw CNIC Images
    const loadImage = (file: File): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = URL.createObjectURL(file);
      });
    };

    const imgFront = await loadImage(cnicFront);
    const imgBack = await loadImage(cnicBack);

    // FIXED DIMENSIONS FOR ID CARD
    // Standard ID Ratio is approx 1.58 (85.6mm x 53.98mm)
    // We want a large, clear size on A4.
    const FIXED_WIDTH = 700;
    const FIXED_HEIGHT = 442; // 700 / 1.58 approx
    
    // Center the image horizontally
    const imgX = (WIDTH - FIXED_WIDTH) / 2;

    const drawFixedImage = (img: HTMLImageElement, yPos: number, title: string) => {
         // Draw Title
         ctx.fillStyle = '#000000';
         ctx.font = 'bold 24px Arial';
         ctx.textAlign = 'center';
         ctx.fillText(title, WIDTH / 2, yPos);

         // Draw Border Rect (for professional look)
         ctx.strokeStyle = '#000000';
         ctx.lineWidth = 2;
         ctx.strokeRect(imgX - 2, yPos + 15 - 2, FIXED_WIDTH + 4, FIXED_HEIGHT + 4);

         // Draw Image (Stretched/Fit to Box)
         ctx.drawImage(img, imgX, yPos + 15, FIXED_WIDTH, FIXED_HEIGHT);

         return FIXED_HEIGHT + 70; // Return height used + spacing
    };

    let imgCursorY = currentY + 30; // Add some top margin
    
    // Draw Front
    const heightUsedFront = drawFixedImage(imgFront, imgCursorY, "CNIC (FRONT)");
    imgCursorY += heightUsedFront;

    // Draw Back
    drawFixedImage(imgBack, imgCursorY, "CNIC (BACK)");

    // 5. Finalize
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setGeneratedA4(dataUrl);
    setStep('preview');
  };

  const downloadFile = () => {
    if (!generatedA4) return;
    const link = document.createElement('a');
    link.download = `Nomination_${formData.name.replace(/\s+/g, '_')}.jpg`;
    link.href = generatedA4;
    link.click();
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-12 flex flex-col items-center animate-fade-in max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="text-center mb-10">
         <h1 className="text-4xl font-display font-bold text-white flex items-center justify-center gap-3">
             <FileText className="w-10 h-10 text-[#00f3ff]" />
             NOMINATION <span className="text-[#00f3ff] drop-shadow-[0_0_10px_#00f3ff]">PORTAL</span>
         </h1>
         <p className="text-slate-400 mt-2 text-lg">Official Nomination Form Generator & Archiver</p>
      </div>

      {/* FORM STEP */}
      {step === 'form' && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
            
            {/* Left: Inputs */}
            <div className="lg:col-span-7 bg-[#0f172a] p-8 rounded-2xl border border-white/10 shadow-xl space-y-8">
                <div className="border-b border-white/10 pb-4 mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-[#00f3ff]" /> Personal Information
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Full Name" icon={<User size={14}/>} name="name" value={formData.name} onChange={handleInputChange} placeholder="Muhammad Ali" />
                    <InputGroup label="Father Name" icon={<User size={14}/>} name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Ahmed Ali" />
                    <InputGroup label="Mobile Number" icon={<Smartphone size={14}/>} name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="0300-1234567" />
                    <InputGroup label="Gmail Address" icon={<Mail size={14}/>} name="gmail" value={formData.gmail} onChange={handleInputChange} placeholder="example@gmail.com" />
                </div>

                <div className="border-b border-white/10 pb-4 mb-4 pt-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-[#00f3ff]" /> Banking Details
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Bank Name" icon={<Building size={14}/>} name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="HBL / Meezan" />
                    <InputGroup label="IBAN / Account No" icon={<Hash size={14}/>} name="iban" value={formData.iban} onChange={handleInputChange} placeholder="PK36 MEZN 0000..." />
                </div>
            </div>

            {/* Right: Uploads & Action */}
            <div className="lg:col-span-5 flex flex-col gap-6">
                
                <div className="bg-[#0f172a] p-8 rounded-2xl border border-white/10 shadow-xl flex flex-col gap-6">
                     <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                        <Upload className="text-[#00f3ff]" /> Document Upload
                     </h3>

                     {/* Front Upload */}
                     <div className="relative group cursor-pointer border-2 border-dashed border-slate-700 hover:border-[#00f3ff] rounded-xl p-6 transition-all bg-black/20 text-center">
                         <input type="file" onChange={(e) => handleFileChange(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                         {cnicFront ? (
                             <div className="flex items-center justify-center gap-2 text-[#00f3ff]">
                                 <CheckCircle className="w-5 h-5" /> <span>Front Side Uploaded</span>
                             </div>
                         ) : (
                             <div className="text-slate-400 group-hover:text-white">
                                 <p className="font-bold">Upload CNIC Front</p>
                                 <p className="text-xs mt-1">Click to browse</p>
                             </div>
                         )}
                     </div>

                     {/* Back Upload */}
                     <div className="relative group cursor-pointer border-2 border-dashed border-slate-700 hover:border-[#00f3ff] rounded-xl p-6 transition-all bg-black/20 text-center">
                         <input type="file" onChange={(e) => handleFileChange(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                         {cnicBack ? (
                             <div className="flex items-center justify-center gap-2 text-[#00f3ff]">
                                 <CheckCircle className="w-5 h-5" /> <span>Back Side Uploaded</span>
                             </div>
                         ) : (
                             <div className="text-slate-400 group-hover:text-white">
                                 <p className="font-bold">Upload CNIC Back</p>
                                 <p className="text-xs mt-1">Click to browse</p>
                             </div>
                         )}
                     </div>
                </div>

                <button 
                    onClick={generateA4Page}
                    className="w-full py-5 bg-[#00f3ff] hover:bg-[#00c2cc] text-black font-extrabold text-xl rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.4)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                >
                    GENERATE FORM <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
      )}

      {/* PREVIEW STEP */}
      {step === 'preview' && generatedA4 && (
        <div className="flex flex-col items-center gap-8 animate-pop-in w-full">
            <div className="bg-white p-2 rounded-xl shadow-2xl max-w-lg w-full border-4 border-[#0f172a]">
                <img src={generatedA4} className="w-full h-auto rounded border border-slate-200" alt="Generated Form" />
            </div>
            
            <div className="flex gap-4">
                <button 
                    onClick={() => setStep('form')}
                    className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                   <RefreshCw className="w-5 h-5" /> Edit Details
                </button>
                <button 
                    onClick={downloadFile}
                    className="px-8 py-3 bg-[#00f3ff] text-black font-bold rounded-xl hover:bg-[#00c2cc] shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all flex items-center gap-2"
                >
                   <Download className="w-5 h-5" /> Save to Drive
                </button>
            </div>
        </div>
      )}
    </div>
  );
};