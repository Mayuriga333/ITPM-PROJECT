import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

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

          <div className="flex items-center space-x-3">
            <Link to="/discovery" className="btn-secondary">
              Browse Volunteers
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;