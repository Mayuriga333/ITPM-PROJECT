/**
 * App.jsx — Root component: routing, auth provider, protected routes
 *
 * Route map:
 *   /                  → Redirect based on role/status
 *   /register          → Public
 *   /login             → Public
 *   /pending           → Pending volunteer holding screen
 *   /suspended         → Suspended account screen
 *   /rejected          → Rejected account screen
 *   /student           → Student dashboard       [Student only]
 *   /student/chat      → Chatbot                 [Student only]
 *   /student/matches   → Volunteer matches        [Student only]
 *   /volunteer         → Volunteer dashboard      [Volunteer only]
 *   /admin             → Admin overview           [Admin only]
 *   /admin/users       → User management          [Admin only]
 *   /admin/profiles    → Profile moderation       [Admin only]
 */ 
// test change

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }                  from './context/AuthContext';
import ProtectedRoute                             from './components/ProtectedRoute';

import RegisterPage        from './pages/RegisterPage';
import LoginPage           from './pages/LoginPage';
import { PendingPage, SuspendedPage, RejectedPage } from './pages/StatusPages';
import ProfilePage         from './pages/ProfilePage';

import StudentDashboard    from './pages/StudentDashboard';
import ChatPage            from './pages/ChatPage';
import MatchesPage         from './pages/MatchesPage';
import MessagesPage        from './pages/MessagesPage';
import VolunteerDashboard  from './pages/VolunteerDashboard';

import AdminDashboard      from './pages/AdminDashboard';
import AdminUsersPage      from './pages/AdminUsersPage';
import AdminProfilesPage   from './pages/AdminProfilesPage';

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'Pending')   return <Navigate to="/pending"   replace />;
  if (user.status === 'Suspended') return <Navigate to="/suspended" replace />;
  if (user.status === 'Rejected')  return <Navigate to="/rejected"  replace />;
  const map = { Student: '/student', Volunteer: '/volunteer', Admin: '/admin' };
  return <Navigate to={map[user.role] || '/login'} replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/"         element={<RootRedirect />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/login"    element={<LoginPage />} />

    {/* Account status screens (accessible without Approved status) */}
    <Route path="/pending"   element={<PendingPage />} />
    <Route path="/suspended" element={<SuspendedPage />} />
    <Route path="/rejected"  element={<RejectedPage />} />

    {/* Student */}
    <Route path="/student"         element={<ProtectedRoute allowedRole="Student"><StudentDashboard /></ProtectedRoute>} />
    <Route path="/student/chat"    element={<ProtectedRoute allowedRole="Student"><ChatPage /></ProtectedRoute>} />
    <Route path="/student/matches" element={<ProtectedRoute allowedRole="Student"><MatchesPage /></ProtectedRoute>} />
    <Route path="/profile"          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

    {/* Volunteer */}
    <Route path="/volunteer" element={<ProtectedRoute allowedRole="Volunteer"><VolunteerDashboard /></ProtectedRoute>} />

    {/* Messages - accessible to both Students and Volunteers */}
    <Route path="/messages" element={<ProtectedRoute allowedRoles={['Student', 'Volunteer']}><MessagesPage /></ProtectedRoute>} />

    {/* Admin */}
    <Route path="/admin"          element={<ProtectedRoute allowedRole="Admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users"    element={<ProtectedRoute allowedRole="Admin"><AdminUsersPage /></ProtectedRoute>} />
    <Route path="/admin/profiles" element={<ProtectedRoute allowedRole="Admin"><AdminProfilesPage /></ProtectedRoute>} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;