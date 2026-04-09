import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProposalProvider } from './contexts/ProposalContext';
import { VenueProvider } from './contexts/VenueContext';
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
import CampusTwin from './pages/CampusTwin';
import Timetable from './pages/Timetable';
import GraphInsights from './pages/GraphInsights';
import AttendanceLoop from './pages/AttendanceLoop';
import CampusChat from './pages/CampusChat';
import UpcomingEvents from './pages/student/UpcomingEvents';
import AttendanceScanner from './pages/society/AttendanceScanner';
import StudentCheckIn from './pages/student/StudentCheckIn.jsx';
import CollegeSelector from './pages/CollegeSelector';
import EventDetail from './pages/student/EventDetail';
import { COLLEGES } from './utils/constants';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case ROLES.STUDENT: return <StudentDashboard />;
    case ROLES.SOCIETY: return <SocietyDashboard />;
    case ROLES.FACULTY: return <FacultyDashboard />;
    case ROLES.ADMIN: return <AdminDashboard />;
    default: return <StudentDashboard />;
  }
}

function AppContent() {
  const { user, loading, selectedCollege, selectCollege } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!selectedCollege) {
    return <CollegeSelector onSelect={selectCollege} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user || user.incomplete) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="main-content flex-1 overflow-y-auto">
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
            <Route path="/campus-twin" element={<ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.FACULTY, ROLES.SOCIETY]}><CampusTwin /></ProtectedRoute>} />
            <Route path="/timetable" element={<ProtectedRoute allowedRoles={[ROLES.FACULTY]}><Timetable /></ProtectedRoute>} />
            <Route path="/graph-insights" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><GraphInsights /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute allowedRoles={[ROLES.SOCIETY, ROLES.ADMIN]}><AttendanceScanner /></ProtectedRoute>} />
            <Route path="/campus-chat" element={<ProtectedRoute><CampusChat /></ProtectedRoute>} />
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VenueProvider>
          <ProposalProvider>
            <AppContent />
          </ProposalProvider>
        </VenueProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
