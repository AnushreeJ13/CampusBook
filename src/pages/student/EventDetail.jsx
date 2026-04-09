import { useParams, useNavigate } from 'react-router-dom';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { EVENT_TYPES } from '../../utils/constants';
import { 
  Calendar, Clock, MapPin, 
  Users, ChevronLeft, Info, Scan, ShieldCheck, 
  CheckCircle2, Ticket
} from 'lucide-react';
import './EventDetail.css';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { proposals } = useProposals();
  const { venues } = useVenues();
  const { activeSessions, myAttendance, checkIn } = useAttendance();
  
  const event = proposals.find(p => p.id === id);
  const venue = venues.find(v => v.id === event?.venueId);
  const activeSession = activeSessions.find(s => s.eventId === id && s.isActive);
  const hasAttended = myAttendance.some(a => a.sessionId === activeSession?.id);

  if (!event) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
        <Calendar size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.5, marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Event Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>The requested event could not be found or you don't have access.</p>
        <button 
          onClick={() => navigate('/events')}
          className="btn-primary"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const handleCheckIn = async () => {
    if (activeSession) {
      await checkIn(activeSession.id, event.id);
    }
  };

  const typeInfo = EVENT_TYPES.find(t => t.value === event.eventType);

  return (
    <div className="event-detail-page">
      
      <button 
        onClick={() => navigate('/events')}
        className="btn-back"
      >
        <ChevronLeft size={16} /> Back to Events
      </button>

      {/* Main Header */}
      <div className="event-detail-header">
        <div className="event-tags-row">
            <span className="event-tag-primary">
                {typeInfo?.label || 'General Event'}
            </span>
            {activeSession ? (
                <span className="event-tag-live">
                    <span className="live-dot"></span>
                    HAPPENING NOW
                </span>
            ) : (
                <span className="event-tag-upcoming">Upcoming</span>
            )}
        </div>
        
        <h1 className="event-hero-title">{event.title}</h1>

        <div className="event-meta-row">
            <div className="event-meta-item">
                <Calendar size={18} />
                <span>{event.date}</span>
            </div>
            <div className="event-meta-item">
                <Clock size={18} />
                <span>{event.timeSlot?.split('_').join(' ').toUpperCase()}</span>
            </div>
            <div className="event-meta-item">
                <MapPin size={18} />
                <span>{venue?.name || 'TBD'}</span>
            </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="event-layout-grid">
        
        {/* Left Column: Details */}
        <div className="event-main-col">
          <div className="event-block">
            <h3 className="block-title">
              <Info /> Event Details
            </h3>
            <p className="event-desc-text">
              {event.description || "Join us for this exciting event. An opportunity to connect, learn, and grow your network on campus. Don't forget to mark your attendance and participate!"}
            </p>
            
            <div className="event-stats-grid">
              <div className="event-stat-card">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Expected Attendees</div>
                  <div className="stat-value">{event.expectedAttendance || 'TBD'}</div>
                </div>
              </div>
              <div className="event-stat-card">
                <div className="stat-icon primary">
                  <MapPin size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Location</div>
                  <div className="stat-value">{venue?.address || 'TBD'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="event-block organizer-block">
            <div className="org-avatar">
               🏛️
            </div>
            <div className="org-info">
              <p className="org-label">Organized By</p>
              <h3 className="org-name">{event.clubName || 'General Campus Team'}</h3>
              <p className="org-sub">Verified University Organization</p>
            </div>
            <div className="org-badge">
               <ShieldCheck size={16} />
               <span>Trusted</span>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Scanner */}
        <div className="event-side-col">
          <div className="scanner-block">
             {activeSession ? (
               <>
                  <div className="scanner-icon-wrap">
                    <Scan size={36} className="text-green-400" style={{ color: '#34d399' }} />
                  </div>
                  
                  <h3 className="scanner-title">Event is Live</h3>
                  <p className="scanner-subtitle">Scan to mark your attendance</p>

                  <div className="qr-container">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UNIFLOW_CHECKIN_${activeSession.id}`} 
                      alt="Event QR Code Scanner"
                    />
                  </div>

                  <div className="checkin-stats">
                     <div className="stat-box">
                       <div className="stat-box-label">Checked In</div>
                       <div className="stat-box-value">{activeSession.attendeeCount || 0}</div>
                     </div>
                     <Users size={24} style={{ color: 'var(--text-tertiary)' }} />
                  </div>

                  {hasAttended ? (
                    <div className="btn-checked-in">
                       <CheckCircle2 size={20} />
                       <span>CHECKED IN</span>
                    </div>
                  ) : (
                    <button 
                      onClick={handleCheckIn}
                      className="btn-checkin"
                    >
                      CHECK-IN (TAP TO DEMO)
                    </button>
                  )}
               </>
             ) : (
               <>
                  <div className="scanner-icon-wrap disabled">
                    <Ticket size={36} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <h3 className="scanner-title">Check-in Unavailable</h3>
                  <p className="scanner-subtitle" style={{ marginBottom: 0 }}>This event is not currently live.</p>
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
