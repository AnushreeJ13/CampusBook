import { useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { useProfile } from '../../contexts/ProfileContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { rankEvents } from '../../utils/recommendationEngine';
import WhatsAppWidget from '../../components/common/WhatsAppWidget';
import { getAIRecommendations } from '../../utils/mlRecommender';
import {
  Calendar, MapPin, TrendingUp, Cpu, Map, Clock,
  ArrowRight, Activity, Zap, Shield, Sparkles, Target, AlertCircle, Bookmark, BookmarkCheck
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

  // Rank events using the actual intelligence engine
  const rankedEvents = useMemo(() => {
    const validEvents = proposals.filter(p =>
      [PROPOSAL_STATUS.VENUE_BOOKED, PROPOSAL_STATUS.APPROVED].includes(p.status)
    );
    return rankEvents(validEvents, {
      interests: profile?.interests || [],
      skills: profile?.skills || []
    });
  }, [proposals, profile]);

  // Campus Dashboard Metadata Calculations
  const nodeCount = rankedEvents.length;
  const sectorCount = venues.length;
  const signalDensity = (profile?.telemetry?.totalEventsAttended || 0);

  if (profile && !profile.onboardingComplete) {
    return <InterestOnboarding />;
  }

  return (
    <div className="page-container student-dashboard-page">
      <IntelligenceTicker />

      {/* Campus Dashboard Hero Header */}
      <div className="student-hero">
        <div className="student-blob student-blob-1" />
        <div className="student-blob student-blob-2" />

        <div className="student-hero-content">
          <p className="student-greeting">
            <Sparkles size={14} className="text-yellow-400" />
            {new Date().getHours() < 12 ? 'Good Morning!' : new Date().getHours() < 17 ? 'Good Afternoon!' : 'Good Evening!'}
          </p>
          <h1>Welcome Back, {user?.name || 'Student'}</h1>
          <p className="student-hero-sub">Explore your personalized campus feed. We've matched the best events based on your interests.</p>
        </div>
      </div>

<<<<<<< HEAD
  <div className="dashboard-content-inner">
    {/* Campus Insights Grid */}
    <div className="student-stats-grid">
      <div className="student-stat">
        <div className="student-stat-icon"><Zap size={24} /></div>
        <div className="student-stat-info">
          <span className="student-stat-value">{profile?.interests?.length || 0}</span>
          <span className="student-stat-label">Active Interest Domains</span>
        </div>
=======
      {/* WhatsApp Notification Banner */}
        <WhatsAppWidget />

        {/* Stats - Clean SaaS Layout like Society */}
        <div className="student-stats-grid">
          <Link to="/events" className="student-stat stagger-1">
            <div className="student-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <Calendar size={24} strokeWidth={2.5} />
>>>>>>> 1bac6ff (whatsapp feature)
            </div>

            <div className="student-stat">
              <div className="student-stat-icon"><Target size={24} /></div>
              <div className="student-stat-info">
                <span className="student-stat-value">{profile?.joinedEvents?.length || 0}</span>
                <span className="student-stat-label">Events Joined</span>
              </div>
            </div>

            <div className="student-stat">
              <div className="student-stat-icon"><Map size={24} /></div>
              <div className="student-stat-info">
                <span className="student-stat-value">{sectorCount}</span>
                <span className="student-stat-label">Total Locations</span>
              </div>
            </div>
        </div>

        <div className="dashboard-main-grid">
          <div className="main-left">
            <div className="grid-header">
              <Sparkles size={18} className="text-yellow-400" />
              <h2>Personal Recommendations</h2>
              <Link to="/events" className="view-all">Find More <ArrowRight size={14} /></Link>
            </div>

            {/* Neural AI Recommender Component */}
            <div className="animate-card-entrance" style={{ animationDelay: '0.45s' }}>
              <EventRecommendations />
            </div>

            {/* Global Event Grid */}
            <div className="feed-section">
              <div className="student-section-header">
                <div className="section-header-left">
                  <div className="section-dot" />
                  <h2 className="section-title">Live Event Feed</h2>
                </div>
                <Link to="/events" className="btn-primary-link">
                  View All Events
                  <ArrowRight size={16} className="arrow-icon" />
                </Link>
              </div>

              <div className="student-events-grid">
                {rankedEvents.slice(0, 6).map((event, i) => {
                  const venue = venues.find(v => v.id === event.venueId);
                  return (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="student-event-card"
                      style={{ animationDelay: `${0.6 + (i * 0.1)}s` }}
                    >
                      <div className="card-scanner-line" />
                      <div className="event-card-header flex justify-between items-center w-full">
                        <div className="flex gap-sm">
                          <div className="event-type-badge">EVENT</div>
                          {event.affinityScore > 0.7 && (
                            <span className="event-match-badge">
                              <Sparkles size={12} /> Matched
                            </span>
                          )}
                        </div>
                        <button
                          className="save-event-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSavedEvent(event.id);
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10, padding: '4px' }}
                        >
                          {user?.savedEvents?.includes(event.id) ? (
                            <BookmarkCheck size={18} fill="var(--accent)" color="var(--accent)" />
                          ) : (
                            <Bookmark size={18} color="var(--text-tertiary)" className="hover:text-accent transition-colors" />
                          )}
                        </button>
                      </div>

                      <div className="event-card-poster" style={{ margin: '12px 0', borderRadius: '8px', overflow: 'hidden', height: '120px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {event.posterUrl && event.posterUrl !== 'default-logo' ? (
                          <img src={event.posterUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ opacity: 0.3, transform: 'scale(1.5)' }}>
                            <UniflowLogo />
                          </div>
                        )}
                      </div>

                      <h3 className="student-event-title">{event.title}</h3>
                      <span className="student-event-club">{event.clubName || 'General'}</span>

                      <div className="student-event-details">
                        <div className="detail-item">
                          <Clock size={14} />
                          {event.date}
                        </div>
                        <div className="detail-item">
                          <MapPin size={14} />
                          {venue?.name || 'TBD'}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {rankedEvents.length === 0 && (
                  <div className="empty-feed-state glass-pane">
                    <div className="status-msg flex flex-col items-center gap-4">
                      <AlertCircle size={48} className="text-dim opacity-30" />
                      <span className="text-xs text-dim">No updates available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="main-right">
            <div className="grid-header">
              <TrendingUp size={18} />
              <h2>Interest Pulse</h2>
            </div>
            <div className="intelligence-panel">
              <InterestProfileGraph />
            </div>

            <div className="grid-header mt-8">
              <BookmarkCheck size={18} className="text-yellow-400" />
              <h2>Saved Events</h2>
            </div>
            <div className="intelligence-panel">
              {user?.savedEvents && user.savedEvents.length > 0 ? (
                <div className="flex flex-col gap-sm">
                  {proposals.filter(p => user.savedEvents.includes(p.id)).map(event => (
                    <Link key={event.id} to={`/events/${event.id}`} className="p-3 bg-card border border-border-secondary rounded-lg hover:border-accent transition-colors">
                      <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{event.title}</h4>
                      <p className="text-xs text-dim mt-1">{event.date}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="text-xs text-dim">No saved events. Bookmark events to review them here.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
    );
}
