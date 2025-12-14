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
    <div className="flex flex-col xl:flex-row gap-8 animate-fade-in pb-20">
      
      {/* LEFT: Data Entry Form */}
      <div className="flex-1 xl:max-w-md">
        <div className="glass-card p-6 rounded-2xl sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="p-2 bg-cyan-400/10 rounded-lg">
                    <Database size={24} className="text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Data Entry</h2>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name *</label>
                        <div className="relative">
                            <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-400 focus:outline-none" placeholder="Full Name" />
                            <User size={16} className="absolute left-3 top-2.5 text-slate-500" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Father Name</label>
                        <input name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none" placeholder="Father Name" />
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_2fr] gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age</label>
                        <input name="age" type="number" value={formData.age} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none" placeholder="25" />
                    </div>
                    <div className="flex flex-col gap-1">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone 1 *</label>
                         <div className="relative">
                            <input name="phone1" value={formData.phone1} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-400 focus:outline-none" placeholder="0300-1234567" />
                            <Phone size={16} className="absolute left-3 top-2.5 text-slate-500" />
                         </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trade *</label>
                     <div className="relative">
                        <input list="trades-list" name="trade" value={formData.trade} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-400 focus:outline-none" placeholder="Select or Type Trade" />
                        <Briefcase size={16} className="absolute left-3 top-2.5 text-slate-500" />
                        <datalist id="trades-list">
                            {TRADES.map(t => <option key={t} value={t} />)}
                        </datalist>
                     </div>
                </div>

                {/* Location Cascading Dropdowns */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 flex flex-col gap-3">
                    <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2"><MapPin size={12}/> Address Details</label>
                    <div className="grid grid-cols-2 gap-3">
                         <select name="province" value={formData.province} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none">
                             <option value="">Select Province</option>
                             {Object.keys(LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                         <select name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.province} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none disabled:opacity-50">
                             <option value="">Select District</option>
                             {formData.province && Object.keys(LOCATIONS[formData.province]).map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                    </div>
                    <select name="city" value={formData.city} onChange={handleInputChange} disabled={!formData.district} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-400 outline-none disabled:opacity-50">
                         <option value="">Select City</option>
                         {formData.district && LOCATIONS[formData.province][formData.district].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remarks</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none h-20 resize-none" placeholder="Any additional notes..." />
                </div>

                <button 
                    onClick={handleSaveEntry}
                    className="w-full mt-2 py-3 bg-cyan-400 hover:bg-[#00c2cc] text-black font-bold rounded-xl shadow-neon transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                    <Save size={20} /> SAVE & UPDATE
                </button>
            </div>
        </div>
      </div>

      {/* RIGHT: Data Table & Actions */}
      <div className="flex-[2] flex flex-col gap-6">
          
          {/* Actions Bar */}
          <div className="glass-card p-4 flex flex-col gap-4 sticky top-24 z-20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="relative w-full max-w-xs">
                      <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-slate-950 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                      />
                      <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                  </div>

                  <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        ref={fileInputRef} 
                        className="hidden"
                        onChange={handleImportExcel}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
                        title="Import existing Excel sheet"
                      >
                         <Upload size={16} /> Import
                      </button>

                      <button 
                        onClick={exportAllSheets}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg transition-transform hover:-translate-y-0.5"
                      >
                         <FileSpreadsheet size={16} /> Export Sheets
                      </button>
                  </div>
              </div>
              
              {importStatus && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
                      <AlertCircle size={16} /> {importStatus}
                  </div>
              )}
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden rounded-2xl border border-white/10">
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-900 text-xs uppercase text-slate-400 font-bold border-b border-white/10">
                         <tr>
                             <th className="p-4">Sr No</th>
                             <th className="p-4">Date</th>
                             <th className="p-4">Name</th>
                             <th className="p-4">Trade</th>
                             <th className="p-4">Contact</th>
                             <th className="p-4">Location</th>
                             <th className="p-4 text-right">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5 text-sm">
                         {filteredEntries.map((entry, index) => (
                             <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                 <td className="p-4 text-slate-500">{entries.length - index}</td>
                                 <td className="p-4 font-mono text-slate-400">{entry.date}</td>
                                 <td className="p-4">
                                     <div className="font-bold text-white">{entry.name}</div>
                                     <div className="text-xs text-slate-500">{entry.fatherName}</div>
                                 </td>
                                 <td className="p-4">
                                     <span className="px-2 py-1 bg-cyan-400/10 text-cyan-400 rounded border border-cyan-400/30 text-xs font-bold">
                                         {entry.trade}
                                     </span>
                                 </td>
                                 <td className="p-4 text-slate-300">{entry.phone1}</td>
                                 <td className="p-4 text-slate-400 text-xs">{entry.city}, {entry.province}</td>
                                 <td className="p-4 text-right">
                                     <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors">
                                         <Trash2 size={16} />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                         {filteredEntries.length === 0 && (
                             <tr>
                                 <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                                     No entries found.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
          </div>

          <div className="text-center text-xs text-slate-500 mt-4">
              Total Records: {entries.length} | Database stored locally in your browser.
          </div>
      </div>
    </div>
  );
};