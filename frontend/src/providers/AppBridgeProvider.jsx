// frontend/src/providers/AppBridgeProvider.jsx
// This provider is responsible for initializing the Shopify App Bridge.

import { Provider } from '@shopify/app-bridge-react';
import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Page, Spinner, Banner } from '@shopify/polaris';

function AppBridgeProvider({ children }) {
  const location = useLocation();
  const [appBridgeConfig, setAppBridgeConfig] = useState(null);
  const [isConfigValid, setIsConfigValid] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shop = searchParams.get('shop');
    const host = searchParams.get('host');

    // The VITE_SHOPIFY_API_KEY must be set in the Railway environment variables
    // and prefixed with VITE_ to be exposed to the frontend.
    const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;

    if (host && shop && apiKey) {
      try {
        const decodedHost = atob(host);
        setAppBridgeConfig({
          apiKey,
          host: decodedHost,
          forceRedirect: true,
        });
        setIsConfigValid(true);
      } catch (e) {
        console.error("Failed to decode host parameter:", e);
        setIsConfigValid(false);
      }
    } else {
      // If parameters are missing, it's likely not embedded in Shopify.
      console.warn('App Bridge config is missing required parameters (host, shop, or VITE_SHOPIFY_API_KEY).');
      setIsConfigValid(false);
    }
  }, [location.search]);

  // While waiting for the configuration to be determined
  if (appBridgeConfig === null) {
    return (
      <Page>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spinner />
        </div>
      </Page>
    );
  }

  // If the configuration is valid, provide the App Bridge context
  if (isConfigValid) {
    return (
      <Provider config={appBridgeConfig}>
        {children}
      </Provider>
    );
  }

  // If the configuration is invalid, show an error message.
  // This prevents the infinite redirect loop to /login.
  return (
      <Page>
          <Banner title="Application Error" tone="critical">
              <p>Could not initialize the application. Required parameters are missing.</p>
              <p>Please make sure you are opening the app from within the Shopify Admin dashboard and that the app is configured correctly.</p>
          </Banner>
      </Page>
  );
}

export default AppBridgeProvider;