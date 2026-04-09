import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProposalProvider } from './contexts/ProposalContext';
import { VenueProvider } from './contexts/VenueContext';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { ROLES } from './utils/constants';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import Login from './pages/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import SocietyDashboard from './pages/society/SocietyDashboard';
import NewProposal from './pages/society/NewProposal';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageVenues from './pages/admin/ManageVenues';
import AuditLog from './pages/admin/AuditLog';
import BrowseVenues from './pages/BrowseVenues';
import ProposalDetail from './pages/ProposalDetail';
import ProposalsList from './pages/ProposalsList';
import PendingReviews from './pages/PendingReviews';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import GraphInsights from './pages/GraphInsights';
import UpcomingEvents from './pages/student/UpcomingEvents';

import AttendanceScanner from './pages/society/AttendanceScanner';
import StudentCheckIn from './pages/student/StudentCheckIn.jsx';
import CollegeSelector from './pages/CollegeSelector';
import EventDetail from './pages/student/EventDetail';
import { COLLEGES } from './utils/constants';

import { ThemeProvider } from './contexts/ThemeContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  console.log("DashboardRouter: Routing user", user.id, "with role:", user.role);

  switch (user.role) {
    case ROLES.STUDENT: return <StudentDashboard />;
    case ROLES.SOCIETY: return <SocietyDashboard />;
    case ROLES.FACULTY: return <FacultyDashboard />;
    case ROLES.ADMIN: return <AdminDashboard />;
    default: 
      console.warn("DashboardRouter: Unknown role, defaulting to Student", user.role);
      return <StudentDashboard />;
  }
}

import { useNotifications } from './contexts/NotificationContext';
import { useNavigate, useLocation } from 'react-router-dom';

function AppContent() {
  const { user, loading, selectedCollege, selectCollege } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-redirect to notifications if too many updates (spam protection)
  useEffect(() => {
    if (user && !user.incomplete && unreadCount > 10 && location.pathname !== '/notifications') {
      navigate('/notifications');
    }
  }, [user, unreadCount, location.pathname, navigate]);

  // Sync role with body class for the forensic theme
  useEffect(() => {
    if (user?.role) {
      // Remove all potential role classes first
      Object.values(ROLES).forEach(r => document.body.classList.remove(`role-${r.toLowerCase()}`));
      // Add current role class
      document.body.classList.add(`role-${user.role.toLowerCase()}`);
    } else {
      // Default to student or clean up if logged out
      Object.values(ROLES).forEach(r => document.body.classList.remove(`role-${r.toLowerCase()}`));
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  // Public routes
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login mode="register" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!selectedCollege) {
    return <CollegeSelector onSelect={selectCollege} />;
  }

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div className="view-canvas">
        <TopBar onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="main-content">
          <Routes>
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Venues */}
            <Route path="/venues" element={<ProtectedRoute><BrowseVenues /></ProtectedRoute>} />
            <Route path="/venues/manage" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><ManageVenues /></ProtectedRoute>} />

            {/* Proposals */}
            <Route path="/proposals" element={<ProtectedRoute><ProposalsList /></ProtectedRoute>} />
            <Route path="/proposals/new" element={<ProtectedRoute allowedRoles={[ROLES.SOCIETY]}><NewProposal /></ProtectedRoute>} />
            <Route path="/proposals/:id" element={<ProtectedRoute><ProposalDetail /></ProtectedRoute>} />

            {/* Reviews */}
            <Route path="/reviews" element={<ProtectedRoute allowedRoles={[ROLES.FACULTY, ROLES.ADMIN]}><PendingReviews /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AuditLog /></ProtectedRoute>} />

            {/* CampusOS Intelligence */}
            <Route path="/graph-insights" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><GraphInsights /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute allowedRoles={[ROLES.SOCIETY, ROLES.ADMIN]}><AttendanceScanner /></ProtectedRoute>} />
            <Route path="/check-in" element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]}><StudentCheckIn /></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/events" element={<ProtectedRoute><UpcomingEvents /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>

  );
}

import { AttendanceProvider } from './contexts/AttendanceContext';
import { ProfileProvider } from './contexts/ProfileContext';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <VenueProvider>
            <ProposalProvider>
              <NotificationProvider>
                <ProfileProvider>
                  <AttendanceProvider>
                    <AppContent />
                  </AttendanceProvider>
                </ProfileProvider>
              </NotificationProvider>
            </ProposalProvider>
          </VenueProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}


