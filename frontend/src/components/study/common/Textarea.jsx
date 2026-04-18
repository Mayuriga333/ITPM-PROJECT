import React from 'react';

export const Textarea = React.forwardRef(({ className = '', error, ...props }, ref) => {
  const errorClass = error ? 'border-red-500 bg-red-50 focus:ring-red-500' : '';
  
  return (
    <textarea
      ref={ref}
      className={`input-field h-auto min-h-[140px] py-3 align-top resize-y ${errorClass} ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
