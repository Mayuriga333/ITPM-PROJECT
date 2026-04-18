import React from 'react';

export const Label = ({ children, className = '', ...props }) => (
  <label className={`input-label ${className}`} {...props}>
    {children}
  </label>
);

export const Input = React.forwardRef(({ className = '', error, ...props }, ref) => {
  const errorClass = error ? 'border-red-500 bg-red-50 focus:ring-red-500' : '';
  
  return (
    <input
      ref={ref}
      className={`input-field ${errorClass} ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';
