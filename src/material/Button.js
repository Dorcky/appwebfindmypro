// File: components/ui/Button.js
import React from 'react';

const Button = ({ onClick, children, className, variant }) => {
  const baseStyle = "px-4 py-2 rounded font-semibold";
  const variantStyles = variant === 'outline' 
    ? 'border border-gray-300' 
    : 'bg-blue-500 text-white hover:bg-blue-600';

  return (
    <button onClick={onClick} className={`${baseStyle} ${variantStyles} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
