import { useProposals } from '../../contexts/ProposalContext';
import { ScrollText, Filter, ArrowRight, CheckCircle, XCircle, Edit3, ChevronRight, Send } from 'lucide-react';
import { useState } from 'react';

export default function AuditLog() {
  const { proposals } = useProposals();
  const [filterAction, setFilterAction] = useState('');

  // Collect all audit entries from all proposals
  const allEntries = proposals.flatMap(p =>
    p.auditTrail.map(entry => ({
      ...entry,
      proposalTitle: p.title,
      proposalId: p.id,
    }))
  ).sort((a, b) => b.at.localeCompare(a.at));

  const filtered = filterAction
    ? allEntries.filter(e => e.action === filterAction)
    : allEntries;

  const getActionIcon = (action) => {
    switch (action) {
      case 'approved': case 'venue_booked': return <CheckCircle size={14} color="var(--status-success)" />;
      case 'rejected': return <XCircle size={14} color="var(--status-error)" />;
      case 'revision_requested': return <Edit3 size={14} color="var(--status-warning)" />;
      case 'submitted': return <Send size={14} color="var(--accent)" />;
      case 'forwarded': return <ChevronRight size={14} color="var(--status-info)" />;
      default: return <ChevronRight size={14} color="var(--text-tertiary)" />;
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'approved': return 'badge-success';
      case 'venue_booked': return 'badge-success';
      case 'rejected': return 'badge-error';
      case 'revision_requested': return 'badge-warning';
      case 'submitted': return 'badge-accent';
      case 'forwarded': return 'badge-info';
      default: return 'badge-info';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Audit Trail</h1>
        <p>Complete log of all actions across the platform</p>
      </div>

      <div className="flex items-center gap-lg" style={{ marginBottom: 'var(--space-xl)' }}>
        <select className="input-field" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="revision_requested">Revision Requested</option>
          <option value="forwarded">Forwarded</option>
          <option value="venue_booked">Venue Booked</option>
        </select>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
          {filtered.length} entries
        </span>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Proposal</th>
              <th>Note</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-sm">
                    {getActionIcon(entry.action)}
                    <span className={`badge ${getActionBadge(entry.action)}`}>
                      {entry.action.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{entry.byName}</td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{entry.proposalTitle}</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.note}</td>
                <td>{entry.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
