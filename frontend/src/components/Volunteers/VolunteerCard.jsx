import React from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VolunteerCard = ({ volunteer }) => {
  const navigate = useNavigate();
  // We extract `match` if it's there (from our mock fallback for the image design)
  const { _id, name, initials, subjects, rating, totalSessions, match = 90 } = volunteer;

  const handleRequestSupport = () => {
    navigate(`/request/${_id}`);
  };

  return (
    <div className="bg-[#0B0F19] border border-[#1C2033] rounded-3xl p-6 flex flex-col items-center hover:-translate-y-2 transition-transform duration-300 relative shadow-2xl pb-8 group">
      
      {/* 1. Large Avatar Block */}
      <div className="relative mb-6 mt-4">
        {/* Main large rounded avatar container */}
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-[#4f46e5] rounded-[24px] flex items-center justify-center text-white text-[32px] font-black shadow-[0_10px_30px_rgba(99,102,241,0.3)]">
          {initials}
        </div>
        
        {/* Absolute 98% Match Badge overlapping the avatar */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#134e4a]/80 backdrop-blur-md border border-[#2dd4bf]/30 text-[#2dd4bf] text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg">
          {match}% Match
        </div>
      </div>

      {/* 2. Name & Rating */}
      <h3 className="font-bold text-white text-[18px] tracking-tight">{name}</h3>
      <div className="flex items-center justify-center gap-1.5 mt-2 mb-5">
        <Star className="w-3.5 h-3.5 text-[#fbbf24] fill-[#fbbf24]" />
        <span className="text-white text-xs font-bold">{rating.toFixed(1)}</span>
        <span className="text-slate-500 text-[11px] font-medium">({totalSessions})</span>
      </div>

      {/* 3. Subjects Mini-Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {subjects.map((subject, index) => (
          <span
            key={index}
            className="px-3 py-1.5 bg-[#151928] border border-[#21273B] text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest"
          >
            {subject}
          </span>
        ))}
      </div>

      {/* 4. Action Button - Lavender matched to image */}
      <button
        onClick={handleRequestSupport}
        className="w-full bg-[#c4b5fd] hover:bg-[#a78bfa] text-[#1e1b4b] font-bold py-3.5 rounded-2xl transition-all shadow-[0_10px_20px_rgba(196,181,253,0.15)] hover:shadow-[0_10px_25px_rgba(167,139,250,0.3)] mt-auto"
      >
        Request Support
      </button>
    </div>
  );
};

export default VolunteerCard;