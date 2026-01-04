
import React, { useState } from 'react';
import { AppData, Complaint } from '../../types';

interface ComplaintBoxProps {
  setAppData: React.Dispatch<React.SetStateAction<AppData>>;
  onBack: () => void;
}

const ComplaintBox: React.FC<ComplaintBoxProps> = ({ setAppData, onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [complaintText, setComplaintText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    const newComplaint: Complaint = {
      id: Math.random().toString(36).substr(2, 9),
      text: complaintText,
      timestamp: new Date().toLocaleString(),
      status: 'PENDING'
    };

    setAppData(prev => ({
      ...prev,
      complaints: [newComplaint, ...prev.complaints]
    }));

    setSubmitted(true);
    setTimeout(() => {
      onBack();
    }, 2500);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fadeIn">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <i className="fa-solid fa-check text-4xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Submitted Anonymously</h3>
        <p className="text-slate-500">Thank you for your feedback. We will look into it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-bold text-slate-700 dark:text-white">Complaint Box</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl mb-6">
          <div className="flex gap-3">
            <i className="fa-solid fa-user-secret text-blue-600 text-xl"></i>
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">Identity Protected</h4>
              <p className="text-blue-700 dark:text-blue-400 text-xs">All submissions are strictly anonymous. Your privacy is our priority.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Your Concern</label>
            <textarea 
              rows={6}
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-blue-500/30 transition-all border border-slate-100 dark:border-slate-700 dark:text-white"
              placeholder="Type your complaint here..."
            ></textarea>
          </div>
          <button className="w-full py-4 bg-slate-800 dark:bg-blue-600 text-white rounded-2xl font-bold hover:bg-slate-900 dark:hover:bg-blue-700 transition-all shadow-xl shadow-slate-200 dark:shadow-none">
            Send Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintBox;
