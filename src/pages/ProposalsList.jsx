import { useProposals } from '../contexts/ProposalContext';
import { useVenues } from '../contexts/VenueContext';
import { STATUS_LABELS, PROPOSAL_STATUS } from '../utils/constants';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Filter } from 'lucide-react';
import { useState } from 'react';

export default function ProposalsList() {
  const { proposals } = useProposals();
  const { venues } = useVenues();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = proposals.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
        <h1>All Proposals</h1>
        <p>View and manage event proposals</p>
      </div>

      <div className="flex items-center gap-lg" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Search proposals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Society</th>
              <th>Type</th>
              <th>Date</th>
              <th>Venue</th>
              <th>Attendees</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const venue = venues.find(v => v.id === p.venueId);
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</td>
                  <td>{p.clubName}</td>
                  <td><span className="badge badge-accent">{p.eventType}</span></td>
                  <td>{p.date}</td>
                  <td>{venue?.name || '—'}</td>
                  <td>{p.expectedAttendees}</td>
                  <td><span className={`badge ${getStatusBadge(p.status)}`}>{STATUS_LABELS[p.status]}</span></td>
                  <td>
                    <Link to={`/proposals/${p.id}`} className="btn btn-ghost btn-sm">
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-tertiary)' }}>
                  No proposals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
