
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
        <h2 className="text-2xl font-black text-lime-600 tracking-tighter">Campus Map</h2>
      </div>

      <div className="relative rounded-[3rem] overflow-hidden shadow-2xl h-[60vh] bg-slate-200 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <img 
          src={mapImage} 
          className="w-full h-full object-contain bg-white dark:bg-slate-900" 
          alt="Campus Map" 
        />
        
        {/* Only show markers if using default/sample map */}
        {!data.campusMapImage && (
          <>
            <div className="absolute top-1/4 left-1/3 animate-pulse">
              <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border-2 border-lime-500">
                <i className="fa-solid fa-building text-lime-600"></i>
                <span className="text-[10px] font-bold dark:text-white">Main Block</span>
              </div>
            </div>

            <div className="absolute top-1/2 right-1/4 animate-pulse [animation-delay:0.5s]">
              <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border-2 border-blue-500">
                <i className="fa-solid fa-flask text-blue-600"></i>
                <span className="text-[10px] font-bold dark:text-white">Lab Complex</span>
              </div>
            </div>

            <div className="absolute bottom-1/3 left-1/4 animate-pulse [animation-delay:1s]">
              <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border-2 border-rose-500">
                <i className="fa-solid fa-utensils text-rose-600"></i>
                <span className="text-[10px] font-bold dark:text-white">Canteen</span>
              </div>
            </div>
          </>
        )}

        {/* Navigation Interface Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%]">
          <button className="w-full py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 shadow-2xl group transition-all hover:bg-white active:scale-95">
            <i className="fa-solid fa-expand text-lime-600 text-xl group-hover:rotate-90 transition-transform"></i>
            <span className="font-black text-slate-800 dark:text-white uppercase text-[11px] tracking-widest">Digital Navigation</span>
          </button>
        </div>
      </div>
      
      <p className="text-center text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest px-10">
        Pinch to zoom map. Point your camera at nodes for AR context.
      </p>
    </div>
  );
};

export default CampusMap;
