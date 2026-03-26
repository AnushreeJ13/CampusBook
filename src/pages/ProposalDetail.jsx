import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProposals } from '../contexts/ProposalContext';
import { useVenues } from '../contexts/VenueContext';
import { PROPOSAL_STATUS, STATUS_LABELS, ROLES, TIME_SLOTS } from '../utils/constants';
import { generateAISummary } from '../utils/aiHelpers';
import {
  ArrowLeft, CheckCircle, XCircle, Edit3, Send, Sparkles,
  Calendar, MapPin, Users, FileText, Clock, AlertTriangle, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function ProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { proposals, updateProposalStatus, approveAndForward, bookVenue } = useProposals();
  const { venues } = useVenues();
  const [comment, setComment] = useState('');
  const [showActions, setShowActions] = useState(false);

  const proposal = proposals.find(p => p.id === id);
  if (!proposal) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <FileText size={48} />
          <h3>Proposal Not Found</h3>
          <p>The proposal you're looking for doesn't exist.</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const venue = venues.find(v => v.id === proposal.venueId);
  const aiSummary = generateAISummary(proposal);
  const timeSlot = TIME_SLOTS.find(t => t.id === proposal.timeSlot);
  const canReview = (user.role === ROLES.FACULTY || user.role === ROLES.ADMIN) &&
    proposal.currentReviewer === user.id;
  const isAdmin = user.role === ROLES.ADMIN;

  const handleApprove = () => {
    if (user.role === ROLES.FACULTY) {
      approveAndForward(proposal.id, user.id, user.name, comment || 'Approved by Faculty Advisor', PROPOSAL_STATUS.HOD_REVIEW, 'u6');
    } else if (isAdmin) {
      updateProposalStatus(proposal.id, PROPOSAL_STATUS.APPROVED, user.id, user.name, comment || 'Final approval granted');
      setTimeout(() => bookVenue(proposal.id), 500);
    }
    setShowActions(false);
    setComment('');
  };

  const handleReject = () => {
    updateProposalStatus(proposal.id, PROPOSAL_STATUS.REJECTED, user.id, user.name, comment || 'Rejected');
    setShowActions(false);
    setComment('');
  };

  const handleRevision = () => {
    updateProposalStatus(proposal.id, PROPOSAL_STATUS.REVISION_REQUESTED, user.id, user.name, comment || 'Changes requested');
    setShowActions(false);
    setComment('');
  };

  const getStatusColor = (status) => {
    const map = {
      [PROPOSAL_STATUS.DRAFT]: 'var(--text-tertiary)',
      [PROPOSAL_STATUS.SUBMITTED]: 'var(--accent)',
      [PROPOSAL_STATUS.FACULTY_REVIEW]: 'var(--status-warning)',
      [PROPOSAL_STATUS.HOD_REVIEW]: 'var(--status-warning)',
      [PROPOSAL_STATUS.ADMIN_REVIEW]: 'var(--status-info)',
      [PROPOSAL_STATUS.APPROVED]: 'var(--status-success)',
      [PROPOSAL_STATUS.REJECTED]: 'var(--status-error)',
      [PROPOSAL_STATUS.REVISION_REQUESTED]: 'var(--status-warning)',
      [PROPOSAL_STATUS.VENUE_BOOKED]: 'var(--status-success)',
    };
    return map[status] || 'var(--text-tertiary)';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-md)' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-sm)' }}>
              <h1 style={{
                fontSize: 'var(--font-2xl)', fontWeight: 800,
                background: 'linear-gradient(135deg, var(--text-primary), var(--accent))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>{proposal.title}</h1>
              <span className={`badge ${proposal.status === PROPOSAL_STATUS.APPROVED || proposal.status === PROPOSAL_STATUS.VENUE_BOOKED ? 'badge-success' : proposal.status === PROPOSAL_STATUS.REJECTED ? 'badge-error' : 'badge-accent'}`}>
                {STATUS_LABELS[proposal.status]}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
              by {proposal.clubName} · Submitted by {proposal.submittedByName} · {proposal.createdAt}
            </p>
          </div>
          {canReview && (
            <button className="btn btn-primary" onClick={() => setShowActions(!showActions)}>
              <Edit3 size={16} /> Review Actions
            </button>
          )}
        </div>
      </div>

      <div className="detail-layout">
        {/* Main Content */}
        <div>
          {/* AI Summary */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)', borderColor: 'var(--accent-glow)', background: 'var(--accent-soft)' }}>
            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
              <Sparkles size={18} color="var(--accent)" />
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--accent)' }}>AI Analysis</h3>
              <span className="badge badge-accent">{aiSummary.readiness.score}% Ready</span>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
              {aiSummary.summary}
            </p>
            <div className="flex flex-wrap gap-sm">
              <span className="badge badge-accent">📂 {aiSummary.category.primary}</span>
              {aiSummary.category.secondary && <span className="badge badge-info">{aiSummary.category.secondary}</span>}
              {aiSummary.riskFlags.map((f, i) => (
                <span key={i} className="badge badge-warning">⚠️ {f}</span>
              ))}
            </div>
          </div>

          {/* Event Details */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Event Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div className="flex items-center gap-md">
                <div className="stat-icon"><Calendar size={18} /></div>
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Date</div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{proposal.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="stat-icon"><Clock size={18} /></div>
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Time</div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{timeSlot?.label || 'Not set'}</div>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="stat-icon"><MapPin size={18} /></div>
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Venue</div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{venue?.name || 'Not selected'}</div>
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="stat-icon"><Users size={18} /></div>
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Expected</div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{proposal.expectedAttendees} attendees</div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Description</h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{proposal.description}</p>
          </div>

          {/* Resources */}
          {proposal.resources && (
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Required Resources</h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{proposal.resources}</p>
            </div>
          )}

          {/* Documents */}
          {proposal.documents && proposal.documents.length > 0 && (
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Documents</h3>
              <div className="flex flex-col gap-sm">
                {proposal.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-sm" style={{ padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                    <span>{doc.type === 'image' ? '🖼️' : '📄'}</span>
                    <span style={{ fontSize: 'var(--font-sm)' }}>{doc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Actions */}
          {canReview && showActions && (
            <div className="card" style={{ borderColor: 'var(--accent-glow)', marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Review Actions</h3>
              <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
                <label>Comment / Note</label>
                <textarea className="input-field" placeholder="Add a comment or note for the proposer..." rows={3} value={comment} onChange={e => setComment(e.target.value)} />
              </div>
              <div className="flex gap-md flex-wrap">
                <button className="btn btn-success" onClick={handleApprove}>
                  <CheckCircle size={16} /> Approve{user.role === ROLES.FACULTY ? ' & Forward' : ' & Book Venue'}
                </button>
                <button className="btn btn-danger" onClick={handleReject}>
                  <XCircle size={16} /> Reject
                </button>
                <button className="btn btn-secondary" onClick={handleRevision}>
                  <Edit3 size={16} /> Request Revision
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Audit Trail */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-height) + var(--space-2xl))' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Approval Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {proposal.auditTrail.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', paddingBottom: 'var(--space-lg)', position: 'relative' }}>
                  {/* Timeline line */}
                  {i < proposal.auditTrail.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 11, top: 24, width: 2, bottom: 0,
                      background: 'var(--border-secondary)'
                    }} />
                  )}
                  {/* Dot */}
                  <div style={{
                    width: 24, height: 24, borderRadius: 'var(--radius-full)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: entry.action === 'approved' || entry.action === 'venue_booked' ? 'rgba(34,197,94,0.15)'
                      : entry.action === 'rejected' ? 'rgba(239,68,68,0.15)'
                      : entry.action === 'revision_requested' ? 'rgba(245,158,11,0.15)'
                      : 'var(--bg-glass)',
                    border: `2px solid ${entry.action === 'approved' || entry.action === 'venue_booked' ? 'var(--status-success)'
                      : entry.action === 'rejected' ? 'var(--status-error)'
                      : entry.action === 'revision_requested' ? 'var(--status-warning)'
                      : 'var(--border-secondary)'}`,
                    zIndex: 2,
                  }}>
                    {entry.action === 'approved' || entry.action === 'venue_booked' ? <CheckCircle size={10} color="var(--status-success)" /> :
                     entry.action === 'rejected' ? <XCircle size={10} color="var(--status-error)" /> :
                     <ChevronRight size={10} color="var(--text-tertiary)" />}
                  </div>
                  {/* Content */}
                  <div>
                    <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {entry.byName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
                      {entry.note}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4 }}>
                      {entry.at}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
