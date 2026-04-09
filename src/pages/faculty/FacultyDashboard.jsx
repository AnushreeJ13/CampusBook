import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS, STATUS_LABELS } from '../../utils/constants';
import { generateAISummary } from '../../utils/aiHelpers';
import { ClipboardCheck, CheckCircle, Clock, FileText, Users, Sparkles, ArrowRight, Calendar, MapPin, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './FacultyDashboard.css';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { proposals, isCurrentReviewer } = useProposals();
  const { venues } = useVenues();

  // STRICT: Only proposals where the current user is the assigned reviewer
  const pendingReview = proposals.filter(p => isCurrentReviewer(p));

  // Previously reviewed — proposals where the user acted (in actionLog) but is no longer the reviewer
  const userId = user?.uid || user?.id;
  const reviewed = proposals.filter(p => {
    const acted = p.actionLog?.some(entry => entry.reviewerId === userId);
    return acted && !isCurrentReviewer(p);
  });

  // Also count proposals where user appears in auditTrail (for legacy/mock data without actionLog)
  const legacyReviewed = proposals.filter(p =>
    p.auditTrail?.some(a => a.by === userId) && !isCurrentReviewer(p)
  );
  const allReviewed = [...new Map([...reviewed, ...legacyReviewed].map(p => [p.id, p])).values()];

  return (
    <div className="faculty-saas-layout">
      {/* Header */}
      <header className="faculty-saas-header animate-fade-in">
        <div className="flex justify-between items-end w-full flex-wrap gap-4">
          <div>
            <div className="faculty-badge-professional mb-2">Faculty Portal</div>
            <h1 className="faculty-saas-title">Overview</h1>
            <p className="faculty-saas-subtitle">Manage, evaluate, and guide student initiatives with precision.</p>
          </div>
          <div className="faculty-saas-user">
             <div className="avatar">{user?.name?.charAt(0) || 'F'}</div>
             <div className="info">
                <span className="name">{user?.name || 'Faculty Member'}</span>
                <span className="role">Advising {user?.assignedClubs?.length || 0} Societies</span>
             </div>
          </div>
        </div>
      </header>

      {/* Stats Board */}
      <div className="faculty-saas-stats animate-fade-in" style={{ animationDelay: '0.1s' }}>
         <div className="saas-stat-card">
           <div className="saas-stat-icon blue"><Clock size={20} /></div>
           <div className="saas-stat-content">
             <p className="saas-stat-label">Pending Reviews</p>
             <h3 className="saas-stat-value">{pendingReview.length}</h3>
           </div>
           {pendingReview.length > 0 && <div className="saas-stat-trend">Needs Action</div>}
         </div>

         <div className="saas-stat-card">
           <div className="saas-stat-icon emerald"><CheckCircle size={20} /></div>
           <div className="saas-stat-content">
             <p className="saas-stat-label">Events Evaluated</p>
             <h3 className="saas-stat-value">{allReviewed.length}</h3>
           </div>
         </div>

         <div className="saas-stat-card">
           <div className="saas-stat-icon purple"><Users size={20} /></div>
           <div className="saas-stat-content">
             <p className="saas-stat-label">Societies Mentored</p>
             <h3 className="saas-stat-value">{user?.assignedClubs?.length || 0}</h3>
           </div>
         </div>
      </div>

      {/* AI Triage Section */}
      <main className="faculty-saas-main animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex justify-between items-center mb-6">
           <h2 className="saas-section-title">Requires Attention</h2>
           {pendingReview.length > 0 && <span className="saas-badge-critical">{pendingReview.length} Pending</span>}
        </div>

        {pendingReview.length === 0 ? (
          <div className="saas-empty-state">
             <div className="saas-empty-icon"><ClipboardCheck size={32} /></div>
             <h3>Inbox Zero</h3>
             <p>All outstanding event proposals have been evaluated.</p>
          </div>
        ) : (
          <div className="saas-proposal-list">
            {pendingReview.map((proposal, i) => {
              const aiSummary = generateAISummary(proposal);
              const venue = venues.find(v => v.id === proposal.venueId);

              return (
                <div key={proposal.id} className="saas-proposal-card animate-slide-up" style={{ animationDelay: `${(i+2)*0.05}s` }}>
                   <div className="saas-proposal-edge"></div>
                   
                   <div className="saas-proposal-body">
                      {/* Top Row: Meta */}
                      <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-3">
                            <span className="saas-proposal-tag">{STATUS_LABELS[proposal.status]}</span>
                            <span className="saas-text-muted text-sm flex items-center gap-1"><Calendar size={14}/> {proposal.date}</span>
                         </div>
                      </div>

                      {/* Title & Organization */}
                      <h3 className="saas-proposal-title">{proposal.title}</h3>
                      <p className="saas-proposal-org">Proposed by <strong>{proposal.clubName}</strong></p>

                      {/* AI Intelligence Block - Notion AI Style */}
                      <div className="saas-ai-block">
                         <div className="saas-ai-header">
                            <Sparkles size={14} className="saas-ai-icon" /> AI Executive Summary
                         </div>
                         <p className="saas-ai-text">{aiSummary.summary}</p>
                         
                         {aiSummary.riskFlags.length > 0 && (
                            <div className="saas-ai-risks">
                               {aiSummary.riskFlags.map((f, fi) => <span key={fi} className="saas-risk-flag">Flag: {f}</span>)}
                            </div>
                         )}
                      </div>

                      {/* Footer Actions */}
                      <div className="saas-proposal-footer">
                         <div className="flex items-center gap-4 saas-text-muted text-sm">
                            <span className="flex items-center gap-1"><Users size={14}/> {proposal.expectedAttendees} Pax</span>
                            <span className="flex items-center gap-1"><MapPin size={14}/> {venue?.name || 'TBD'}</span>
                         </div>
                         <Link to={`/proposals/${proposal.id}`} className="saas-btn-action">
                            Review Proposal <ArrowRight size={16} />
                         </Link>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Previously Reviewed Section */}
        {allReviewed.length > 0 && (
          <div style={{ marginTop: 'var(--space-2xl)' }}>
            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-lg)' }}>
              <Lock size={16} color="var(--text-tertiary)" />
              <h2 className="saas-section-title" style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)' }}>Previously Reviewed</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '2px 8px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>Read Only</span>
            </div>
            <div className="saas-proposal-list">
              {allReviewed.slice(0, 5).map((proposal) => {
                const venue = venues.find(v => v.id === proposal.venueId);
                return (
                  <div key={proposal.id} className="saas-proposal-card" style={{ opacity: 0.65 }}>
                    <div className="saas-proposal-body" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="saas-proposal-title" style={{ fontSize: 'var(--font-sm)', marginBottom: '2px' }}>{proposal.title}</h3>
                          <p className="saas-proposal-org" style={{ fontSize: 'var(--font-xs)' }}>{proposal.clubName} · {STATUS_LABELS[proposal.status]}</p>
                        </div>
                        <Link to={`/proposals/${proposal.id}`} className="saas-btn-action" style={{ fontSize: 'var(--font-xs)' }}>
                          View <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
