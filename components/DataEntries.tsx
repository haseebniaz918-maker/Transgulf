import React, { useState, useEffect, useRef } from 'react';
import { Database, Save, FileSpreadsheet, Search, Trash2, MapPin, Phone, Briefcase, User, Upload, AlertCircle } from 'lucide-react';

interface WorkerEntry {
  id: string;
  date: string;
  name: string;
  fatherName: string;
  age: string;
  phone1: string;
  phone2: string;
  trade: string;
  province: string;
  district: string;
  city: string;
  remarks: string;
}

const TRADES = [
  "Electrician", "Plumber", "Mason", "Steel Fixer", "Shuttering Carpenter", 
  "Welder (3G/4G)", "Welder (6G)", "Fabricator", "Pipe Fitter", "AC Technician", 
  "HVAC Technician", "Painter (Wall)", "Painter (Spray)", "Driver (LTV)", "Driver (HTV)",
  "Heavy Equipment Operator", "Crane Operator", "Forklift Operator", "Labor/Helper",
  "Store Keeper", "Safety Officer", "Foreman (Civil)", "Foreman (Electrical)", "Foreman (Mechanical)",
  "Supervisor", "Civil Engineer", "Electrical Engineer", "Mechanical Engineer", "Accountant"
];

const LOCATIONS: Record<string, Record<string, string[]>> = {
  "Punjab": {
    "Lahore": ["Lahore City", "Cantt", "Model Town", "Raiwind"],
    "Rawalpindi": ["Rawalpindi", "Murree", "Taxila", "Gujar Khan"],
    "Faisalabad": ["Faisalabad", "Jaranwala", "Samundri"],
    "Multan": ["Multan", "Shujabad"],
    "Gujranwala": ["Gujranwala", "Wazirabad", "Kamoke"],
    "Attock": ["Attock", "Fateh Jang", "Hassan Abdal", "Jand"],
    "Sialkot": ["Sialkot", "Daska", "Pasrur"],
    "Sargodha": ["Sargodha", "Bhalwal"]
  },
  "Sindh": {
    "Karachi": ["Karachi Central", "Karachi East", "Karachi South", "Malir", "Korangi"],
    "Hyderabad": ["Hyderabad", "Latifabad"],
    "Sukkur": ["Sukkur", "Rohri"],
    "Larkana": ["Larkana", "Ratodero"]
  },
  "KPK": {
    "Peshawar": ["Peshawar"],
    "Mardan": ["Mardan", "Takht Bhai"],
    "Swat": ["Mingora", "Saidu Sharif"],
    "Abbottabad": ["Abbottabad", "Havelian"],
    "Kohat": ["Kohat"]
  },
  "Balochistan": {
    "Quetta": ["Quetta"],
    "Gwadar": ["Gwadar"],
    "Khuzdar": ["Khuzdar"]
  },
  "Islamabad": {
    "Islamabad": ["Islamabad"]
  }
};

export const DataEntries: React.FC = () => {
  const [entries, setEntries] = useState<WorkerEntry[]>([]);
  const [formData, setFormData] = useState<Omit<WorkerEntry, 'id' | 'date'>>({
    name: '',
    fatherName: '',
    age: '',
    phone1: '',
    phone2: '',
    trade: '',
    province: '',
    district: '',
    city: '',
    remarks: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('bhattis_data_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load entries", e);
      }
    }
  }, []);

  const saveToStorage = (newEntries: WorkerEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('bhattis_data_entries', JSON.stringify(newEntries));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'province') {
        setFormData(prev => ({ ...prev, province: value, district: '', city: '' }));
    } else if (name === 'district') {
        setFormData(prev => ({ ...prev, district: value, city: '' }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveEntry = () => {
    if (!formData.name || !formData.phone1 || !formData.trade) {
        alert("Please fill required fields (Name, Phone, Trade).");
        return;
    }

    const newEntry: WorkerEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        ...formData
    };

    const updatedEntries = [newEntry, ...entries];
    saveToStorage(updatedEntries);
    
    setFormData({
        name: '', fatherName: '', age: '', phone1: '', phone2: '', 
        trade: '', province: '', district: '', city: '', remarks: ''
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
        const updated = entries.filter(e => e.id !== id);
        saveToStorage(updated);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const bstr = evt.target?.result;
              // @ts-ignore
              const XLSX = window.XLSX;
              const wb = XLSX.read(bstr, { type: 'binary' });
              
              const wsName = wb.SheetNames[0];
              const ws = wb.Sheets[wsName];
              const data = XLSX.utils.sheet_to_json(ws);

              const importedEntries: WorkerEntry[] = data.map((row: any, idx: number) => ({
                  id: `imported-${Date.now()}-${idx}`,
                  date: row['Date'] || row['date'] || new Date().toISOString().split('T')[0],
                  name: row['Name'] || row['name'] || '',
                  fatherName: row['Father Name'] || row['fatherName'] || '',
                  age: row['Age'] || row['age'] || '',
                  phone1: row['Contact 1'] || row['phone1'] || '',
                  phone2: row['Contact 2'] || row['phone2'] || '',
                  trade: row['Trade'] || row['trade'] || '',
                  province: row['Province'] || row['province'] || '',
                  district: row['District'] || row['district'] || '',
                  city: row['City'] || row['city'] || '',
                  remarks: row['Remarks'] || row['remarks'] || ''
              })).filter((e: WorkerEntry) => e.name);

              const existingKeys = new Set(entries.map(e => `${e.name}|${e.phone1}`));
              const newUniqueEntries = importedEntries.filter(e => !existingKeys.has(`${e.name}|${e.phone1}`));
              
              const merged = [...newUniqueEntries, ...entries];
              saveToStorage(merged);
              setImportStatus(`Imported ${newUniqueEntries.length} new records (Skipped ${importedEntries.length - newUniqueEntries.length} duplicates) from ${file.name}`);
          } catch (err) {
              console.error(err);
              alert("Failed to parse Excel file.");
          }
      };
      reader.readAsBinaryString(file);
  };

  const prepareDataForSheet = (data: WorkerEntry[]) => {
      return data.map((entry, index) => ({
          "Sr No": index + 1,
          "Date": entry.date,
          "Name": entry.name,
          "Father Name": entry.fatherName,
          "Age": entry.age,
          "Contact 1": entry.phone1,
          "Contact 2": entry.phone2,
          "Trade": entry.trade,
          "Province": entry.province,
          "District": entry.district,
          "City": entry.city,
          "Remarks": entry.remarks
      }));
  };

  const exportAllSheets = () => {
    if (entries.length === 0) return alert("No data to export.");
    // @ts-ignore
    const XLSX = window.XLSX;
    
    const wb = XLSX.utils.book_new();

    const masterData = prepareDataForSheet([...entries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const wsMaster = XLSX.utils.json_to_sheet(masterData);
    
    const wscols = [
        { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 6 }, 
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
    ];
    wsMaster['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(wb, wsMaster, "Master Database");

    const grouped: Record<string, any[]> = {};
    entries.forEach(entry => {
        if (!grouped[entry.date]) grouped[entry.date] = [];
        grouped[entry.date].push(entry);
    });

    Object.keys(grouped).sort().reverse().forEach(date => {
        const sheetData = prepareDataForSheet(grouped[date]);
        const wsDaily = XLSX.utils.json_to_sheet(sheetData);
        wsDaily['!cols'] = wscols;
        XLSX.utils.book_append_sheet(wb, wsDaily, date);
    });

    XLSX.writeFile(wb, `Bhattis_Worker_Database_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredEntries = entries.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone1.includes(searchTerm)
  );

  return (
    <div className="data-layout animate-fade-in">
      
      {/* LEFT: Data Entry Form */}
      <div className="data-form">
        <div className="card" style={{ position: 'sticky', top: '6rem' }}>
            <div className="flex items-center gap-2 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(0,243,255,0.1)', borderRadius: '0.5rem' }}>
                    <Database size={24} color="var(--color-cyan)" />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Data Entry</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Name *</label>
                        <div className="relative">
                            <input name="name" value={formData.name} onChange={handleInputChange} className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="Full Name" />
                            <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.9rem', color: '#64748b' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Father Name</label>
                        <input name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="input-field" placeholder="Father Name" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Age</label>
                        <input name="age" type="number" value={formData.age} onChange={handleInputChange} className="input-field" placeholder="25" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                         <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Phone 1 *</label>
                         <div className="relative">
                            <input name="phone1" value={formData.phone1} onChange={handleInputChange} className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="0300-1234567" />
                            <Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.9rem', color: '#64748b' }} />
                         </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                     <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Trade *</label>
                     <div className="relative">
                        <input list="trades-list" name="trade" value={formData.trade} onChange={handleInputChange} className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="Select or Type Trade" />
                        <Briefcase size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.9rem', color: '#64748b' }} />
                        <datalist id="trades-list">
                            {TRADES.map(t => <option key={t} value={t} />)}
                        </datalist>
                     </div>
                </div>

                {/* Location Cascading Dropdowns */}
                <div style={{ padding: '1rem', background: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={12}/> Address Details</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                         <select name="province" value={formData.province} onChange={handleInputChange} className="input-field">
                             <option value="">Select Province</option>
                             {Object.keys(LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                         <select name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.province} className="input-field" style={{ opacity: !formData.province ? 0.5 : 1 }}>
                             <option value="">Select District</option>
                             {formData.province && Object.keys(LOCATIONS[formData.province]).map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                    </div>
                    <select name="city" value={formData.city} onChange={handleInputChange} disabled={!formData.district} className="input-field" style={{ opacity: !formData.district ? 0.5 : 1 }}>
                         <option value="">Select City</option>
                         {formData.district && LOCATIONS[formData.province][formData.district].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Remarks</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="input-field" style={{ height: '5rem', resize: 'none' }} placeholder="Any additional notes..." />
                </div>

                <button 
                    onClick={handleSaveEntry}
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                >
                    <Save size={20} /> SAVE & UPDATE
                </button>
            </div>
        </div>
      </div>

      {/* RIGHT: Data Table & Actions */}
      <div className="data-table-container">
          
          {/* Actions Bar */}
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', position: 'sticky', top: '6rem', zIndex: 20 }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <div className="relative" style={{ width: '100%', maxWidth: '16rem' }}>
                      <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="input-field"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                      <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.9rem', color: '#64748b' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        ref={fileInputRef} 
                        className="hidden"
                        onChange={handleImportExcel}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#cbd5e1', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem' }}
                        title="Import existing Excel sheet"
                      >
                         <Upload size={16} /> Import
                      </button>

                      <button 
                        onClick={exportAllSheets}
                        style={{ padding: '0.75rem 1rem', background: 'var(--color-green)', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem' }}
                      >
                         <FileSpreadsheet size={16} /> Export Sheets
                      </button>
                  </div>
              </div>
              
              {importStatus && (
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--color-green)', padding: '0.75rem', borderRadius: '0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} /> {importStatus}
                  </div>
              )}
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
             <div style={{ overflowX: 'auto' }}>
                 <table className="data-table">
                     <thead style={{ background: 'var(--color-slate-900)' }}>
                         <tr>
                             <th>Sr No</th>
                             <th>Date</th>
                             <th>Name</th>
                             <th>Trade</th>
                             <th>Contact</th>
                             <th>Location</th>
                             <th style={{ textAlign: 'right' }}>Action</th>
                         </tr>
                     </thead>
                     <tbody>
                         {filteredEntries.map((entry, index) => (
                             <tr key={entry.id}>
                                 <td style={{ color: 'var(--color-text-muted)' }}>{entries.length - index}</td>
                                 <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{entry.date}</td>
                                 <td style={{ color: 'white', fontWeight: 700 }}>{entry.name} <span style={{ display: 'block', fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{entry.fatherName}</span></td>
                                 <td>
                                     <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(0,243,255,0.1)', color: 'var(--color-cyan)', borderRadius: '0.25rem', border: '1px solid rgba(0,243,255,0.3)', fontSize: '0.75rem', fontWeight: 700 }}>
                                         {entry.trade}
                                     </span>
                                 </td>
                                 <td>{entry.phone1}</td>
                                 <td style={{ fontSize: '0.75rem' }}>{entry.city}, {entry.province}</td>
                                 <td style={{ textAlign: 'right' }}>
                                     <button onClick={() => handleDelete(entry.id)} style={{ color: 'var(--color-red)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                                         <Trash2 size={16} />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                         {filteredEntries.length === 0 && (
                             <tr>
                                 <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                     No entries found.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
              Total Records: {entries.length} | Database stored locally in your browser.
          </div>
      </div>
    </div>
  );
};