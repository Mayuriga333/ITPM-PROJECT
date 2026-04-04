import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HeartHandshake } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/rating");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/rating" className="navbar-logo">
          <HeartHandshake size={20} className="text-white" />
          EduConnect
        </Link>

        <div className="navbar-links">
          <Link to="/rating/volunteers">Volunteers</Link>
          <Link to="/rating/leaderboard">Leaderboard</Link>
          {user && user.role === "Student" && (
            <>
              <Link to="/rating/find-volunteer">Find Match</Link>
              <Link to="/rating/dashboard/student">Dashboard</Link>
            </>
          )}
          {user && user.role === "Volunteer" && (
            <Link to="/rating/dashboard/volunteer">Dashboard</Link>
          )}
          {user && user.role === "Admin" && (
            <Link to="/rating/admin/moderation">Moderation</Link>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <span style={{ fontSize: "0.9rem", color: "var(--gray-600)" }}>
                Hi, {user.name.split(" ")[0]}
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
