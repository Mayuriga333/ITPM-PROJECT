import React from 'react';

const Card = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div
      className={`card-container ${noPadding ? '' : 'p-6'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
