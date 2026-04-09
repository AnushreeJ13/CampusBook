import { useState } from 'react';
import { COLLEGES } from '../utils/constants';
import './CollegeSelector.css';

export default function CollegeSelector({ onSelect }) {
  return (
    <div className="college-selector-overlay">
      <div className="college-selector-container">
        <div className="selector-header">
          <div className="selector-badge">
            Select Your Institution
          </div>
          <h1 className="selector-title">
            Welcome to <span>UniFlow</span>
          </h1>
          <p className="selector-subtitle">
            Choose your college to enter the decentralized campus intelligence engine.
          </p>
        </div>

        <div className="college-grid">
          {COLLEGES.map((college) => (
            <button
              key={college.id}
              onClick={() => onSelect(college)}
              className="college-card"
            >
              <div className="college-card-glow" />
              
              <div className="relative-z-10">
                <div className="college-card-logo">
                  {college.logo}
                </div>
                <h3 className="college-card-name">
                  {college.name}
                </h3>
                <div className="college-card-tag">
                  {college.shortName}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="selector-footer">
          <p>© 2026 UniFlow Intelligence Platform</p>
          <div className="footer-dots">
            <span />
            <span className="active" />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

