import React, { useState } from 'react';
import { ScanLine, Upload, Layers, Download, RefreshCw, X, AlertCircle } from 'lucide-react';
import { generateEnhancedDocument, helperFileToBase64 } from '../services/geminiService';

export const DocuScan: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const process = async () => {
      if (!image) return;
      setLoading(true);
      try {
          const base64 = await helperFileToBase64(image);
          const res = await generateEnhancedDocument(base64, image.type);
          setResults(res);
      } catch (e) { alert("Failed"); }
      finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, color: 'white' }}>DocuScan <span style={{ color: 'var(--color-green)' }}>AI</span></h1>
        
        {!image ? (
            <div className="upload-box" style={{ width: '100%', maxWidth: '40rem' }} onClick={() => document.getElementById('scan-up')?.click()}>
                <input id="scan-up" type="file" className="hidden" onChange={e => e.target.files && setImage(e.target.files[0])} />
                <Upload size={40} color="var(--color-green)" />
                <h3>Upload Document Photo</h3>
            </div>
        ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <img src={URL.createObjectURL(image)} style={{ maxWidth: '400px', borderRadius: '1rem', border: '1px solid white' }} />
                <button onClick={process} className="btn" style={{ background: 'var(--color-green)', color: 'black', padding: '1rem 3rem' }}>{loading ? 'SCANNING...' : 'START SCAN'}</button>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%' }}>
                    {results.map((r, i) => (
                        <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <img src={`data:image/png;base64,${r}`} style={{ width: '100%' }} />
                            <div style={{ padding: '1rem' }}>
                                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { const l=document.createElement('a'); l.href=`data:image/png;base64,${r}`; l.download='scan.jpg'; l.click(); }}>Download</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};