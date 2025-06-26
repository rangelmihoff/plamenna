import { AppProvider as PolarisProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import { useRouter } from 'next/router';
import translations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import { TopBar } from './components/TopBar';
import { Frame } from '@shopify/polaris';
import { AppBridgeProvider } from './contexts/AppBridgeContext';
import { PolarisProvider } from './contexts/PolarisContext';
import { QueryProvider } from './contexts/QueryProvider';

function AppWrapper() {
  return (
    <AppBridgeProvider>
      <PolarisProvider config={{...}}>
        <QueryProvider>
          <App />
        </QueryProvider>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const shop = router.query.shop;
  const host = router.query.host;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
    host: host,
    forceRedirect: true,
  };

  return (
    <AppBridgeProvider config={config}>
      <PolarisProvider i18n={translations}>
        <Frame topBar={<TopBar />}>
          <Component {...pageProps} />
        </Frame>
      </PolarisProvider>
    </AppBridgeProvider>
  );
}

export default MyApp;