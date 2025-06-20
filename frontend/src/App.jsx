import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import enTranslations from '@shopify/polaris/locales/en.json';
import Dashboard from './components/Dashboard';
import ProductsList from './components/ProductsList';
import PricingPage from './pages/PricingPage';
import SettingsPage from './pages/SettingsPage';
import AppNavigation from './components/Navigation';
import SEOGenerator from './components/SEOGenerator';
import Analytics from './components/Analytics';
import Subscription from './components/Subscription';
import { AppContextProvider } from './context/AppContext';

import './App.css';
import '@shopify/polaris/build/esm/styles.css';

// I18n
import './i18n';

const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;
let host = new URLSearchParams(window.location.search).get('host');

if (!host) {
  console.warn('[Shopify App] host липсва в URL! Ако сте в dev среда, app bridge няма да работи embed-нато.');
  // За локално тестване може да сложиш фалшив host:
  if (import.meta.env.DEV) {
    host = 'FAKE_HOST_FOR_DEV';
  }
}

console.log('AppBridge config:', { apiKey, host });

const appBridgeConfig = {
  apiKey,
  host,
  forceRedirect: true,
};

function App() {
  return (
    <PolarisProvider i18n={enTranslations}>
      <AppBridgeProvider config={appBridgeConfig}>
        <AppContextProvider>
          <AppNavigation>
            <div style={{
              minHeight: '100vh',
              backgroundColor: '#f6f6f7',
              fontFamily: 'Inter, sans-serif'
            }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<ProductsList />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/seo-generator" element={<SEOGenerator />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </AppNavigation>
        </AppContextProvider>
      </AppBridgeProvider>
    </PolarisProvider>
  );
}

export default App;

