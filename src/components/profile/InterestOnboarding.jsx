import React, { useState } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { Target, Zap, Sparkles, Check, ArrowRight, BookOpen, Music, Users, Trophy, Code } from 'lucide-react';
import './InterestOnboarding.css';

const DOMAINS = [
  { id: 'tech', label: 'Technology', icon: <Code size={20} />, color: '#6366f1' },
  { id: 'culture', label: 'Cultural & Arts', icon: <Music size={20} />, color: '#ec4899' },
  { id: 'social', label: 'Social & Fun', icon: <Users size={20} />, color: '#10b981' },
  { id: 'academic', label: 'Academic & Career', icon: <BookOpen size={20} />, color: '#f59e0b' },
  { id: 'sports', label: 'Sports & Fitness', icon: <Trophy size={20} />, color: '#ef4444' }
];

const SKILLS = [
  'Python', 'React', 'Public Speaking', 'Marketing', 'UI Design', 
  'Web Development', 'Machine Learning', 'Leadership', 'Event Management',
  'Graphic Design', 'Data Analysis', 'Cybersecurity'
];

export default function InterestOnboarding() {
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const toggleInterest = (id) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleComplete = async () => {
    try {
      await updateProfile({
        interests: selectedInterests,
        skills: selectedSkills,
        onboardingComplete: true
      });
    } catch (err) {
      console.warn('Failed to update profile remotely. Bypassing onboarding for session.', err);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card glass-pane animate-scale-up">
        {/* Progress Bar */}
        <div className="onboarding-progress">
          <div className="progress-fill" style={{ width: `${(step / 2) * 100}%` }} />
        </div>

        {step === 1 ? (
          <div className="onboarding-step">
            <div className="step-header">
              <div className="step-badge">Phase 1/2</div>
              <h2>Select your Smart Interests</h2>
              <p>Choose at least 2 domains to calibrate your personalized event feed.</p>
            </div>

            <div className="domain-grid">
              {DOMAINS.map(domain => {
                const isSelected = selectedInterests.includes(domain.id);
                return (
                  <button 
                    key={domain.id}
                    onClick={() => toggleInterest(domain.id)}
                    className={`domain-item ${isSelected ? 'selected' : ''}`}
                    style={{ '--domain-color': domain.color }}
                  >
                    <div className="domain-icon">{domain.icon}</div>
                    <div className="domain-label">{domain.label}</div>
                    {isSelected && <Check className="check-icon" size={14} />}
                  </button>
                );
              })}
            </div>

            <button 
              className="onboarding-btn-next"
              disabled={selectedInterests.length < 2}
              onClick={() => setStep(2)}
            >
              Continue Calibration <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="onboarding-step">
            <div className="step-header">
              <div className="step-badge">Phase 2/2</div>
              <h2>Identify your Skillset</h2>
              <p>Pick tags that reflect your current skills or what you want to learn.</p>
            </div>

            <div className="skills-cloud">
              {SKILLS.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`skill-tag ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                >
                  {skill}
                </button>
              ))}
            </div>

            <div className="onboarding-actions">
              <button className="btn-back" onClick={() => setStep(1)}>Back</button>
              <button 
                className="onboarding-btn-complete"
                disabled={selectedSkills.length < 1}
                onClick={handleComplete}
              >
                Finalize Setup <Sparkles size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
