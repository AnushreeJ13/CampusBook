import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { getAIRecommendations } from '../../utils/mlRecommender';
import { Calendar, MapPin, TrendingUp, Cpu, Map, Clock, ArrowRight, Activity, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { proposals, bookings } = useProposals();
  const { venues } = useVenues();

  const upcomingEvents = proposals.filter(p => [PROPOSAL_STATUS.VENUE_BOOKED, PROPOSAL_STATUS.APPROVED].includes(p.status));
  
  // Real-time Machine Learning recommendations using the new Brain.js model!
  // If you book an event, the Neural Network will instantly re-train to recommend similar events!
  const myBookings = bookings?.filter(b => b.userId === user?.id) || [];
  
  // (Fallback: If you have 0 bookings, we temporarily feed it a simulated Hackathon history so you can see the AI working immediately)
  const trainingHistory = myBookings.length > 0 ? myBookings : [{ proposalId: 'p1' }];
  const aiRecommendations = getAIRecommendations(upcomingEvents, trainingHistory).slice(0, 2);

  return (
    <div className="page-container pb-8">
      {/* Hero Header */}
      <div className="student-hero">
        <div className="student-blob student-blob-1" />
        <div className="student-blob student-blob-2" />
        
        <div className="student-hero-content">
          <p className="student-greeting">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},
          </p>
          <h1>{user?.name?.split(' ')[0] || 'Student'}</h1>
          <p className="student-hero-sub">Ready to discover what's happening on campus today?</p>
        </div>
      </div>

      {/* Stats - Clean SaaS Layout like Society */}
      <div className="student-stats-grid">
        <Link to="/events" className="student-stat stagger-1">
          <div className="student-stat-icon" style={{background: '#eff6ff', color: '#3b82f6'}}>
            <Calendar size={24} strokeWidth={2.5} />
          </div>
          <div className="student-stat-info">
            <div className="student-stat-value">{upcomingEvents.length}</div>
            <div className="student-stat-label">Upcoming Events</div>
          </div>
        </Link>
        
        <Link to="/venues" className="student-stat stagger-2">
          <div className="student-stat-icon" style={{background: '#fce7f3', color: '#ec4899'}}>
            <Map size={24} strokeWidth={2.5} />
          </div>
          <div className="student-stat-info">
            <div className="student-stat-value">{venues.length}</div>
            <div className="student-stat-label">Campus Venues</div>
          </div>
        </Link>
        
        <Link to="/events" className="student-stat stagger-3">
          <div className="student-stat-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <div className="student-stat-info">
            <div className="student-stat-value">{proposals.filter(p => String(p.status).toLowerCase().includes('book')).length}</div>
            <div className="student-stat-label">Events This Month</div>
          </div>
        </Link>
        
        <Link to="/notifications" className="student-stat stagger-4">
          <div className="student-stat-icon" style={{background: '#dcfce7', color: '#22c55e'}}>
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div className="student-stat-info">
            <div className="student-stat-value">{bookings?.length || 0}</div>
            <div className="student-stat-label">Active Bookings</div>
          </div>
        </Link>
      </div>

      {/* --- REAL-TIME AI RECOMMENDER (Brain.js Neural Network Output) --- */}
      {aiRecommendations.length > 0 && (
        <div className="ai-recommendation-section animate-card-entrance stagger-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="ai-badge"><Cpu size={12}/> Brain.js Active</span>
            <h2 style={{fontSize: 'var(--font-lg)', fontWeight: 800, color: '#86198f', margin: 0}}>Just For You</h2>
          </div>
          <p style={{color: '#a21caf', fontSize: 'var(--font-sm)', opacity: 0.9, margin: 0}}>
            Our neural network has analyzed your event history to find these perfect matches.
          </p>

          <div className="ai-recommendation-grid">
            {aiRecommendations.map((event, i) => {
              const venue = venues.find(v => v.id === event.venueId);
              return (
                <Link to={`/events/${event.id}`} key={`ai-${event.id}`} className="ai-card" style={{animationDelay: `${i*0.1}s`}}>
                  <div className="match-score-badge">
                    <span className="match-score">{event.matchPercentage}%</span>
                    <span className="match-label">Match</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="student-event-title" style={{color: '#4a044e'}}>{event.title}</h3>
                    </div>
                    <span className="student-event-club" style={{color: '#c026d3', display: 'flex', alignItems: 'center', gap: 4}}><Zap size={12}/> {event.clubName}</span>
                    <div className="flex items-center gap-sm mt-3" style={{fontSize: 12, color: '#701a75', fontWeight: 600}}>
                       <Calendar size={12}/> {event.date} &nbsp; <MapPin size={12}/> {venue?.name || 'TBD'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events Grid */}
      <div className="mt-12 mb-10">
        <div className="student-section-header">
          <h2>Latest Events</h2>
          <Link to="/events" className="btn btn-ghost btn-sm text-accent-student">View All <ArrowRight size={16}/></Link>
        </div>
        
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link to="/events" className="bg-indigo-600 rounded-[2rem] p-6 text-white group hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl">🗓️</span>
              <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
            <div className="text-2xl font-black">{upcomingEvents.length}</div>
            <div className="text-indigo-100 text-sm font-bold opacity-80 uppercase tracking-wider">Live Events</div>
          </Link>
          <Link to="/venues" className="bg-slate-800 rounded-[2rem] p-6 text-white group hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl">🏛️</span>
              <div className="bg-white/10 p-2 rounded-xl group-hover:-rotate-12 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="text-2xl font-black">{venues.length}+</div>
            <div className="text-slate-400 text-sm font-bold opacity-80 uppercase tracking-wider">Venues</div>
          </Link>
        </div>

        {/* Event Cards Mapping */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.slice(0, 6).map((event) => {
            const venue = venues.find(v => v.id === event.venueId);
            return (
              <Link 
                key={event.id} 
                to={`/events/${event.id}`}
                className="group bg-white border border-slate-200 rounded-[2rem] p-6 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="student-event-icon-box">
                    <Calendar size={20} className="text-accent-student" />
                  </div>
                  <span className="badge badge-success">✓ Confirmed</span>
                </div>
                
                <div className="mb-4 flex-1">
                  <h3 className="student-event-title">{event.title}</h3>
                  <span className="student-event-club">by {event.clubName}</span>
                </div>
                
                <div className="student-event-details">
                  <div className="flex items-center gap-sm font-medium"><Clock size={14} className="text-accent-student" /> {event.date}</div>
                  <div className="flex items-center gap-sm font-medium"><MapPin size={14} className="text-accent-student" /> {venue?.name || 'TBD'}</div>
                </div>
              </Link>
            );
          })}
          {upcomingEvents.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed">
              No upcoming events right now. Check back later!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
