import { useAuth } from '../contexts/AuthContext';
import { useProposals } from '../contexts/ProposalContext';
import { Bell, Check, CheckCheck, Zap, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Notifications.css';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, markNotificationRead } = useProposals();

  const myNotifs = notifications.filter(n => n.userId === user?.id);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'approval': return '✅';
      case 'rejection': return '❌';
      case 'revision': return '✏️';
      case 'booking': return '🏟️';
      case 'submission': return '📄';
      default: return '🔔';
    }
  };

  return (
    <div className="notif-container animate-card-entrance">
      <div className="notif-header">
        <h1>Notifications</h1>
        <p className="font-mono text-secondary text-sm">Latest updates and event notifications.</p>
      </div>

      {myNotifs.length === 0 ? (
        <div className="empty-feed-state glass-pane p-12 flex flex-col items-center">
          <Bell size={48} className="text-muted opacity-20 mb-6" />
          <h3 className="section-title">No Notifications</h3>
          <p className="font-mono text-muted text-sm mt-2">You're all caught up! No new notifications.</p>
        </div>
      ) : (
        <div className="notif-list">
          {myNotifs.map((n, i) => (
            <div
              key={n.id}
              className={`notif-card glass-pane ${!n.read ? 'unread' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="notif-icon-box">
                {getNotifIcon(n.type)}
              </div>
              
              <div className="notif-content">
                <div className="notif-title-row">
                  <h3 className="notif-title">{n.title}</h3>
                  {!n.read && <div className="notif-unread-dot" />}
                </div>
                <p className="notif-message font-mono">
                  {n.message}
                </p>
                <span className="notif-time font-mono">{n.createdAt}</span>
              </div>

              <div className="notif-actions">
                {n.proposalId && (
                  <Link to={`/proposals/${n.proposalId}`} className="btn-notif-action">
                    View Details
                  </Link>
                )}
                {!n.read && (
                  <button 
                    className="btn-mark-read" 
                    onClick={() => markNotificationRead(n.id)} 
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
              
              <div className="card-scanner-line" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
