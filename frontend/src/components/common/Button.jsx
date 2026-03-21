import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center py-3 px-6 rounded-full font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    outline: 'border-2 border-primary text-primary hover:bg-secondary',
    ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
    fullWidth: 'w-full bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
