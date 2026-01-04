
import React from 'react';
import { AppData } from '../../types';

interface AttendanceProps {
  data: AppData;
  onBack: () => void;
}

const Attendance: React.FC<AttendanceProps> = ({ data, onBack }) => {
  const hasData = data.attendance.length > 0;
  const averageAttendance = hasData 
    ? Math.round(data.attendance.reduce((acc, curr) => acc + curr.percentage, 0) / data.attendance.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-bold text-emerald-700">Attendance Tracker</h2>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50">
        {!hasData ? (
          <div className="text-center py-10">
            <i className="fa-solid fa-chart-line text-4xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 text-sm">No attendance data uploaded by admin yet.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-emerald-600">{averageAttendance}%</div>
              <div className="text-slate-400 text-sm mt-1">Average Attendance</div>
            </div>

            <div className="space-y-6">
              {data.attendance.map((a, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-700">{a.subject}</span>
                    <span className={a.percentage < 75 ? 'text-rose-500' : 'text-emerald-500'}>
                      {a.percentage}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${a.percentage < 75 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                      style={{ width: `${a.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{a.attendedClasses} Attended</span>
                    <span>{a.totalClasses} Total</span>
                  </div>
                  {a.percentage < 75 && (
                    <div className="text-[10px] text-rose-500 bg-rose-50 px-2 py-1 rounded-md inline-block">
                      ⚠️ Danger: Below 75% limit
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
        <h4 className="text-amber-800 font-bold text-sm mb-1">Attendance Policy</h4>
        <p className="text-amber-700 text-xs">Minimum 75% attendance is required to be eligible for final examinations.</p>
      </div>
    </div>
  );
};

export default Attendance;
