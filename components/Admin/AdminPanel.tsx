
import React, { useState, useRef, useEffect } from 'react';
import { AppData, Complaint } from '../../types';
import { extractAndCategorize, isApiKeyConfigured } from '../../services/geminiService';
import { saveExtractedItems, deleteItemFromCloud, saveGlobalConfig } from '../../services/persistenceService';
import Logo from '../Logo';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  appData: AppData;
  onExit: () => void;
}

type AdminCategory = 'TIMETABLE' | 'SCHOLARSHIP' | 'EVENT' | 'EXAM' | 'INTERNSHIP' | 'CAMPUS_MAP' | 'COMPLAINTS' | 'ANNOUNCEMENTS';

const CATEGORY_MAP: Record<AdminCategory, { label: string, icon: string, color: string, dataKey: keyof AppData }> = {
  TIMETABLE: { label: 'Timetable', icon: 'fa-calendar-week', color: 'text-indigo-400', dataKey: 'timetable' },
  SCHOLARSHIP: { label: 'Scholarship', icon: 'fa-graduation-cap', color: 'text-amber-400', dataKey: 'scholarships' },
  EVENT: { label: 'Event Info', icon: 'fa-masks-theater', color: 'text-pink-400', dataKey: 'events' },
  EXAM: { label: 'Exam Info', icon: 'fa-file-signature', color: 'text-rose-400', dataKey: 'exams' },
  INTERNSHIP: { label: 'Internship', icon: 'fa-briefcase', color: 'text-cyan-400', dataKey: 'internships' },
  CAMPUS_MAP: { label: 'Campus Map', icon: 'fa-map-location-dot', color: 'text-lime-400', dataKey: 'rawKnowledge' },
  COMPLAINTS: { label: 'Complaints', icon: 'fa-box-archive', color: 'text-slate-400', dataKey: 'complaints' },
  ANNOUNCEMENTS: { label: 'Broadcasts', icon: 'fa-bullhorn', color: 'text-orange-400', dataKey: 'announcements' },
};

const AdminPanel: React.FC<AdminPanelProps> = ({ appData, onExit }) => {
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [manualText, setManualText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiOk, setApiOk] = useState(false);

  useEffect(() => {
    setApiOk(isApiKeyConfigured());
  }, []);

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    setIsProcessing(true);
    setStatusMsg('AI Processing Manual Input...');
    try {
      const catToProcess = selectedCategory === 'SCHOLARSHIP' ? 'SCHOLARSHIP' : (selectedCategory === 'ANNOUNCEMENTS' ? 'ANNOUNCEMENT' : (selectedCategory || undefined) as any);
      const result = await extractAndCategorize(manualText, "text/plain", catToProcess);
      if (result) {
        await saveExtractedItems(result.category, result.items);
        setStatusMsg('Stored Successfully! 🚀');
        setManualText('');
      } else {
        setStatusMsg('AI failed to parse text.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Error processing text.');
    } finally {
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(`Handling ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      let content = '';
      let mimeType = file.type;

      try {
        if (selectedCategory === 'CAMPUS_MAP' && file.type.startsWith('image/')) {
          await saveGlobalConfig({ campusMapImage: event.target?.result as string });
          setStatusMsg('Map Updated Globally! 🗺️');
          setIsProcessing(false);
          return;
        }

        // Handle Excel / CSV parsing specifically for scholarship rows
        if (file.name.match(/\.(xlsx|xls|csv)$/)) {
          setStatusMsg('Parsing Spreadsheet Rows...');
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          content = JSON.stringify(json);
          mimeType = 'application/json';
        } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          content = event.target?.result as string;
          // mimeType remains as is
        } else {
          content = event.target?.result as string;
          mimeType = 'text/plain';
        }

        const catToProcess = selectedCategory === 'SCHOLARSHIP' ? 'SCHOLARSHIP' : (selectedCategory as any);
        const result = await extractAndCategorize(content, mimeType, catToProcess);
        
        if (result && result.items && result.items.length > 0) {
          await saveExtractedItems(result.category, result.items);
          setStatusMsg(`Injected ${result.items.length} items to Cloud! 🚀`);
        } else {
          setStatusMsg('AI Extraction found no valid items.');
        }
      } catch (err) {
        console.error(err);
        setStatusMsg('System error during upload.');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    if (file.name.match(/\.(xlsx|xls|csv)$/)) {
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const renderContentList = () => {
    if (!selectedCategory) return null;
    const key = CATEGORY_MAP[selectedCategory].dataKey;
    const items = appData[key] as any[] || [];

    if (selectedCategory === 'COMPLAINTS') {
      return (
        <div className="space-y-4">
          {selectedComplaint ? (
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-blue-500/30 animate-scaleIn">
              <button onClick={() => setSelectedComplaint(null)} className="text-blue-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2">
                <i className="fa-solid fa-arrow-left"></i> Back to List
              </button>
              <h4 className="text-xl font-black text-white mb-2">Complaint Details</h4>
              <div className="space-y-4 text-slate-300">
                <div className="bg-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Timestamp</p>
                  <p className="text-xs">{selectedComplaint.timestamp}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Message Content</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedComplaint.text}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Status</p>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${selectedComplaint.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            items.map((c: Complaint) => (
              <div key={c.id} onClick={() => setSelectedComplaint(c)} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 hover:border-blue-500 cursor-pointer transition-all">
                <div className="flex justify-between items-start">
                  <p className="text-xs text-slate-300 font-bold truncate max-w-[80%]">{c.text}</p>
                  <span className="text-[8px] font-black text-slate-500 uppercase">{c.timestamp.split(',')[0]}</span>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item: any) => (
          <div key={item.id} className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800 flex justify-between items-center group">
            <div className="overflow-hidden">
              <h5 className="text-[10px] font-black text-slate-200 truncate uppercase">{item.subject || item.name || item.title || item.role || item.day || "Entry"}</h5>
              <p className="text-[7px] text-slate-500 font-bold uppercase mt-1">
                {item.branch || item.category || 'Global'} 
                {item.sourceType && ` • From ${item.sourceType}`}
              </p>
            </div>
            <button onClick={() => deleteItemFromCloud(selectedCategory!, item.id)} className="w-9 h-9 rounded-xl bg-slate-800 text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
              <i className="fa-solid fa-trash text-[11px]"></i>
            </button>
          </div>
        ))}
        {items.length === 0 && !isProcessing && (
          <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-widest italic">No Data in Cloud</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative overflow-hidden font-['Outfit']">
      <header className="p-8 border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo className="w-12 h-12" />
            <h1 className="text-xl font-black tracking-tighter text-blue-500 uppercase">Cloud HUB</h1>
          </div>
          <button onClick={onExit} className="bg-slate-900 w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-all">
            <i className="fa-solid fa-power-off text-rose-500"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto pb-32 custom-scrollbar">
        {selectedCategory ? (
          <div className="space-y-6 animate-slideUp">
            <div className="flex items-center justify-between">
              <button onClick={() => {setSelectedCategory(null); setSelectedComplaint(null);}} className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-blue-400 border border-slate-800">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">{CATEGORY_MAP[selectedCategory].label} Controller</h3>
              <div className="w-10"></div>
            </div>

            {selectedCategory !== 'COMPLAINTS' && (
              <div className="space-y-4">
                <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800">
                  <textarea 
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder={`Type ${CATEGORY_MAP[selectedCategory].label} details manually...`}
                    className="w-full bg-slate-800/50 rounded-2xl p-4 text-sm outline-none border border-slate-700 focus:border-blue-500 transition-all min-h-[100px]"
                  />
                  <button onClick={handleManualSubmit} className="w-full mt-3 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all">
                    Inject Manual Entry
                  </button>
                </div>

                <div className="bg-slate-900 border-2 border-slate-800 border-dashed rounded-[2.5rem] p-8 text-center cursor-pointer hover:border-blue-500/50 transition-all"
                     onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt" onChange={handleFileUpload} />
                  <i className="fa-solid fa-file-arrow-up text-3xl text-blue-500 mb-3"></i>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload PDF, Excel, Word or Image</p>
                  <p className="text-[8px] text-slate-600 mt-2 font-bold uppercase">AI will auto-extract rows and fields</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center gap-3 py-4 bg-blue-600/10 rounded-3xl border border-blue-500/20">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{statusMsg}</span>
              </div>
            )}

            {renderContentList()}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(CATEGORY_MAP) as AdminCategory[]).map(key => (
              <button key={key} onClick={() => setSelectedCategory(key)}
                className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-col items-center justify-center group hover:border-blue-600 transition-all active:scale-95">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <i className={`fa-solid ${CATEGORY_MAP[key].icon} text-lg ${CATEGORY_MAP[key].color} group-hover:text-white`}></i>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{CATEGORY_MAP[key].label}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
