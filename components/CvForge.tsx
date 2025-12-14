import React, { useState, useRef, useEffect } from 'react';
import { FileText, Plus, Trash2, Zap, Briefcase, GraduationCap, User, Globe, Download, Sparkles, Target, AlertTriangle, Eraser, Layout, ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react';
import { generateCvHtml, generateIdentityPhoto, helperFileToBase64, validateFieldWithAI } from '../services/geminiService';

const InputField = ({ label, name, value, onChange, type = "text", placeholder }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</label>
    <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} className="input-field" />
  </div>
);

export const CvForge: React.FC = () => {
  const [jobRole, setJobRole] = useState(''); 
  const [personalInfo, setPersonalInfo] = useState({ name: '', fatherName: '', phone: '', email: '', address: '', cnic: '', dob: '' });
  const [education, setEducation] = useState([{ degree: '', school: '', year: '' }]);
  const [experience, setExperience] = useState([{ title: '', company: '', years: '' }]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInfoChange = (e: any) => setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  
  const generateCV = async () => {
      setIsGenerating(true);
      try {
          const html = await generateCvHtml({ jobRole, personalInfo, education, experience });
          setPreviewHtml(html);
      } catch (e) {
          alert("Failed to generate.");
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="text-center">
            <h1 className="text-neon" style={{ fontSize: '3rem', fontWeight: 700 }}>CV FORGE PRO</h1>
            <p className="text-muted">AI-Architected Professional Resumes</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target color="var(--color-cyan)" /> Target Position
                    </h3>
                    <input value={jobRole} onChange={e => setJobRole(e.target.value)} className="input-field" style={{ fontSize: '1.25rem', fontWeight: 700 }} placeholder="e.g. Civil Engineer" />
                </div>

                <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InputField label="Name" name="name" value={personalInfo.name} onChange={handleInfoChange} />
                    <InputField label="Phone" name="phone" value={personalInfo.phone} onChange={handleInfoChange} />
                    <InputField label="Email" name="email" value={personalInfo.email} onChange={handleInfoChange} />
                    <InputField label="CNIC" name="cnic" value={personalInfo.cnic} onChange={handleInfoChange} />
                </div>

                <button onClick={generateCV} className="btn btn-primary" style={{ padding: '1.5rem', fontSize: '1.25rem' }}>
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Zap fill="black" />} GENERATE CV
                </button>
            </div>

            <div className="card" style={{ background: '#0a0f1e', minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {previewHtml ? (
                    <iframe srcDoc={previewHtml} style={{ width: '100%', height: '100%', border: 'none', background: 'white' }} />
                ) : (
                    <div className="text-muted" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Layout size={64} style={{ opacity: 0.2 }} />
                        <p>Preview will appear here</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};