// File: components/ui/ListItem.js
import React from 'react';

const ListItem = ({ onClick, children, className }) => (
  <li onClick={onClick} className={`cursor-pointer ${className}`}>
    {children}
  </li>
);

export default ListItem;
