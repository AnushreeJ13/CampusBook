import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import { Sparkles, GraduationCap, Users, BookOpen, Shield } from 'lucide-react';
import './Login.css';

const ROLE_CARDS = [
  { role: ROLES.STUDENT, icon: GraduationCap, label: 'Student', desc: 'Browse venues & events', color: '#3B82F6' },
  { role: ROLES.SOCIETY, icon: Users, label: 'Society', desc: 'Create & manage proposals', color: '#8B5CF6' },
  { role: ROLES.FACULTY, icon: BookOpen, label: 'Faculty Advisor', desc: 'Review & approve proposals', color: '#F59E0B' },
  { role: ROLES.ADMIN, icon: Shield, label: 'Admin', desc: 'Full system control', color: '#10B981' },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [universityName, setUniversityName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!selectedRole) return;
    login(selectedRole, universityName || 'CampusBook University');
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <Sparkles size={32} />
          </div>
          <h1 className="login-title">CampusBook</h1>
          <p className="login-subtitle">
            Smart Event Proposal & Venue Management Platform
          </p>
        </div>

        {/* University Input */}
        <div className="login-university-section">
          <label className="login-label">Your University</label>
          <input
            type="text"
            className="login-university-input"
            placeholder="Enter university name..."
            value={universityName}
            onChange={(e) => setUniversityName(e.target.value)}
          />
        </div>

        {/* Role Selection */}
        <div className="login-roles-section">
          <label className="login-label">Select Your Role</label>
          <div className="login-roles-grid">
            {ROLE_CARDS.map((card) => (
              <button
                key={card.role}
                className={`login-role-card ${selectedRole === card.role ? 'selected' : ''}`}
                onClick={() => setSelectedRole(card.role)}
                style={{ '--card-color': card.color }}
              >
                <div className="login-role-icon-wrapper">
                  <card.icon size={28} />
                </div>
                <span className="login-role-label">{card.label}</span>
                <span className="login-role-desc">{card.desc}</span>
                {selectedRole === card.role && (
                  <div className="login-role-check">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Login Button */}
        <button
          className={`login-btn ${selectedRole ? 'active' : ''}`}
          onClick={handleLogin}
          disabled={!selectedRole}
        >
          <Sparkles size={18} />
          Enter CampusBook
        </button>

        <p className="login-hint">
          🎓 Demo mode — select any role to explore the platform
        </p>
      </div>
    </div>
  );
}
