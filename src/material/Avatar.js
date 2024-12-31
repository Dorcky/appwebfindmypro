// File: components/ui/Avatar.js
import React from 'react';

const Avatar = ({ src, alt, className }) => (
  <img
    src={src}
    alt={alt}
    className={`rounded-full ${className}`}
    width={40}
    height={40}
  />
);

export default Avatar;

