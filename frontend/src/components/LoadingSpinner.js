import React from 'react';
// import { Stack } from '@shopify/polaris'; // Премахнато, ако не се използва

const LoadingSpinner = ({ message, size = 'large' }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px',
    flexDirection: 'column'
  }}>
    <div className="Polaris-Spinner Polaris-Spinner--sizeLarge" />
    {message && (
      <div style={{ marginTop: '16px' }}>
        <Text variant="bodyMd" color="subdued">{message}</Text>
      </div>
    )}
  </div>
);

export default LoadingSpinner;