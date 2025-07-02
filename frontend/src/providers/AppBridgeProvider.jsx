// frontend/src/providers/AppBridgeProvider.jsx
// This provider is responsible for initializing the Shopify App Bridge.

import { Provider } from '@shopify/app-bridge-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Page, Banner } from '@shopify/polaris';

function AppBridgeProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Use useMemo to parse the URL parameters directly and synchronously.
  // This is more robust than relying on useEffect for the initial setup.
  const appBridgeConfig = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const shop = params.get('shop');
    const host = params.get('host');

    // The VITE_SHOPIFY_API_KEY must be set in the Railway environment variables
    // and prefixed with VITE_ to be exposed to the frontend.
    const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;

    if (host && shop && apiKey) {
      try {
        // If all parameters are present, create the config object.
        return {
          apiKey,
          host: atob(host), // Decode the base64-encoded host
          forceRedirect: true,
        };
      } catch (e) {
        console.error("Failed to decode host parameter:", e);
        return null;
      }
    }
    
    // If any parameter is missing, return null.
    return null;
  }, [location.search]);

  // If the configuration is valid, provide the App Bridge context to the children.
  if (appBridgeConfig) {
    return (
      <Provider config={appBridgeConfig} router={{ location, navigate }}>
        {children}
      </Provider>
    );
  }

  // If the configuration is invalid (e.g., app opened outside Shopify),
  // show an error message. This prevents the infinite redirect loop.
  // We explicitly check for the /login path to avoid showing this error on the login page itself.
  if (location.pathname !== '/login') {
    // A small delay before navigating to login to prevent flashing content.
    setTimeout(() => navigate('/login'), 50);
  }

  // Render nothing while the redirect to /login happens.
  return null;
}

export default AppBridgeProvider;
