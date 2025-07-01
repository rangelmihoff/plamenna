// frontend/src/providers/AppBridgeProvider.jsx
// This provider is responsible for initializing the Shopify App Bridge.

import { Provider } from '@shopify/app-bridge-react';
import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Banner, Page, Spinner } from '@shopify/polaris';

function AppBridgeProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [appBridgeConfig, setAppBridgeConfig] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shop = searchParams.get('shop');
    const host = searchParams.get('host');

    // The VITE_SHOPIFY_API_KEY must be set in the Railway environment variables
    const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;

    if (host && shop && apiKey) {
      setAppBridgeConfig({
        apiKey,
        host: atob(host), // Decode the base64-encoded host
        forceRedirect: true,
      });
    } else {
      // If parameters are missing, it's likely not embedded in Shopify.
      // Redirect to a login page where the user can enter their shop domain.
      console.warn('Host, shop, or API key is missing. Redirecting to login.');
      navigate('/login');
    }
  }, [location.search, navigate]);

  if (!appBridgeConfig) {
    // Show a loading spinner while the configuration is being set up.
    return (
      <Page>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spinner />
        </div>
      </Page>
    );
  }

  return (
    <Provider config={appBridgeConfig}>
      {children}
    </Provider>
  );
}

export default AppBridgeProvider;