import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import { LayoutDashboard, MapPin, PlusCircle, Bell, FileText, ClipboardCheck, BarChart3, Calendar, Search } from 'lucide-react';
import './BottomNav.css';

const NAV_CONFIG = {
  [ROLES.STUDENT]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/events', icon: Calendar, label: 'Events' },
    { to: '/venues', icon: Search, label: 'Search' },
  ],
  [ROLES.SOCIETY]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/proposals/new', icon: PlusCircle, label: 'Create' },
    { to: '/proposals', icon: FileText, label: 'Proposals' },
  ],
  [ROLES.FACULTY]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/reviews', icon: ClipboardCheck, label: 'Reviews' },
    { to: '/proposals', icon: FileText, label: 'Proposals' },
  ],
  [ROLES.ADMIN]: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/reviews', icon: ClipboardCheck, label: 'Reviews' },
    { to: '/proposals', icon: FileText, label: 'Proposals' },
    { to: '/audit', icon: BarChart3, label: 'Audit' },
  ],
};

export default function BottomNav() {
  const { user } = useAuth();
  if (!user) return null;

  const items = NAV_CONFIG[user.role] || [];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
