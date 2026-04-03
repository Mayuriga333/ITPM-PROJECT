import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-rose-500/10 text-rose-400',
    blue: 'bg-sky-500/10 text-sky-400',
  };

  return (
    <div className="bg-[#141824] rounded-xl shadow-sm border border-[#21273B] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;