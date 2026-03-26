import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { Bell, Search, X, FileText, MapPin, Sparkles, Menu } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './TopBar.css';

export default function TopBar({ onMenuClick }) {
  const { user, university } = useAuth();
  const { notifications, markNotificationRead, proposals } = useProposals();
  const { venues } = useVenues();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const userNotifs = notifications.filter(n => n.userId === user?.id);
  const unreadCount = userNotifs.filter(n => !n.read).length;

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // — FUNCTIONAL SEARCH: searches proposals + venues live —
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const matchedProposals = proposals
      .filter(p => p.title.toLowerCase().includes(q) || p.clubName?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(p => ({ id: p.id, type: 'proposal', title: p.title, sub: p.clubName || p.eventType, to: `/proposals/${p.id}` }));
    const matchedVenues = venues
      .filter(v => v.name.toLowerCase().includes(q) || v.type.toLowerCase().includes(q))
      .slice(0, 3)
      .map(v => ({ id: v.id, type: 'venue', title: v.name, sub: `${v.type.replace('_', ' ')} · Cap: ${v.capacity}`, to: '/venues' }));
    return [...matchedProposals, ...matchedVenues];
  }, [searchQuery, proposals, venues]);

  if (!user) return null;

  const timeStr = liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = liveTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile brand — visible when sidebar is hidden */}
        <div className="topbar-brand">
          <button className="mobile-menu-btn" onClick={onMenuClick}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand-icon"><Sparkles size={14} /></div>
          <span className="topbar-brand-name">CampusBook</span>
        </div>
        <h2 className="topbar-university">{university}</h2>
        <div className="live-indicator"><span className="live-dot" /><span>Live</span></div>
      </div>

      <div className="topbar-center" ref={searchRef}>
        <div className="topbar-search">
          <Search size={16} className="topbar-search-icon" />
          <input
            type="text"
            placeholder="Search proposals, venues..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            className="topbar-search-input"
          />
          {/* Search Results Dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map(r => (
                <Link
                  key={`${r.type}-${r.id}`}
                  to={r.to}
                  className="search-result-item"
                  onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                >
                  {r.type === 'proposal' ? <FileText size={16} /> : <MapPin size={16} />}
                  <div className="search-result-info">
                    <span className="search-result-title">{r.title}</span>
                    <span className="search-result-sub">{r.sub}</span>
                  </div>
                  <span className={`badge ${r.type === 'proposal' ? 'badge-accent' : 'badge-info'}`}>{r.type}</span>
                </Link>
              ))}
            </div>
          )}
          {showSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="search-results-dropdown">
              <div className="search-empty">No results for "{searchQuery}"</div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-clock">
          <span className="topbar-clock-time">{timeStr}</span>
          <span className="topbar-clock-date">{dateStr}</span>
        </div>

        {/* Notifications */}
        <div className="topbar-notif-wrapper" ref={notifRef}>
          <button className="topbar-notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="topbar-notif-badge">{unreadCount}</span>}
          </button>

          {showNotifs && (
            <div className="topbar-notif-panel">
              <div className="notif-panel-header">
                <h3>Notifications</h3>
                <button onClick={() => setShowNotifs(false)}><X size={16} /></button>
              </div>
              <div className="notif-panel-list">
                {userNotifs.length === 0 ? (
                  <p className="notif-empty">No notifications yet ✨</p>
                ) : (
                  userNotifs.slice(0, 8).map(n => (
                    <Link
                      key={n.id}
                      to={n.proposalId ? `/proposals/${n.proposalId}` : '/notifications'}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => { markNotificationRead(n.id); setShowNotifs(false); }}
                    >
                      <div className={`notif-dot notif-dot-${n.type}`} />
                      <div className="notif-content">
                        <span className="notif-title">{n.title}</span>
                        <span className="notif-message">{n.message}</span>
                        <span className="notif-time">{n.createdAt}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              {userNotifs.length > 0 && (
                <Link to="/notifications" className="notif-panel-footer" onClick={() => setShowNotifs(false)}>
                  View all notifications →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="topbar-user">
          <span className="topbar-user-avatar">{user.avatar}</span>
          <span className="topbar-user-name">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
