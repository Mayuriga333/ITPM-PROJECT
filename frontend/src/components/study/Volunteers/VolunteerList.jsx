import React from 'react';
import VolunteerCard from './VolunteerCard';

const VolunteerList = ({ volunteers, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[280px] skeleton-loader"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 text-red-300 p-6 rounded-2xl border border-red-500/30 text-center">
        {error}
      </div>
    );
  }

  if (volunteers.length === 0) {
    return (
      <div className="bg-white/5 text-slate-400 p-12 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
        <p className="text-[16px] font-medium">No volunteers found matching your criteria.</p>
        <p className="text-[14px]">Try adjusting your filters or search term.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {volunteers.map((volunteer) => (
        <VolunteerCard key={volunteer._id} volunteer={volunteer} />
      ))}
    </div>
  );
};

export default VolunteerList;