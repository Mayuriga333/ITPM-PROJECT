import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VolunteerList from "./pages/VolunteerList";
import VolunteerProfile from "./pages/VolunteerProfile";
import FindVolunteer from "./pages/FindVolunteer";
import StudentDashboard from "./pages/StudentDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import Leaderboard from "./pages/Leaderboard";
import AdminModeration from "./pages/AdminModeration";

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/volunteers" element={<VolunteerList />} />
          <Route path="/volunteers/:id" element={<VolunteerProfile />} />
          <Route path="/find-volunteer" element={<FindVolunteer />} />
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default App;
