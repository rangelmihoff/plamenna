// frontend/src/App.jsx
// This is the main application component. It sets up the main layout
// including the navigation menu and top bar, and renders the routes.

import { Frame, Navigation } from '@shopify/polaris';
import {
  HomeMajor,
  ProductsMajor,
  AnalyticsMajor,
  SettingsMajor,
  QuestionMarkMajor, // Using for AI Queries
} from '@shopify/polaris-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppRoutes from './Routes';
import TopBarMarkup from './components/TopBar.jsx';

function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Define the navigation menu structure
  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            url: '/',
            label: t('navigation.dashboard'),
            icon: HomeMajor,
            // Determine if the item is selected based on the current URL path
            selected: location.pathname === '/',
            onClick: () => navigate('/'),
          },
          {
            url: '/products',
            label: t('navigation.products'),
            icon: ProductsMajor,
            selected: location.pathname.startsWith('/products'),
            onClick: () => navigate('/products'),
          },
          {
            url: '/ai-queries',
            label: t('navigation.ai_queries'),
            icon: QuestionMarkMajor,
            selected: location.pathname.startsWith('/ai-queries'),
            onClick: () => navigate('/ai-queries'),
          },
          {
            url: '/analytics',
            label: t('navigation.analytics'),
            icon: AnalyticsMajor,
            selected: location.pathname.startsWith('/analytics'),
            onClick: () => navigate('/analytics'),
          },
          {
            url: '/settings',
            label: t('navigation.settings'),
            icon: SettingsMajor,
            selected: location.pathname.startsWith('/settings'),
            onClick: () => navigate('/settings'),
          },
        ]}
      />
    </Navigation>
  );

  return (
    // The Frame component provides the main structure of an embedded Shopify app
    <Frame
      topBar={<TopBarMarkup />}
      navigation={navigationMarkup}
    >
      <AppRoutes />
    </Frame>
  );
}

export default App;
