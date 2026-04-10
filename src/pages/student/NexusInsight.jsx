import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Zap, TrendingUp, Map as MapIcon, 
  Sparkles, Clock, MapPin, Coffee, BookOpen, Music,
  ArrowRight, ShieldCheck, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './NexusInsight.css';

const MOCK_PULSE = [
  { id: 1, type: 'CROWD', location: 'Main Canteen', level: 'HIGH', trend: 'UP', icon: Coffee },
  { id: 2, type: 'STUDY', location: 'LRC Floor 2', level: 'QUIET', trend: 'STABLE', icon: BookOpen },
  { id: 3, type: 'EVENT', location: 'Open Air Theatre', label: 'Sound Check in Progress', trend: 'STARTING', icon: Music },
  { id: 4, type: 'OPPORTUNITY', location: 'Placement Cell', label: '3 New Internships Posted', trend: 'CRITICAL', icon: Zap },
];

const ANALYTICS_DATA = [
  { label: 'Campus Energy', value: '84%', trend: '+5%', color: '#00f2fe' },
  { label: 'Resource Load', value: '42%', trend: '-2%', color: '#4facfe' },
  { label: 'Social Vibe', value: 'High', trend: 'Peak', color: '#f093fb' },
];

export default function NexusInsight() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="nexus-loading">
        <div className="nexus-loader">
          <Sparkles className="loader-icon" size={40} />
          <span>Synchronizing Nexus Intelligence...</span>
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
            <ShieldCheck size={14} />
            <span>CampusOS Verified Intelligence</span>
          </div>
          <h1>Nexus <span className="gradient-text">Insight</span></h1>
          <p>Real-time forensic analysis of your campus ecosystem.</p>
        </div>
        <div className="nexus-live-indicator">
          <div className="pulse-dot"></div>
          <span>LIVE PULSE</span>
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
              <h2>Opportunity Radar</h2>
            </div>
            <div className="radar-feed">
              {MOCK_PULSE.map((item) => (
                <div key={item.id} className="radar-item">
                  <div className="item-icon">
                    <item.icon size={20} />
                  </div>
                  <div className="item-details">
                    <div className="item-top">
                      <span className="item-location">{item.location}</span>
                      <span className={`item-tag tag-${item.level?.toLowerCase() || item.trend?.toLowerCase()}`}>
                        {item.level || item.trend}
                      </span>
                    </div>
                    <div className="item-label">{item.label || `${item.type} Activity Detected`}</div>
                  </div>
                  <ArrowRight size={16} className="item-arrow" />
                </div>
              ))}
            </div>
          </section>

          <section className="nexus-section highlight-section">
             <div className="section-header">
              <Zap size={20} className="text-secondary" />
              <h2>AI Recommended Slots</h2>
            </div>
            <div className="nexus-recommender">
              <div className="recommender-card">
                <div className="recommender-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="recommender-info">
                  <h3>Optimize Your Next Hour</h3>
                  <p>Based on your profile, we recommend the <strong>Seminar Hall A</strong> for the upcoming Guest Lecture on "AI Logistics".</p>
                  <button className="nexus-btn-sm">View Details</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Insights */}
        <aside className="nexus-sidebar">
          <div className="nexus-card heatmap-card">
            <h3>Activity Heatmap</h3>
            <div className="heatmap-placeholder">
              <MapIcon size={40} />
              <div className="heatmap-overlay">
                <div className="hotspot" style={{ top: '30%', left: '40%' }}></div>
                <div className="hotspot" style={{ top: '60%', left: '70%' }}></div>
                <div className="hotspot" style={{ top: '20%', left: '80%' }}></div>
              </div>
            </div>
            <div className="heatmap-legend">
              <span>Low</span>
              <div className="legend-gradient"></div>
              <span>Peak</span>
            </div>
          </div>

          <div className="nexus-card info-card">
            <div className="info-icon"><Info size={20} /></div>
            <p>Nexus Insight uses anonymized aggregate data from attendance logs and check-ins to provide real-time updates.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
