import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS, STATUS_LABELS } from '../../utils/constants';
import { PlusCircle, FileText, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './SocietyDashboard.css';

export default function SocietyDashboard() {
  const { user } = useAuth();
  const { proposals } = useProposals();
  const { venues } = useVenues();

  const myProposals = proposals.filter(p => p.clubId === user.clubId || p.submittedBy === user.uid || p.submittedBy === user.id);
  const approved = myProposals.filter(p => [PROPOSAL_STATUS.APPROVED, PROPOSAL_STATUS.VENUE_BOOKED].includes(p.status));
  const pending = myProposals.filter(p => [PROPOSAL_STATUS.SUBMITTED, PROPOSAL_STATUS.FACULTY_REVIEW, PROPOSAL_STATUS.HOD_REVIEW, PROPOSAL_STATUS.ADMIN_REVIEW].includes(p.status));
  const rejected = myProposals.filter(p => p.status === PROPOSAL_STATUS.REJECTED);
  const needsRevision = myProposals.filter(p => p.status === PROPOSAL_STATUS.REVISION_REQUESTED);

  const getStatusBadge = (status) => {
    const map = {
      [PROPOSAL_STATUS.DRAFT]: 'badge-info',
      [PROPOSAL_STATUS.SUBMITTED]: 'badge-accent',
      [PROPOSAL_STATUS.FACULTY_REVIEW]: 'badge-warning',
      [PROPOSAL_STATUS.HOD_REVIEW]: 'badge-warning',
      [PROPOSAL_STATUS.ADMIN_REVIEW]: 'badge-pending',
      [PROPOSAL_STATUS.APPROVED]: 'badge-success',
      [PROPOSAL_STATUS.REJECTED]: 'badge-error',
      [PROPOSAL_STATUS.REVISION_REQUESTED]: 'badge-warning',
      [PROPOSAL_STATUS.VENUE_BOOKED]: 'badge-success',
    };
    return map[status] || 'badge-info';
  };

  return (
    <div className="page-container">
      {/* Hero Header */}
      <div className="society-hero">
        <div className="society-hero-content">
          <div>
            <p className="society-greeting">Club Dashboard</p>
            <h1>{user.assignedClubs?.[0] || 'My Society'}</h1>
            <p className="society-subtitle">Manage your events, proposals, and track approvals.</p>
          </div>
          <Link to="/proposals/new" className="btn btn-primary society-new-btn">
            <PlusCircle size={20} />
            <span>New Event</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="society-stats-grid">
        <div className="society-stat stagger-1">
          <div className="society-stat-icon society-stat-icon--total">
            <FileText size={20} strokeWidth={2.5} />
          </div>
          <div className="society-stat-info">
            <div className="society-stat-value">{myProposals.length}</div>
            <div className="society-stat-label">Total Proposals</div>
          </div>
        </div>
        
        <div className="society-stat stagger-2">
          <div className="society-stat-icon society-stat-icon--approved">
            <CheckCircle size={20} strokeWidth={2.5} />
          </div>
          <div className="society-stat-info">
            <div className="society-stat-value">{approved.length}</div>
            <div className="society-stat-label">Events Approved</div>
          </div>
        </div>
        
        <div className="society-stat stagger-3">
          <div className="society-stat-icon society-stat-icon--pending">
            <Clock size={20} strokeWidth={2.5} />
          </div>
          <div className="society-stat-info">
            <div className="society-stat-value">{pending.length}</div>
            <div className="society-stat-label">In Review</div>
          </div>
        </div>
        
        <div className="society-stat stagger-4">
          <div className="society-stat-icon society-stat-icon--rejected">
            <XCircle size={20} strokeWidth={2.5} />
          </div>
          <div className="society-stat-info">
            <div className="society-stat-value">{needsRevision.length}</div>
            <div className="society-stat-label">Needs Revision</div>
          </div>
        </div>
      </div>

      {/* Needs Revision Alert */}
      {needsRevision.length > 0 && (
        <div className="society-revision-alert stagger-5">
          <div className="society-revision-header">
            <AlertTriangle size={20} />
            Action Required ({needsRevision.length})
          </div>
          <div>
            {needsRevision.map(p => (
              <div key={p.id} className="society-revision-item">
                <div className="society-revision-info">
                  <span className="society-revision-title">{p.title}</span>
                  <span className="society-revision-note">{p.feedback || 'Please update the proposal based on reviewer feedback.'}</span>
                </div>
                <Link to={`/proposals/${p.id}/edit`} className="btn btn-sm" style={{ background: 'var(--status-warning)', color: 'white' }}>
                  Revise Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Proposals */}
      <div className="society-proposals-section">
        <div className="society-section-header">
          <h2>Recent Proposals</h2>
          <Link to="/proposals" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        
        {myProposals.length === 0 ? (
          <div className="card text-center animate-fade-in" style={{ padding: 'var(--space-3xl) var(--space-xl)' }}>
            <div className="flex justify-center" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={32} color="var(--text-tertiary)" />
              </div>
            </div>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>No Proposals Yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>Create your first event proposal to get started.</p>
            <Link to="/proposals/new" className="btn btn-primary">Create Proposal</Link>
          </div>
        ) : (
          <div className="society-proposal-cards">
            {myProposals.slice(0, 5).map((p, i) => {
              const venue = venues.find(v => v.id === p.venueId);
              return (
                <Link to={`/proposals/${p.id}`} key={p.id} className="society-proposal-card animate-slide-up stagger-1" style={{ animationDelay: `${(i+5) * 0.1}s` }}>
                  <div className="society-proposal-card-top">
                    <h3 className="society-proposal-card-title">{p.title}</h3>
                    <ChevronRight size={20} className="society-proposal-card-arrow" />
                  </div>
                  <div className="society-proposal-card-meta">
                    <span className={`badge ${p.status === PROPOSAL_STATUS.VENUE_BOOKED ? 'badge-success' : p.status === PROPOSAL_STATUS.REJECTED ? 'badge-error' : p.status === PROPOSAL_STATUS.NEEDS_REVISION ? 'badge-warning' : 'badge-accent'}`}>
                      {p.status === PROPOSAL_STATUS.VENUE_BOOKED ? '✅ Approved' : p.status === PROPOSAL_STATUS.REJECTED ? '❌ Rejected' : p.status === PROPOSAL_STATUS.NEEDS_REVISION ? '⚠️ Revision' : '⏳ Reviewing'}
                    </span>
                  </div>
                  <div className="society-proposal-card-details">
                    <span><Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--accent-society)' }} /> {p.date}</span>
                    <span>📍 {venue?.name || 'TBD'}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
