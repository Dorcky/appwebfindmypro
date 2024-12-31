// File: components/ui/Card.js
import React from 'react';

const Card = ({ children, className }) => (
  <div className={`p-4 bg-white shadow-lg rounded-lg ${className}`}>
    {children}
  </div>
);

export default Card;
