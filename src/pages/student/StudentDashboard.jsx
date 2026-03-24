import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { Calendar, MapPin, Clock, Eye, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_VENUES } from '../../utils/mockData';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { proposals, bookings } = useProposals();
  const { venues } = useVenues();

  const upcomingEvents = proposals.filter(p =>
    [PROPOSAL_STATUS.VENUE_BOOKED, PROPOSAL_STATUS.APPROVED].includes(p.status)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome, {user.name.split(' ')[0]}! 👋</h1>
        <p>Discover events and browse available venues across campus</p>
      </div>

      {/* Stats */}
      <div className="grid grid-4 gap-lg" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="stat-card animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon"><Calendar size={20} /></div>
          </div>
          <div className="stat-value">{upcomingEvents.length}</div>
          <div className="stat-label">Upcoming Events</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon"><MapPin size={20} /></div>
          </div>
          <div className="stat-value">{venues.length}</div>
          <div className="stat-label">Campus Venues</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-value">{proposals.filter(p => p.status === PROPOSAL_STATUS.VENUE_BOOKED).length}</div>
          <div className="stat-label">Events This Month</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon"><Sparkles size={20} /></div>
          </div>
          <div className="stat-value">{bookings.filter(b => b.status === 'confirmed').length}</div>
          <div className="stat-label">Active Bookings</div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Upcoming Events</h2>
          <Link to="/events" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        <div className="grid grid-3 gap-lg">
          {upcomingEvents.slice(0, 6).map((event, i) => {
            const venue = venues.find(v => v.id === event.venueId);
            return (
              <div key={event.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
                  <span style={{ fontSize: '24px' }}>{venue?.image || '📍'}</span>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>{event.title}</h3>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>by {event.clubName}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-xs" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-xs"><Calendar size={12} /> {event.date}</div>
                  <div className="flex items-center gap-xs"><MapPin size={12} /> {venue?.name || 'TBD'}</div>
                  <div className="flex items-center gap-xs"><Eye size={12} /> {event.expectedAttendees} attendees expected</div>
                </div>
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <span className={`badge ${event.status === PROPOSAL_STATUS.VENUE_BOOKED ? 'badge-success' : 'badge-accent'}`}>
                    {event.status === PROPOSAL_STATUS.VENUE_BOOKED ? '✅ Confirmed' : '⏳ Approved'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access - Venues */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Campus Venues</h2>
          <Link to="/venues" className="btn btn-ghost btn-sm">Browse All →</Link>
        </div>
        <div className="grid grid-3 gap-lg">
          {venues.slice(0, 3).map((venue, i) => (
            <div key={venue.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-md)' }}>
                <span style={{ fontSize: '32px' }}>{venue.image}</span>
                <div>
                  <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>{venue.name}</h3>
                  <span className="badge badge-accent">{venue.type.replace('_', ' ')}</span>
                </div>
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
                {venue.description}
              </p>
              <div className="flex items-center gap-lg" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                <span>👥 Capacity: {venue.capacity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
