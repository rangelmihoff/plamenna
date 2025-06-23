import React from 'react';
import { Modal as PolarisModal } from '@shopify/polaris';

const Modal = ({ 
  children, 
  open, 
  onClose, 
  title, 
  primaryAction, 
  secondaryActions,
  size = 'medium',
  ...props 
}) => {
  return (
    <PolarisModal
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      size={size}
      {...props}
    >
      {children}
    </PolarisModal>
  );
};

// Add Section as a sub-component
Modal.Section = PolarisModal.Section;

export default Modal;