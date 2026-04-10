import { useState } from 'react';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { Calendar, MapPin, ChevronRight, Sparkles, Search, Bookmark, Target, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import EventRecommendations from '../../components/intelligence/EventRecommendations';
import './UpcomingEvents.css';

export default function UpcomingEvents() {
  const { user, toggleSavedEvent } = useAuth();
  const { proposals } = useProposals();
  const { venues } = useVenues();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Filter approved events that are in the future
  const upcomingEvents = proposals
    .filter(p => p.status === PROPOSAL_STATUS.APPROVED || p.status === PROPOSAL_STATUS.VENUE_BOOKED)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const filteredEvents = upcomingEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.clubName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || event.eventType?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="events-page-container">
      <header className="events-header">
        <div className="events-title-group">
          <h1>
            Campus Events
            <Sparkles className="text-accent animate-pulse" size={32} />
          </h1>
          <p>Discover and register for the latest events happening on campus.</p>
        </div>
        
        <div className="scanner-controls">
          <div className="scanner-input-group">
            <Search size={18} className="text-secondary" />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="scanner-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="scanner-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="workshop">Workshops</option>
            <option value="competition">Competitions</option>
            <option value="cultural">Cultural</option>
            <option value="seminar">Seminars</option>
          </select>
        </div>
      </header>

      {filteredEvents.length === 0 ? (
        <div className="nodes-empty">
          <Shield size={64} className="empty-icon" />
          <h3>No events found</h3>
          <p>We couldn't find any upcoming events matching your search criteria.</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event) => {
            const venue = venues.find(v => v.id === event.venueId);
            const isSaved = (user?.saved_events || user?.savedEvents || []).includes(event.id);

            return (
              <Link key={event.id} to={`/events/${event.id}`} className="data-node">
                <div className="node-visualizer">
                  <div className="node-type-badge">{event.eventType || 'Event'}</div>
                  <div className="icon-box brand-icon">
                     <Sparkles size={32} className="text-accent" />
                  </div>
                  <div className="absolute top-4 right-4 z-20">
                    <button 
                      className={`icon-box hover:scale-110 transition-colors ${isSaved ? 'bg-accent border-accent text-white' : 'bg-glass'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSavedEvent(event.id);
                      }}
                    >
                       <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="node-date-row">
                     <Calendar size={12} className="text-secondary" />
                     <span className="node-date-text">{event.date}</span>
                  </div>

                  <h3 className="node-title">{event.title}</h3>
                  <p className="node-description line-clamp-2">
                    {event.description || `Join us for this exciting event organized by ${event.clubName}. Bring your college ID!`}
                  </p>
                </div>

                <div className="node-footer">
                  <div className="node-meta">
                     <MapPin size={14} className="text-accent" />
                     {venue?.name || 'TBD'}
                  </div>
                  
                  <div className="access-node-btn">
                    View Details
                    <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Recommended Section (ML) */}
      <section style={{ marginTop: '2rem' }}>
         <EventRecommendations />
      </section>
    </div>
  );
}
