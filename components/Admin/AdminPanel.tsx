
import React, { useState, useRef } from 'react';
import { AppData, Complaint } from '../../types';
import { extractAndCategorize } from '../../services/geminiService';
import { saveCategorizedItems, deleteItemFromCloud, COLLECTIONS } from '../../services/persistenceService';
import Logo from '../Logo';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  appData: AppData;
  onExit: () => void;
}

type AdminCategory = 'TIMETABLE' | 'SCHOLARSHIP' | 'EXAM' | 'INTERNSHIP' | 'BROADCASTS' | 'COMPLAINTS';

const ADMIN_MODULES: Record<AdminCategory, { label: string, icon: string, color: string, collection: string, dataKey: keyof AppData }> = {
  BROADCASTS: { label: 'Broadcasts', icon: 'fa-bullhorn', color: 'text-orange-400', collection: COLLECTIONS.BROADCASTS, dataKey: 'broadcasts' },
  INTERNSHIP: { label: 'Internships', icon: 'fa-briefcase', color: 'text-cyan-400', collection: COLLECTIONS.INTERNSHIPS, dataKey: 'internships' },
  SCHOLARSHIP: { label: 'Scholarships', icon: 'fa-graduation-cap', color: 'text-amber-400', collection: COLLECTIONS.SCHOLARSHIPS, dataKey: 'scholarships' },
  EXAM: { label: 'Exam Info', icon: 'fa-file-signature', color: 'text-rose-400', collection: COLLECTIONS.EXAMS, dataKey: 'exams' },
  TIMETABLE: { label: 'Timetable', icon: 'fa-calendar-week', color: 'text-indigo-400', collection: COLLECTIONS.TIMETABLE, dataKey: 'timetable' },
  COMPLAINTS: { label: 'Complaints', icon: 'fa-box-archive', color: 'text-slate-400', collection: COLLECTIONS.COMPLAINTS, dataKey: 'complaints' },
};

const AdminPanel: React.FC<AdminPanelProps> = ({ appData, onExit }) => {
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [targetCollection, setTargetCollection] = useState<AdminCategory>('BROADCASTS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [manualText, setManualText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIngest = async (file?: File, text?: string) => {
    setIsProcessing(true);
    setStatusMsg(`Syncing to ${ADMIN_MODULES[targetCollection].label}...`);

    try {
      let content = '';
      let mimeType = 'text/plain';
      const fileName = file?.name || 'Manual Upload';

      if (file) {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          if (file.name.match(/\.(xlsx|xls|csv)$/)) reader.readAsArrayBuffer(file);
          else if (file.type.startsWith('image/') || file.type === 'application/pdf') reader.readAsDataURL(file);
          else reader.readAsText(file);
        });
        mimeType = file.type;

        if (file.name.match(/\.(xlsx|xls|csv)$/)) {
          const workbook = XLSX.read(content, { type: 'array' });
          content = JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]));
          mimeType = 'application/json';
        }
      } else {
        content = text || '';
      }

      // Try AI extraction first but with TARGETed category
      const result = await extractAndCategorize(content, mimeType, fileName);
      
      // We FORCE the target collection selected by the Admin
      const destinationCollection = ADMIN_MODULES[targetCollection].collection;
      
      // Update items with mandatory metadata
      const itemsToSave = result.items.map(item => ({
        ...item,
        category: targetCollection,
        fileUrl: mimeType.startsWith('image/') || mimeType === 'application/pdf' ? content : undefined,
        branch: ['Comp', 'IT', 'Civil', 'Mech', 'Elect', 'AIDS', 'E&TC'], // Default to All
        year: ['1st Year', '2nd Year', '3rd Year', '4th Year'], // Default to All
      }));

      await saveCategorizedItems(destinationCollection, itemsToSave);
      setStatusMsg(`Success! Saved to ${ADMIN_MODULES[targetCollection].label} 🚀`);
      setManualText('');
      
    } catch (err) {
      console.error(err);
      setStatusMsg('Ingest failed. Check network.');
    } finally {
      setTimeout(() => { setIsProcessing(false); setStatusMsg(''); }, 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderContentList = () => {
    if (!selectedCategory) return null;
    const mod = ADMIN_MODULES[selectedCategory];
    const items = appData[mod.dataKey] as any[] || [];

    return (
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-slate-500 text-[10px] uppercase font-bold py-10">Empty Collection</p>
        ) : (
          items.map((item: any) => (
            <div key={item.id} className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800 flex justify-between items-center">
              <div className="overflow-hidden pr-2">
                <h5 className="text-[10px] font-black text-slate-200 truncate uppercase">
                  {item.title || item.subject || item.name || item.originalFileName || "Item"}
                </h5>
                <p className="text-[7px] text-slate-500 font-bold uppercase mt-1">
                  {item.uploadedAt?.toDate?.()?.toLocaleString() || 'Just now'}
                </p>
              </div>
              <button onClick={() => deleteItemFromCloud(mod.collection, item.id)} className="w-9 h-9 rounded-xl bg-slate-800 text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
                <i className="fa-solid fa-trash text-[11px]"></i>
              </button>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative font-['Outfit']">
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

      <main className="flex-1 p-6 overflow-y-auto pb-32">
        {!selectedCategory ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 rounded-[3rem] border border-blue-500/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Direct Ingest
                </h3>
                <div className="flex flex-col items-end">
                   <label className="text-[8px] font-black text-slate-500 uppercase mb-1">Target Section</label>
                   <select 
                    value={targetCollection} 
                    onChange={(e) => setTargetCollection(e.target.value as AdminCategory)}
                    className="bg-slate-800 text-[10px] font-black uppercase rounded-lg px-2 py-1 outline-none border border-slate-700"
                   >
                     {Object.keys(ADMIN_MODULES).map(k => <option key={k} value={k}>{ADMIN_MODULES[k as AdminCategory].label}</option>)}
                   </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={`Write ${ADMIN_MODULES[targetCollection].label} info...`}
                  className="w-full bg-slate-900/50 rounded-2xl p-4 text-xs outline-none border border-slate-700 focus:border-blue-500 transition-all min-h-[100px]"
                />
                
                <div className="flex gap-2">
                  <button onClick={() => handleIngest(undefined, manualText)} 
                    disabled={!manualText.trim() || isProcessing}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">
                    Sync Text
                  </button>
                  <button onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">
                    Upload Doc
                  </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && handleIngest(e.target.files[0])} />
              </div>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-3 py-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 animate-pulse">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{statusMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(ADMIN_MODULES) as AdminCategory[]).map(key => (
                <button key={key} onClick={() => setSelectedCategory(key)}
                  className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] flex flex-col items-center justify-center group active:scale-95 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600">
                    <i className={`fa-solid ${ADMIN_MODULES[key].icon} text-lg ${ADMIN_MODULES[key].color} group-hover:text-white`}></i>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{ADMIN_MODULES[key].label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase mb-4">
              <i className="fa-solid fa-chevron-left"></i> Hub Dashboard
            </button>
            <h4 className="text-sm font-black text-white uppercase mb-4">{ADMIN_MODULES[selectedCategory].label} Records</h4>
            {renderContentList()}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
