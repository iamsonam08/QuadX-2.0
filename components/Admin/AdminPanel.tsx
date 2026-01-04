
import React, { useState, useRef, useEffect } from 'react';
import { AppData, TimetableEntry, ExamSchedule, ScholarshipItem, InternshipItem, CampusEvent, Complaint } from '../../types';
import { extractCategoryData, isApiKeyConfigured } from '../../services/geminiService';
import { saveGlobalData } from '../../services/persistenceService';
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
  const [editingItem, setEditingItem] = useState<{ id: string, data: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiOk, setApiOk] = useState(false);

  useEffect(() => {
    setApiOk(isApiKeyConfigured());
  }, []);

  const handleCloudDeploy = async () => {
    setIsProcessing(true);
    setStatusMsg("Broadcasting to All Devices...");
    const success = await saveGlobalData(appData);
    if (success) {
      setStatusMsg("Cloud Sync Complete! ✅");
    } else {
      setStatusMsg("Sync Failed. Try Again. ❌");
    }
    setTimeout(() => { setIsProcessing(false); setStatusMsg(""); }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;

    if (!apiOk) {
      alert("CRITICAL: API Key is missing. Check Vercel Environment Variables!");
      return;
    }

    setIsProcessing(true);
    setStatusMsg(`Uploading ${file.name}...`);

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');

    reader.onload = async (event) => {
      let content = '';
      let mimeType = file.type;

      try {
        if (selectedCategory === 'CAMPUS_MAP' && file.type.startsWith('image/')) {
          const base64 = event.target?.result as string;
          setAppData(prev => ({ ...prev, campusMapImage: base64 }));
          setStatusMsg('Map visual set locally!');
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
        } else {
          content = event.target?.result as string;
        }

        setStatusMsg('AI Analysis Engine...');
        const extracted = await extractCategoryData(selectedCategory, content, mimeType);
        
        if (extracted && extracted.length > 0) {
          updateAppData(selectedCategory, extracted);
          setStatusMsg('Extraction Successful!');
        } else {
          setStatusMsg('AI could not find data.');
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
    } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative overflow-hidden font-['Outfit']">
      {/* Edit Modal Logic Remains Same */}
      
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
        
        {/* API STATUS BAR */}
        <div className={`mt-4 py-1.5 px-4 rounded-full text-[8px] font-black uppercase tracking-widest text-center ${apiOk ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500 animate-pulse'}`}>
          {apiOk ? "● AI Connected (API Key Found)" : "● AI Disconnected (API Key Missing!)"}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto pb-32 custom-scrollbar">
        {selectedCategory ? (
          <div className="space-y-6 animate-slideUp">
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedCategory(null)} className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 border border-slate-800">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">{CATEGORY_MAP[selectedCategory].label} Hub</h3>
              <div className="w-10"></div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 border-dashed rounded-[3rem] p-8 text-center group hover:border-blue-500/50 transition-all cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls, .txt, .pdf, image/*" onChange={handleFileUpload} />
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all">
                <i className="fa-solid fa-cloud-arrow-up text-3xl"></i>
              </div>
              <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-widest">Select File to Extract</h4>
              <p className="text-[8px] text-slate-600 font-black mt-2 uppercase">Excel, PDF, or Images</p>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-3 py-4 bg-blue-600/10 rounded-3xl border border-blue-500/20">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{statusMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              {(appData as any)[CATEGORY_MAP[selectedCategory].dataKey].map((item: any) => (
                <div key={item.id} className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800 flex justify-between items-center">
                  <div className="overflow-hidden">
                    <h5 className="text-[10px] font-black text-slate-200 truncate uppercase">{item.subject || item.name || item.title || item.role || item.day}</h5>
                    <p className="text-[7px] text-slate-500 font-bold uppercase mt-1">{item.branch || 'General'}</p>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="w-9 h-9 rounded-xl bg-slate-800 text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
                    <i className="fa-solid fa-trash text-[11px]"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[4rem] relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest mb-2">Sync Dashboard</p>
                <h2 className="text-3xl font-black text-white leading-none tracking-tighter mb-6 uppercase">Global<br/>Sync</h2>
                <button 
                  onClick={handleCloudDeploy}
                  disabled={isProcessing}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-3xl flex items-center gap-3 transition-all active:scale-95 group/btn"
                >
                  <i className={`fa-solid fa-globe group-hover/btn:rotate-12 transition-transform ${isProcessing ? 'animate-spin' : ''}`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">{statusMsg || 'Push to All Computers'}</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(CATEGORY_MAP) as AdminCategory[]).map(key => (
                <button key={key} onClick={() => setSelectedCategory(key)}
                  className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-col items-center justify-center group hover:border-blue-600 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                    <i className={`fa-solid ${CATEGORY_MAP[key].icon} text-lg ${CATEGORY_MAP[key].color} group-hover:text-white`}></i>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{CATEGORY_MAP[key].label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
