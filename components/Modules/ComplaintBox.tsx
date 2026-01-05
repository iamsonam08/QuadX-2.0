
import React, { useState } from 'react';
import { AppData, Complaint } from '../../types';
import { saveExtractedItems } from '../../services/persistenceService';

interface ComplaintBoxProps {
  data: AppData;
  onBack: () => void;
}

const ComplaintBox: React.FC<ComplaintBoxProps> = ({ data, onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim() || isSending) return;

    setIsSending(true);
    const newComplaint: Complaint = {
      id: Math.random().toString(36).substr(2, 9),
      text: complaintText,
      timestamp: new Date().toLocaleString(),
      status: 'PENDING'
    };

    try {
      // Direct save to "complaints" collection
      await saveExtractedItems('COMPLAINTS', [newComplaint]);
      setSubmitted(true);
      setTimeout(() => {
        onBack();
      }, 2500);
    } catch (error) {
      console.error("Cloud Submission Error:", error);
      alert("Network bottleneck. Your feedback is important, please try again.");
      setIsSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fadeIn">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <i className="fa-solid fa-check text-4xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Encrypted Submission</h3>
        <p className="text-slate-500 px-10">Your concern has been stored securely in the Cloud Console for admin review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm active:scale-90 transition-all">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Campus Voice</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl mb-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-shield-halved text-xl"></i>
            </div>
            <div>
              <h4 className="font-black text-blue-900 dark:text-blue-300 text-[11px] uppercase tracking-wider">Zero-Trace Privacy</h4>
              <p className="text-blue-700 dark:text-blue-400 text-[9px] font-bold uppercase mt-1 leading-normal">Submissions bypass local logs and go straight to the Cloud Console anonymously.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-2 block">Tell us what happened</label>
            <textarea 
              rows={6}
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              disabled={isSending}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-500/10 transition-all border border-slate-100 dark:border-slate-700 dark:text-white font-medium text-sm leading-relaxed"
              placeholder="Your anonymity is guaranteed..."
            ></textarea>
          </div>
          <button 
            type="submit"
            disabled={isSending || !complaintText.trim()}
            className="w-full py-5 bg-slate-950 dark:bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-2xl shadow-slate-200 dark:shadow-none disabled:opacity-50 active:scale-[0.98]"
          >
            {isSending ? "Syncing with Cloud..." : "Broadcast Concern"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintBox;
