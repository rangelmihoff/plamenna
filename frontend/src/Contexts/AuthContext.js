import { createContext, useContext, useEffect, useState } from 'react';
import { useAppQuery } from '../hooks/useAppQuery';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetch = useAppQuery();

  useEffect(() => {
    const validateSession = async () => {
      try {
        const data = await fetch('/api/auth/validate');
        if (data.success) {
          setShop(data.data.shop);
        }
      } catch (error) {
        console.error('Session validation failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const value = {
    shop,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}