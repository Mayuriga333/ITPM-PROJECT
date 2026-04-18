import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import UserMenu from '../common/UserMenu';

function Navbar() {
  return (
    <nav className="nav-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <HeartHandshake className="h-7 w-7 text-white" />
              <span className="text-xl font-bold text-slate-50">EduConnect</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/study/discovery" className="btn-secondary">
              Browse Volunteers
            </Link>
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;