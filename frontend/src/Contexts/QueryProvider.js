import { createContext, useContext, useMemo } from 'react';
import { useAuthenticatedFetch } from '../hooks/useAppQuery';

const QueryContext = createContext();

export function QueryProvider({ children }) {
  const fetch = useAuthenticatedFetch();

  const value = useMemo(() => ({
    async query(endpoint, options = {}) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
          },
          ...options
        });
        return await response.json();
      } catch (error) {
        console.error('Query failed:', error);
        throw error;
      }
    },
    async mutation(endpoint, method = 'POST', body) {
      return this.query(endpoint, {
        method,
        body: JSON.stringify(body)
      });
    }
  }), [fetch]);

  return (
    <QueryContext.Provider value={value}>
      {children}
    </QueryContext.Provider>
  );
}

export function useQuery() {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQuery must be used within a QueryProvider');
  }
  return context;
}