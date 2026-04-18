/**
 * App.jsx — Merged root component: All routes from P1 (Auth/Chat), P2 (Rating), P3 (Study)
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// ── P1 Pages (Auth, Chat, Match, Admin, Messages) ──
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import { PendingPage, SuspendedPage, RejectedPage } from './pages/StatusPages';
import ProfilePage from './pages/ProfilePage';
import StudentDashboard from './pages/StudentDashboard';
import ChatPage from './pages/ChatPage';
import MatchesPage from './pages/MatchesPage';
import MessagesPage from './pages/MessagesPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminProfilesPage from './pages/AdminProfilesPage';

// ── P2 Pages (Rating & Reviews) ──
import RatingHome from './pages/rating/Home';
import RatingVolunteerList from './pages/rating/VolunteerList';
import RatingVolunteerProfile from './pages/rating/VolunteerProfile';
import RatingFindVolunteer from './pages/rating/FindVolunteer';
import RatingStudentDashboard from './pages/rating/StudentDashboard';
import RatingVolunteerDashboard from './pages/rating/VolunteerDashboard';
import RatingLeaderboard from './pages/rating/Leaderboard';
import RatingAdminModeration from './pages/rating/AdminModeration';
import RatingFooter from './components/rating/Footer';
import './styles/rating.css';

// ── P3 Pages (Study Support) ──
import StudyHomePage from './pages/study/HomePage';
import StudyRegisterPage from './pages/study/RegisterPage';
import StudyDiscoveryPage from './pages/study/DiscoveryPage';
import StudyRequestPage from './pages/study/RequestPage';
import StudyStudentDashboard from './pages/study/StudentDashboard';
import StudyVolunteerDashboard from './pages/study/VolunteerDashboard';
import './styles/theme.css';

// ── Root redirect based on role / status ──
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'Pending')   return <Navigate to="/pending"   replace />;
  if (user.status === 'Suspended') return <Navigate to="/suspended" replace />;
  if (user.status === 'Rejected')  return <Navigate to="/rejected"  replace />;
  const map = { Student: '/student', Volunteer: '/volunteer', Admin: '/admin' };
  return <Navigate to={map[user.role] || '/login'} replace />;
};

// ── Layout wrapper for P2 rating pages (Navbar + Footer) ──
const RatingLayout = () => (
  <div className="rating-app">
    <Navbar />
    <main className="main-content">
      <Outlet />
    </main>
    <RatingFooter />
  </div>
);

// ── Layout wrapper for P3 study pages (full-screen dark) ──
const StudyLayout = () => (
  <div className="w-full min-h-screen" style={{ background: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 40%, #0f172a 100%)', backgroundAttachment: 'fixed' }}>
    <main className="w-full h-full">
      <Outlet />
    </main>
  </div>
);

const AppRoutes = () => (
  <Routes>
    {/* ── Public ── */}
    <Route path="/"         element={<RootRedirect />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/pending"   element={<PendingPage />} />
    <Route path="/suspended" element={<SuspendedPage />} />
    <Route path="/rejected"  element={<RejectedPage />} />

    {/* ── P1: Student ── */}
    <Route path="/student"         element={<ProtectedRoute allowedRole="Student"><StudentDashboard /></ProtectedRoute>} />
    <Route path="/student/chat"    element={<ProtectedRoute allowedRole="Student"><ChatPage /></ProtectedRoute>} />
    <Route path="/student/matches" element={<ProtectedRoute allowedRole="Student"><MatchesPage /></ProtectedRoute>} />
    <Route path="/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

    {/* ── P1: Volunteer ── */}
    <Route path="/volunteer" element={<ProtectedRoute allowedRole="Volunteer"><VolunteerDashboard /></ProtectedRoute>} />

    {/* ── P1: Messages (Student + Volunteer) ── */}
    <Route path="/messages" element={<ProtectedRoute allowedRoles={['Student', 'Volunteer']}><MessagesPage /></ProtectedRoute>} />

    {/* ── P1: Admin ── */}
    <Route path="/admin"          element={<ProtectedRoute allowedRole="Admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users"    element={<ProtectedRoute allowedRole="Admin"><AdminUsersPage /></ProtectedRoute>} />
    <Route path="/admin/profiles" element={<ProtectedRoute allowedRole="Admin"><AdminProfilesPage /></ProtectedRoute>} />

    {/* ── P2: Rating & Reviews ── */}
    <Route element={<RatingLayout />}>
      <Route path="/rating"                    element={<RatingHome />} />
      <Route path="/rating/volunteers"         element={<RatingVolunteerList />} />
      <Route path="/rating/volunteers/:id"     element={<RatingVolunteerProfile />} />
      <Route path="/rating/find-volunteer"     element={<RatingFindVolunteer />} />
      <Route path="/rating/dashboard/student"  element={<ProtectedRoute allowedRole="Student"><RatingStudentDashboard /></ProtectedRoute>} />
      <Route path="/rating/dashboard/volunteer" element={<ProtectedRoute allowedRole="Volunteer"><RatingVolunteerDashboard /></ProtectedRoute>} />
      <Route path="/rating/leaderboard"        element={<RatingLeaderboard />} />
      <Route path="/rating/admin/moderation"   element={<ProtectedRoute allowedRole="Admin"><RatingAdminModeration /></ProtectedRoute>} />
    </Route>

    {/* ── P3: Study Support ── */}
    <Route element={<StudyLayout />}>
      <Route path="/study"                     element={<StudyHomePage />} />
      <Route path="/study/register"            element={<StudyRegisterPage />} />
      <Route path="/study/discovery"           element={<ProtectedRoute allowedRole="Student"><StudyDiscoveryPage /></ProtectedRoute>} />
      <Route path="/study/request/:volunteerId" element={<ProtectedRoute allowedRole="Student"><StudyRequestPage /></ProtectedRoute>} />
      <Route path="/study/student-dashboard"   element={<ProtectedRoute allowedRole="Student"><StudyStudentDashboard /></ProtectedRoute>} />
      <Route path="/study/volunteer-dashboard" element={<ProtectedRoute allowedRole="Volunteer"><StudyVolunteerDashboard /></ProtectedRoute>} />
    </Route>

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <ToastContainer position="bottom-right" autoClose={3000} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
