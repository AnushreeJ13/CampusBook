import { useAuth } from '../contexts/AuthContext';
import { useProposals } from '../contexts/ProposalContext';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, markNotificationRead } = useProposals();

  const myNotifs = notifications.filter(n => n.userId === user?.id);

  const getNotifColor = (type) => {
    switch (type) {
      case 'approval': return 'var(--status-success)';
      case 'rejection': return 'var(--status-error)';
      case 'revision': return 'var(--status-warning)';
      case 'booking': return 'var(--accent-student)';
      case 'submission': return 'var(--accent-society)';
      default: return 'var(--text-tertiary)';
    }
  };

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
    <div className="page-container">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Stay updated on your proposals and reviews</p>
      </div>

      {myNotifs.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>No Notifications</h3>
          <p>You're all caught up! Nothing to see here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {myNotifs.map((n, i) => (
            <div
              key={n.id}
              className="card animate-fade-in-up flex items-center gap-lg"
              style={{
                animationDelay: `${i * 0.03}s`,
                borderColor: !n.read ? `color-mix(in srgb, ${getNotifColor(n.type)}, transparent 70%)` : undefined,
                background: !n.read ? `color-mix(in srgb, ${getNotifColor(n.type)}, transparent 95%)` : undefined,
              }}
            >
              <span style={{ fontSize: '24px' }}>{getNotifIcon(n.type)}</span>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-sm">
                  <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{n.title}</h3>
                  {!n.read && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: getNotifColor(n.type) }} />
                  )}
                </div>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
                  {n.message}
                </p>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{n.createdAt}</span>
              </div>
              <div className="flex items-center gap-sm">
                {n.proposalId && (
                  <Link to={`/proposals/${n.proposalId}`} className="btn btn-secondary btn-sm">View</Link>
                )}
                {!n.read && (
                  <button className="btn btn-ghost btn-sm" onClick={() => markNotificationRead(n.id)} title="Mark as read">
                    <Check size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
