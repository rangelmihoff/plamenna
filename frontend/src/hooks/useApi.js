import { useState } from 'react';

export const useAPI = () => {
  const [loading, setLoading] = useState(false);

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading };
};