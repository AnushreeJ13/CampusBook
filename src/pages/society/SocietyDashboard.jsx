import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { PlusCircle, FileText, CheckCircle, Clock, AlertTriangle, Sparkles, TrendingUp, Zap, Calendar, ChevronRight, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import WhatsAppWidget from '../../components/common/WhatsAppWidget';
import './SocietyDashboard.css';

export default function SocietyDashboard() {
  const { user } = useAuth();
  const { proposals } = useProposals();
  const { venues } = useVenues();

  const myProposals = proposals.filter(p => p.clubId === user.clubId || p.submittedBy === user.uid || p.submittedBy === user.id);
  const approved = myProposals.filter(p => [PROPOSAL_STATUS.APPROVED, PROPOSAL_STATUS.VENUE_BOOKED].includes(p.status));
  const pending = myProposals.filter(p => [PROPOSAL_STATUS.SUBMITTED, PROPOSAL_STATUS.FACULTY_REVIEW, PROPOSAL_STATUS.HOD_REVIEW, PROPOSAL_STATUS.ADMIN_REVIEW, PROPOSAL_STATUS.VENUE_REQUESTED].includes(p.status));
  const needsRevision = myProposals.filter(p => p.status === PROPOSAL_STATUS.REVISION_REQUESTED);
  const rejected = myProposals.filter(p => p.status === PROPOSAL_STATUS.REJECTED);

  const approvalRate = myProposals.length > 0 
    ? Math.round((approved.length / (myProposals.length - pending.length || 1)) * 100) 
    : 0;

  const totalAttendance = approved.reduce((acc, p) => acc + (p.attendeeCount || 0), 0);
  const avgAttendance = approved.length > 0 ? Math.round(totalAttendance / approved.length) : 0;

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
      {/* Hero Header — UniFlow Branding */}
      <div className="bg-indigo-900 text-white p-12 rounded-[2.5rem] mb-12 relative overflow-hidden shadow-2xl" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '3rem', borderRadius: '2.5rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden'}}>
        <div className="absolute top-0 right-0 p-12 opacity-10" style={{position: 'absolute', top: 0, right: 0, padding: '3rem', opacity: 0.1}}>
           <Zap size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8" style={{position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '2rem'}}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-xs font-black uppercase tracking-widest mb-4" style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem'}}>
               <Sparkles size={14} /> Intelligence Engine Active
            </div>
            <h1 className="text-5xl font-black mb-2" style={{fontSize: '3.5rem', fontWeight: 900, margin: 0}}>{user.assignedClubs?.[0] || 'Society Hub'}</h1>
            <p className="text-indigo-200 text-lg max-w-xl" style={{fontSize: '1.25rem', color: '#c7d2fe', maxWidth: '36rem', margin: 0}}>Powering campus engagement with predictive intelligence.</p>
          </div>
          <div className="flex gap-4" style={{display: 'flex', gap: '1rem'}}>
            <Link to="/attendance" className="bg-white text-indigo-900 px-8 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center gap-2" style={{background: 'white', color: '#1e1b4b', padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <QrCode size={20} /> Attendance
            </Link>
            <Link to="/proposals/new" className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center gap-2 border border-indigo-400/30 shadow-lg" style={{background: '#6366f1', color: 'white', padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(129, 140, 248, 0.3)'}}>
              <PlusCircle size={20} /> Create
            </Link>
          </div>
        </div>
      </div>

      {/* WhatsApp Notification Banner */}
      <WhatsAppWidget />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem'}}>
        {/* Intelligence Highlights */}
        <div className="lg:col-span-2 space-y-8" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          <section>
            <div className="flex items-center justify-between mb-6" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem'}}>
              <h2 className="text-2xl font-black flex items-center gap-2" style={{fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0}}>
                <Zap size={24} className="text-indigo-600" /> Intelligence Highlights
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest" style={{fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em'}}>Live Predictions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
               <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 group hover:shadow-lg transition-all" style={{padding: '1.5rem', background: '#f5f3ff', borderRadius: '1.5rem', border: '1px solid #e0e7ff', transition: 'all 0.3s'}}>
                  <TrendingUp className="text-indigo-600 mb-4" size={32} />
                  <h3 className="font-black text-lg mb-1" style={{fontWeight: 900, fontSize: '1.125rem', margin: 0}}>Reach Velocity</h3>
                  <p className="text-sm text-slate-500 mb-4" style={{fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem'}}>
                    Your events average <strong>{avgAttendance}</strong> attendees. 
                    {avgAttendance > 50 ? ' High engagement detected.' : ' Targeted push recommended.'}
                  </p>
                  <div className="w-full bg-indigo-200 h-1 rounded-full overflow-hidden" style={{width: '100%', background: '#e0e7ff', height: '0.25rem', borderRadius: '9999px', overflow: 'hidden'}}>
                    <div className="bg-indigo-600 h-full" style={{background: '#4f46e5', height: '100%', width: `${Math.min(100, (avgAttendance/200)*100)}%`}}></div>
                  </div>
               </div>
               
               <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 group hover:shadow-lg transition-all" style={{padding: '1.5rem', background: '#ecfdf5', borderRadius: '1.5rem', border: '1px solid #d1fae5', transition: 'all 0.3s'}}>
                  <CheckCircle className="text-emerald-600 mb-4" size={32} />
                  <h3 className="font-black text-lg mb-1" style={{fontWeight: 900, fontSize: '1.125rem', margin: 0}}>Auth Success Rate</h3>
                  <p className="text-sm text-slate-500 mb-4" style={{fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem'}}>
                    You have a <strong>{approvalRate}%</strong> approval rate across across all verified venue requests.
                  </p>
                  <div className="w-full bg-emerald-200 h-1 rounded-full overflow-hidden" style={{width: '100%', background: '#d1fae5', height: '0.25rem', borderRadius: '9999px', overflow: 'hidden'}}>
                    <div className="bg-emerald-600 h-full" style={{background: '#059669', height: '100%', width: `${approvalRate}%`}}></div>
                  </div>
               </div>
            </div>
          </section>
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
    </div> {/* End of lg:col-span-2 */}

    {/* Sidebar / Stats Column */}
        <div className="space-y-8" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" style={{ padding: '1.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '1.5rem' }}>
            <h3 className="font-black text-lg mb-4 flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Zap size={20} className="text-indigo-600" /> Snap Stats
            </h3>
            <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>Active Proposals</div>
                <div className="text-3xl font-black text-slate-900" style={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a' }}>{pending.length}</div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>Approved Events</div>
                <div className="text-3xl font-black text-emerald-600" style={{ fontSize: '1.875rem', fontWeight: 900, color: '#059669' }}>{approved.length}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
