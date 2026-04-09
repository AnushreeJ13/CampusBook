import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Search, Bell, Menu, X, Clock, 
  Shield, Activity, Zap, Cpu, 
  ChevronDown, LogOut, Settings, User,
  Sun, Moon
} from 'lucide-react';
import './TopBar.css';

export default function TopBar({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { proposals } = useProposals();
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
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

        <div className="topbar-notif-wrapper" ref={notifRef}>
          <button 
            className={`topbar-notif-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="topbar-notif-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="topbar-notif-panel forensic-panel animate-scale-in">
              <div className="notif-panel-header">
                <div className="flex items-center gap-2">
                  <div className="terminal-dot"></div>
                  <h3 className="notif-panel-title">INTEL_FEEDS [SEC_LEVEL_ALPHA]</h3>
                </div>
                <button className="dismiss-btn" onClick={() => markAsRead('all')}>// PURGE_ALL</button>
              </div>
              <div className="notif-panel-list custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''} alert-lvl-${n.type || 'info'}`}>
                      <div className="notif-marker">
                        <div className="marker-dot"></div>
                        <div className="marker-line"></div>
                      </div>
                      <div className="notif-content">
                        <div className="notif-meta">
                          <span className="notif-type">{n.type === 'recommendation' ? 'ENGINE_PULSE' : 'SYS_ALERT'}</span>
                          <span className="notif-time">{n.time}</span>
                        </div>
                        <div className="notif-body">
                          <span className="notif-title">{n.title}</span>
                          <p className="notif-message">{n.message}</p>
                        </div>
                        <div className="notif-footer">
                          <span className="notif-hash">ID: {n.id?.toString().slice(0, 8) || 'DEF-001'}</span>
                          <span className="notif-status">{n.read ? 'REPLICATED' : 'LIVE_FEED'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notif-empty">
                    <Zap size={24} className="empty-icon animate-pulse" />
                    <span>NO_ACTIVE_FEEDS_DETECTED</span>
                  </div>
                )}
              </div>
              <div className="notif-panel-footer">
                <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                  <div className="footer-link-content">
                    <Activity size={10} />
                    <span>OPEN_CENTRAL_LOGS</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
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
