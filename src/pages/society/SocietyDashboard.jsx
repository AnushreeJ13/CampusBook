import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS, STATUS_LABELS } from '../../utils/constants';
import { PlusCircle, FileText, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SocietyDashboard() {
  const { user } = useAuth();
  const { proposals } = useProposals();

  const myProposals = proposals.filter(p => p.clubId === user.clubId);
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
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>{user.clubName} Dashboard</h1>
            <p>Manage your event proposals and track their progress</p>
          </div>
          <Link to="/proposals/new" className="btn btn-primary btn-lg">
            <PlusCircle size={20} /> New Proposal
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4 gap-lg" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="stat-card animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon"><FileText size={20} /></div>
          </div>
          <div className="stat-value">{myProposals.length}</div>
          <div className="stat-label">Total Proposals</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--status-success)' }}><CheckCircle size={20} /></div>
          </div>
          <div className="stat-value">{approved.length}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--status-warning)' }}><Clock size={20} /></div>
          </div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--status-error)' }}><XCircle size={20} /></div>
          </div>
          <div className="stat-value">{rejected.length}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {/* Needs Revision Alert */}
      {needsRevision.length > 0 && (
        <div className="card animate-fade-in-up" style={{
          marginBottom: 'var(--space-2xl)',
          borderColor: 'rgba(245,158,11,0.3)',
          background: 'rgba(245,158,11,0.05)'
        }}>
          <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-md)' }}>
            <AlertTriangle size={20} color="var(--status-warning)" />
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--status-warning)' }}>
              Revision Requested ({needsRevision.length})
            </h3>
          </div>
          {needsRevision.map(p => (
            <div key={p.id} className="flex items-center justify-between" style={{ padding: 'var(--space-sm) 0' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{p.title}</span>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {p.auditTrail[p.auditTrail.length - 1]?.note}
                </p>
              </div>
              <Link to={`/proposals/${p.id}`} className="btn btn-secondary btn-sm">
                View <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Recent Proposals */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Recent Proposals</h2>
          <Link to="/proposals" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Date</th>
                <th>Attendees</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {myProposals.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</td>
                  <td><span className="badge badge-accent">{p.eventType}</span></td>
                  <td>{p.date}</td>
                  <td>{p.expectedAttendees}</td>
                  <td><span className={`badge ${getStatusBadge(p.status)}`}>{STATUS_LABELS[p.status]}</span></td>
                  <td>
                    <Link to={`/proposals/${p.id}`} className="btn btn-ghost btn-sm">
                      View <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
