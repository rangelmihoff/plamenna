import React, { useEffect, useState } from 'react';
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

function NavigationWrapper({ children, onNavigate, currentPage }) {
  const app = useAppBridge();

  useEffect(() => {
    if (!app) return;

    console.log('Setting up App Bridge navigation...');

    try {
      // Import NavigationMenu dynamically
      import('@shopify/app-bridge/actions').then(({ NavigationMenu }) => {
        console.log('NavigationMenu imported successfully');

        // Create navigation menu
        const navigationMenu = NavigationMenu.create(app, {
          items: [
            {
              id: 'dashboard',
              label: 'Dashboard',
              destination: '/?page=dashboard'
            },
            {
              id: 'products', 
              label: 'Products',
              destination: '/?page=products'
            },
            {
              id: 'seo-generator',
              label: 'SEO Generator',
              destination: '/?page=seo-generator'
            },
            {
              id: 'analytics',
              label: 'Analytics',
              destination: '/?page=analytics'
            },
            {
              id: 'subscription',
              label: 'Subscription',
              destination: '/?page=subscription'
            },
            {
              id: 'settings',
              label: 'Settings',
              destination: '/?page=settings'
            }
          ],
          active: currentPage || 'dashboard'
        });

        console.log('Navigation menu created:', navigationMenu);

        // Handle navigation clicks
        navigationMenu.subscribe(NavigationMenu.Action.SELECT, (data) => {
          console.log('Navigation clicked:', data);
          const page = data.destination.split('page=')[1] || 'dashboard';
          onNavigate(page);
        });

        // Cleanup function
        return () => {
          console.log('Cleaning up navigation...');
          navigationMenu.unsubscribe();
        };

      }).catch(error => {
        console.error('Failed to import NavigationMenu:', error);
      });

    } catch (error) {
      console.error('App Bridge navigation error:', error);
    }

  }, [app, onNavigate, currentPage]);

  return children;
}

function App() {
  const [shop, setShop] = useState('');
  const [host, setHost] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    console.log('App initializing...');
    
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    const hostParam = urlParams.get('host');
    const pageParam = urlParams.get('page') || 'dashboard';
    
    console.log('URL params:', { shop: shopParam, host: hostParam, page: pageParam });
    
    if (shopParam) setShop(shopParam);
    if (hostParam) setHost(hostParam);
    setCurrentPage(pageParam);
    
    // If no shop in URL, try to get from embedded context
    if (!shopParam && window.location !== window.parent.location) {
      console.log('App is embedded, using default shop');
      setShop('plamenna-fashion-boutique.myshopify.com');
    }
  }, []);

  const handleNavigate = (page) => {
    console.log('Navigating to:', page);
    setCurrentPage(page);
    // Update URL without reload
    const newUrl = `${window.location.pathname}?page=${page}${shop ? `&shop=${shop}` : ''}${host ? `&host=${host}` : ''}`;
    window.history.pushState({}, '', newUrl);
  };

  const config = {
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY || '2bc2b96aa1515eeda30ed377c41375d8',
    shop: shop,
    host: host,
    forceRedirect: true
  };

  console.log('App Bridge config:', config);

  // If we don't have shop info, show loading
  if (!shop) {
    return (
      <PolarisProvider i18n={enTranslations}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #5c6ac4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p>Loading Shopify AI SEO...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </PolarisProvider>
    );
  }

  // Render component based on current page
  const renderCurrentPage = () => {
    console.log('Rendering page:', currentPage);
    switch(currentPage) {
      case 'products':
        return <ProductsList />;
      case 'seo-generator':
        return <SEOGenerator />;
      case 'analytics':
        return <Analytics />;
      case 'subscription':
        return <Subscription />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <PolarisProvider i18n={enTranslations}>
      <AppBridgeProvider config={config}>
        <AuthProvider>
          <SubscriptionProvider>
            <ToastProvider>
              <NavigationWrapper onNavigate={handleNavigate} currentPage={currentPage}>
                <div style={{ 
                  minHeight: '100vh',
                  backgroundColor: '#f6f6f7',
                  fontFamily: 'Inter, sans-serif',
                  padding: '20px'
                }}>
                  {renderCurrentPage()}
                </div>
              </NavigationWrapper>
            </ToastProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </AppBridgeProvider>
    </PolarisProvider>
  );
}

export default App;

