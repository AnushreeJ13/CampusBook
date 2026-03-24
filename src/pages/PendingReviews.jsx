import { useProposals } from '../contexts/ProposalContext';
import { useAuth } from '../contexts/AuthContext';
import { useVenues } from '../contexts/VenueContext';
import { PROPOSAL_STATUS, STATUS_LABELS, ROLES } from '../utils/constants';
import { generateAISummary } from '../utils/aiHelpers';
import { ClipboardCheck, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PendingReviews() {
  const { user } = useAuth();
  const { proposals } = useProposals();
  const { venues } = useVenues();

  const pendingForMe = proposals.filter(p => {
    if (user.role === ROLES.FACULTY) {
      return p.currentReviewer === user.id ||
        (user.assignedClubs?.includes(p.clubId) &&
          [PROPOSAL_STATUS.FACULTY_REVIEW, PROPOSAL_STATUS.SUBMITTED].includes(p.status));
    }
    if (user.role === ROLES.ADMIN) {
      return p.status === PROPOSAL_STATUS.ADMIN_REVIEW ||
        (p.currentReviewer === user.id && [PROPOSAL_STATUS.HOD_REVIEW, PROPOSAL_STATUS.ADMIN_REVIEW].includes(p.status));
    }
    return false;
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
    </div>
  );
}
