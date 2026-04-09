import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { QrCode, Users, Clock, CheckCircle, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

export default function AttendanceScanner() {
  const { user } = useAuth();
  const { proposals } = useProposals();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [scanCount, setScanCount] = useState(0);

  // Filter approved events for the society
  const approvedEvents = proposals.filter(p => 
    (p.status === PROPOSAL_STATUS.APPROVED || p.status === PROPOSAL_STATUS.VENUE_BOOKED) &&
    (p.clubId === user.clubId || p.submittedBy === (user.uid || user.id))
  );

  const handleStartScanner = (event) => {
    setSelectedEvent(event);
    setActiveTab('live');
    setScanCount(0);
  };

  const simulateScan = () => {
    setScanCount(prev => prev + 1);
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <div className="flex items-center gap-4 mb-8" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500" style={{padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.75rem', color: '#6366f1'}}>
           <QrCode size={32} />
        </div>
        <div>
           <h1 className="text-3xl font-black" style={{fontSize: '1.875rem', fontWeight: 900, margin: 0}}>Scanner Center</h1>
           <p className="text-slate-500 text-sm" style={{color: '#64748b', fontSize: '0.875rem', margin: 0}}>Society-managed intelligence check-in</p>
        </div>
      </div>

      {activeTab === 'setup' ? (
        <div className="animate-fade-in">
           <h3 className="mb-4 font-bold text-lg" style={{marginBottom: '1rem', fontWeight: 700, fontSize: '1.125rem'}}>Select Event to Start</h3>
           {approvedEvents.length === 0 ? (
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center" style={{padding: '3rem', textAlign: 'center', background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '1rem'}}>
                <AlertTriangle className="mx-auto mb-4 opacity-20" size={64} style={{margin: '0 auto 1rem', opacity: 0.2}} />
                <p className="text-slate-500 font-medium">No approved events found for scanning.</p>
             </div>
           ) : (
             <div className="grid gap-4" style={{display: 'grid', gap: '1rem'}}>
                {approvedEvents.map(event => (
                   <div 
                    key={event.id} 
                    className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer" 
                    style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.2s'}}
                    onClick={() => handleStartScanner(event)}
                   >
                      <div>
                         <div className="font-black text-lg" style={{fontWeight: 900, fontSize: '1.125rem'}}>{event.title}</div>
                         <div className="text-sm text-slate-500" style={{fontSize: '0.875rem', color: '#64748b'}}>{event.date} • {event.venueName || 'Main Hall'}</div>
                      </div>
                      <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors" style={{backgroundColor: '#4f46e5', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer'}}>
                        Initialize
                      </button>
                   </div>
                ))}
             </div>
           )}
        </div>
      ) : (
        <div className="animate-slide-up">
           <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden" style={{padding: '3rem', background: '#0f172a', color: 'white', borderRadius: '2rem', border: '1px solid #1e293b', position: 'relative', overflow: 'hidden'}}>
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none" style={{position: 'absolute', top: 0, right: 0, padding: '3rem', opacity: 0.05, pointerEvents: 'none'}}>
                 <RefreshCw size={240} className="animate-spin-slow" />
              </div>

              <div className="relative z-10" style={{position: 'relative', zIndex: 10}}>
                 <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-black tracking-widest uppercase" style={{marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em'}}>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{width: '0.5rem', height: '0.5rem', background: '#818cf8', borderRadius: '50%'}}></div>
                    Live Intelligence Loop
                 </div>

                 <div className="mb-12" style={{marginBottom: '3rem'}}>
                    <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight" style={{fontSize: '3rem', fontWeight: 900, margin: 0}}>{selectedEvent.title}</h2>
                    <p className="text-xl text-slate-400" style={{fontSize: '1.25rem', color: '#94a3b8', margin: 0}}>{selectedEvent.venueName || 'Main Hall'}</p>
                 </div>

                 <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '4rem'}}>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.3)] transition-transform hover:scale-105" style={{padding: '2rem', background: 'white', borderRadius: '2.5rem', transition: 'transform 0.3s'}}>
                       <div style={{ width: 240, height: 240, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1.5rem', position: 'relative', border: '1px solid #e2e8f0' }}>
                          <QrCode size={180} color="#0f172a" strokeWidth={1.5} />
                          <div className="absolute inset-0 flex items-center justify-center" style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <div className="bg-white p-2 rounded-lg" style={{background: 'white', padding: '0.5rem', borderRadius: '0.5rem'}}>
                               <div className="bg-indigo-600 w-6 h-6 rounded-md" style={{background: '#4f46e5', width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem'}}></div>
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-8 min-w-[280px]" style={{display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '280px'}}>
                       <div className="p-8 bg-slate-800/40 rounded-3xl border border-white/5 backdrop-blur-sm" style={{padding: '2rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(4px)'}}>
                          <div className="text-6xl font-black text-white mb-2" style={{fontSize: '4rem', fontWeight: 900, margin: 0}}>{scanCount}</div>
                          <div className="text-xs text-indigo-400 font-black uppercase tracking-[0.2em]" style={{fontSize: '0.75rem', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.2em'}}>Students Scanned</div>
                       </div>
                       
                       <div className="flex gap-4" style={{display: 'flex', gap: '1rem'}}>
                          <button className="bg-indigo-600 text-white flex-1 py-4 px-8 rounded-2xl font-black hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95" style={{background: '#4f46e5', color: 'white', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: 900, border: 'none', cursor: 'pointer'}} onClick={simulateScan}>
                             Simulate Scan
                          </button>
                          <button className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-700 transition-all border border-slate-700" style={{background: '#1e293b', color: 'white', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: 900, border: '1px solid #334155', cursor: 'pointer'}} onClick={() => setActiveTab('setup')}>
                             Reset
                          </button>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-16 flex items-center justify-center gap-4 text-sm text-slate-500 p-6 bg-slate-800/20 rounded-2xl" style={{marginTop: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.5rem', background: 'rgba(30, 41, 59, 0.2)', borderRadius: '1rem'}}>
                    <Sparkles size={20} className="text-indigo-400" />
                    <span style={{fontWeight: 500}}>AI Intelligence is training on arrival patterns for <strong>{selectedEvent.title}</strong></span>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
