import React from "react";
import Dashboard from "./components/Dashboard";
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import enTranslations from '@shopify/polaris/locales/en.json';
import { AuthProvider } from './hooks/AuthProvider';
import { SubscriptionProvider } from './hooks/SubscriptionProvider';

function App() {
  return (
    <AppProvider i18n={enTranslations}>
      <AuthProvider>
        <SubscriptionProvider>
          <Dashboard />
        </SubscriptionProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App; 