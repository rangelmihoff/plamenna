import { useMemo } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge-utils';

export function useAuthenticatedFetch() {
  const app = useAppBridge();
  return useMemo(() => {
    return async (url, options = {}) => {
      const response = await getSessionToken(app);
      options.headers = options.headers || {};
      options.headers['Authorization'] = `Bearer ${response}`;
      return fetch(url, options);
    };
  }, [app]);
}

export function useAppQuery() {
  const fetch = useAuthenticatedFetch();
  
  return async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response.json();
  };
}