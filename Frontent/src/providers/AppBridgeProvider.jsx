// frontend/src/providers/AppBridgeProvider.jsx
// This provider is responsible for initializing the Shopify App Bridge.
// The App Bridge is a JavaScript library that allows the embedded app (our frontend)
// to communicate securely with the Shopify Admin dashboard.

import { Provider } from '@shopify/app-bridge-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function AppBridgeProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Get the shop and host parameters from the URL search string.
  // Shopify provides these when loading the embedded app.
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  // The host is required to initialize the App Bridge. If it's missing,
  // it means the app is not loaded inside the Shopify Admin.
  if (!host) {
    // In a real scenario, you might want to show a more user-friendly page
    // that explains how to install or launch the app correctly.
    // For now, we redirect to a simple login/error page.
    // NOTE: This check might not be sufficient on its own. The backend auth flow is the source of truth.
    // navigate('/login');
    // return null; // Render nothing while redirecting
  }

  // The host parameter is base64-encoded and needs to be decoded.
  const decodedHost = useMemo(() => {
    if (host) {
        try {
            return atob(host);
        } catch(e) {
            console.error("Failed to decode host:", e);
            return null;
        }
    }
    return null;
  }, [host]);


  // The configuration for the App Bridge provider.
  // It requires the API key from environment variables and the host.
  const appBridgeConfig = useMemo(() => ({
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY, // Vite exposes env vars this way
    host: decodedHost,
    forceRedirect: true, // This ensures the app always runs inside the Shopify iframe
  }), [decodedHost]);


  if (!appBridgeConfig.apiKey || !appBridgeConfig.host) {
      console.warn("App Bridge Provider: Missing API key or host. Waiting for redirection.");
      // Render a loading state or nothing while the app redirects.
      // The `forceRedirect: true` will handle redirecting to the correct auth path if needed.
      return null;
  }
  
  return (
    <Provider config={appBridgeConfig}>
      {children}
    </Provider>
  );
}

export default AppBridgeProvider;
