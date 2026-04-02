import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Layout/NavBar';
import HomePage from './pages/HomePage';
import DiscoveryPage from './pages/DiscoveryPage';
import RequestPage from './pages/RequestPage';
import StudentDashboard from './pages/StudentDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import ChatPage from './pages/ChatPage'; // <--- Added ChatPage
import Login from './pages/Login'; // <--- Added Login
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';


function AppContent() {
  const location = useLocation();

  // Routes that require a full-screen standalone layout without global navbar/shells
  const isFullScreenRoute = 
    location.pathname === '/login' ||
    location.pathname === '/volunteer/dashboard' || 
    location.pathname === '/student/dashboard' || 
    location.pathname === '/discovery' ||
    location.pathname === '/chat';

  return (
    <div className={isFullScreenRoute ? "w-full h-screen overflow-hidden" : "app-shell"}>
      {!isFullScreenRoute && <Navbar />}

      <main className={isFullScreenRoute ? "w-full h-full p-0 m-0" : "app-main"}>
        <Routes>
          {/* Redirect to login by default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/discovery" 
            element={
              <ProtectedRoute allowedRole="Student">
                <DiscoveryPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRole="Student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/volunteer/dashboard" 
            element={
              <ProtectedRoute allowedRole="Volunteer">
                <VolunteerDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Unprotected for now or you can protect it too */}
          <Route 
            path="/request/:volunteerId" 
            element={
              <ProtectedRoute allowedRole="Student">
                <RequestPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
