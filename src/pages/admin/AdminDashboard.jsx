import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS, STATUS_LABELS } from '../../utils/constants';
import { BarChart3, Building2, FileText, CheckCircle, Clock, Users, ArrowRight, Shield, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { proposals, bookings } = useProposals();
  const { venues } = useVenues();

  const approved = proposals.filter(p => [PROPOSAL_STATUS.APPROVED, PROPOSAL_STATUS.VENUE_BOOKED].includes(p.status));
  const pending = proposals.filter(p => [PROPOSAL_STATUS.SUBMITTED, PROPOSAL_STATUS.FACULTY_REVIEW, PROPOSAL_STATUS.HOD_REVIEW, PROPOSAL_STATUS.ADMIN_REVIEW].includes(p.status));
  const adminPending = proposals.filter(p => p.status === PROPOSAL_STATUS.ADMIN_REVIEW);

  // Event types distribution
  const typeCount = {};
  proposals.forEach(p => {
    typeCount[p.eventType] = (typeCount[p.eventType] || 0) + 1;
  });
  const pieData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  // Venue usage
  const venueUsage = venues.map(v => ({
    name: v.name.length > 15 ? v.name.substring(0, 15) + '...' : v.name,
    bookings: bookings.filter(b => b.venueId === v.id).length,
    proposals: proposals.filter(p => p.venueId === v.id).length,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Control Center</h1>
        <p>Complete oversight of events, venues, and approvals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-4 gap-lg" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="stat-card animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon"><FileText size={20} /></div>
          </div>
          <div className="stat-value">{proposals.length}</div>
          <div className="stat-label">Total Proposals</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--status-warning)' }}><Clock size={20} /></div>
          </div>
          <div className="stat-value">{adminPending.length}</div>
          <div className="stat-label">Awaiting Your Approval</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--status-success)' }}><CheckCircle size={20} /></div>
          </div>
          <div className="stat-value">{approved.length}</div>
          <div className="stat-label">Approved Events</div>
        </div>
        <div className="stat-card animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-admin)' }}><Building2 size={20} /></div>
          </div>
          <div className="stat-value">{venues.length}</div>
          <div className="stat-label">Managed Venues</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-2 gap-lg" style={{ marginBottom: 'var(--space-2xl)' }}>
        {/* Event Types Pie */}
        <div className="card animate-fade-in-up">
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            Event Type Distribution
          </h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-xs)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-sm justify-center">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-xs" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Venue Usage Bar */}
        <div className="card animate-fade-in-up stagger-2">
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
            Venue Usage
          </h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={venueUsage}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-xs)',
                  }}
                />
                <Bar dataKey="proposals" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Proposals" />
                <Bar dataKey="bookings" fill="#10B981" radius={[4, 4, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Admin Approvals */}
      {adminPending.length > 0 && (
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>⏳ Pending Your Approval</h2>
            <Link to="/reviews" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          <div className="flex flex-col gap-md">
            {adminPending.map(p => {
              const venue = venues.find(v => v.id === p.venueId);
              return (
                <div key={p.id} className="card card-action-row">
                  <div className="flex items-center gap-md">
                    <span style={{ fontSize: '24px' }}>{venue?.image || '📍'}</span>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>{p.title}</h3>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                        {p.clubName} · {p.expectedAttendees} attendees · {p.date}
                      </span>
                    </div>
                  </div>
                  <Link to={`/proposals/${p.id}`} className="btn btn-primary btn-sm">
                    Review <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-3 gap-lg">
        <Link to="/venues/manage" className="card flex items-center gap-md" style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Building2 size={20} /></div>
          <div>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Manage Venues</h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{venues.length} venues</p>
          </div>
          <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
        </Link>
        <Link to="/analytics" className="card flex items-center gap-md" style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><BarChart3 size={20} /></div>
          <div>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Analytics</h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>View insights</p>
          </div>
          <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
        </Link>
        <Link to="/audit" className="card flex items-center gap-md" style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Shield size={20} /></div>
          <div>
            <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 700 }}>Audit Log</h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>System activity</p>
          </div>
          <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
        </Link>
      </div>
    </div>
  );
}
