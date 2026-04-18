import React from 'react';

const Badge = ({ status, className = '', children }) => {
  const statusStyles = {
    completed: 'bg-success/10 text-success border border-success/20',
    active: 'bg-info/10 text-info border border-info/20',
    needsReview: 'bg-warning/10 text-warning border border-warning/20',
    default: 'bg-neutral-100 text-neutral-600 border border-neutral-200'
  };

  const styleClass = statusStyles[status] || statusStyles.default;

  return (
    <span className={`inline-flex items-center px-3 h-5 rounded-full text-[12px] font-semibold tracking-wide ${styleClass} ${className}`}>
      {children || status}
    </span>
  );
};

export default Badge;
