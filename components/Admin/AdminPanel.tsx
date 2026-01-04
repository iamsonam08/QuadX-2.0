
import React, { useState, useRef } from 'react';
import { AppData, TimetableEntry, ExamSchedule, ScholarshipItem, InternshipItem, CampusEvent, Complaint } from '../../types';
import { extractCategoryData } from '../../services/geminiService';
import Logo from '../Logo';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  appData: AppData;
  setAppData: React.Dispatch<React.SetStateAction<AppData>>;
  onExit: () => void;
}

type AdminCategory = 'TIMETABLE' | 'SCHOLARSHIP' | 'EVENT' | 'EXAM' | 'INTERNSHIP' | 'CAMPUS_MAP' | 'COMPLAINTS';

const CATEGORY_MAP: Record<AdminCategory, { label: string, icon: string, color: string, dataKey: keyof AppData }> = {
  TIMETABLE: { label: 'Timetable', icon: 'fa-calendar-week', color: 'text-indigo-400', dataKey: 'timetable' },
  SCHOLARSHIP: { label: 'Scholarship', icon: 'fa-graduation-cap', color: 'text-amber-400', dataKey: 'scholarships' },
  EVENT: { label: 'Event Info', icon: 'fa-masks-theater', color: 'text-pink-400', dataKey: 'events' },
  EXAM: { label: 'Exam Info', icon: 'fa-file-signature', color: 'text-rose-400', dataKey: 'exams' },
  INTERNSHIP: { label: 'Internship', icon: 'fa-briefcase', color: 'text-cyan-400', dataKey: 'internships' },
  CAMPUS_MAP: { label: 'Campus Map', icon: 'fa-map-location-dot', color: 'text-lime-400', dataKey: 'rawKnowledge' },
  COMPLAINTS: { label: 'Complaints', icon: 'fa-box-archive', color: 'text-slate-400', dataKey: 'complaints' },
};

const AdminPanel: React.FC<AdminPanelProps> = ({ appData, setAppData, onExit }) => {
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [manualText, setManualText] = useState('');
  const [gDocUrl, setGDocUrl] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string, data: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;

    setIsProcessing(true);
    setStatusMsg(`Uploading ${file.name}...`);

    const reader = new FileReader();
    
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');
    const isPdf = file.type === 'application/pdf';

    reader.onload = async (event) => {
      let content = '';
      let mimeType = file.type;

      try {
        if (selectedCategory === 'CAMPUS_MAP' && file.type.startsWith('image/')) {
          const base64 = event.target?.result as string;
          setAppData(prev => ({ ...prev, campusMapImage: base64 }));
          setStatusMsg('Map visual deployed!');
          setIsProcessing(false);
          return;
        }

        if (isExcel || isCsv) {
          setStatusMsg('Parsing Spreadsheet...');
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: isExcel ? 'array' : 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          content = JSON.stringify(json, null, 2);
          mimeType = 'application/json';
        } else if (isPdf || file.type.startsWith('image/')) {
          content = event.target?.result as string;
        } else {
          content = event.target?.result as string;
        }

        setStatusMsg('AI Extraction Engine...');
        const extracted = await extractCategoryData(selectedCategory, content, mimeType);
        
        if (extracted && extracted.length > 0) {
          updateAppData(selectedCategory, extracted);
          setStatusMsg('Deployment Successful!');
        } else {
          setStatusMsg('No data extracted.');
        }
      } catch (err) {
        console.error(err);
        setStatusMsg('System Error.');
      } finally {
        setTimeout(() => { setIsProcessing(false); setStatusMsg(''); }, 2000);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else if (isPdf || file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleManualUpload = async () => {
    if (!manualText.trim() || !selectedCategory) return;
    setIsProcessing(true);
    setStatusMsg('AI Reasoning...');
    try {
      const extracted = await extractCategoryData(selectedCategory, manualText);
      if (extracted && extracted.length > 0) {
        updateAppData(selectedCategory, extracted);
        setStatusMsg('Synchronized!');
        setManualText('');
      } else {
        setStatusMsg('Parse failed.');
      }
    } catch (err) {
      setStatusMsg('Logic Error.');
    } finally {
      setTimeout(() => { setIsProcessing(false); setStatusMsg(''); }, 2000);
    }
  };

  const handleGDocSync = async () => {
    if (!gDocUrl.trim() || !selectedCategory) return;
    
    const docIdMatch = gDocUrl.match(/\/d\/(.*?)(\/|$)/);
    if (!docIdMatch) {
      alert("Please provide a valid Google Doc URL.");
      return;
    }

    setIsProcessing(true);
    setStatusMsg('Requesting Cloud Access...');

    try {
      const exportUrl = `https://docs.google.com/document/d/${docIdMatch[1]}/export?format=txt`;
      
      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error("Access Denied");

      const text = await response.text();
      setStatusMsg('Extracting from Cloud Doc...');
      const extracted = await extractCategoryData(selectedCategory, text);
      
      if (extracted && extracted.length > 0) {
        updateAppData(selectedCategory, extracted);
        setStatusMsg('Cloud Sync Complete!');
        setGDocUrl('');
      } else {
        setStatusMsg('Empty Document Content.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('CORS Lock. See Instructions.');
      setTimeout(() => {
        alert("Security restriction: Browsers block direct access to Google Docs. \n\nPlease either: \n1. Download Doc as PDF and upload here. \n2. Copy & Paste text into the manual box below.");
        setIsProcessing(false);
        setStatusMsg('');
      }, 1000);
    } finally {
      if (statusMsg !== 'CORS Lock. See Instructions.') {
        setTimeout(() => { setIsProcessing(false); setStatusMsg(''); }, 2000);
      }
    }
  };

  const updateAppData = (category: AdminCategory, items: any[]) => {
    setAppData(prev => {
      const newData = { ...prev };
      const key = CATEGORY_MAP[category].dataKey;
      
      if (category === 'TIMETABLE') {
        items.forEach((entry: TimetableEntry) => {
          const existingIdx = newData.timetable.findIndex(t => 
            t.day === entry.day && 
            t.branch === entry.branch && 
            t.year === entry.year && 
            t.division === entry.division
          );
          if (existingIdx !== -1) {
            newData.timetable[existingIdx].slots = [...newData.timetable[existingIdx].slots, ...entry.slots];
          } else {
            newData.timetable.push(entry);
          }
        });
      } else {
        (newData[key] as any) = [...(newData[key] as any), ...items];
      }
      
      newData.uploadLogs = [{
        id: Math.random().toString(36).substr(2, 9),
        fileName: `${CATEGORY_MAP[category].label} Deployment`,
        type: 'AI_SYNC',
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS'
      }, ...newData.uploadLogs];

      return newData;
    });
  };

  const deleteItem = (id: string) => {
    if (!selectedCategory) return;
    const key = CATEGORY_MAP[selectedCategory].dataKey;
    setAppData(prev => ({
      ...prev,
      [key]: (prev[key] as any[]).filter((item: any) => item.id !== id)
    }));
  };

  const toggleComplaintStatus = (id: string) => {
    setAppData(prev => ({
      ...prev,
      complaints: prev.complaints.map(c => 
        c.id === id ? { ...c, status: c.status === 'PENDING' ? 'RESOLVED' : 'PENDING' } : c
      )
    }));
  };

  const startEdit = (item: any) => {
    setEditingItem({ id: item.id, data: { ...item } });
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !selectedCategory) return;

    const key = CATEGORY_MAP[selectedCategory].dataKey;
    setAppData(prev => {
      const newData = { ...prev };
      const arr = [...(newData[key] as any[])];
      const idx = arr.findIndex(i => i.id === editingItem.id);
      if (idx !== -1) {
        arr[idx] = editingItem.data;
      }
      (newData[key] as any) = arr;
      return newData;
    });
    setEditingItem(null);
  };

  const renderEditModal = () => {
    if (!editingItem || !selectedCategory) return null;
    const fields = Object.keys(editingItem.data).filter(k => k !== 'id' && k !== 'slots');

    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[3.5rem] p-10 shadow-3xl animate-scaleIn">
          <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Edit Record</h3>
          <form onSubmit={saveEdit} className="space-y-4 max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
            {fields.map(key => (
              <div key={key}>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2 mb-1 block">{key}</label>
                <input 
                  type="text" 
                  value={editingItem.data[key] || ''} 
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    data: { ...editingItem.data, [key]: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                />
              </div>
            ))}
          </form>
          <div className="flex gap-4 pt-8">
            <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl">Cancel</button>
            <button type="submit" onClick={saveEdit} className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl">Save</button>
          </div>
        </div>
      </div>
    );
  };

  const renderManagementView = (catKey: AdminCategory) => {
    const cat = CATEGORY_MAP[catKey];
    const items = (appData as any)[cat.dataKey] as any[];

    return (
      <div className="space-y-6 animate-slideUp">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedCategory(null)} className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 border border-slate-800 active:scale-90 transition-all">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="text-center">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">{cat.label} Hub</h3>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Active Database</p>
          </div>
          <div className="w-10"></div>
        </div>

        {catKey !== 'COMPLAINTS' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border-2 border-slate-800 border-dashed rounded-[3rem] p-6 text-center group hover:border-blue-500/50 transition-all relative overflow-hidden">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls, .txt, .pdf, image/*" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}
                  className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 active:scale-95 transition-all">
                  <i className="fa-solid fa-file-pdf text-2xl"></i>
                </button>
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Local Upload</h4>
                <p className="text-[7px] text-slate-600 font-black mt-1 uppercase">CSV, XLSX, PDF, Images</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-6 text-center group transition-all">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                  <i className="fa-brands fa-google-drive text-2xl"></i>
                </div>
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cloud Sync</h4>
                <p className="text-[7px] text-slate-600 font-black mt-1 uppercase">Direct Google Docs</p>
              </div>
            </div>

            {catKey === 'CAMPUS_MAP' && appData.campusMapImage && (
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-4 animate-fadeIn">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">Current Map Visual</p>
                 <img src={appData.campusMapImage} className="w-full h-32 object-cover rounded-xl border border-slate-800" alt="Map Preview" />
                 <button onClick={() => setAppData(prev => ({...prev, campusMapImage: undefined}))} className="w-full mt-2 py-2 text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 rounded-lg hover:bg-rose-500 hover:text-white transition-all">Clear Image</button>
              </div>
            )}

            {catKey !== 'CAMPUS_MAP' && (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-4 flex gap-2 items-center group focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <i className="fa-solid fa-link text-slate-700 ml-4"></i>
                  <input 
                    type="text" 
                    value={gDocUrl}
                    onChange={(e) => setGDocUrl(e.target.value)}
                    placeholder="Paste Google Doc Public URL..."
                    className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold text-slate-400 placeholder:text-slate-800"
                  />
                  <button 
                    onClick={handleGDocSync}
                    disabled={isProcessing || !gDocUrl.trim()}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    <i className="fa-solid fa-cloud-arrow-down"></i>
                  </button>
                </div>

                <div className="relative">
                  <textarea rows={3} value={manualText} onChange={(e) => setManualText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-[11px] font-bold text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-800" 
                    placeholder={`Paste raw document text here...`}
                  />
                  <button onClick={handleManualUpload} disabled={isProcessing || !manualText.trim()}
                    className="absolute bottom-4 right-4 bg-emerald-600 text-white w-10 h-10 rounded-xl shadow-lg hover:bg-emerald-700 disabled:opacity-50 active:scale-90 transition-all flex items-center justify-center">
                    <i className="fa-solid fa-bolt-lightning"></i>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center gap-3 py-2 bg-slate-900/50 rounded-full border border-slate-800">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{statusMsg}</span>
          </div>
        )}

        {/* Records Database */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
              {catKey === 'COMPLAINTS' ? 'Report Log' : "Sync'd Records"}
            </h4>
            <span className="text-[8px] font-black text-slate-400 bg-slate-900 px-3 py-1 rounded-full">{items.length} Total</span>
          </div>
          
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/50 rounded-[2rem] border border-slate-800">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Database Clear</p>
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item.id} className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800 flex justify-between items-center group hover:border-blue-500/20 transition-all">
                  <div className="flex-1 overflow-hidden pr-4">
                    {catKey === 'COMPLAINTS' ? (
                      <>
                        <p className="text-[10px] font-bold text-slate-300 leading-relaxed mb-2">{item.text}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{item.timestamp}</span>
                          <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${item.status === 'PENDING' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                            {item.status}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <h5 className="text-[10px] font-black text-slate-200 truncate uppercase leading-none">{item.subject || item.name || item.title || item.role || item.day}</h5>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[7px] font-black text-slate-500 uppercase">{item.branch || 'General'}</span>
                          <span className="text-[7px] font-black text-slate-500 uppercase">{item.year || 'All Years'}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {catKey === 'COMPLAINTS' ? (
                      <>
                        <button onClick={() => toggleComplaintStatus(item.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.status === 'PENDING' ? 'bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white' : 'bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white'}`} title="Toggle Resolution">
                          <i className={`fa-solid ${item.status === 'PENDING' ? 'fa-check' : 'fa-clock'} text-[10px]`}></i>
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="w-8 h-8 rounded-lg bg-slate-800 text-rose-500 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                          <i className="fa-solid fa-trash text-[10px]"></i>
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="w-8 h-8 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                          <i className="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="w-8 h-8 rounded-lg bg-slate-800 text-rose-500 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                          <i className="fa-solid fa-trash text-[10px]"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative overflow-hidden font-['Outfit']">
      {renderEditModal()}
      
      <header className="p-8 border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo className="w-12 h-12" />
            <h1 className="text-xl font-black tracking-tighter text-blue-500">ADMIN HUB</h1>
          </div>
          <button onClick={onExit} className="bg-slate-900 w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-all">
            <i className="fa-solid fa-power-off text-rose-500"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto pb-32 custom-scrollbar">
        {selectedCategory ? renderManagementView(selectedCategory) : (
          <div className="space-y-10">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-10 rounded-[4rem] relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest opacity-80 mb-2">Security Level 10</p>
                <h2 className="text-3xl font-black text-white leading-none tracking-tighter">Campus<br/>Control</h2>
              </div>
              <i className="fa-solid fa-shield-halved absolute -right-4 -bottom-4 text-[10rem] text-white/10 group-hover:scale-110 transition-transform duration-700"></i>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(CATEGORY_MAP) as AdminCategory[]).map(key => {
                const cat = CATEGORY_MAP[key];
                return (
                  <button key={key} onClick={() => setSelectedCategory(key)}
                    className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-col items-center justify-center group hover:border-blue-600 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                      <i className={`fa-solid ${cat.icon} text-lg ${cat.color} group-hover:text-white`}></i>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{cat.label}</span>
                    <p className="text-[7px] text-slate-600 mt-2 font-black uppercase">
                      {key === 'CAMPUS_MAP' ? (appData.campusMapImage ? 'Visual Set' : 'No Visual') : `${(appData as any)[cat.dataKey].length} Active`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
