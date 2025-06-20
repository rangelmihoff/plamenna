import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import { CustomAppBridgeProvider } from './components/AppBridgeProvider';
import enTranslations from '@shopify/polaris/locales/en.json';
import Dashboard from './components/Dashboard';
import ProductsList from './components/ProductsList';
import PricingPage from './pages/PricingPage';
import SettingsPage from './pages/SettingsPage';
import AppNavigation from './components/Navigation';
import { AppContextProvider } from './context/AppContext';

import './App.css';
import '@shopify/polaris/build/esm/styles.css';

// I18n
import './i18n';

function App() {
  return (
    <PolarisProvider i18n={enTranslations}>
      <BrowserRouter>
        <CustomAppBridgeProvider>
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
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </div>
            </AppNavigation>
          </AppContextProvider>
        </CustomAppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}

export default App;

