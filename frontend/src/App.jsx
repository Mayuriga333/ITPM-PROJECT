import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Layout/NavBar';
import HomePage from './pages/HomePage';
import DiscoveryPage from './pages/DiscoveryPage';
import RequestPage from './pages/RequestPage';
import StudentDashboard from './pages/StudentDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';

function AppContent() {
  const location = useLocation();

  // Routes that require a full-screen standalone layout without global navbar/shells
  const isFullScreenRoute = 
    location.pathname === '/volunteer/dashboard' || 
    location.pathname === '/student/dashboard' || 
    location.pathname === '/discovery';

  return (
    <div className={isFullScreenRoute ? "w-full h-screen overflow-hidden" : "app-shell"}>
      {!isFullScreenRoute && <Navbar />}

      <main className={isFullScreenRoute ? "w-full h-full p-0 m-0" : "app-main"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/request/:volunteerId" element={<RequestPage />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
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
      <AppContent />
    </Router>
  );
}

export default App;
