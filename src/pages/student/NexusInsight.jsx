import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Users, Zap, TrendingUp, Map as MapIcon, 
  Sparkles, Clock, MapPin, Coffee, BookOpen, Music,
  ArrowRight, ShieldCheck, Info, Target, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import EventRecommendations from '../../components/intelligence/EventRecommendations';
import './NexusInsight.css';

const MOCK_PULSE = [
  { id: 1, type: 'HANGOUT', location: 'Main Canteen', level: 'HIGH', trend: 'UP', icon: Coffee },
  { id: 2, type: 'QUIET ZONE', location: 'LRC Floor 2', level: 'QUIET', trend: 'STABLE', icon: BookOpen },
  { id: 3, type: 'HAPPENING NOW', location: 'Open Air Theatre', label: 'Sound Check in Progress', trend: 'STARTING', icon: Music },
  { id: 4, type: 'CAREER BOOST', location: 'Placement Cell', label: '3 New Internships Posted', trend: 'CRITICAL', icon: Zap },
];

const ANALYTICS_DATA = [
  { label: 'Campus Energy', value: '84%', trend: '+5%', color: '#00f2fe' },
  { label: 'Study Vibe', value: '42%', trend: '-2%', color: '#4facfe' },
  { label: 'Social Vibe', value: 'High', trend: 'Peak', color: '#f093fb' },
];

export default function NexusInsight() {
  const { user } = useAuth();
  const { proposals } = useProposals();
  const { activeSessions } = useAttendance();
  const [loading, setLoading] = useState(true);

  // Transform real proposals to live radar pulses incorporating live attendance data!
  const livePulse = React.useMemo(() => {
    if (!proposals || proposals.length === 0) return MOCK_PULSE;
    
    // Grab the most recently approved/upcoming events to feature on the radar
    const validEvents = proposals.filter(p => p.status === 'approved' || p.status === 'venue_booked').slice(0, 4);
    if (validEvents.length === 0) return MOCK_PULSE;
    
    return validEvents.map((event, idx) => {
      const session = activeSessions?.find(s => s.eventId === event.id);
      const iconRotation = [Music, Zap, Coffee, BookOpen];
      
      let computedLevel = 'STABLE';
      let typeLabel = 'UPCOMING';
      
      if (session) {
        typeLabel = 'HAPPENING NOW';
        const attendees = session.attendeeCount || 0;
        if (attendees > 50) {
            computedLevel = 'HIGH';
        } else if (attendees > 10) {
            computedLevel = 'ONGOING';
        } else {
            computedLevel = 'STARTING';
        }
        
        // Show scan counts dynamically if it's active!
        computedLevel = attendees > 0 ? `${computedLevel} [${attendees}]` : computedLevel;
      } else {
        const d = new Date(event.date);
        const today = new Date();
        const diff = d - today;
        if (diff > 0 && diff < 86400000) {
            computedLevel = 'STARTING';
            typeLabel = 'STARTING SOON';
        } else if (diff < 0) {
            computedLevel = 'ENDED';
            typeLabel = 'RECENT EVENT';
        } else {
            computedLevel = 'UP';
        }
      }

      // Safe stripping of dynamically added brackets for CSS class
      const cssClassLevel = computedLevel.split(' ')[0].toLowerCase();
      
      return {
        id: event.id || `evt-${idx}`,
        type: typeLabel,
        location: event.eventVenue || event.venue_id || 'Campus Grounds',
        level: computedLevel,
        cssClass: cssClassLevel,
        label: event.eventName || event.title,
        icon: iconRotation[idx % iconRotation.length]
      };
    });
  }, [proposals, activeSessions]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="nexus-loading">
        <div className="nexus-loader">
          <Sparkles className="loader-icon" size={40} />
          <span>Loading Campus Insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="nexus-container">
      {/* Header Section */}
      <header className="nexus-header">
        <div className="header-content">
          <div className="nexus-badge">
            <Sparkles size={14} />
            <span>CampusOS Student Hub</span>
          </div>
          <h1>Campus <span className="gradient-text">Pulse</span></h1>
          <p>Your personalized real-time view of campus life and activities.</p>
        </div>
        <div className="nexus-live-indicator">
          <div className="pulse-dot"></div>
          <span>LIVE NOW</span>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="nexus-grid">
        {ANALYTICS_DATA.map((stat, i) => (
          <div key={i} className="stat-card" style={{ '--accent': stat.color }}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-main">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-trend">{stat.trend}</span>
            </div>
            <div className="stat-progress">
              <div className="progress-bar" style={{ width: stat.value }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="nexus-layout">
        {/* Main Feed */}
        <div className="nexus-main-feed">
          <section className="nexus-section">
            <div className="section-header">
              <Activity size={20} className="text-primary" />
              <h2>Live Campus Radar</h2>
            </div>
            <div className="radar-feed">
              {livePulse.map((item) => (
                <Link to="/events" key={item.id} className="radar-item relative overflow-hidden" style={{ textDecoration: 'none', display: 'flex' }}>
                  <div className="item-icon">
                    <item.icon size={24} />
                  </div>
                  <div className="item-details hover-highlight z-10">
                    <div className="item-top">
                      <span className="item-location">{item.location}</span>
                      <span className={`item-tag tag-${item.cssClass}`}>
                        {item.level}
                      </span>
                    </div>
                    <div className="item-label" style={{color: '#9ca3af'}}>{item.type} • {item.label}</div>
                  </div>
                  <ChevronRight className="item-arrow z-10" size={20} />
                </Link>
              ))}
            </div>
          </section>

          <section className="nexus-section highlight-section" style={{ background: 'transparent', border: 'none', padding: 0 }}>
             <div className="section-header" style={{ marginBottom: '1rem' }}>
              <Zap size={20} className="text-secondary" />
              <h2>For You: Top Picks</h2>
            </div>
            <div className="nexus-recommender">
               <EventRecommendations />
            </div>
          </section>
        </div>

        {/* Sidebar Insights */}
        <aside className="nexus-sidebar">
          <div className="nexus-card heatmap-card">
            <h3>Campus Heatmap</h3>
            <div className="heatmap-placeholder">
              <MapIcon size={40} />
              <div className="heatmap-overlay">
                <div className="hotspot" style={{ top: '30%', left: '40%' }}></div>
                <div className="hotspot" style={{ top: '60%', left: '70%' }}></div>
                <div className="hotspot" style={{ top: '20%', left: '80%' }}></div>
              </div>
            </div>
            <div className="heatmap-legend">
              <span>Chill</span>
              <div className="legend-gradient"></div>
              <span>Packed</span>
            </div>
          </div>

          <div className="nexus-card info-card">
            <div className="info-icon"><Info size={20} /></div>
            <p>Campus Pulse uses anonymized check-ins to show you exactly where the action is happening right now.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
