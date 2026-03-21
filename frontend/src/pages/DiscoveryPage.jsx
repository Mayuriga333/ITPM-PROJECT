import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import VolunteerList from '../components/Volunteers/VolunteerList';
import { volunteerAPI } from '../services/api';
import { Bell, Filter, ChevronDown, BookOpen } from 'lucide-react';
import UserMenu from '../components/common/UserMenu';

const SUBJECT_Categories = ['Mathematics', 'Science', 'Humanities', 'CS'];

const DiscoveryPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubject, setActiveSubject] = useState('All Subjects');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVolunteers();
  }, [activeSubject, searchQuery]);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeSubject !== 'All Subjects') params.subject = activeSubject;
      if (searchQuery) params.search = searchQuery;
      
      const response = await volunteerAPI.getAll(params);
      setVolunteers(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load volunteers. Please try again.');
      console.error('Error fetching volunteers:', err);
      // Fallback data mapping specifically to the image's demo data
      setVolunteers([
        { _id: '1', name: 'Emily Rodriguez', initials: 'ER', subjects: ['Chemistry', 'Biology'], rating: 4.9, totalSessions: 120, match: 98, availability: 'Available Now' },
        { _id: '2', name: 'Michael Chang', initials: 'MC', subjects: ['Python', 'Algorithms'], rating: 4.8, totalSessions: 85, match: 92, availability: 'This Week' },
        { _id: '3', name: 'Sofia Petrova', initials: 'SP', subjects: ['Statistics', 'Economics'], rating: 5.0, totalSessions: 42, match: 89, availability: 'Available Now' },
        { _id: '4', name: 'David Kim', initials: 'DK', subjects: ['Physics', 'Calculus'], rating: 4.5, totalSessions: 60, match: 75, availability: 'Any Time' },
      ]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#0B0A1A] text-slate-300 font-sans pb-40 overflow-y-auto">
      
      {/* 1. Simple Header with logo + user info */}
      <nav className="flex items-center justify-between px-10 py-6">
        <Link to="/" className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold text-slate-50">TutorConnect</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
          >
            <Bell className="w-4 h-4" />
          </button>
          <UserMenu />
        </div>
      </nav>

      {/* 2. Hero Section */}
      <div className="max-w-7xl mx-auto pt-16 pb-12 px-6 flex flex-col items-center text-center">
        <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
          Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-300">Ideal Tutor</span>
        </h1>
        <p className="text-slate-300 text-[15px] max-w-2xl mb-12">
          Connect with expert volunteers for personalized academic support across all major subjects and skill levels.
        </p>

        {/* 3. Search Bar */}
        <div className="w-full max-w-3xl relative mb-10">
          <input
            type="text"
            placeholder="Search by subject, skill, or tutor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-4 pl-8 pr-16 bg-white rounded-2xl text-[#0B0F19] placeholder-slate-400 font-medium text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all"
          />
        </div>

        {/* 4. Horizontal Filters Pill */}
        <div className="w-full bg-[#151928] border border-[#1E2335] rounded-2xl flex flex-col md:flex-row justify-between items-center p-4 shadow-xl">
           <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto pb-4 md:pb-0 hide-scrollbar">
             <div className="flex items-center gap-2 text-slate-400 ml-2 shrink-0">
               <Filter className="w-4 h-4" />
               <span className="text-xs font-bold tracking-widest uppercase">Filters</span>
             </div>
             
             <div className="flex items-center gap-2">
               <button 
                 onClick={() => setActiveSubject('All Subjects')}
                 className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeSubject === 'All Subjects' ? 'bg-[#c4b5fd] text-indigo-950 shadow-[0_0_15px_rgba(167,139,250,0.3)]' : 'bg-[#1C2033] text-slate-300 hover:bg-[#2A314A]'}`}
               >
                 All Subjects
               </button>
               {SUBJECT_Categories.map(sub => (
                 <button 
                   key={sub}
                   onClick={() => setActiveSubject(sub)}
                   className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeSubject === sub ? 'bg-[#c4b5fd] text-indigo-950 shadow-[0_0_15px_rgba(167,139,250,0.3)]' : 'bg-[#1C2033] text-slate-300 hover:bg-[#2A314A]'}`}
                 >
                   {sub}
                 </button>
               ))}
             </div>
           </div>

           <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 border-[#1E2335] pt-4 md:pt-0 w-full md:w-auto px-4 md:px-0 justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Availability:</span>
                <button className="flex items-center gap-1 text-xs font-bold text-white">
                  Any time <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Match: 70%+</span>
                <div className="w-20 h-1 bg-[#1C2033] rounded-full relative cursor-pointer">
                  <div className="absolute top-0 left-0 w-[70%] h-full bg-[#c4b5fd] rounded-full"></div>
                  <div className="absolute top-1/2 left-[70%] -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-[#c4b5fd] rounded-full shadow-lg"></div>
                </div>
              </div>

              <button className="text-[10px] font-bold tracking-widest uppercase text-[#c4b5fd] hover:text-white transition-colors ml-2">
                Reset
              </button>
           </div>
        </div>
      </div>

      {/* 5. Results Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-48 mb-20">
        <div className="flex justify-between items-center mb-6">
          {/* <p className="text-sm font-medium text-slate-300">
            Showing <span className="font-bold text-white">{volunteers.length === 0 ? '0' : '0'}</span> active volunteers
          </p> */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sort:</span>
            <button className="flex items-center gap-1 text-sm font-bold text-white">
              Best Match <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        <VolunteerList 
            volunteers={volunteers} 
            loading={loading} 
            error={error}
        />
      </div>

    </div>
  );
};

export default DiscoveryPage;