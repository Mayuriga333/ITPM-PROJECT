import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name ? user.name.charAt(0).toUpperCase() : '?';

   const handleProfileClick = () => {
    if (user.role === 'Student') {
      navigate('/student/dashboard');
    } else if (user.role === 'Volunteer') {
      navigate('/volunteer/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleProfileClick}
        className="flex items-center gap-2 focus:outline-none group"
      >
        <div className="flex flex-col items-end text-right mr-1">
          <span className="text-sm font-semibold text-slate-50 truncate max-w-[160px] group-hover:text-white">
            {user.name || 'User'}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            {user.role || 'Member'}
          </span>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-semibold group-hover:bg-indigo-500">
          {initials}
        </div>
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserMenu;
