import { createContext, useContext } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';

const AppBridgeContext = createContext();

export function AppBridgeProvider({ children }) {
  const app = useAppBridge();

  return (
    <AppBridgeContext.Provider value={app}>
      {children}
    </AppBridgeContext.Provider>
  );
}

export function useAppBridgeContext() {
  const context = useContext(AppBridgeContext);
  if (!context) {
    throw new Error('useAppBridgeContext must be used within an AppBridgeProvider');
  }
  return context;
}