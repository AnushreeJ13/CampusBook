import { useParams, useNavigate } from 'react-router-dom';
import { useProposals } from '../../contexts/ProposalContext';
import { EVENT_TYPES, PROPOSAL_STATUS } from '../../utils/constants';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { proposals } = useProposals();
  
  const event = proposals.find(p => p.id === id);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
        <p>This event might have been moved or cancelled.</p>
        <button 
          onClick={() => navigate('/events')}
          className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-500 transition-colors"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const typeInfo = EVENT_TYPES.find(t => t.value === event.eventType);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Pass Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="md:flex">
            <div className="md:w-2/3 p-8 md:p-12 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                  {typeInfo?.label || 'General Event'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 text-sm font-medium">#{event.id}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                {event.title}
              </h1>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Date</div>
                  <div className="text-white font-bold">{new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Time</div>
                  <div className="text-white font-bold">{event.timeSlot?.split('_').join(' ').toUpperCase()}</div>
                </div>
              </div>
            </div>

            <div className="md:w-1/3 bg-slate-800/50 border-t md:border-t-0 md:border-l border-slate-700/50 p-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="text-6xl mb-2">{typeInfo?.icon || '📅'}</div>
              <div className="space-y-1">
                <div className="text-slate-400 text-sm">Venue Integrity</div>
                <div className="text-2xl font-black text-cyan-400">98.2%</div>
              </div>
              <button 
                onClick={() => navigate('/check-in')}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-white/5"
              >
                CHECK IN NOW
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-800/30 border border-slate-700/50 p-8 rounded-[2rem] space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Event Brief
          </h3>
          <p className="text-slate-400 leading-relaxed text-lg">
            {event.description || "Join us for an exclusive CampusOS powered event. Experience the next generation of campus engagement."}
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <div className="bg-slate-700/30 px-4 py-2 rounded-xl border border-slate-600/30 text-slate-300 text-sm">
              👥 {event.expectedAttendance || 0} Expected
            </div>
            <div className="bg-slate-700/30 px-4 py-2 rounded-xl border border-slate-600/30 text-slate-300 text-sm">
              📍 {event.venueName || 'Main Campus'}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2rem] flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-indigo-300 mb-2">Organizer</h3>
            <div className="text-2xl font-black text-white">{event.clubName}</div>
          </div>
          <div className="mt-8 pt-8 border-t border-indigo-500/10">
            <div className="text-sm text-indigo-400 font-bold mb-1 uppercase tracking-tighter">Status</div>
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
              Live & Open
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
