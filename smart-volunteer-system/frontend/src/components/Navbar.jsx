/**
 * components/Navbar.jsx
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HeartHandshake, 
  LayoutDashboard, 
  Users, 
  Contact, 
  LogOut, 
  User, 
  ChevronDown
} from 'lucide-react';
import './Navbar.css';

const ROLE_DASH = { Student: '/student', Volunteer: '/volunteer', Admin: '/admin' };

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner container">

        {/* Brand */}
        <Link to={ROLE_DASH[user?.role] || '/'} className="navbar-brand group">
          <div className="navbar-logo">
            <HeartHandshake size={18} className="text-white group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="brand-name tracking-tight">Educonnect</span>
        </Link>

        {/* Admin nav links */}
        {user?.role === 'Admin' && (
          <div className="admin-nav-links">
            <Link to="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
              <LayoutDashboard size={16} />
              <span>Overview</span>
            </Link>
            <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
              <Users size={16} />
              <span>Users</span>
            </Link>
            <Link to="/admin/profiles" className={`nav-item ${isActive('/admin/profiles') ? 'active' : ''}`}>
              <Contact size={16} />
              <span>Profiles</span>
            </Link>
          </div>
        )}

        {/* Right side */}
        <div className="navbar-right">
          {user ? (
            <>
              <div className="user-profile-badge">
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <div className="user-info-text">
                  <span className="user-name">{user.name}</span>
                  <span className={`badge badge-${user.role.toLowerCase()} text-[10px] leading-none py-1 px-2`}>
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div className="h-6 w-px bg-slate-700/50 mx-2"></div>
              
              <Link to="/profile" className="btn btn-outline btn-sm hover:bg-white/5 border-white/10 text-slate-300">
                Profile
              </Link>
              <button 
                className="btn btn-logout btn-sm group" 
                onClick={handleLogout}
              >
                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="btn btn-outline btn-sm border-white/10 hover:bg-white/5">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm shadow-indigo-500/20">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;