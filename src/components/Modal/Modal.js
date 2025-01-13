import React from 'react';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-xl"
        style={{ 
          width: '90vw', // Taille plus grande du modal
          height: '90vh', // Taille plus grande du modal
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
      >
        <div className="relative flex justify-center items-center h-full">
          <button 
            onClick={onClose} 
            className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="p-8 overflow-auto h-full w-full flex justify-center items-center">
            {/* Le padding est maintenant augmenté à 8 */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default Modal;
