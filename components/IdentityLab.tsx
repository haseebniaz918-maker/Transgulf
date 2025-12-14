import React, { useState } from 'react';
import { Upload, Sparkles, Fingerprint, Download, RefreshCw, X, AlertCircle, ArrowRight } from 'lucide-react';
import { generateIdentityPhoto, helperFileToBase64 } from '../services/geminiService';

export const IdentityLab: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
          setErrorMessage("Invalid file type.");
          return;
      }
      setOriginalImage(file);
      setGeneratedImageBase64(null);
      setErrorMessage(null);
    }
  };

  const processImage = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const base64 = await helperFileToBase64(originalImage);
      const resultBase64 = await generateIdentityPhoto(base64, originalImage.type);
      setGeneratedImageBase64(resultBase64);
    } catch (error: any) {
      setErrorMessage(error.message || "Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${generatedImageBase64}`;
    link.download = `identity_lab_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(255,0,255,0.1)', border: '1px solid rgba(255,0,255,0.3)', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(255,0,255,0.2)' }}>
          <Fingerprint size={40} color="#ff00ff" />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>
          IDENTITY <span style={{ color: '#ff00ff', textShadow: '0 0 20px #ff00ff' }}>LAB</span>
        </h1>
        <p className="text-muted" style={{ maxWidth: '40rem', margin: '0 auto', fontSize: '1.125rem' }}>
          AI-powered professional identity enhancement. Upload a casual photo and get a DSLR-quality passport photo with professional attire.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '500px' }}>
        
        {!originalImage ? (
          <div className="upload-box" style={{ width: '100%', maxWidth: '36rem', borderColor: 'rgba(255,0,255,0.3)' }} onClick={() => document.getElementById('id-upload')?.click()}>
            <input id="id-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <Upload size={32} color="#ff00ff" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Upload Photo</h3>
            <p className="text-muted">Drag & drop or click to browse</p>
          </div>
        ) : (!generatedImageBase64 && !isProcessing) ? (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '20rem', aspectRatio: '3/4', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,0,255,0.3)', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
              <img src={URL.createObjectURL(originalImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => setOriginalImage(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            {errorMessage && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={20} /> {errorMessage}
                </div>
            )}

            <button onClick={processImage} className="btn" style={{ background: '#ff00ff', color: 'black', boxShadow: '0 0 20px rgba(255,0,255,0.4)', padding: '1rem 3rem', fontSize: '1.125rem' }}>
                <Sparkles size={24} fill="black" /> ENHANCE IDENTITY
            </button>
          </div>
        ) : (
          <div className="animate-pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem', width: '100%' }}>
             <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', width: '100%' }}>
                
                {/* Original */}
                <div style={{ position: 'relative', width: '18rem', aspectRatio: '3/4', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={URL.createObjectURL(originalImage)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isProcessing ? 'grayscale(100%) opacity(0.5)' : 'none' }} />
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>ORIGINAL</div>
                    {isProcessing && (
                        <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', background: '#ff00ff', boxShadow: '0 0 15px #ff00ff', animation: 'slideUp 2s infinite linear alternate' }}></div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#ff00ff' }} className="hidden sm:flex">
                    <ArrowRight size={32} />
                </div>

                {/* Result */}
                <div style={{ position: 'relative', width: '18rem', aspectRatio: '3/4', borderRadius: '1rem', overflow: 'hidden', border: '2px solid #ff00ff', boxShadow: '0 0 30px rgba(255,0,255,0.2)' }}>
                    {isProcessing ? (
                        <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ff00ff' }}>
                            <div className="animate-spin" style={{ width: '3rem', height: '3rem', border: '3px solid rgba(255,0,255,0.3)', borderTopColor: '#ff00ff', borderRadius: '50%', marginBottom: '1rem' }}></div>
                            <span style={{ fontSize: '0.875rem', letterSpacing: '0.1em' }}>ENHANCING...</span>
                        </div>
                    ) : (
                        <>
                            <img src={`data:image/png;base64,${generatedImageBase64}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(255,0,255,0.8)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'white', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                <Sparkles size={12} fill="white" /> ENHANCED
                            </div>
                        </>
                    )}
                </div>
             </div>

             {!isProcessing && (
                 <div style={{ display: 'flex', gap: '1rem' }}>
                     <button onClick={() => { setGeneratedImageBase64(null); setOriginalImage(null); }} className="btn btn-secondary">
                        <RefreshCw size={20} /> New Scan
                     </button>
                     <button onClick={handleDownload} className="btn" style={{ background: '#ff00ff', color: 'black', padding: '0.75rem 2rem' }}>
                        <Download size={20} /> Download
                     </button>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};