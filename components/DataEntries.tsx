import React, { useState, useEffect, useRef } from 'react';
import { Database, Save, Download, FileSpreadsheet, Plus, Search, Trash2, MapPin, Phone, Briefcase, User, Calendar, FileText, Upload, AlertCircle } from 'lucide-react';

// --- Types ---
interface WorkerEntry {
  id: string;
  date: string; // ISO Date String (YYYY-MM-DD)
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

// --- Data Constants ---
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
  // --- State ---
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

  // --- Persistence ---
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

  // --- Handlers ---
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

    // Add to top of list
    const updatedEntries = [newEntry, ...entries];
    saveToStorage(updatedEntries);
    
    // Reset Form
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

  // --- Excel Import Logic ---
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
              
              // Assume first sheet is Master
              const wsName = wb.SheetNames[0];
              const ws = wb.Sheets[wsName];
              const data = XLSX.utils.sheet_to_json(ws);

              // Map generic excel data to our schema if possible
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
              })).filter((e: WorkerEntry) => e.name); // Filter empty rows

              // Merge logic: Don't duplicate if exact name+phone matches? 
              // For simplicity, we append imported entries to existing ones.
              const merged = [...entries, ...importedEntries];
              saveToStorage(merged);
              setImportStatus(`Successfully imported ${importedEntries.length} records from ${file.name}`);
          } catch (err) {
              console.error(err);
              alert("Failed to parse Excel file.");
          }
      };
      reader.readAsBinaryString(file);
  };

  // --- Excel Export Logic with Sr No & Formatting ---
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
    
    // 1. Prepare Master Sheet Data (Sorted by Date descending)
    const masterData = prepareDataForSheet([...entries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // 2. Prepare Daily Sheets (Grouped by Date)
    const grouped: Record<string, any[]> = {};
    entries.forEach(entry => {
        if (!grouped[entry.date]) grouped[entry.date] = [];
        grouped[entry.date].push(entry);
    });

    const wb = XLSX.utils.book_new();

    // Add Master Sheet
    const wsMaster = XLSX.utils.json_to_sheet(masterData);
    
    // Basic Column Widths
    const wscols = [
        { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 6 }, 
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
    ];
    wsMaster['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(wb, wsMaster, "Master Database");

    // Add Daily Sheets
    Object.keys(grouped).sort().reverse().forEach(date => {
        const sheetData = prepareDataForSheet(grouped[date]);
        const wsDaily = XLSX.utils.json_to_sheet(sheetData);
        wsDaily['!cols'] = wscols;
        XLSX.utils.book_append_sheet(wb, wsDaily, date);
    });

    // Write File
    XLSX.writeFile(wb, `Bhattis_Worker_Database_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Filtering ---
  const filteredEntries = entries.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone1.includes(searchTerm)
  );

  return (
    <div className="w-full min-h-screen p-6 md:p-12 max-w-[1800px] mx-auto animate-fade-in flex flex-col xl:flex-row gap-8">
      
      {/* LEFT: Data Entry Form */}
      <div className="w-full xl:w-1/3 space-y-6">
        <div className="bg-[#0f172a] border border-white/10 p-6 rounded-2xl shadow-xl sticky top-24">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <div className="p-2 bg-[#00f3ff]/10 rounded-lg">
                    <Database className="w-6 h-6 text-[#00f3ff]" />
                </div>
                <h2 className="text-xl font-bold text-white">Data Entry</h2>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-bold uppercase">Name *</label>
                        <div className="relative">
                            <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 pl-9 text-white focus:border-[#00f3ff] outline-none" placeholder="Full Name" />
                            <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-bold uppercase">Father Name</label>
                        <input name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:border-[#00f3ff] outline-none" placeholder="Father Name" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-1">
                        <label className="text-xs text-slate-400 font-bold uppercase">Age</label>
                        <input name="age" type="number" value={formData.age} onChange={handleInputChange} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:border-[#00f3ff] outline-none" placeholder="25" />
                    </div>
                    <div className="space-y-1 col-span-2">
                         <label className="text-xs text-slate-400 font-bold uppercase">Phone 1 *</label>
                         <div className="relative">
                            <input name="phone1" value={formData.phone1} onChange={handleInputChange} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 pl-9 text-white focus:border-[#00f3ff] outline-none" placeholder="0300-1234567" />
                            <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-1">
                         <label className="text-xs text-slate-400 font-bold uppercase">Trade *</label>
                         <div className="relative">
                            <input list="trades-list" name="trade" value={formData.trade} onChange={handleInputChange} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 pl-9 text-white focus:border-[#00f3ff] outline-none" placeholder="Select or Type Trade" />
                            <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                            <datalist id="trades-list">
                                {TRADES.map(t => <option key={t} value={t} />)}
                            </datalist>
                         </div>
                    </div>
                </div>

                {/* Location Cascading Dropdowns */}
                <div className="space-y-3 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                    <label className="text-xs text-[#00f3ff] font-bold uppercase flex items-center gap-2"><MapPin className="w-3 h-3"/> Address Details</label>
                    <div className="grid grid-cols-2 gap-3">
                         <select name="province" value={formData.province} onChange={handleInputChange} className="bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-[#00f3ff] outline-none">
                             <option value="">Select Province</option>
                             {Object.keys(LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                         <select name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.province} className="bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-[#00f3ff] outline-none disabled:opacity-50">
                             <option value="">Select District</option>
                             {formData.province && Object.keys(LOCATIONS[formData.province]).map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                    </div>
                    <select name="city" value={formData.city} onChange={handleInputChange} disabled={!formData.district} className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-[#00f3ff] outline-none disabled:opacity-50">
                         <option value="">Select City</option>
                         {formData.district && LOCATIONS[formData.province][formData.district].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase">Remarks</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:border-[#00f3ff] outline-none h-20 resize-none" placeholder="Any additional notes..." />
                </div>

                <button 
                    onClick={handleSaveEntry}
                    className="w-full py-4 bg-[#00f3ff] hover:bg-[#00c2cc] text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                    <Save className="w-5 h-5" /> SAVE & UPDATE
                </button>
            </div>
        </div>
      </div>

      {/* RIGHT: Data Table & Actions */}
      <div className="flex-1 space-y-6">
          
          {/* Actions Bar */}
          <div className="bg-[#0f172a] border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center sticky top-24 z-20">
              <div className="relative w-full md:w-64">
                  <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, trade, phone..."
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-[#00f3ff] outline-none"
                  />
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              </div>

              <div className="flex items-center gap-3">
                  {/* File Upload Hidden */}
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    ref={fileInputRef} 
                    className="hidden"
                    onChange={handleImportExcel}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 border border-white/10 hover:bg-white/5 text-slate-300 font-bold rounded-lg flex items-center gap-2 transition-colors"
                    title="Import existing Excel sheet"
                  >
                     <Upload className="w-4 h-4" /> Import Master
                  </button>

                  <button 
                    onClick={exportAllSheets}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-lg"
                  >
                     <FileSpreadsheet className="w-4 h-4" /> Export All Sheets
                  </button>
              </div>
          </div>

          {importStatus && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4" /> {importStatus}
              </div>
          )}

          {/* Table */}
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-300">
                     <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-400">
                         <tr>
                             <th className="p-4 border-b border-white/10 w-16">Sr No</th>
                             <th className="p-4 border-b border-white/10">Date</th>
                             <th className="p-4 border-b border-white/10">Name</th>
                             <th className="p-4 border-b border-white/10">Trade</th>
                             <th className="p-4 border-b border-white/10">Contact</th>
                             <th className="p-4 border-b border-white/10">Location</th>
                             <th className="p-4 border-b border-white/10 text-right">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                         {filteredEntries.map((entry, index) => (
                             <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                 <td className="p-4 text-slate-500">{entries.length - index}</td>
                                 <td className="p-4 font-mono text-xs text-slate-500">{entry.date}</td>
                                 <td className="p-4 font-bold text-white">{entry.name} <span className="text-xs font-normal text-slate-500 block">{entry.fatherName}</span></td>
                                 <td className="p-4">
                                     <span className="px-2 py-1 bg-[#00f3ff]/10 text-[#00f3ff] rounded border border-[#00f3ff]/30 text-xs font-bold">
                                         {entry.trade}
                                     </span>
                                 </td>
                                 <td className="p-4">{entry.phone1}</td>
                                 <td className="p-4 text-xs">{entry.city}, {entry.province}</td>
                                 <td className="p-4 text-right">
                                     <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                         {filteredEntries.length === 0 && (
                             <tr>
                                 <td colSpan={8} className="p-12 text-center text-slate-500 italic">
                                     No entries found.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
          </div>

          <div className="text-center text-slate-500 text-xs">
              Total Records: {entries.length} | Database stored locally in your browser.
          </div>
      </div>
    </div>
  );
};