import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { useVenues } from '../../contexts/VenueContext';
import { PROPOSAL_STATUS } from '../../utils/constants';
import { BarChart3, Building2, FileText, CheckCircle, Clock, Shield, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AdminDashboard.css';

const CHART_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function AdminDashboard() {
  const navigate = useNavigate();
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
      {/* Hero Header */}
      <div className="admin-hero">
        <div className="admin-blob admin-blob-1" />
        <div className="admin-blob admin-blob-2" />

        <div className="admin-hero-content">
          <div>
            <h1>Admin Control Center</h1>
            <p>System overview, venue utilization, and approval pipeline</p>
          </div>
          <div className="admin-hero-badge">
            <span className="live-dot" /> Live System Status
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat admin-stat--proposals stagger-1">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Proposals</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
              <FileText size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="admin-stat-value">{proposals.length}</div>
        </div>

        <div className="admin-stat admin-stat--pending stagger-2">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Awaiting Approval</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <Clock size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="admin-stat-value">{adminPending.length}</div>
        </div>

        <div className="admin-stat admin-stat--approved stagger-3">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Approved Events</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
              <CheckCircle size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="admin-stat-value">{approved.length}</div>
        </div>

        <div className="admin-stat admin-stat--venues stagger-4">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Managed Venues</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(42, 201, 168, 0.15)', color: 'var(--accent-admin)' }}>
              <Building2 size={20} strokeWidth={2.5} />
            </div>
          </div>
          <div className="admin-stat-value">{venues.length}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="admin-charts-grid">
        {/* Event Types Pie */}
        <div className="admin-chart-card stagger-5">
          <h3 className="admin-chart-title">Global Signal Distribution</h3>
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
                  onClick={(data) => navigate(`/proposals?type=${data.name}`)}
                  style={{ cursor: 'pointer' }}
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
        <div className="admin-chart-card stagger-6">
          <h3 className="admin-chart-title">Sector Utilization</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={venueUsage} onClick={(data) => data && navigate('/venues/manage')}>
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
                <Bar dataKey="proposals" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Proposals" style={{ cursor: 'pointer' }} />
                <Bar dataKey="bookings" fill="var(--accent-admin)" radius={[4, 4, 0, 0]} name="Bookings" style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Admin Approvals */}
      {adminPending.length > 0 && (
        <div className="admin-pending-section">
          <div className="admin-pending-header">
            <h2>
              Pending Approvals
              <span className="admin-pending-count">{adminPending.length}</span>
            </h2>
            <Link to="/reviews" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          <div className="flex flex-col">
            {adminPending.map((p, i) => {
              const venue = venues.find(v => v.id === p.venueId);
              return (
                <div key={p.id} className="admin-pending-card animate-slide-left stagger-1" style={{ animationDelay: `${(i + 5) * 0.1}s` }}>
                  <div className="admin-pending-info">
                    <span className="admin-pending-emoji">{venue?.image || '📍'}</span>
                    <div>
                      <h3 className="admin-pending-title">{p.title}</h3>
                      <span className="admin-pending-meta">
                        {p.clubName} • {p.expectedAttendees} attendees • {p.date}
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
      <div className="admin-quick-links">
        <Link to="/venues/manage" className="admin-quick-link stagger-3">
          <div className="admin-stat-icon" style={{ background: 'rgba(42, 201, 168, 0.15)', color: 'var(--accent-admin)' }}>
            <Building2 size={24} />
          </div>
          <div className="admin-quick-link-info">
            <h3>Manage Venues</h3>
            <p>{venues.length} venues</p>
          </div>
          <ArrowRight size={18} className="admin-quick-link-arrow" />
        </Link>
        <Link to="/analytics" className="admin-quick-link stagger-4">
          <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
            <BarChart3 size={24} />
          </div>
          <div className="admin-quick-link-info">
            <h3>Analytics</h3>
            <p>View insights</p>
          </div>
          <ArrowRight size={18} className="admin-quick-link-arrow" />
        </Link>
        <Link to="/audit" className="admin-quick-link stagger-5">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <Shield size={24} />
          </div>
          <div className="admin-quick-link-info">
            <h3>Audit Log</h3>
            <p>System activity</p>
          </div>
          <ArrowRight size={18} className="admin-quick-link-arrow" />
        </Link>
      </div>
    </div>
  );
}
