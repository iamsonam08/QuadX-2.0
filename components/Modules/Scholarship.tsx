import React, { useState, useMemo } from 'react';
import { AppData, ScholarshipItem } from '../../types';

interface ScholarshipProps {
  data: AppData;
  onBack: () => void;
}

const Scholarship: React.FC<ScholarshipProps> = ({ data, onBack }) => {
  const branches = ['Global', 'Comp', 'IT', 'Civil', 'Mech', 'Elect', 'AIDS', 'E&TC'];
  const years = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year'];

  const [selBranch, setSelBranch] = useState(branches[0]);
  const [selYear, setSelYear] = useState(years[0]);

  // Filtering architecture copied from Timetable module
  const filteredScholarships = useMemo(() => {
    return data.scholarships.filter(s => {
      // Fix: Use .includes() for array comparisons
      const branchMatch = selBranch === 'Global' || !s.branch || s.branch.includes(selBranch);
      const yearMatch = selYear === 'All Years' || !s.year || s.year.includes(selYear);
      return branchMatch && yearMatch;
    });
  }, [data.scholarships, selBranch, selYear]);

  const girlsList = useMemo(() => filteredScholarships.filter(s => s.category === 'GIRLS'), [filteredScholarships]);
  const generalList = useMemo(() => filteredScholarships.filter(s => s.category === 'GENERAL' || !s.category), [filteredScholarships]);

  const renderCard = (s: ScholarshipItem, i: number) => (
    <div key={s.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-amber-50 dark:border-slate-800 animate-slideUp" style={{ animationDelay: `${i * 100}ms` }}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
          <i className="fa-solid fa-award"></i>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-slate-400 font-black uppercase">Amount</div>
          <div className="text-base font-black text-amber-600">{s.amount}</div>
        </div>
      </div>
      {/* Fix: Using s.name as per updated types.ts or fallback to title */}
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1 leading-tight">{s.name || s.title}</h3>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-2">{s.eligibility}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">{s.branch || 'Global'}</span>
        <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">{s.year || 'All Years'}</span>
        {s.sourceType && <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full">{s.sourceType}</span>}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex flex-col">
          <span className="text-[9px] text-rose-500 font-black uppercase tracking-tighter">Ends: {s.deadline}</span>
          {/* Fix: Using s.uploadedAt instead of createdAt to match BaseUpload type and add safe split handling */}
          {s.uploadedAt && <span className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Posted: {typeof s.uploadedAt === 'string' ? s.uploadedAt.split(',')[0] : 'Recently'}</span>}
        </div>
        <button 
          onClick={() => s.applicationLink ? window.open(s.applicationLink, '_blank') : alert('No link provided for this entry.')}
          className="bg-amber-500 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all"
        >
          {s.applicationLink ? 'Apply Now' : 'Details'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-black text-amber-600 tracking-tighter">Scholarship Hub</h2>
      </div>

      {/* Filters: Replicated from Timetable module */}
      <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch</label>
          <select value={selBranch} onChange={(e) => setSelBranch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-2 py-2 text-[10px] font-black outline-none border-none cursor-pointer">
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Year</label>
          <select value={selYear} onChange={(e) => setSelYear(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-2 py-2 text-[10px] font-black outline-none border-none cursor-pointer">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <section className="space-y-4">
        <div className="px-2 flex items-center gap-2">
          <div className="w-1 h-4 bg-pink-500 rounded-full"></div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Girls Scholarships</h3>
        </div>
        {girlsList.length > 0 ? (
          <div className="space-y-4">{girlsList.map((s, i) => renderCard(s, i))}</div>
        ) : (
          <div className="p-8 bg-slate-100 dark:bg-slate-800/50 rounded-[2.5rem] text-center italic text-slate-400 text-[9px] font-bold uppercase tracking-widest">No active girls scholarships</div>
        )}
      </section>

      <section className="space-y-4">
        <div className="px-2 flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Scholarships</h3>
        </div>
        {generalList.length > 0 ? (
          <div className="space-y-4">{generalList.map((s, i) => renderCard(s, i))}</div>
        ) : (
          <div className="p-8 bg-slate-100 dark:bg-slate-800/50 rounded-[2.5rem] text-center italic text-slate-400 text-[9px] font-bold uppercase tracking-widest">No general scholarships listed</div>
        )}
      </section>
    </div>
  );
};

export default Scholarship;