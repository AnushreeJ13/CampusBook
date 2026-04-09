import { useProposals } from '../contexts/ProposalContext';
import { useAuth } from '../contexts/AuthContext';
import { useVenues } from '../contexts/VenueContext';
import { PROPOSAL_STATUS, STATUS_LABELS, ROLES } from '../utils/constants';
import { generateAISummary } from '../utils/aiHelpers';
import { ClipboardCheck, ArrowRight, Sparkles, CheckCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PendingReviews() {
  const { user } = useAuth();
  const { proposals, isCurrentReviewer } = useProposals();
  const { venues } = useVenues();

  // STRICT: Only show proposals where the current user is the assigned reviewer
  const pendingForMe = proposals.filter(p => isCurrentReviewer(p));

  // Previously reviewed — proposals where user acted but is no longer the reviewer
  const previouslyReviewed = proposals.filter(p => {
    const userId = user?.uid || user?.id;
    const acted = p.actionLog?.some(entry => entry.reviewerId === userId);
    return acted && !isCurrentReviewer(p);
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Pending Reviews</h1>
        <p>Proposals waiting for your review and approval</p>
      </div>

      {pendingForMe.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} />
          <h3>All Caught Up!</h3>
          <p>No proposals are waiting for your review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-lg">
          {pendingForMe.map((proposal, i) => {
            const aiSummary = generateAISummary(proposal);
            const venue = venues.find(v => v.id === proposal.venueId);
            return (
              <div key={proposal.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                  <div className="flex items-center gap-md">
                    <span style={{ fontSize: '28px' }}>{venue?.image || '📍'}</span>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>{proposal.title}</h3>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                        {proposal.clubName} · Submitted {proposal.createdAt}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-warning">{STATUS_LABELS[proposal.status]}</span>
                </div>

                {/* AI Summary */}
                <div style={{
                  padding: 'var(--space-md)', background: 'var(--accent-soft)',
                  borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)',
                  border: '1px solid var(--accent-glow)'
                }}>
                  <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-sm)' }}>
                    <Sparkles size={14} color="var(--accent)" />
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--accent)' }}>AI Summary</span>
                    <span className="badge badge-accent" style={{ fontSize: '10px' }}>{aiSummary.readiness.score}% Ready</span>
                  </div>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {aiSummary.summary}
                  </p>
                  {aiSummary.riskFlags.length > 0 && (
                    <div className="flex flex-wrap gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
                      {aiSummary.riskFlags.map((f, fi) => (
                        <span key={fi} className="badge badge-warning" style={{ fontSize: '10px' }}>⚠️ {f}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-lg" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                    <span>📅 {proposal.date}</span>
                    <span>👥 {proposal.expectedAttendees}</span>
                    <span>📍 {venue?.name || 'TBD'}</span>
                  </div>
                  <Link to={`/proposals/${proposal.id}`} className="btn btn-primary btn-sm">
                    Review <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Previously Reviewed — Read-Only Section */}
      {previouslyReviewed.length > 0 && (
        <div style={{ marginTop: 'var(--space-2xl)' }}>
          <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-lg)' }}>
            <Lock size={18} color="var(--text-tertiary)" />
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-secondary)' }}>Previously Reviewed</h2>
            <span className="badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-tertiary)', fontSize: '11px' }}>
              Read Only
            </span>
          </div>
          <div className="flex flex-col gap-md">
            {previouslyReviewed.map((proposal, i) => {
              const venue = venues.find(v => v.id === proposal.venueId);
              return (
                <div key={proposal.id} className="card" style={{ opacity: 0.7, animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      <span style={{ fontSize: '20px' }}>{venue?.image || '📍'}</span>
                      <div>
                        <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{proposal.title}</h3>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                          {proposal.clubName} · {STATUS_LABELS[proposal.status]}
                        </span>
                      </div>
                    </div>
                    <Link to={`/proposals/${proposal.id}`} className="btn btn-ghost btn-sm">
                      View <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
