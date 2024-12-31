// File: components/ui/Popover.js
import React from 'react';
import { Popover as MuiPopover } from '@mui/material';

const Popover = ({ open, anchorEl, onClose, anchorOrigin, transformOrigin, children }) => (
  <MuiPopover
    open={open}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={anchorOrigin}
    transformOrigin={transformOrigin}
  >
    {children}
  </MuiPopover>
);

export default Popover;
