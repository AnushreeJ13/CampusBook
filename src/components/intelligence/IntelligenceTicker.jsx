import React from 'react';
import { Activity, Shield, Zap, Cpu } from 'lucide-react';
import './IntelligenceTicker.css';

const LOG_MESSAGES = [
  "CAMPUS LIVE: WELCOME TO UNIFLOW SMART CAMPUS",
  "UPCOMING: TECH SYMPOSIUM TOMORROW AT MAIN AUDITORIUM",
  "TRENDING: 150+ STUDENTS JOINED THE ROBOTICS WORKSHOP",
  "UPDATES: LIBRARY TIMINGS EXTENDED FOR FINALS WEEK",
  "EVENTS: 5 NEW STUDENT MIXERS ANNOUNCED",
  "COMMUNITY: JOIN THE WEEKLY CAMPUS CLEAN DRIVE",
  "SPORTS: INTER-COLLEGE BASKETBALL TRYOUTS AT 5 PM",
  "ALERTS: CAFETERIA SPECIAL MENU THIS FRIDAY"
];

export default function IntelligenceTicker() {
  return (
    <div className="intelligence-ticker">
      <div className="ticker-label">
        <Activity size={14} className="pulse-icon" />
        <span>LIVE FEED</span>
      </div>
      <div className="ticker-track">
        <div className="ticker-content">
          {LOG_MESSAGES.map((msg, i) => (
            <React.Fragment key={i}>
              <span className="ticker-msg">{msg}</span>
              <span className="ticker-sep">///</span>
            </React.Fragment>
          ))}
          {/* Duplicate for seamless loop */}
          {LOG_MESSAGES.map((msg, i) => (
            <React.Fragment key={`dup-${i}`}>
              <span className="ticker-msg">{msg}</span>
              <span className="ticker-sep">///</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="ticker-stats">
        <Cpu size={14} />
        <span>NODE-OS v2.4.0</span>
      </div>
    </div>
  );
}
