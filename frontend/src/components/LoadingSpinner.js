import React from 'react';
// import { Text } from '@shopify/polaris'; // Премахнато, ако не се използва

const LoadingSpinner = ({ message, size = 'large' }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px',
    flexDirection: 'column'
  }}>
    <div className="Polaris-Spinner Polaris-Spinner--sizeLarge" />
    {/* Премахнато: {message && (<Text>{message}</Text>)} */}
    {message && (
      <div style={{ marginTop: '16px' }}>{message}</div>
    )}
  </div>
);

export default LoadingSpinner;