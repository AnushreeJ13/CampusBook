import React, { useState, useMemo } from 'react';
import { useProposals } from '../../contexts/ProposalContext';
import {
  ScrollText, ArrowRight, CheckCircle, XCircle,
  Edit3, Send, Search, ChevronDown, ChevronUp, Calendar,
  User, MoreHorizontal, ChevronRight
} from 'lucide-react';

export default function AuditLog() {
  const { proposals } = useProposals();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Flatten and filter entries
  const allEntries = useMemo(() => {
    return (proposals || []).flatMap(p => {
      if (!p) return [];
      return (p.auditTrail || []).map((entry, idx) => ({
        ...entry,
        proposalTitle: p.title,
        proposalId: p.id,
        // Unique ID for state tracking
        uid: `${p.id}-${entry.at}-${entry.action}-${idx}`
      }))
    }).sort((a, b) => b.at.localeCompare(a.at));
  }, [proposals]);

  const filtered = useMemo(() => {
    return allEntries.filter(entry => {
      const matchesSearch =
        entry.proposalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.byName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = !filterAction || entry.action === filterAction;
      const matchesUser = !filterUser || entry.byName === filterUser;

      const matchesDate = (!dateStart || entry.at >= dateStart) &&
        (!dateEnd || entry.at <= dateEnd);

      return matchesSearch && matchesAction && matchesUser && matchesDate;
    });
  }, [allEntries, searchTerm, filterAction, filterUser, dateStart, dateEnd]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // List of unique users for the filter
  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(allEntries.map(e => e.byName))).sort();
  }, [allEntries]);

  const toggleRow = (uid) => {
    const next = new Set(expandedRows);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setExpandedRows(next);
  };

  const getActionInfo = (action) => {
    switch (action) {
      case 'approved': case 'venue_booked':
        return { icon: <CheckCircle size={14} />, class: 'create', label: action.replace('_', ' ') };
      case 'rejected':
        return { icon: <XCircle size={14} />, class: 'delete', label: action };
      case 'revision_requested':
        return { icon: <Edit3 size={14} />, class: 'update', label: 'revision' };
      case 'submitted':
        return { icon: <Send size={14} />, class: 'info', label: action };
      case 'forwarded':
        return { icon: <ArrowRight size={14} />, class: 'info', label: action };
      default:
        return { icon: <MoreHorizontal size={14} />, class: 'info', label: action };
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAction('');
    setFilterUser('');
    setDateStart('');
    setDateEnd('');
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Audit Trail</h1>
        <p>Complete log of all actions across the platform</p>
      </div>

      <div className="data-table-container">
        {/* Filter Bar */}
        <div className="table-controls">
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by proposal, user or note..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <select
            className="input-field"
            style={{ maxWidth: 160 }}
            value={filterAction}
            onChange={e => { setFilterAction(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="forwarded">Forwarded</option>
            <option value="venue_booked">Venue Booked</option>
          </select>

          <select
            className="input-field"
            style={{ maxWidth: 160 }}
            value={filterUser}
            onChange={e => { setFilterUser(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>

          <div className="flex items-center gap-xs">
            <Calendar size={14} color="var(--text-tertiary)" />
            <input
              type="date"
              className="input-field btn-sm"
              value={dateStart}
              onChange={e => { setDateStart(e.target.value); setCurrentPage(1); }}
            />
            <span style={{ color: 'var(--text-muted)' }}>-</span>
            <input
              type="date"
              className="input-field btn-sm"
              value={dateEnd}
              onChange={e => { setDateEnd(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Semantic Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>Action</th>
              <th className="col-hide-mobile">User</th>
              <th className="col-hide-tablet">Proposal</th>
              <th className="col-hide-tablet">Note</th>
              <th>Date</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((entry) => {
              const info = getActionInfo(entry.action);
              const isExpanded = expandedRows.has(entry.uid);

              return (
                <React.Fragment key={entry.uid}>
                  <tr className={`main-row ${isExpanded ? 'expanded' : ''}`} onClick={() => toggleRow(entry.uid)}>
                    <td>
                      <div className="flex items-center">
                        <span className={`action-indicator ${info.class}`}>
                          {info.icon}
                        </span>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{info.label}</span>
                      </div>
                    </td>
                    <td className="col-hide-mobile">
                      <div className="flex items-center gap-xs">
                        <User size={14} color="var(--text-tertiary)" />
                        {entry.byName}
                      </div>
                    </td>
                    <td className="col-hide-tablet" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.proposalTitle}
                    </td>
                    <td className="col-hide-tablet" style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {entry.note}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{entry.at}</td>
                    <td>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>

                  {/* Expansion Content */}
                  <tr className="detail-row">
                    <td colSpan="6">
                      <div className="detail-content">
                        <div className="detail-inner">
                          <div className="detail-item">
                            <label>Proposal</label>
                            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.proposalTitle}</p>
                            <p style={{ fontSize: 'var(--font-xs)', marginTop: 4 }}>ID: {entry.proposalId}</p>
                          </div>
                          <div className="detail-item">
                            <label>Note / Comment</label>
                            <p>{entry.note || "No additional comments provided."}</p>
                          </div>
                          <div className="detail-item">
                            <label>Action Meta</label>
                            <p>Performed by: {entry.byName}</p>
                            <p>Timestamp: {entry.at}</p>
                            <p>Status: <span className={`badge badge-${info.class === 'create' ? 'success' : info.class === 'delete' ? 'error' : info.class === 'update' ? 'warning' : 'info'}`}>{entry.action}</span></p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {paginated.length === 0 && (
          <div className="empty-state" style={{ padding: 'var(--space-4xl) 0' }}>
            <ScrollText size={48} />
            <h3>No results found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        )}

        {/* Footer / Pagination */}
        <div className="table-footer">
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            Showing {filtered.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} entries
          </span>

          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)', display: 'block' }} />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="page-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight size={16} style={{ display: 'block' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
