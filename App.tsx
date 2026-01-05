
import React, { useState, useEffect, useRef } from 'react';
import { AppData, ModuleType } from './types';
import { INITIAL_DATA } from './constants';
import { subscribeToGlobalData } from './services/persistenceService';
import FeatureCard from './components/FeatureCard';
import VPai from './components/Modules/VPai';
import Attendance from './components/Modules/Attendance';
import Timetable from './components/Modules/Timetable';
import ExamInfo from './components/Modules/ExamInfo';
import Scholarship from './components/Modules/Scholarship';
import EventInfo from './components/Modules/EventInfo';
import ComplaintBox from './components/Modules/ComplaintBox';
import Internship from './components/Modules/Internship';
import CampusMap from './components/Modules/CampusMap';
import AdminPanel from './components/Admin/AdminPanel';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>('DASHBOARD');
  const [appData, setAppData] = useState<AppData>(INITIAL_DATA);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logoTaps = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });

  useEffect(() => {
    // Establishing real-time sync with individual collection listeners
    const unsubscribe = subscribeToGlobalData((data) => {
      setAppData(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - logoTaps.current.lastTime < 1000) logoTaps.current.count += 1;
    else logoTaps.current.count = 1;
    logoTaps.current.lastTime = now;

    if (logoTaps.current.count === 3) {
      setShowAdminLogin(true);
      logoTaps.current.count = 0;
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'VP@123') {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setPassword('');
    } else {
      alert('Incorrect Password');
    }
  };

  const renderModule = () => {
    switch (currentModule) {
      case 'VPAI': return <VPai data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      case 'ATTENDANCE': return <Attendance data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      case 'TIMETABLE': return <Timetable data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      case 'EXAM_INFO': return <ExamInfo data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      case 'SCHOLARSHIP': return <Scholarship data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      case 'EVENT_INFO': return <EventInfo data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      case 'COMPLAINT_BOX': return <ComplaintBox data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      case 'INTERNSHIP': return <Internship data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      case 'CAMPUS_MAP': return <CampusMap data={appData} onBack={() => setCurrentModule('DASHBOARD')} />;
      default: return null;
    }
  };

  if (isAdminMode) return <AdminPanel appData={appData} onExit={() => setIsAdminMode(false)} />;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
        <Logo className="w-32 h-32 mb-8 animate-pulse" />
        <h2 className="text-xl font-black text-blue-400 uppercase tracking-tighter mb-2">Establishing Secure Link</h2>
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <header className="p-6 pb-2 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div onClick={handleLogoClick} className="cursor-pointer select-none group flex items-center gap-2">
            <Logo className="w-16 h-16 transition-transform duration-500 group-hover:scale-110 active:scale-95" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent tracking-tighter leading-none">QUADX</h1>
              <span className="text-[8px] font-bold text-slate-400 tracking-[0.3em] uppercase opacity-60">Companion</span>
            </div>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400">
            <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-400'} text-lg`}></i>
          </button>
        </div>

        {currentModule === 'DASHBOARD' && appData.broadcasts.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6 flex items-center gap-4 animate-fadeIn">
            <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Global Broadcast</p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                {appData.broadcasts[0].title || "Recent Update"}
              </p>
            </div>
            {appData.broadcasts[0].fileUrl && (
               <button 
                onClick={() => {
                  const content = appData.broadcasts[0].fileUrl;
                  if (content?.startsWith('data:')) {
                    const win = window.open();
                    win?.document.write(`<iframe src="${content}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                  }
                }}
                className="text-orange-600 font-black text-[9px] uppercase border-b border-orange-600"
               >
                 View
               </button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 pb-10 relative z-10 overflow-y-auto">
        {currentModule === 'DASHBOARD' ? (
          <div className="grid grid-cols-2 gap-5 animate-slideUp">
            <FeatureCard title="VPai Assistant" icon="fa-robot" gradient="from-violet-600 to-fuchsia-600" onClick={() => setCurrentModule('VPAI')} className="col-span-2 py-10" desc="Next-Gen AI Campus Guide" />
            <FeatureCard title="Attendance" icon="fa-chart-pie" gradient="from-emerald-400 to-teal-600" onClick={() => setCurrentModule('ATTENDANCE')} desc="Track your progress" />
            <FeatureCard title="Timetable" icon="fa-calendar-week" gradient="from-blue-400 to-indigo-600" onClick={() => setCurrentModule('TIMETABLE')} desc="Class schedules" />
            <FeatureCard title="Scholarship" icon="fa-graduation-cap" gradient="from-amber-400 to-orange-500" onClick={() => setCurrentModule('SCHOLARSHIP')} desc="Financial aid" />
            <FeatureCard title="Events" icon="fa-masks-theater" gradient="from-pink-500 to-rose-500" onClick={() => setCurrentModule('EVENT_INFO')} desc="Don't miss out" />
            <FeatureCard title="Exam Info" icon="fa-file-signature" gradient="from-red-500 to-orange-600" onClick={() => setCurrentModule('EXAM_INFO')} desc="Finals prep" />
            <FeatureCard title="Complaints" icon="fa-box-archive" gradient="from-slate-600 to-slate-800" onClick={() => setCurrentModule('COMPLAINT_BOX')} desc="Speak up" />
            <FeatureCard title="Internship" icon="fa-briefcase" gradient="from-cyan-400 to-blue-500" onClick={() => setCurrentModule('INTERNSHIP')} desc="Career goals" />
            <FeatureCard title="Campus Map" icon="fa-map-location-dot" gradient="from-lime-400 to-green-600" onClick={() => setCurrentModule('CAMPUS_MAP')} desc="Find your way" />
          </div>
        ) : (
          <div className="animate-fadeIn">{renderModule()}</div>
        )}
      </main>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full p-10 shadow-2xl animate-scaleIn border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black mb-2 text-center text-slate-800 dark:text-white uppercase tracking-tighter">System Override</h3>
            <form onSubmit={handleAdminLogin}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 mb-6 text-center text-2xl tracking-widest text-slate-800 dark:text-white" autoFocus />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold">Verify</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};

export default App;
