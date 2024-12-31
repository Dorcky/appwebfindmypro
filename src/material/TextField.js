// File: components/ui/TextField.js
import React from 'react';

const TextField = ({ value, onChange, placeholder, onKeyPress, className }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    onKeyPress={onKeyPress}
    className={`p-2 border rounded ${className}`}
  />
);

export default TextField;

