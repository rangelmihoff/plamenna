import { createContext, useContext } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge-utils';

const PolarisContext = createContext();

export function PolarisProvider({ children, config }) {
  const app = useAppBridge();

  const value = {
    async getToken() {
      return await getSessionToken(app);
    },
    config
  };

  return (
    <PolarisContext.Provider value={value}>
      {children}
    </PolarisContext.Provider>
  );
}

export function usePolarisContext() {
  const context = useContext(PolarisContext);
  if (!context) {
    throw new Error('usePolarisContext must be used within a PolarisProvider');
  }
  return context;
}