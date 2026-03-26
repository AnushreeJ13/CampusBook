import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProposals } from '../../contexts/ProposalContext';
import { ROLES } from '../../utils/constants';
import {
  LayoutDashboard, MapPin, FileText, PlusCircle, ClipboardCheck,
  Bell, BarChart3, Users, ScrollText, Settings, LogOut, Eye,
  Building2, ChevronLeft, ChevronRight, RefreshCw, Sparkles, X
} from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

const MENU_CONFIG = {
  [ROLES.STUDENT]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/venues', icon: MapPin, label: 'Browse Venues' },
    { to: '/events', icon: Eye, label: 'Upcoming Events' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],
  [ROLES.SOCIETY]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/proposals/new', icon: PlusCircle, label: 'New Proposal' },
    { to: '/proposals', icon: FileText, label: 'My Proposals' },
    { to: '/venues', icon: MapPin, label: 'Browse Venues' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],
  [ROLES.FACULTY]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reviews', icon: ClipboardCheck, label: 'Pending Reviews' },
    { to: '/proposals', icon: FileText, label: 'All Proposals' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],
  [ROLES.ADMIN]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/venues/manage', icon: Building2, label: 'Manage Venues' },
    { to: '/reviews', icon: ClipboardCheck, label: 'Pending Approvals' },
    { to: '/proposals', icon: FileText, label: 'All Proposals' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/audit', icon: ScrollText, label: 'Audit Log' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],
};

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout, switchRole } = useAuth();
  const { resetData } = useProposals();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  if (!user) return null;

  const menuItems = MENU_CONFIG[user.role] || [];

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
            <Sparkles size={22} />
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-brand">CampusBook</span>
              <span className="sidebar-role-tag">{user.role}</span>
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
        {/* Demo Role Switcher */}
        {!collapsed && (
          <div className="sidebar-demo-section">
            <button
              className="sidebar-link demo-switcher-btn"
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            >
              <RefreshCw size={18} />
              <span>Switch Role (Demo)</span>
            </button>
            {showRoleSwitcher && (
              <div className="role-switcher-dropdown">
                {Object.values(ROLES).map(role => (
                  <button
                    key={role}
                    className={`role-option ${user.role === role ? 'active' : ''}`}
                    onClick={() => handleRoleSwitch(role)}
                  >
                    <span className={`role-dot role-dot-${role}`} />
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
                <button className="role-option reset-option" onClick={resetData}>
                  <RefreshCw size={14} /> Reset Data
                </button>
              </div>
            )}
          </div>
        )}

        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.avatar}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{user.clubName || user.role}</span>
            </div>
          )}
          {!collapsed && (
            <button className="sidebar-logout" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
