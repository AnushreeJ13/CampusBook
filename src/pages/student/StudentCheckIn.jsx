import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProposals } from '../../contexts/ProposalContext';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, Sparkles, MapPin, Calendar, Clock, ArrowRight, Star } from 'lucide-react';

export default function StudentCheckIn() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const { proposals } = useProposals();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (eventId) {
      const found = proposals.find(p => p.id === eventId);
      if (found) {
        setEvent(found);
        setTimeout(() => setStatus('ready'), 1500);
      } else {
        setStatus('error');
      }
    }
  }, [eventId, proposals]);

  const handleConfirm = () => {
    setStatus('confirming');
    setTimeout(() => {
      setStatus('confirmed');
    }, 2000);
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold animate-pulse">Establishing Secure Link...</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || !eventId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xl">
           <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star size={40} />
           </div>
           <h2 className="text-2xl font-black mb-2">Invalid Check-in URL</h2>
           <p className="text-slate-500 mb-8">This check-in link seems to be expired or invalid. Please ask the society coordinator for a fresh QR code.</p>
           <button onClick={() => navigate('/dashboard')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-slide-up">
        {status === 'confirmed' ? (
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 text-center shadow-2xl relative overflow-hidden" style={{padding: '2.5rem', background: 'white', borderRadius: '2.5rem', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', position: 'relative', overflow: 'hidden'}}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '0.5rem', background: 'linear-gradient(to right, #4ade80, #10b981)'}}></div>
            
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-short" style={{width: '6rem', height: '6rem', background: '#f0fdf4', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem'}}>
               <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            
            <h2 className="text-3xl font-black mb-2 tracking-tight" style={{fontSize: '1.875rem', fontWeight: 900, marginBottom: '0.5rem', margin: 0}}>Check-in Verified!</h2>
            <p className="text-slate-500 mb-10" style={{color: '#64748b', marginBottom: '2.5rem', margin: 0}}>Welcome to <strong>{event?.title}</strong>. Your attendance has been logged by CampusOS.</p>
            
            <div className="space-y-4" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
               <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3 text-left" style={{padding: '1rem', background: '#f5f3ff', borderRadius: '1rem', border: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left'}}>
                  <Sparkles className="text-indigo-600" size={20} />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400" style={{fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#818cf8'}}>Intelligence Insight</div>
                    <div className="text-indigo-900 text-sm font-bold" style={{color: '#1e1b4b', fontSize: '0.875rem', fontWeight: 700}}>You've attended 3 society events this month!</div>
                  </div>
               </div>
               
               <button onClick={() => navigate('/dashboard')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2" style={{width: '100%', background: '#0f172a', color: 'white', padding: '1rem', borderRadius: '1rem', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                  Go to Dashboard <ArrowRight size={18} />
               </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-2xl" style={{padding: '2rem', background: 'white', borderRadius: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'}}>
            <div className="flex items-center gap-2 mb-8" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'}}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white" style={{width: '2.5rem', height: '2.5rem', background: '#4f46e5', color: 'white', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                 <Sparkles size={20} />
              </div>
              <span className="font-black tracking-tighter text-xl" style={{fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.025em'}}>CAMPUS<span className="text-indigo-600">OS</span></span>
            </div>

            <div className="mb-8" style={{marginBottom: '2rem'}}>
               <h1 className="text-3xl font-black mb-2" style={{fontSize: '1.875rem', fontWeight: 900, marginBottom: '0.5rem', margin: 0}}>Confirm Attendance</h1>
               <p className="text-slate-500" style={{color: '#64748b', margin: 0}}>You are joining <strong>{event?.title}</strong> as a student participant.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 mb-8" style={{background: '#f8fafc', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'}}>
               <div className="flex items-center gap-4" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-lg flex items-center justify-center text-slate-400" style={{width: '2.5rem', height: '2.5rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
                     <MapPin size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest" style={{fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8'}}>Location</div>
                    <div className="text-slate-900 font-bold" style={{color: '#0f172a', fontWeight: 700}}>{event?.venueName || 'Main Hall'}</div>
                  </div>
               </div>
               <div className="flex items-center gap-4" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-lg flex items-center justify-center text-slate-400" style={{width: '2.5rem', height: '2.5rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
                     <Calendar size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest" style={{fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8'}}>Date</div>
                    <div className="text-slate-900 font-bold" style={{color: '#0f172a', fontWeight: 700}}>{event?.date}</div>
                  </div>
               </div>
            </div>

            <button 
              onClick={handleConfirm}
              disabled={status === 'confirming'}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{width: '100%', background: '#4f46e5', color: 'white', padding: '1.25rem', borderRadius: '1rem', fontWeight: 900, fontSize: '1.125rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s'}}
            >
              {status === 'confirming' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging Presence...
                </>
              ) : (
                <>Confirm Check-in <Sparkles size={20} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
