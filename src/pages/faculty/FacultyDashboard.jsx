import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS, STATUS_LABELS } from '../../utils/constants';
import { generateAISummary } from '../../utils/aiHelpers';
import { ClipboardCheck, CheckCircle, AlertTriangle, ArrowRight, Sparkles, Clock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { proposals } = useProposals();
  const { venues } = useVenues();

  const assignedProposals = proposals.filter(p =>
    p.currentReviewer === user.id ||
    (user.assignedClubs && user.assignedClubs.includes(p.clubId) &&
      [PROPOSAL_STATUS.FACULTY_REVIEW, PROPOSAL_STATUS.SUBMITTED].includes(p.status))
  );

  const pendingReview = assignedProposals.filter(p =>
    [PROPOSAL_STATUS.FACULTY_REVIEW, PROPOSAL_STATUS.SUBMITTED].includes(p.status)
  );

  const reviewed = proposals.filter(p =>
    p.auditTrail.some(a => a.by === user.id)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Faculty Advisor Dashboard</h1>
        <p>Review and approve event proposals from your assigned societies</p>
      </div>

      {/* Stats */}
      <div className="grid grid-3 gap-lg" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="stat-card animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon"><Clock size={20} /></div>
          </div>
          <div className="stat-value">{pendingReview.length}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--status-success)' }}><CheckCircle size={20} /></div>
          </div>
          <div className="stat-value">{reviewed.length}</div>
          <div className="stat-label">Total Reviewed</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-society)' }}><FileText size={20} /></div>
          </div>
          <div className="stat-value">{user.assignedClubs?.length || 0}</div>
          <div className="stat-label">Assigned Clubs</div>
        </div>
      </div>

      {/* Pending Reviews */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>
            <ClipboardCheck size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Pending Reviews
          </h2>
          <Link to="/reviews" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {pendingReview.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} />
            <h3>All Caught Up!</h3>
            <p>No proposals are waiting for your review right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-lg">
            {pendingReview.map((proposal, i) => {
              const aiSummary = generateAISummary(proposal);
              const venue = venues.find(v => v.id === proposal.venueId);
              return (
                <div key={proposal.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>{proposal.title}</h3>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                        by {proposal.clubName} · Submitted {proposal.createdAt}
                      </span>
                    </div>
                    <span className={`badge ${proposal.status === PROPOSAL_STATUS.SUBMITTED ? 'badge-accent' : 'badge-warning'}`}>
                      {STATUS_LABELS[proposal.status]}
                    </span>
                  </div>

                  {/* AI Summary */}
                  <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--accent-soft)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-md)',
                    border: '1px solid var(--accent-glow)'
                  }}>
                    <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-sm)' }}>
                      <Sparkles size={14} color="var(--accent)" />
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--accent)' }}>AI Summary</span>
                    </div>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {aiSummary.summary}
                    </p>
                    {aiSummary.riskFlags.length > 0 && (
                      <div className="flex flex-wrap gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
                        {aiSummary.riskFlags.map((flag, fi) => (
                          <span key={fi} className="badge badge-warning" style={{ fontSize: '10px' }}>
                            ⚠️ {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-lg" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                      <span>📅 {proposal.date}</span>
                      <span>👥 {proposal.expectedAttendees}</span>
                      <span>📍 {venue?.name || 'No venue'}</span>
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
    </div>
  );
}
