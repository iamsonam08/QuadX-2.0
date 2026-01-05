
import React from 'react';
import { AppData } from '../../types';

interface CampusMapProps {
  data: AppData;
  onBack: () => void;
}

const CampusMap: React.FC<CampusMapProps> = ({ data, onBack }) => {
  const mapImage = data.campusMapImage || "https://picsum.photos/seed/campus/800/1200";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-black text-lime-600 tracking-tighter">Campus Navigator</h2>
      </div>

      <div className="relative rounded-[3rem] overflow-hidden shadow-2xl h-[65vh] bg-slate-200 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <img 
          src={mapImage} 
          className="w-full h-full object-contain bg-white dark:bg-slate-900 transition-opacity duration-1000" 
          alt="Campus Map" 
        />
        
        {!data.campusMapImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
            <p className="bg-white/90 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">Sample Map View</p>
          </div>
        )}

        {/* Navigation Interface Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%]">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 flex items-center justify-center gap-3 shadow-2xl border border-white/50 dark:border-slate-700/50">
            <i className="fa-solid fa-compass text-lime-600 text-xl animate-spin-slow"></i>
            <span className="font-black text-slate-800 dark:text-white uppercase text-[10px] tracking-widest">Real-time Location Overlay</span>
          </div>
        </div>
      </div>
      
      <p className="text-center text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] px-10">
        Pinch to zoom. Map updates instantly on Admin deployment.
      </p>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
};

export default CampusMap;
