import React from 'react';
import { Spinner, Stack, Text } from '@shopify/polaris';

const LoadingSpinner = ({ message, size = 'large' }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px',
    flexDirection: 'column'
  }}>
    <Spinner accessibilityLabel="Loading" size={size} />
    {message && (
      <div style={{ marginTop: '16px' }}>
        <Text variant="bodyMd" color="subdued">{message}</Text>
      </div>
    )}
  </div>
);

export default LoadingSpinner;