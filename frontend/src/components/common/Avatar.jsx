import React from 'react';

const Avatar = ({ initials, className = '' }) => {
  return (
    <div className={`flex items-center justify-center w-[50px] h-[50px] rounded-[50px] bg-secondary text-primary font-bold text-sm ${className}`}>
      {initials}
    </div>
  );
};

export default Avatar;
