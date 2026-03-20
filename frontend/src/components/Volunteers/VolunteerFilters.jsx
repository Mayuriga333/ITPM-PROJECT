import React, { useState } from 'react';
import { Search } from 'lucide-react';

const subjects = [
  'Python', 'Calculus', 'Physics', 'Chemistry',
  'Statistics', 'Economics', 'Biology', 'English'
];

const availabilityOptions = ['Available Now', 'This Week', 'Any Time'];

const VolunteerFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    subject: '',
    availability: '',
    search: ''
  });

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="w-[280px] shrink-0 sticky top-[100px]">
      <div className="card-container p-6">
        <h2 className="text-[18px] font-bold text-white mb-2">Find Your Tutor</h2>
        <p className="text-indigo-200 text-[14px] mb-6">Connect with peer volunteers for academic support.</p>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-300" />
            <input
              type="text"
              placeholder="Search subjects or names..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 text-white rounded-full focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow text-[14px] placeholder-indigo-300"
            />
          </div>
        </div>

        {/* Subjects */}
        <div className="mb-8">
          <h3 className="text-[12px] font-bold text-indigo-300 tracking-wider mb-3 uppercase">Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => handleChange('subject', filters.subject === subject ? '' : subject)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${filters.subject === subject
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white/5 border-white/10 text-indigo-100 hover:bg-white/10 hover:border-white/30'
                  }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <h3 className="text-[12px] font-bold text-indigo-300 tracking-wider mb-3 uppercase">Availability</h3>
          <div className="space-y-3">
            {availabilityOptions.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input
                    type="radio"
                    name="availability"
                    value={option}
                    checked={filters.availability === option}
                    onChange={(e) => handleChange('availability', e.target.value)}
                    className="peer appearance-none w-5 h-5 border-2 border-white/30 rounded-full checked:border-primary transition-colors cursor-pointer"
                  />
                  <div className="absolute w-2.5 h-2.5 bg-primary rounded-full scale-0 peer-checked:scale-100 transition-transform pointer-events-none"></div>
                </div>
                <span className="text-[14px] text-indigo-100 font-medium group-hover:text-white transition-colors">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerFilters;