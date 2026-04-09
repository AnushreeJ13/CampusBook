import { useState, useEffect } from 'react';
import { useProposals } from '../../contexts/ProposalContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { Calendar, MapPin, Users, Info, ChevronRight, Sparkles, Filter, Search, Bookmark } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function UpcomingEvents() {
  const { user } = useAuth();
  const { proposals } = useProposals();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Filter approved events that are in the future
  const upcomingEvents = proposals
    .filter(p => p.status === PROPOSAL_STATUS.APPROVED || p.status === PROPOSAL_STATUS.VENUE_BOOKED)
    .filter(p => new Date(p.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const filteredEvents = upcomingEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.clubName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || event.type?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      <header className="mb-12" style={{marginBottom: '3rem'}}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem'}}>
          <div>
            <h1 className="text-4xl font-black mb-2 flex items-center gap-3" style={{fontSize: '2.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              What's Happening? 
              <Sparkles className="text-indigo-500 animate-pulse" size={32} />
            </h1>
            <p className="text-slate-500 text-lg" style={{fontSize: '1.125rem', color: '#64748b', margin: 0}}>Discover and join elite campus society events</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200" style={{display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
            <div className="flex items-center gap-2 px-3 border-r border-slate-200" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.75rem', borderRight: '1px solid #e2e8f0'}}>
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search events..." 
                className="bg-transparent border-none outline-none text-sm w-48"
                style={{background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', width: '12rem'}}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer px-2"
              style={{background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', fontWeight: 700, color: '#334155', cursor: 'pointer', padding: '0 0.5rem'}}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Genres</option>
              <option value="workshop">Workshops</option>
              <option value="competition">Competitions</option>
              <option value="cultural">Cultural</option>
              <option value="seminar">Seminars</option>
            </select>
          </div>
        </div>
      </header>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200" style={{textAlign: 'center', padding: '5rem', background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '2.5rem'}}>
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6" style={{width: '5rem', height: '5rem', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'}}>
             <Calendar size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2" style={{fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0}}>No events matching your search</h3>
          <p className="text-slate-500" style={{color: '#64748b', margin: 0}}>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <Link 
              key={event.id} 
              to={`/events/${event.id}`}
              className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col justify-between h-full"
            >
              {/* Event Image Placeholder */}
              <div className="h-48 bg-slate-100 relative overflow-hidden rounded-2xl mb-6" style={{height: '12rem', background: '#f1f5f9', position: 'relative', overflow: 'hidden'}}>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', zIndex: 10}}></div>
                 <div className="absolute top-4 right-4 z-20" style={{position: 'absolute', top: '1rem', right: '1rem', zIndex: 20}}>
                    <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-indigo-600 transition-all" style={{padding: '0.5rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '50%', color: 'white', border: 'none', cursor: 'pointer'}}>
                       <Bookmark size={20} />
                    </button>
                 </div>
                 <div className="absolute bottom-4 left-6 z-20" style={{position: 'absolute', bottom: '1rem', left: '1.5rem', zIndex: 20}}>
                    <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-wider" style={{padding: '0.25rem 0.75rem', background: '#4f46e5', color: 'white', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                       {event.type || 'Society Event'}
                    </div>
                 </div>
                 <div className="w-full h-full bg-indigo-50 flex items-center justify-center -rotate-3 scale-110" style={{width: '100%', height: '100%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-3deg) scale(1.1)'}}>
                    <Sparkles size={80} className="text-indigo-100" />
                 </div>
              </div>

              <div className="p-8 flex-1 flex flex-col" style={{padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column'}}>
                <div className="flex items-center gap-2 mb-4 text-xs font-black text-indigo-600 uppercase tracking-widest" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.1em'}}>
                   <Calendar size={14} />
                   {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>

                <h3 className="text-2xl font-black mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors" style={{fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', transition: 'color 0.2s'}}>
                  {event.title}
                </h3>
                
                <p className="text-slate-500 text-sm mb-6 line-clamp-3" style={{fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                  {event.description || `Join ${event.clubName || 'the society'} for an exciting session. Perfect for those looking to learn and network.`}
                </p>

                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between" style={{marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-sm" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontWeight: 700, fontSize: '0.875rem'}}>
                     <MapPin size={16} className="text-indigo-500" />
                     {event.venueName || 'Main Hall'}
                  </div>
                  
                  <button className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group/btn" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', border: 'none', background: 'none', cursor: 'pointer', padding: 0}}>
                    View Intel
                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recommended Section (ML) */}
      <section className="mt-20 p-12 bg-indigo-900 text-white rounded-[3rem] relative overflow-hidden" style={{marginTop: '5rem', padding: '3rem', background: '#1e1b4b', color: 'white', borderRadius: '3rem', position: 'relative', overflow: 'hidden'}}>
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-48 -mt-48" style={{position: 'absolute', top: 0, right: 0, width: '24rem', height: '24rem', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '50%', filter: 'blur(100px)', marginRight: '-12rem', marginTop: '-12rem'}}></div>
         
         <div className="relative z-10" style={{position: 'relative', zIndex: 10}}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/30 rounded-full text-xs font-black uppercase tracking-widest mb-6" style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', background: 'rgba(99, 102, 241, 0.3)', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem'}}>
               <Sparkles size={14} />
               Forensic Match
            </div>
            <h2 className="text-4xl font-black mb-4" style={{fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', margin: 0}}>Recommended for You</h2>
            <p className="text-indigo-200 text-lg mb-8 max-w-2xl" style={{fontSize: '1.125rem', color: '#c7d2fe', marginBottom: '2rem', maxWidth: '42rem', margin: 0}}>
               Our intelligence model suggests these events based on your interest in technical workshops and networking sessions.
            </p>
            
            <div className="flex flex-wrap gap-4" style={{display: 'flex', flexWrap: 'wrap', gap: '1rem'}}>
               <button className="bg-white text-indigo-900 px-8 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all" style={{background: 'white', color: '#1e1b4b', padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: 900, border: 'none', cursor: 'pointer'}}>
                  Explore Predictions
               </button>
               <button className="bg-indigo-800 text-white px-8 py-3 rounded-2xl font-black border border-indigo-700 hover:bg-indigo-700 transition-all" style={{background: '#3730a3', color: 'white', padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: 900, border: '1px solid #4338ca', cursor: 'pointer'}}>
                  View Smart Calendar
               </button>
            </div>
         </div>
      </section>
    </div>
  );
}
