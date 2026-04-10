import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { ROLES } from '../../utils/constants';
import {
  LayoutDashboard, MapPin, FileText, PlusCircle, ClipboardCheck,
  Bell, BarChart3, Users, ScrollText, Settings, LogOut, Eye,
  Building2, ChevronLeft, ChevronRight, RefreshCw, X,
  Map, Calendar, Shield, QrCode, MessageCircle, Activity, Sparkles,
  BookmarkCheck
} from 'lucide-react';
import { useState } from 'react';
import UniflowLogo from '../UniflowLogo';
import './Sidebar.css';

const MENU_CONFIG = {
  [ROLES.STUDENT]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/events', icon: Calendar, label: 'Upcoming Events' },
    { to: '/nexus-insight', icon: Sparkles, label: 'Nexus Insight' },
    { to: '/check-in', icon: QrCode, label: 'Attendance Scanner' },
    { to: '/profile', icon: Settings, label: 'Profile and Interests' },
  ],
  [ROLES.SOCIETY]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: QrCode, label: 'Attendance Scanner' },
    { to: '/proposals/new', icon: PlusCircle, label: 'New Proposal' },
    { to: '/proposals', icon: FileText, label: 'My Proposals' },
    { to: '/venues', icon: MapPin, label: 'Venues' },
  ],
  [ROLES.FACULTY]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reviews', icon: ClipboardCheck, label: 'Pending Reviews' },
    { to: '/proposals', icon: FileText, label: 'All Proposals' },
  ],
  [ROLES.ADMIN]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reviews', icon: ClipboardCheck, label: 'Approvals' },
    { to: '/proposals', icon: FileText, label: 'All Proposals' },
    { to: '/venues/manage', icon: Building2, label: 'Venue Management' },
    { to: '/graph-insights', icon: Shield, label: 'Campus Insights' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/audit', icon: ScrollText, label: 'Audit Trail' },
  ],
};


export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout, switchRole, selectedCollege, selectCollege } = useAuth();
  const { resetData } = useProposals();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  if (!user) return null;

  const currentRole = user?.role?.toLowerCase() || '';
  const menuItems = MENU_CONFIG[currentRole] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = (role) => {
    switchRole(role);
    setShowRoleSwitcher(false);
    navigate('/dashboard');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <UniflowLogo size={28} />
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-brand">UniFlow</span>
              <span className="sidebar-tagline">{selectedCollege?.shortName || 'Smart Campus'}</span>
              <span className="sidebar-role-tag">{user?.role}</span>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button className="sidebar-toggle desktop-only" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Close Toggle (Mobile) */}
        <button className="sidebar-close mobile-only" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={true}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => mobileOpen && setMobileOpen(false)}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        {/* User Info */}
        <Link to="/profile" className="sidebar-user" style={{textDecoration: 'none'}}>
          <div className="sidebar-user-avatar">{user.avatar}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{user.clubName || user.role}</span>
            </div>
          )}
          {!collapsed && (
            <button className="sidebar-logout" onClick={(e) => { e.preventDefault(); handleLogout(); }} title="Logout">
              <LogOut size={18} />
            </button>
          )}
        </Link>
      </div>

    </aside>
    </>
  );
}
