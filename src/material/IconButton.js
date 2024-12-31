// File: components/ui/IconButton.js
import React from 'react';

const IconButton = ({ onClick, children, className }) => (
  <button onClick={onClick} className={`p-2 hover:bg-gray-100 ${className}`}>
    {children}
  </button>
);

export default IconButton;
