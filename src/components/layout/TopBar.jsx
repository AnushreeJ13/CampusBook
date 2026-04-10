import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Search, Menu, X, Clock, 
  Shield, Activity, Zap, Cpu, 
  ChevronDown, LogOut, Settings, User,
  Sun, Moon
} from 'lucide-react';
import './TopBar.css';

export default function TopBar({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { proposals } = useProposals();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const userMenuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn hidden-d" onClick={onMobileMenuToggle}>
          <Menu size={20} />
        </button>
        
        <div className="topbar-university hidden-m">
          FORENSIC TERMINAL [UNIFLOW]
        </div>

        {user?.incomplete && (
          <div className="profile-alert-banner animate-pulse">
            <Zap size={14} />
            <span>IDENTITY_INCOMPLETE: <Link to="/login?mode=google-setup">SYNC_PROFILE_NOW</Link></span>
          </div>
        )}
		
        <div className="system-status-pills">
          <div className="status-pill">
            <div className="indicator pulse"></div>
            SYSTEM_UPTIME: 99.9%
          </div>
          <div className="status-pill">
            <div className="indicator" style={{background: 'var(--accent)', boxShadow: '0 0 5px var(--accent)'}}></div>
            NEURAL_SYNC: ACTIVE
          </div>
          <div className="status-pill">
            <Activity size={10} style={{ color: 'var(--status-warning)' }} />
            LATENCY: 14MS
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="topbar-clock">
          <div className="topbar-clock-time">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </div>
          <div className="topbar-clock-date">
            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' })}
          </div>
        </div>

        <div className="topbar-user-wrapper" ref={userMenuRef}>
          <div className="topbar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="topbar-user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="topbar-user-name hidden-m">{user?.name}</span>
            <ChevronDown size={14} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </div>

          {showUserMenu && (
            <div className="topbar-user-dropdown animate-scale-in">
              <div className="user-dropdown-header">
                <p className="user-dropdown-label">User Identity</p>
                <p className="user-dropdown-email">{user?.email}</p>
              </div>
              <Link to="/profile" className="user-dropdown-item" onClick={() => setShowUserMenu(false)}>
                <User size={14} /> Profile Settings
              </Link>
              <Link to="/security" className="user-dropdown-item" onClick={() => setShowUserMenu(false)}>
                <Shield size={14} /> Security Keys
              </Link>
              <div className="user-dropdown-divider"></div>
              <button 
                onClick={handleLogout}
                className="user-dropdown-item logout-item"
              >
                <LogOut size={14} /> Close Terminal
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

  );
}
