import React, { useEffect } from 'react';
import { Toast as PolarisToast } from '@shopify/polaris';

const Toast = ({ message, error, success, onDismiss, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (!message) return null;

  return (
    <PolarisToast
      content={message}
      error={error}
      onDismiss={onDismiss}
      duration={duration}
    />
  );
};

export default Toast;