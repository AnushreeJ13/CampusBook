import { useProposals } from '../contexts/ProposalContext';
import { useVenues } from '../contexts/VenueContext';
import { STATUS_LABELS, PROPOSAL_STATUS } from '../utils/constants';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import './ProposalsList.css';

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

      <div className="proposals-filter-row">
        <div className="proposals-search-wrap">
          <Search size={16} className="proposals-search-icon" />
          <input 
            className="input-field proposals-search-input" 
            placeholder="Search proposals..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        <select 
          className="input-field proposals-status-select" 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="table-container desktop-only">
        <table className="table table-wide">
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
                  <td className="proposal-title-cell">{p.title}</td>
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
                <td colSpan={8} className="proposals-empty-row">
                  No proposals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-only flex flex-col gap-md">
        {filtered.map(p => {
          const venue = venues.find(v => v.id === p.venueId);
          return (
            <div key={p.id} className="card animate-fade-in-up proposal-card-mobile">
              <div className="proposal-card-header">
                <span className={`badge ${getStatusBadge(p.status)}`}>{STATUS_LABELS[p.status]}</span>
                <span className="proposal-date-tag">{p.date}</span>
              </div>
              <h3 className="proposal-card-title">{p.title}</h3>
              <p className="proposal-card-club">{p.clubName}</p>
              
              <div className="proposal-card-footer">
                <div className="proposal-footer-left">
                  <span className="badge badge-accent proposal-type-pill">{p.eventType}</span>
                  <span className="proposal-venue-tag">{venue?.name || 'No Venue'}</span>
                </div>
                <Link to={`/proposals/${p.id}`} className="btn btn-ghost btn-sm">
                  View <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state card" style={{ padding: 'var(--space-xl)' }}>
            <p>No proposals found</p>
          </div>
        )}
      </div>
    </div>
  );
}
