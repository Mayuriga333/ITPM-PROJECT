import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiBook } from "react-icons/fi";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <FiBook size={24} />
          EduConnect
        </Link>

        <div className="navbar-links">
          <Link to="/volunteers">Volunteers</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          {user && user.role === "student" && (
            <>
              <Link to="/find-volunteer">Find Match</Link>
              <Link to="/dashboard/student">Dashboard</Link>
            </>
          )}
          {user && user.role === "volunteer" && (
            <Link to="/dashboard/volunteer">Dashboard</Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin/moderation">Moderation</Link>
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
