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

  // Triple-tap logic
  const logoTaps = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });

  useEffect(() => {
    // Establish Real-Time Connection with Firestore
    const unsubscribe = subscribeToGlobalData((data) => {
      setAppData(data);
      setIsLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - logoTaps.current.lastTime < 1000) {
      logoTaps.current.count += 1;
    } else {
      logoTaps.current.count = 1;
    }
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

  if (isAdminMode) {
    return <AdminPanel appData={appData} onExit={() => setIsAdminMode(false)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
        <Logo className="w-32 h-32 mb-8 animate-pulse" />
        <h2 className="text-xl font-black text-blue-400 uppercase tracking-tighter mb-2">Establishing Secure Link</h2>
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
        <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Connected to Firebase Real-time Grid...</p>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      {/* Animated Background Blobs */}
      {currentModule === 'DASHBOARD' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-pink-400/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      )}

      {/* Header */}
      <header className="p-6 pb-2 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div onClick={handleLogoClick} className="cursor-pointer select-none group flex items-center gap-2">
            <Logo className="w-16 h-16 transition-transform duration-500 group-hover:scale-110 active:scale-95" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent tracking-tighter leading-none">QUADX</h1>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Live Sync Active"></div>
              </div>
              <span className="text-[8px] font-bold text-slate-400 tracking-[0.3em] uppercase opacity-60">Companion</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-90"
              title={isDarkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-400'} text-lg`}></i>
            </button>
            <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-blue-600 hover:rotate-12 transition-all">
              <i className="fa-solid fa-bell"></i>
            </button>
          </div>
        </div>

        {currentModule === 'DASHBOARD' && (
          <div className="mb-6 animate-fadeIn px-2">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Hi, Student! 👋</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time Campus Intelligence Enabled</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-10 relative z-10">
        {currentModule === 'DASHBOARD' ? (
          <div className="grid grid-cols-2 gap-5 animate-slideUp">
            <FeatureCard 
              title="VPai Assistant" 
              icon="fa-robot" 
              gradient="from-violet-600 to-fuchsia-600" 
              onClick={() => setCurrentModule('VPAI')}
              className="col-span-2 py-10"
              desc="Next-Gen AI Campus Guide"
            />
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
          <div className="animate-fadeIn">
            {renderModule()}
          </div>
        )}
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full p-10 shadow-2xl animate-scaleIn border border-slate-100 dark:border-slate-800">
            <Logo className="w-24 h-24 mb-6 mx-auto" />
            <h3 className="text-2xl font-black mb-2 text-center text-slate-800 dark:text-white uppercase tracking-tighter">System Override</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8 text-xs font-bold uppercase tracking-widest">Provide secret access key</p>
            <form onSubmit={handleAdminLogin}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 mb-6 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-500/10 transition-all text-center text-2xl tracking-widest text-slate-800 dark:text-white"
                autoFocus
              />
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-none transition-all"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Style Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-blob { animation: blob 7s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default App;