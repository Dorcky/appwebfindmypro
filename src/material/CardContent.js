// File: components/ui/CardContent.js
import React from 'react';

const CardContent = ({ children, className }) => (
  <div className={`pt-2 ${className}`}>{children}</div>
);

export default CardContent;
