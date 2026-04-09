import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProposals } from '../contexts/ProposalContext';
import { Bell, Check, CheckCheck, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const { user, handleSocietyApproval } = useAuth();
  const { notifications, markNotificationRead } = useProposals();

  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(null);

  const myNotifs = notifications.filter(n => n.userId === user?.id || n.userId === user?.uid);

  const getNotifColor = (type) => {
    switch (type) {
      case 'approval': return 'var(--status-success)';
      case 'rejection': return 'var(--status-error)';
      case 'revision': return 'var(--status-warning)';
      case 'booking': return 'var(--accent-student)';
      case 'submission': return 'var(--accent-society)';
      case 'society_request': return '#8b5cf6';
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
      case 'society_request': return '🏛️';
      default: return '🔔';
    }
  };

  const handleApproveSociety = async (notif) => {
    if (!notif.societyUserId) return;
    setProcessingId(notif.id);
    try {
      await handleSocietyApproval(notif.societyUserId, true);
      await markNotificationRead(notif.id);
    } catch (e) {
      console.error("Failed to approve society:", e);
      alert("Failed to approve. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSociety = async (notif) => {
    if (!notif.societyUserId) return;
    setProcessingId(notif.id);
    try {
      await handleSocietyApproval(notif.societyUserId, false, rejectReason);
      await markNotificationRead(notif.id);
      setShowRejectInput(null);
      setRejectReason('');
    } catch (e) {
      console.error("Failed to reject society:", e);
      alert("Failed to reject. Please try again.");
    } finally {
      setProcessingId(null);
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
              className="card animate-fade-in-up"
              style={{
                gap: 'var(--space-md)',
                animationDelay: `${i * 0.03}s`,
                borderColor: !n.read ? `color-mix(in srgb, ${getNotifColor(n.type)}, transparent 70%)` : undefined,
                background: !n.read ? `color-mix(in srgb, ${getNotifColor(n.type)}, transparent 95%)` : undefined,
              }}
            >
              {/* Top Row */}
              <div className="flex items-start" style={{ gap: 'var(--space-md)' }}>
                <span style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>{getNotifIcon(n.type)}</span>
                <div style={{ flex: '1 1 200px' }}>
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
                <div className="flex items-center gap-sm" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  {n.proposalId && (
                    <Link to={`/proposals/${n.proposalId}`} className="btn btn-secondary btn-sm">View</Link>
                  )}
                  {!n.read && n.type !== 'society_request' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => markNotificationRead(n.id)} title="Mark as read">
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Society Request Actions — Only show for society_request type */}
              {n.type === 'society_request' && !n.read && (
                <div style={{
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'rgba(139, 92, 246, 0.06)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                }}>
                  {/* Society Details */}
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                      {n.societyName && (
                        <div>
                          <span style={{ color: 'var(--text-tertiary)' }}>Society: </span>
                          <strong>{n.societyName}</strong>
                        </div>
                      )}
                      {n.societyEmail && (
                        <div>
                          <span style={{ color: 'var(--text-tertiary)' }}>Email: </span>
                          <strong>{n.societyEmail}</strong>
                        </div>
                      )}
                      {n.societyCollege && (
                        <div>
                          <span style={{ color: 'var(--text-tertiary)' }}>College: </span>
                          <strong>{n.societyCollege}</strong>
                        </div>
                      )}
                    </div>
                    {n.societyDescription && (
                      <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Purpose: </span>
                        {n.societyDescription}
                      </div>
                    )}
                  </div>

                  {/* Reject Reason Input */}
                  {showRejectInput === n.id && (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                      <textarea
                        className="input-field"
                        placeholder="Reason for rejection (optional)..."
                        rows={2}
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        style={{ fontSize: 'var(--font-xs)', resize: 'vertical' }}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-sm">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleApproveSociety(n)}
                      disabled={processingId === n.id}
                      style={{ flex: 1 }}
                    >
                      <UserCheck size={14} />
                      {processingId === n.id ? 'Processing...' : 'Approve Society'}
                    </button>
                    
                    {showRejectInput === n.id ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRejectSociety(n)}
                        disabled={processingId === n.id}
                        style={{ flex: 1 }}
                      >
                        <UserX size={14} />
                        Confirm Reject
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowRejectInput(n.id)}
                        disabled={processingId === n.id}
                        style={{ flex: 1 }}
                      >
                        <UserX size={14} />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Already processed society request */}
              {n.type === 'society_request' && n.read && (
                <div style={{
                  marginTop: 'var(--space-sm)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--bg-glass)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-tertiary)',
                }}>
                  ✅ This request has been processed.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
