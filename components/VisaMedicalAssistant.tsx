import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, Search, Loader2, User, Globe, FileCheck, ExternalLink, 
    Sparkles, Activity, AlertCircle, CheckCircle2, History, CreditCard, 
    Layout, Info, XCircle, ArrowRight, ChevronRight, ClipboardList, 
    Terminal, Briefcase, FileSpreadsheet, Building2, UserPlus, 
    Lock, CheckCircle, Ban, AlertOctagon, Copy, Check
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface StepResult {
  status: string;
  details: string;
  sourceUrl: string;
  verified: boolean;
  failed: boolean;
}

interface AuditRecord {
  id: string;
  companyName: string;
  name: string;
  passport: string;
  nationality: string;
  date: string;
  wafid: StepResult;
  takamol: StepResult;
  enjaz: StepResult;
}

const TAKAMOL_CODES = [
    { code: "931201", name: "Construction Worker / General Laborer" },
    { code: "711101", name: "House Builder" },
    { code: "711202", name: "Brick Mason" },
    { code: "711401", name: "Concrete Finisher" },
    { code: "711501", name: "Carpenter (General)" },
    { code: "711502", name: "Construction Formwork Carpenter" },
    { code: "711901", name: "Scaffolder" },
    { code: "712201", name: "Floor Layer / Tile Setter" },
    { code: "712301", name: "Plasterer" },
    { code: "712601", name: "Plumber" },
    { code: "713101", name: "Building Painter" },
    { code: "741101", name: "Building Electrician" },
    { code: "741201", name: "Electrical Mechanic / Maintenance Technician" },
    { code: "712701", name: "HVAC Mechanic (Air Conditioning)" },
    { code: "711402", name: "Steel Fixer" },
    { code: "721201", name: "Welder (Arc/Gas/General)" },
    { code: "721301", name: "Tinsmith / Sheet Metal Worker" },
    { code: "721401", name: "Structural Metal Preparer" },
    { code: "722201", name: "Tool and Die Maker" },
    { code: "722301", name: "Metal Working Machine Tool Setter" },
    { code: "723101", name: "Auto Mechanic (Petrol/Diesel)" },
    { code: "723102", name: "Auto Electrician" },
    { code: "723301", name: "Agricultural Machinery Mechanic" },
    { code: "821101", name: "Mechanical Machinery Assembler" },
    { code: "821201", name: "Electrical Equipment Assembler" },
    { code: "833101", name: "Bus Driver" },
    { code: "833201", name: "Heavy Truck / Trailer Driver" },
    { code: "833202", name: "Car / Light Vehicle Driver" },
    { code: "834201", name: "Earth Moving & Related Plant Operator (Excavator)" },
    { code: "834301", name: "Crane / Hoist Operator" },
    { code: "512001", name: "Professional Chef / Cook" },
    { code: "513101", name: "Waiter" },
    { code: "514101", name: "Barber / Hairdresser" },
    { code: "541401", name: "Security Guard" },
    { code: "751101", name: "Butcher" },
    { code: "751201", name: "Baker / Pastry Maker" },
    { code: "753101", name: "Tailor / Dressmaker" },
    { code: "753301", name: "Sewing Machine Operator" },
    { code: "911201", name: "Cleaner (Offices and Facilities)" }
];

export const VisaMedicalAssistant: React.FC = () => {
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('alhadab_company_name') || '');
  const [tempCompany, setTempCompany] = useState('');
  
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0); // 0: Medical, 1: Takamol, 2: Visa
  const [candidateName, setCandidateName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('Pakistani');
  const [isCopied, setIsCopied] = useState(false);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  
  const [auditData, setAuditData] = useState<{
    wafid: StepResult;
    takamol: StepResult;
    enjaz: StepResult;
  }>({
    wafid: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
    takamol: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
    enjaz: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
  });

  const [history, setHistory] = useState<AuditRecord[]>(() => {
    const saved = localStorage.getItem('alhadab_audit_history');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSetCompany = () => {
    if (tempCompany.trim()) {
        setCompanyName(tempCompany);
        localStorage.setItem('alhadab_company_name', tempCompany);
    }
  };

  const copyPassport = () => {
    if (!passportNumber) return;
    navigator.clipboard.writeText(passportNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isStepLocked = (stepIdx: number) => {
      // Basic profile check
      if (!candidateName || !passportNumber) return true;
      
      // Strict sequence check
      if (stepIdx === 0) return false;
      if (stepIdx === 1) return !auditData.wafid.verified || auditData.wafid.failed;
      if (stepIdx === 2) return !auditData.takamol.verified || auditData.takamol.failed;
      return true;
  };

  const getStepName = (idx: number) => ['Wafid Medical', 'Takamol Skill Verification', 'Enjaz Visa'][idx];

  const handleManualExtraction = async () => {
    if (!pastedText) return;
    setIsParsing(true);
    const currentStepName = getStepName(activeStep);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `
        Analyze the provided portal text for ${currentStepName}.
        IDENTIFY: Status (FIT, UNFIT, PASSED, FAILED, ISSUED, REJECTED).
        DETERMINE: If status is positive (FIT/PASSED/ISSUED) or negative.
        
        Text: "${pastedText}"
        
        OUTPUT FORMAT (JSON):
        {
          "status": "string (uppercase status)",
          "details": "string (brief reason)",
          "isPositive": boolean
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const res = JSON.parse(response.text || "{}");
      const key = activeStep === 0 ? 'wafid' : activeStep === 1 ? 'takamol' : 'enjaz';
      
      setAuditData(prev => ({
        ...prev,
        [key]: {
          ...prev[key as keyof typeof auditData],
          status: res.status || 'ERROR',
          details: res.details || 'Manually parsed',
          verified: true,
          failed: !res.isPositive
        }
      }));
      setPastedText('');
    } catch (e) {
      alert("Parsing failed. Check connection.");
    } finally {
      setIsParsing(false);
    }
  };

  const runStepCheck = async (stepIndex: number) => {
    if (!passportNumber) return;
    setIsSearching(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Find official check URL for ${getStepName(stepIndex)} for Passport ${passportNumber}. 
      If CAPTCHA is expected, return status "CAPTCHA REQUIRED".
      JSON format: { "status": "string", "sourceUrl": "string" }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
      });

      const res = JSON.parse(response.text || "{}");
      const key = stepIndex === 0 ? 'wafid' : stepIndex === 1 ? 'takamol' : 'enjaz';
      
      setAuditData(prev => ({
        ...prev,
        [key]: {
          ...prev[key as keyof typeof auditData],
          status: res.status || 'CAPTCHA REQUIRED',
          sourceUrl: res.sourceUrl || '',
          verified: false,
          failed: false
        }
      }));
    } finally {
      setIsSearching(false);
    }
  };

  const finalizeAudit = () => {
    const newRecord: AuditRecord = {
      id: Date.now().toString(),
      companyName,
      name: candidateName,
      passport: passportNumber,
      nationality,
      date: new Date().toLocaleString(),
      ...auditData
    };
    const updated = [newRecord, ...history.slice(0, 99)];
    setHistory(updated);
    localStorage.setItem('alhadab_audit_history', JSON.stringify(updated));
    
    // Reset
    setCandidateName('');
    setPassportNumber('');
    setAuditData({
      wafid: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
      takamol: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
      enjaz: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
    });
    setActiveStep(0);
  };

  const exportExcel = () => {
    if (history.length === 0) return;
    // @ts-ignore
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();
    const data = history.map((r, i) => ({
        "Sr": i + 1,
        "Date": r.date,
        "Name": r.name,
        "Passport": r.passport,
        "Medical": r.wafid.failed ? `FAILED: ${r.wafid.status}` : r.wafid.status,
        "Skill": r.takamol.failed ? `FAILED: ${r.takamol.status}` : r.takamol.status,
        "Visa": r.enjaz.failed ? `FAILED: ${r.enjaz.status}` : r.enjaz.status,
        "Notes": `${r.wafid.details} | ${r.takamol.details} | ${r.enjaz.details}`
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Audit Log");
    XLSX.writeFile(wb, `${companyName}_Verification_Log.xlsx`);
  };

  // --- Initial Setup Screen ---
  if (!companyName) {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md glass-card p-10 rounded-[40px] border border-cyan-400/20 shadow-2xl text-center flex flex-col gap-8">
                <div className="w-20 h-20 bg-cyan-400/10 rounded-3xl flex items-center justify-center mx-auto border border-cyan-400/30">
                    <Building2 size={40} className="text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">ALHADAB <span className="text-cyan-400">CONNECT</span></h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Initialize Agency Identity</p>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-left text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Company / Office Name</label>
                    <input 
                        value={tempCompany}
                        onChange={(e) => setTempCompany(e.target.value)}
                        placeholder="ENTER COMPANY NAME..."
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-cyan-400 transition-all"
                    />
                </div>
                <button 
                    onClick={handleSetCompany}
                    disabled={!tempCompany.trim()}
                    className="w-full py-5 bg-cyan-400 text-black font-black rounded-2xl hover:bg-cyan-300 transition-all shadow-lg disabled:opacity-20"
                >
                    INITIALIZE SYSTEM
                </button>
            </div>
        </div>
      );
  }

  const steps = [
    { label: 'MEDICAL', icon: Activity, key: 'wafid' },
    { label: 'SKILL', icon: Briefcase, key: 'takamol' },
    { label: 'VISA', icon: FileCheck, key: 'enjaz' }
  ];

  const currentResult = auditData[steps[activeStep].key as keyof typeof auditData];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-cyan-400/5 border border-cyan-400/10 px-4 py-1.5 rounded-full mb-4">
            <Building2 size={12} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{companyName} SYSTEM</span>
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter">PROCESS <span className="text-cyan-400">HUB</span></h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Applicant Data */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <UserPlus size={14} /> Applicant Identity
                </h3>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Candidate Name</label>
                        <input 
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            placeholder="FULL NAME"
                            className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-cyan-400 transition-all"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Passport Number</label>
                        <div className="flex gap-2">
                            <input 
                                value={passportNumber}
                                onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                                placeholder="ABC123456"
                                className="flex-1 bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-white font-mono font-bold outline-none focus:border-cyan-400 transition-all"
                            />
                            <button 
                                onClick={copyPassport}
                                disabled={!passportNumber}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border ${isCopied ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-cyan-400'}`}
                                title="Copy Passport Number"
                            >
                                {isCopied ? <Check size={18}/> : <Copy size={18}/>}
                            </button>
                        </div>
                        {isCopied && <span className="text-[8px] text-green-500 font-black uppercase mt-1 animate-fade-in">Number Copied to Clipboard</span>}
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Workflow Order</h3>
                {steps.map((step, i) => (
                    <button 
                        key={i}
                        onClick={() => !isStepLocked(i) && setActiveStep(i as any)}
                        disabled={isStepLocked(i)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden group ${activeStep === i ? 'bg-cyan-400 border-cyan-400 text-black' : isStepLocked(i) ? 'opacity-30 bg-slate-900 cursor-not-allowed' : 'bg-slate-900/50 border-white/5 text-slate-400'}`}
                    >
                        <step.icon size={16} />
                        <span className="text-[10px] font-black">{step.label}</span>
                        {isStepLocked(i) && <Lock size={12} className="ml-auto opacity-40" />}
                        {auditData[step.key as keyof typeof auditData].verified && !auditData[step.key as keyof typeof auditData].failed && <CheckCircle size={14} className="ml-auto text-green-500" />}
                        {auditData[step.key as keyof typeof auditData].failed && <AlertOctagon size={14} className="ml-auto text-red-500" />}
                    </button>
                ))}
            </div>

            <button onClick={exportExcel} className="w-full py-4 bg-white text-black font-black rounded-2xl text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                <FileSpreadsheet size={16} /> Export {companyName} Log
            </button>
        </div>

        {/* Center: Active Bridge */}
        <div className="lg:col-span-6">
            <div className="glass-card p-8 rounded-[40px] border border-white/10 shadow-2xl min-h-[600px] flex flex-col">
                
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                    <div>
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Active Verification</span>
                        <h2 className="text-3xl font-black text-white">{getStepName(activeStep)}</h2>
                    </div>
                    {currentResult.failed && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-2">
                           <Ban size={12} /> PROCESS HALTED
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6 flex-1">
                    {(!candidateName || !passportNumber) ? (
                        <div className="flex flex-col items-center justify-center gap-6 py-20 animate-fade-in text-center">
                            <User size={64} className="text-slate-800" />
                            <div>
                                <h3 className="text-white font-black text-xl">Incomplete Profile</h3>
                                <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Enter Applicant Name and Passport No to start</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {activeStep === 1 && (
                                <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 animate-slide-up mb-4">
                                    <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-2 block">Skill Code Library</span>
                                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                        {TAKAMOL_CODES.map(c => (
                                            <button 
                                                key={c.code}
                                                onClick={() => navigator.clipboard.writeText(c.code)}
                                                className="bg-white/5 hover:bg-yellow-400 hover:text-black border border-white/5 rounded-lg px-3 py-1.5 text-[8px] font-bold text-slate-400 transition-all flex flex-col items-start"
                                            >
                                                <span>{c.name}</span>
                                                <span className="opacity-50">{c.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={() => runStepCheck(activeStep)}
                                    disabled={isSearching || currentResult.failed}
                                    className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:-translate-y-1 transition-all disabled:opacity-20"
                                >
                                    {isSearching ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                                    {isSearching ? 'SEARCHING PORTAL...' : `INITIATE ${steps[activeStep].label} CHECK`}
                                </button>
                                
                                {passportNumber && (
                                    <button 
                                        onClick={copyPassport}
                                        className="w-full py-3 bg-slate-900 border border-white/10 text-slate-400 font-bold rounded-xl text-[10px] uppercase hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <Copy size={12}/> Copy Passport No: {passportNumber}
                                    </button>
                                )}
                            </div>

                            {(currentResult.sourceUrl || currentResult.status.includes('CAPTCHA')) && (
                                <div className="mt-6 p-6 bg-slate-900 border border-white/5 rounded-3xl animate-fade-in flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-yellow-500 uppercase flex items-center gap-2"><Lock size={12}/> PORTAL BRIDGE</span>
                                        <a href={currentResult.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-cyan-400 flex items-center gap-1 hover:underline">
                                            <ExternalLink size={12}/> GO TO PORTAL
                                        </a>
                                    </div>
                                    <p className="text-[9px] text-slate-500 uppercase font-bold">1. Solve CAPTCHA. 2. Copy all result text. 3. Paste below.</p>
                                    <textarea 
                                        value={pastedText}
                                        onChange={(e) => setPastedText(e.target.value)}
                                        placeholder="PASTE PORTAL TEXT..."
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 font-mono h-24 focus:border-cyan-400 outline-none"
                                    />
                                    <button 
                                        onClick={handleManualExtraction}
                                        disabled={isParsing || !pastedText}
                                        className="w-full py-4 bg-cyan-400 text-black font-black rounded-xl text-[10px] hover:bg-cyan-300 transition-all disabled:opacity-20"
                                    >
                                        {isParsing ? <Loader2 className="animate-spin" size={14}/> : 'VERIFY & EXTRACT STATUS'}
                                    </button>
                                </div>
                            )}

                            {currentResult.verified && (
                                <div className={`mt-auto p-8 rounded-[32px] border-2 shadow-2xl animate-pop-in flex flex-col items-center gap-3 text-center ${currentResult.failed ? 'bg-red-500/5 border-red-500/30' : 'bg-green-500/5 border-green-500/30'}`}>
                                    {currentResult.failed ? <AlertOctagon size={48} className="text-red-500" /> : <CheckCircle2 size={48} className="text-green-500" />}
                                    <h4 className={`text-6xl font-black tracking-tighter ${currentResult.failed ? 'text-red-500' : 'text-green-500'}`}>
                                        {currentResult.status}
                                    </h4>
                                    <p className="text-xs text-slate-400 font-bold italic">"{currentResult.details}"</p>
                                    
                                    {!currentResult.failed && activeStep < 2 && (
                                        <button 
                                            onClick={() => setActiveStep((activeStep + 1) as any)}
                                            className="mt-4 w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black flex items-center justify-center gap-2 group transition-all text-xs"
                                        >
                                            PROCEED TO NEXT STEP <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    )}

                                    {currentResult.failed && (
                                        <button 
                                            onClick={() => {
                                                setCandidateName('');
                                                setPassportNumber('');
                                                setAuditData({
                                                    wafid: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
                                                    takamol: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
                                                    enjaz: { status: 'PENDING', details: '', sourceUrl: '', verified: false, failed: false },
                                                });
                                                setActiveStep(0);
                                            }}
                                            className="mt-4 w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs"
                                        >
                                            REJECT & RESET APPLICANT
                                        </button>
                                    )}

                                    {activeStep === 2 && currentResult.verified && !currentResult.failed && (
                                        <button onClick={finalizeAudit} className="mt-4 w-full py-4 bg-green-500 text-black font-black rounded-2xl text-xs">
                                            COMPLETE & LOG APPLICANT
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Right: Record History */}
        <div className="lg:col-span-3">
            <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col gap-4 h-full bg-slate-900/50">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} /> Global Record
                </h3>
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[700px] custom-scrollbar pr-1">
                    {history.map(record => (
                        <div key={record.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-3 group hover:border-cyan-400/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-[10px] uppercase">{record.name}</span>
                                    <span className="text-[8px] text-slate-600 font-mono">{record.passport}</span>
                                </div>
                                <span className="text-[7px] text-slate-700 font-mono">{record.date.split(',')[0]}</span>
                            </div>
                            <div className="flex gap-1.5">
                                <StatusDot status={record.wafid} />
                                <StatusDot status={record.takamol} />
                                <StatusDot status={record.enjaz} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatusDot = ({ status }: { status: StepResult }) => {
    const color = status.failed ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : status.verified ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-slate-800';
    return <div className={`flex-1 h-1 rounded-full ${color}`} title={status.status}></div>;
};
