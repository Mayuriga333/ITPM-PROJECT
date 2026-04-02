import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import UserMenu from '../common/UserMenu';

function Navbar() {
  return (
    <nav className="nav-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-slate-50">TutorConnect</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/discovery" className="btn-secondary">
              Browse Volunteers
            </Link>
            <Link to="/chat" className="btn-secondary">
              Chats
            </Link>
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;