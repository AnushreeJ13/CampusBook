import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { useProfile } from '../../contexts/ProfileContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { rankEvents } from '../../utils/recommendationEngine';
import WhatsAppWidget from '../../components/common/WhatsAppWidget';
import {
  Calendar, MapPin, TrendingUp, Map, Clock,
  ArrowRight, Zap, Sparkles, Target, AlertCircle, Bookmark, BookmarkCheck,
  ScanLine
} from 'lucide-react';
import { Link } from 'react-router-dom';
import IntelligenceTicker from '../../components/intelligence/IntelligenceTicker';
import EventRecommendations from '../../components/intelligence/EventRecommendations';
import InterestProfileGraph from '../../components/intelligence/InterestProfileGraph';
import InterestOnboarding from '../../components/profile/InterestOnboarding';
import UniflowLogo from '../../components/UniflowLogo';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user, toggleSavedEvent } = useAuth();
  const { proposals } = useProposals();
  const { venues } = useVenues();
  const { profile } = useProfile();

  // Rank events using the intelligence engine (VSM + Cosine Similarity + Peer Behavior)
  const rankedEvents = useMemo(() => {
    const validEvents = proposals.filter(p =>
      [PROPOSAL_STATUS.VENUE_BOOKED, PROPOSAL_STATUS.APPROVED].includes(p.status)
    );
    return rankEvents(validEvents, {
      interests: profile?.interests || [],
      skills: profile?.skills || [],
      id: user?.id || ''
    });
  }, [proposals, profile, user]);

  const sectorCount = venues.length;
  const eventsAttended = profile?.joinedEvents?.length || profile?.telemetry?.totalEventsAttended || profile?.eventsAttended || 0;

  // Saved events list
  const savedEventsList = useMemo(() => {
    if (!user?.savedEvents?.length) return [];
    return proposals.filter(p => user.savedEvents.includes(p.id));
  }, [proposals, user?.savedEvents]);

  // Global Check now handles onboarding in App.jsx

  return (
    <div className="page-container student-dashboard-page">
      <IntelligenceTicker />

      {/* Hero Header */}
      <div className="student-hero">
        <div className="student-blob student-blob-1" />
        <div className="student-blob student-blob-2" />

        <div className="student-hero-content">
          <p className="student-greeting">
            <Sparkles size={14} />
            {new Date().getHours() < 12 ? 'Good Morning!' : new Date().getHours() < 17 ? 'Good Afternoon!' : 'Good Evening!'}
          </p>
          <h1>Welcome Back, {user?.name || 'Student'}</h1>
          <p className="student-hero-sub">Your personalized campus intelligence feed — events matched to your interests, skills & attendance history.</p>
        </div>
      </div>

      <div className="dashboard-content-inner">
        {/* Stats Grid — 4 cards */}
        <div className="student-stats-grid">
          <div className="student-stat stat-interests">
            <div className="student-stat-icon icon-interests"><Zap size={22} /></div>
            <div className="student-stat-info">
              <span className="student-stat-value">{profile?.interests?.length || 0}</span>
              <span className="student-stat-label">Interest Domains</span>
            </div>
          </div>

          <Link to="/events" className="student-stat stat-events" style={{ textDecoration: 'none' }}>
            <div className="student-stat-icon icon-events"><Calendar size={22} /></div>
            <div className="student-stat-info">
              <span className="student-stat-value">{rankedEvents.length}</span>
              <span className="student-stat-label">Events Matched</span>
            </div>
          </Link>

          <div className="student-stat stat-attended">
            <div className="student-stat-icon icon-attended"><ScanLine size={22} /></div>
            <div className="student-stat-info">
              <span className="student-stat-value">{eventsAttended}</span>
              <span className="student-stat-label">Events Attended</span>
            </div>
          </div>

          <div className="student-stat stat-locations">
            <div className="student-stat-icon icon-locations"><Map size={22} /></div>
            <div className="student-stat-info">
              <span className="student-stat-value">{sectorCount}</span>
              <span className="student-stat-label">Campus Venues</span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="dashboard-main-grid">
          {/* LEFT — Main Content */}
          <div className="main-left">
            {/* AI Recommendations */}
            <div className="grid-header">
              <Sparkles size={18} />
              <h2>AI Recommendations</h2>
              <Link to="/events" className="view-all-link">Find More <ArrowRight size={14} /></Link>
            </div>
            <div className="dashboard-panel">
              <EventRecommendations />
            </div>

            {/* Live Event Feed */}
            <div className="feed-section">
              <div className="student-section-header">
                <div className="section-header-left">
                  <div className="section-dot" />
                  <h2 className="section-title">Live Event Feed</h2>
                </div>
                <Link to="/events" className="btn-primary-link">
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div className="student-events-grid">
                {rankedEvents.slice(0, 6).map((event, i) => {
                  const venue = venues.find(v => v.id === event.venueId);
                  const isSaved = user?.savedEvents?.includes(event.id);
                  return (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="student-event-card"
                      style={{ animationDelay: `${0.1 + (i * 0.08)}s` }}
                    >
                      <div className="card-scanner-line" />
                      <div className="event-card-header">
                        <div className="event-badges-row">
                          <div className="event-type-badge">EVENT</div>
                          {event.affinityScore > 0.7 && (
                            <span className="event-match-badge">
                              <Sparkles size={11} /> {Math.round(event.affinityScore * 100)}% Match
                            </span>
                          )}
                        </div>
                        <button
                          className="save-event-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSavedEvent(event.id);
                          }}
                        >
                          {isSaved ? (
                            <BookmarkCheck size={18} className="bookmark-active" />
                          ) : (
                            <Bookmark size={18} className="bookmark-inactive" />
                          )}
                        </button>
                      </div>

                      <div className="event-card-poster">
                        {event.posterUrl && event.posterUrl !== 'default-logo' ? (
                          <img src={event.posterUrl} alt={event.title} />
                        ) : (
                          <div className="poster-placeholder">
                            <UniflowLogo />
                          </div>
                        )}
                      </div>

                      <h3 className="student-event-title">{event.title}</h3>
                      <span className="student-event-club">{event.clubName || 'General'}</span>

                      <div className="student-event-details">
                        <div className="detail-item">
                          <Clock size={13} />
                          <span>{event.date}</span>
                        </div>
                        <div className="detail-item">
                          <MapPin size={13} />
                          <span>{venue?.name || 'TBD'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {rankedEvents.length === 0 && (
                  <div className="empty-feed-state">
                    <AlertCircle size={40} />
                    <span>No events found. Check back later!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Sidebar Widgets */}
          <div className="main-right">
            {/* WhatsApp Widget */}
            <WhatsAppWidget />

            {/* Interest Pulse — Made Prominent */}
            <div className="grid-header">
              <TrendingUp size={18} />
              <h2>Interest Pulse</h2>
            </div>
            <div className="dashboard-panel interest-panel-highlight">
              <InterestProfileGraph />
              <div className="interest-footer">
                <Link to="/profile" className="interest-edit-link">
                  <Target size={14} /> Edit Interests
                </Link>
              </div>
            </div>

            {/* Saved Events */}
            <div className="grid-header">
              <BookmarkCheck size={18} />
              <h2>Saved Events</h2>
              {savedEventsList.length > 0 && (
                <span className="saved-count-badge">{savedEventsList.length}</span>
              )}
            </div>
            <div className="dashboard-panel saved-events-panel">
              {savedEventsList.length > 0 ? (
                <div className="saved-events-list">
                  {savedEventsList.map(event => (
                    <Link key={event.id} to={`/events/${event.id}`} className="saved-event-item">
                      <div className="saved-event-info">
                        <h4>{event.title}</h4>
                        <span className="saved-event-meta">
                          <Clock size={12} /> {event.date}
                        </span>
                      </div>
                      <ArrowRight size={14} className="saved-event-arrow" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-saved-state">
                  <Bookmark size={28} />
                  <p>No saved events yet</p>
                  <span>Bookmark events from the feed to see them here</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
